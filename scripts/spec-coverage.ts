import { globSync } from "glob";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const strict = process.argv.includes("--strict");

// ANSI color helpers
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;
const dim = (text: string) => `\x1b[2m${text}\x1b[0m`;

// Per-product manifest. Each product owns its own specs and workspaces;
// AC IDs are scoped by prefix so cross-product leakage is impossible.
type Platform = "web" | "native" | "backend";

interface ProductConfig {
  name: string;
  prefix: string; // e.g. "BO", "AH"
  specsGlob: string;
  workspaces: Record<Platform, string[]>;
}

const products: ProductConfig[] = [
  {
    name: "backend-office",
    prefix: "BO",
    specsGlob: "docs/products/backend-office/specs/*.md",
    workspaces: {
      web: [
        "apps/backend-office-web/src/**/*.test.ts",
        "apps/backend-office-web/src/**/*.test.tsx",
        "e2e/test-scripts/backend-office/web/*.md",
      ],
      native: [
        "apps/backend-office-native/src/**/*.test.ts",
        "apps/backend-office-native/src/**/*.test.tsx",
        "e2e/test-scripts/backend-office/native/*.md",
      ],
      backend: ["packages/backend-office-backend/convex/**/*.test.ts"],
    },
  },
  {
    name: "auth-hub",
    prefix: "AH",
    specsGlob: "docs/products/auth-hub/specs/*.md",
    workspaces: {
      // Phase 1 will populate these. Empty arrays = no specs yet, no failure.
      web: [
        "apps/auth-hub/src/**/*.test.ts",
        "apps/auth-hub/src/**/*.test.tsx",
        "e2e/test-scripts/auth-hub/web/*.md",
      ],
      native: ["e2e/test-scripts/auth-hub/native/*.md"],
      backend: ["apps/auth-hub/convex/**/*.test.ts"],
    },
  },
];

const statusRegex = /^status:\s*(.+)$/m;
const activeStatuses = new Set(["in-progress", "in-testing", "implemented"]);

interface AcInfo {
  sourceFile: string;
  platforms: Platform[];
}

interface CoverageDetail {
  platform: Platform;
  files: string[];
}

interface ProductReport {
  config: ProductConfig;
  total: number;
  fullyCovered: number;
  partiallyCovered: number;
  uncoveredCount: number;
  fullyCoveredAcs: string[];
  partialAcs: string[];
  uncoveredAcs: string[];
  coverageMap: Map<string, CoverageDetail[]>;
  allCriteria: Map<string, AcInfo>;
  skippedSpecs: string[];
}

function analyzeProduct(config: ProductConfig): ProductReport {
  const acIdRegex = new RegExp(`${config.prefix}-SPEC-\\d+\\.AC\\d+`, "g");
  const acPlatformRegex = new RegExp(
    `\\*\\*(${config.prefix}-SPEC-\\d+\\.AC\\d+)\\*\\*\\s*\\[([^\\]]+)\\]`,
    "g",
  );

  const specFiles = globSync(config.specsGlob, { cwd: rootDir }).filter(
    (f) => !f.endsWith("_TEMPLATE.md") && !f.endsWith("ROADMAP.md"),
  );

  const allCriteria = new Map<string, AcInfo>();
  const skippedSpecs: string[] = [];

  for (const specFile of specFiles) {
    const content = readFileSync(resolve(rootDir, specFile), "utf-8");

    const statusMatch = content.match(statusRegex);
    const status = statusMatch?.[1]?.trim() ?? "";
    if (!activeStatuses.has(status)) {
      skippedSpecs.push(specFile);
      continue;
    }

    const platformMatches = [...content.matchAll(acPlatformRegex)];

    if (platformMatches.length > 0) {
      for (const match of platformMatches) {
        const acId = match[1];
        const platforms = match[2]
          .split(",")
          .map((p) => p.trim().toLowerCase() as Platform)
          .filter((p) => p in config.workspaces);

        if (!allCriteria.has(acId)) {
          allCriteria.set(acId, {
            sourceFile: specFile,
            platforms: platforms.length > 0 ? platforms : ["backend"],
          });
        }
      }
    } else {
      const simpleMatches = content.match(acIdRegex);
      if (simpleMatches) {
        for (const acId of simpleMatches) {
          if (!allCriteria.has(acId)) {
            allCriteria.set(acId, {
              sourceFile: specFile,
              platforms: ["web", "native", "backend"],
            });
          }
        }
      }
    }
  }

  // Build test file index per platform for this product
  const testFilesByPlatform = new Map<Platform, string[]>();
  for (const [platform, patterns] of Object.entries(config.workspaces)) {
    const files = patterns.flatMap((pattern) =>
      globSync(pattern, { cwd: rootDir, ignore: ["node_modules/**"] }),
    );
    testFilesByPlatform.set(platform as Platform, files);
  }

  const coverageMap = new Map<string, CoverageDetail[]>();
  for (const [acId, info] of allCriteria) {
    const details: CoverageDetail[] = [];
    for (const platform of info.platforms) {
      const testFiles = testFilesByPlatform.get(platform) ?? [];
      const matchingFiles: string[] = [];
      for (const testFile of testFiles) {
        const content = readFileSync(resolve(rootDir, testFile), "utf-8");
        if (content.includes(acId)) {
          matchingFiles.push(testFile);
        }
      }
      details.push({ platform, files: matchingFiles });
    }
    coverageMap.set(acId, details);
  }

  let fullyCovered = 0;
  let partiallyCovered = 0;
  const uncoveredAcs: string[] = [];
  const partialAcs: string[] = [];

  for (const [acId, details] of coverageMap) {
    const covered = details.filter((d) => d.files.length > 0).length;
    if (covered === details.length) {
      fullyCovered++;
    } else if (covered > 0) {
      partiallyCovered++;
      partialAcs.push(acId);
    } else {
      uncoveredAcs.push(acId);
    }
  }

  const fullyCoveredAcs = [...coverageMap.entries()]
    .filter(([, details]) => details.every((d) => d.files.length > 0))
    .map(([acId]) => acId)
    .sort();

  return {
    config,
    total: allCriteria.size,
    fullyCovered,
    partiallyCovered,
    uncoveredCount: uncoveredAcs.length,
    fullyCoveredAcs,
    partialAcs,
    uncoveredAcs,
    coverageMap,
    allCriteria,
    skippedSpecs,
  };
}

function pct(num: number, denom: number): number {
  return denom === 0 ? 100 : Math.round((num / denom) * 100);
}

function colorPct(p: number): string {
  return p === 100 ? green(`${p}%`) : p >= 75 ? yellow(`${p}%`) : red(`${p}%`);
}

const reports = products.map(analyzeProduct);

console.log(bold("\n=== Spec Coverage Report ===\n"));

for (const r of reports) {
  console.log(bold(`── ${r.config.name} (${r.config.prefix}) ──`));

  if (r.skippedSpecs.length > 0) {
    const prefix = `docs/products/${r.config.name}/specs/`;
    console.log(
      dim(
        `Skipped ${r.skippedSpecs.length} spec(s) not yet in-progress: ${r.skippedSpecs.map((f) => f.replace(prefix, "")).join(", ")}`,
      ),
    );
  }

  if (r.total === 0) {
    console.log(dim("(no active specs)\n"));
    continue;
  }

  const p = pct(r.fullyCovered, r.total);
  console.log(`${bold("Total criteria:")}    ${r.total}`);
  console.log(`${bold("Fully covered:")}     ${green(String(r.fullyCovered))}`);
  if (r.partiallyCovered > 0) {
    console.log(
      `${bold("Partially covered:")} ${yellow(String(r.partiallyCovered))}`,
    );
  }
  console.log(
    `${bold("Uncovered:")}         ${r.uncoveredCount > 0 ? red(String(r.uncoveredCount)) : green(String(r.uncoveredCount))}`,
  );
  console.log(`${bold("Coverage:")}          ${colorPct(p)}\n`);

  if (r.fullyCoveredAcs.length > 0) {
    console.log(green("Fully covered criteria:"));
    for (const acId of r.fullyCoveredAcs) {
      const details = r.coverageMap.get(acId) ?? [];
      const fileList = details.flatMap((d) => d.files).join(", ");
      console.log(`  ${green("\u2713")} ${acId} ${dim(`(${fileList})`)}`);
    }
    console.log();
  }

  if (r.partialAcs.length > 0) {
    console.log(yellow("Partially covered criteria:"));
    for (const acId of r.partialAcs.sort()) {
      const details = r.coverageMap.get(acId) ?? [];
      const covered = details
        .filter((d) => d.files.length > 0)
        .map((d) => d.platform);
      const missing = details
        .filter((d) => d.files.length === 0)
        .map((d) => d.platform);
      console.log(
        `  ${yellow("~")} ${acId} ${dim(`(covered: ${covered.join(", ")} | missing: ${missing.join(", ")})`)}`,
      );
    }
    console.log();
  }

  if (r.uncoveredAcs.length > 0) {
    console.log(red("Uncovered criteria:"));
    for (const acId of r.uncoveredAcs.sort()) {
      const info = r.allCriteria.get(acId);
      const platforms = info?.platforms.join(", ") ?? "";
      console.log(
        `  ${red("\u2717")} ${acId} ${dim(`(from ${info?.sourceFile}, platforms: ${platforms})`)}`,
      );
    }
    console.log();
  }
}

// Aggregate
const grandTotal = reports.reduce((s, r) => s + r.total, 0);
const grandFully = reports.reduce((s, r) => s + r.fullyCovered, 0);
const grandPct = pct(grandFully, grandTotal);

console.log(bold("── Total ──"));
if (grandTotal === 0) {
  console.log(
    yellow("No active acceptance criteria found across any product.\n"),
  );
} else {
  console.log(
    `${bold("All products:")}       ${grandFully}/${grandTotal} (${colorPct(grandPct)})\n`,
  );
}

// Strict mode: any product below 100% fails
if (strict) {
  const failing = reports.filter(
    (r) => r.total > 0 && r.fullyCovered < r.total,
  );
  if (failing.length > 0) {
    const names = failing
      .map((r) => `${r.config.name} (${pct(r.fullyCovered, r.total)}%)`)
      .join(", ");
    console.log(red(`Strict mode: ${names} below 100%. Exiting with error.\n`));
    process.exit(1);
  }
}
