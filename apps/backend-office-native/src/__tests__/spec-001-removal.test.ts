import * as fs from "node:fs";
import * as path from "node:path";

const screensDir = path.resolve(__dirname, "..", "screens");
const navDir = path.resolve(__dirname, "..", "navigation");

describe("BO-SPEC-001: Notes Domain Removal - Native", () => {
  it("NotesDashboardScreen does not exist [BO-SPEC-001.AC7]", () => {
    expect(
      fs.existsSync(path.join(screensDir, "NotesDashboardScreen.tsx")),
    ).toBe(false);
  });

  it("CreateNoteScreen does not exist [BO-SPEC-001.AC7]", () => {
    expect(fs.existsSync(path.join(screensDir, "CreateNoteScreen.tsx"))).toBe(
      false,
    );
  });

  it("InsideNoteScreen does not exist [BO-SPEC-001.AC7]", () => {
    expect(fs.existsSync(path.join(screensDir, "InsideNoteScreen.tsx"))).toBe(
      false,
    );
  });

  it("HomeScreen placeholder exists [BO-SPEC-001.AC8]", () => {
    expect(fs.existsSync(path.join(screensDir, "HomeScreen.tsx"))).toBe(true);
  });

  it("Navigation.tsx does not reference notes screens [BO-SPEC-001.AC8]", () => {
    const content = fs.readFileSync(
      path.join(navDir, "Navigation.tsx"),
      "utf-8",
    );
    expect(content).not.toContain("NotesDashboard");
    expect(content).not.toContain("InsideNote");
    expect(content).not.toContain("CreateNote");
  });

  it("Navigation.tsx references HomeScreen [BO-SPEC-001.AC8]", () => {
    const content = fs.readFileSync(
      path.join(navDir, "Navigation.tsx"),
      "utf-8",
    );
    expect(content).toContain("HomeScreen");
  });
});
