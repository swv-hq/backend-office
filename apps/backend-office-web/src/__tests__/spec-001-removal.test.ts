import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const srcDir = path.resolve(__dirname, "..");

describe("BO-SPEC-001: Notes Domain Removal - Web", () => {
  it("notes page directory does not exist [BO-SPEC-001.AC4]", () => {
    expect(fs.existsSync(path.join(srcDir, "app", "notes"))).toBe(false);
  });

  it("notes components directory does not exist [BO-SPEC-001.AC5]", () => {
    expect(fs.existsSync(path.join(srcDir, "components", "notes"))).toBe(false);
  });

  it("ComplexToggle component does not exist [BO-SPEC-001.AC5]", () => {
    expect(
      fs.existsSync(
        path.join(srcDir, "components", "home", "ComplexToggle.tsx"),
      ),
    ).toBe(false);
  });

  it("Header.tsx does not link to /notes [BO-SPEC-001.AC6]", () => {
    const content = fs.readFileSync(
      path.join(srcDir, "components", "Header.tsx"),
      "utf-8",
    );
    expect(content).not.toContain('href="/notes"');
  });

  it("UserNav.tsx does not link to /notes [BO-SPEC-001.AC6]", () => {
    const content = fs.readFileSync(
      path.join(srcDir, "components", "common", "UserNav.tsx"),
      "utf-8",
    );
    expect(content).not.toContain('href="/notes"');
  });

  it('layout.tsx metadata title is "Back-End Office" [BO-SPEC-001.AC12]', () => {
    const content = fs.readFileSync(
      path.join(srcDir, "app", "layout.tsx"),
      "utf-8",
    );
    expect(content).toContain("Back-End Office");
  });

  it("layout.tsx metadata description does not contain notes [BO-SPEC-001.AC12]", () => {
    const content = fs.readFileSync(
      path.join(srcDir, "app", "layout.tsx"),
      "utf-8",
    );
    expect(content.toLowerCase()).not.toContain("note");
  });
});
