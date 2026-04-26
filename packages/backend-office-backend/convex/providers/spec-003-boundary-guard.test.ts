import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const backendRoot = path.resolve(__dirname, "..", "..");
// Use a pid-suffixed filename so this test never collides with other test
// files (e.g. BO-SPEC-004's typecheck test) that share the convex/ tree.
const fixtureFile = path.join(
  backendRoot,
  "convex",
  "useCases",
  `__boundary-guard-fixture-${process.pid}__.ts`,
);

function runEslintOn(file: string): { exitCode: number; stdout: string } {
  try {
    const stdout = execSync(`npx eslint --no-color "${file}"`, {
      cwd: backendRoot,
      stdio: ["ignore", "pipe", "pipe"],
    }).toString();
    return { exitCode: 0, stdout };
  } catch (err: unknown) {
    const e = err as { status?: number; stdout?: Buffer };
    return {
      exitCode: e.status ?? 1,
      stdout: e.stdout?.toString() ?? "",
    };
  }
}

describe("BO-SPEC-003: Vendor SDK boundary guard [BO-SPEC-003.AC11]", () => {
  afterAll(() => {
    if (fs.existsSync(fixtureFile)) fs.rmSync(fixtureFile);
  });

  describe("ESLint rule blocks vendor SDK imports outside convex/providers/", () => {
    beforeAll(() => {
      fs.writeFileSync(
        fixtureFile,
        `// Deliberate violation to verify the AC11 guard.\nimport Stripe from "stripe";\nexport const x = Stripe;\n`,
      );
    });

    it("flags a direct Stripe SDK import in a use-case file", () => {
      const { exitCode, stdout } = runEslintOn(fixtureFile);
      expect(exitCode).not.toBe(0);
      expect(stdout).toMatch(/BO-SPEC-003\.AC11/);
    });
  });

  describe("ESLint rule blocks direct vendor API URLs outside convex/providers/", () => {
    beforeAll(() => {
      fs.writeFileSync(
        fixtureFile,
        `// Deliberate violation: hitting api.anthropic.com from a use case.\nexport const URL = "https://api.anthropic.com/v1/messages";\n`,
      );
    });

    it("flags a literal vendor URL in a use-case file", () => {
      const { exitCode, stdout } = runEslintOn(fixtureFile);
      expect(exitCode).not.toBe(0);
      expect(stdout).toMatch(/BO-SPEC-003\.AC11/);
    });
  });

  describe("ESLint rule allows vendor SDK use inside convex/providers/", () => {
    it("does not flag the existing provider implementations", () => {
      const { exitCode } = runEslintOn(
        path.join(backendRoot, "convex", "providers"),
      );
      expect(exitCode).toBe(0);
    });
  });

  describe("Backend typecheck [BO-SPEC-003.AC12]", () => {
    it("passes tsc --noEmit -p convex with zero errors", () => {
      try {
        execSync("npx tsc --noEmit -p convex", {
          cwd: backendRoot,
          stdio: ["ignore", "pipe", "pipe"],
        });
      } catch (err: unknown) {
        const e = err as { stdout?: Buffer; stderr?: Buffer };
        const out = `${e.stdout?.toString() ?? ""}${e.stderr?.toString() ?? ""}`;
        throw new Error(`Backend typecheck failed:\n${out}`);
      }
    }, 60_000);
  });
});
