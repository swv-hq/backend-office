import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const convexDir = path.resolve(__dirname);
const backendRoot = path.resolve(__dirname, "..");

describe("SPEC-001: Notes Domain Removal - Backend", () => {
  it("schema.ts does not define a notes table [SPEC-001.AC1]", () => {
    const schema = fs.readFileSync(path.join(convexDir, "schema.ts"), "utf-8");
    expect(schema).not.toContain("notes: defineTable");
    expect(schema).not.toMatch(/^\s*notes:\s*defineTable/m);
  });

  it("notes.ts does not exist [SPEC-001.AC2]", () => {
    expect(fs.existsSync(path.join(convexDir, "notes.ts"))).toBe(false);
  });

  it("openai.ts does not exist [SPEC-001.AC3]", () => {
    expect(fs.existsSync(path.join(convexDir, "openai.ts"))).toBe(false);
  });

  it("no OPENAI_API_KEY references in convex/ source files [SPEC-001.AC3]", () => {
    const sourceFiles = fs
      .readdirSync(convexDir)
      .filter((f) => f.endsWith(".ts") && !f.includes(".test."))
      .filter((f) => !f.startsWith("_"));

    for (const file of sourceFiles) {
      const content = fs.readFileSync(path.join(convexDir, file), "utf-8");
      expect(content).not.toContain("OPENAI_API_KEY");
    }
  });

  it("schema.ts is valid TypeScript (no stale references) [SPEC-001.AC9]", () => {
    const schema = fs.readFileSync(path.join(convexDir, "schema.ts"), "utf-8");
    expect(schema).not.toContain("notes: defineTable");
    expect(schema).not.toContain("openai");
  });

  it("no remaining source files reference deleted modules [SPEC-001.AC10]", () => {
    const sourceFiles = fs
      .readdirSync(convexDir)
      .filter((f) => f.endsWith(".ts") && !f.includes(".test."))
      .filter((f) => !f.startsWith("_"));

    for (const file of sourceFiles) {
      const content = fs.readFileSync(path.join(convexDir, file), "utf-8");
      expect(content).not.toContain("from './notes'");
      expect(content).not.toContain('from "./notes"');
      expect(content).not.toContain("from './openai'");
      expect(content).not.toContain('from "./openai"');
    }
  });

  it("package.json does not include openai dependency [SPEC-001.AC13]", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(backendRoot, "package.json"), "utf-8"),
    );
    expect(pkg.dependencies?.openai).toBeUndefined();
    expect(pkg.devDependencies?.openai).toBeUndefined();
  });
});
