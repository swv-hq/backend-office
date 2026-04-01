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

// Platform-to-workspace mapping
type Platform = "web" | "native" | "backend";
const platformTestPatterns: Record<Platform, string[]> = {
  web: [
    "apps/web/src/**/*.test.ts",
    "apps/web/src/**/*.test.tsx",
    "e2e/test-scripts/web/*.md",
  ],
  native: [
    "apps/native/src/**/*.test.ts",
    "apps/native/src/**/*.test.tsx",
    "e2e/test-scripts/native/*.md",
  ],
  backend: ["packages/backend/convex/**/*.test.ts"],
};

// 1. Find all spec files and extract acceptance criteria IDs with platform tags
const specPattern = "docs/specs/*.md";
const specFiles = globSync(specPattern, { cwd: rootDir }).filter(
  (f) => !f.endsWith("_TEMPLATE.md") && !f.endsWith("ROADMAP.md")
);

const acIdRegex = /SPEC-\d+\.AC\d+/g;
const acPlatformRegex =
  /\*\*(SPEC-\d+\.AC\d+)\*\*\s*\[([^\]]+)\]/g;
const statusRegex = /^status:\s*(.+)$/m;
const activeStatuses = new Set(["in-progress", "in-testing", "implemented"]);

interface AcInfo {
  sourceFile: string;
  platforms: Platform[];
}

const allCriteria = new Map<string, AcInfo>();
const skippedSpecs: string[] = [];

for (const specFile of specFiles) {
  const content = readFileSync(resolve(rootDir, specFile), "utf-8");

  // Only require test coverage for specs that are in-progress or beyond
  const statusMatch = content.match(statusRegex);
  const status = statusMatch?.[1]?.trim() ?? "";
  if (!activeStatuses.has(status)) {
    skippedSpecs.push(specFile);
    continue;
  }

  // Extract ACs with platform tags
  const platformMatches = [...content.matchAll(acPlatformRegex)];

  if (platformMatches.length > 0) {
    for (const match of platformMatches) {
      const acId = match[1];
      const platforms = match[2]
        .split(",")
        .map((p) => p.trim().toLowerCase() as Platform)
        .filter((p) => p in platformTestPatterns);

      if (!allCriteria.has(acId)) {
        allCriteria.set(acId, {
          sourceFile: specFile,
          platforms: platforms.length > 0 ? platforms : ["backend"],
        });
      }
    }
  } else {
    // Fallback: find AC IDs without platform tags (default to all platforms)
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

// 2. Build test file index per platform
const testFilesByPlatform = new Map<Platform, string[]>();
for (const [platform, patterns] of Object.entries(platformTestPatterns)) {
  const files = patterns.flatMap((pattern) =>
    globSync(pattern, { cwd: rootDir, ignore: ["node_modules/**"] })
  );
  testFilesByPlatform.set(platform as Platform, files);
}

// 3. Search for AC IDs in test files per platform
interface CoverageDetail {
  platform: Platform;
  files: string[];
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

// 4. Calculate coverage
const total = allCriteria.size;
let fullyCovered = 0;
let partiallyCovered = 0;
const uncoveredAcs: string[] = [];
const partialAcs: string[] = [];

for (const [acId, details] of coverageMap) {
  const coveredPlatforms = details.filter((d) => d.files.length > 0).length;
  const totalPlatforms = details.length;

  if (coveredPlatforms === totalPlatforms) {
    fullyCovered++;
  } else if (coveredPlatforms > 0) {
    partiallyCovered++;
    partialAcs.push(acId);
  } else {
    uncoveredAcs.push(acId);
  }
}

const uncoveredCount = uncoveredAcs.length;
const percentage =
  total === 0 ? 100 : Math.round((fullyCovered / total) * 100);

// 5. Report results
console.log(bold("\n=== Spec Coverage Report ===\n"));

if (skippedSpecs.length > 0) {
  console.log(
    dim(
      `Skipped ${skippedSpecs.length} spec(s) not yet in-progress: ${skippedSpecs.map((f) => f.replace("docs/specs/", "")).join(", ")}`
    )
  );
  console.log();
}

if (total === 0) {
  console.log(
    yellow(
      "No acceptance criteria found. Add specs to docs/specs/ using the template."
    )
  );
  console.log(
    dim("  Copy docs/specs/_TEMPLATE.md and define SPEC-XXX.AC# criteria.\n")
  );
  process.exit(0);
}

console.log(`${bold("Total criteria:")}    ${total}`);
console.log(`${bold("Fully covered:")}     ${green(String(fullyCovered))}`);
if (partiallyCovered > 0) {
  console.log(
    `${bold("Partially covered:")} ${yellow(String(partiallyCovered))}`
  );
}
console.log(
  `${bold("Uncovered:")}         ${uncoveredCount > 0 ? red(String(uncoveredCount)) : green(String(uncoveredCount))}`
);
console.log(
  `${bold("Coverage:")}          ${percentage === 100 ? green(`${percentage}%`) : percentage >= 75 ? yellow(`${percentage}%`) : red(`${percentage}%`)}\n`
);

// Show fully covered criteria
const fullyCoveredAcs = [...coverageMap.entries()]
  .filter(([, details]) => details.every((d) => d.files.length > 0))
  .map(([acId]) => acId)
  .sort();

if (fullyCoveredAcs.length > 0) {
  console.log(green("Fully covered criteria:"));
  for (const acId of fullyCoveredAcs) {
    const details = coverageMap.get(acId) ?? [];
    const fileList = details.flatMap((d) => d.files).join(", ");
    console.log(`  ${green("\u2713")} ${acId} ${dim(`(${fileList})`)}`);
  }
  console.log();
}

// Show partially covered criteria
if (partialAcs.length > 0) {
  console.log(yellow("Partially covered criteria:"));
  for (const acId of partialAcs.sort()) {
    const details = coverageMap.get(acId) ?? [];
    const covered = details
      .filter((d) => d.files.length > 0)
      .map((d) => d.platform);
    const missing = details
      .filter((d) => d.files.length === 0)
      .map((d) => d.platform);
    console.log(
      `  ${yellow("~")} ${acId} ${dim(`(covered: ${covered.join(", ")} | missing: ${missing.join(", ")})`)}`
    );
  }
  console.log();
}

// Show uncovered criteria
if (uncoveredAcs.length > 0) {
  console.log(red("Uncovered criteria:"));
  for (const acId of uncoveredAcs.sort()) {
    const info = allCriteria.get(acId);
    const platforms = info?.platforms.join(", ") ?? "";
    console.log(
      `  ${red("\u2717")} ${acId} ${dim(`(from ${info?.sourceFile}, platforms: ${platforms})`)}`
    );
  }
  console.log();
}

// Exit with error if strict mode and not 100%
if (strict && percentage < 100) {
  console.log(
    red(
      `Strict mode: coverage is ${percentage}%, required 100%. Exiting with error.\n`
    )
  );
  process.exit(1);
}
