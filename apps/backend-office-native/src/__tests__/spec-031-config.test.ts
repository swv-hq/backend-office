import fs from "fs";
import path from "path";

const nativeRoot = path.resolve(__dirname, "../..");

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(path.join(nativeRoot, filePath), "utf-8"));
}

describe("BO-SPEC-031: Custom Expo Dev Build", () => {
  it("expo-dev-client is installed as a dependency [BO-SPEC-031.AC1]", () => {
    const pkg = readJson("package.json");
    expect(pkg.dependencies).toHaveProperty("expo-dev-client");
  });

  describe("eas.json build profiles [BO-SPEC-031.AC2]", () => {
    let eas: Record<string, unknown>;

    beforeAll(() => {
      eas = readJson("eas.json");
    });

    it("has a development build profile", () => {
      const build = eas.build as Record<string, unknown>;
      expect(build).toHaveProperty("development");
    });

    it("has a preview build profile", () => {
      const build = eas.build as Record<string, unknown>;
      expect(build).toHaveProperty("preview");
    });

    it("development profile enables dev client and simulator", () => {
      const build = eas.build as Record<
        string,
        { developmentClient?: boolean; ios?: { simulator?: boolean } }
      >;
      expect(build.development.developmentClient).toBe(true);
      expect(build.development.ios?.simulator).toBe(true);
    });
  });

  describe("app.json branding [BO-SPEC-031.AC3]", () => {
    let expo: Record<string, unknown>;

    beforeAll(() => {
      const appJson = readJson("app.json");
      expo = appJson.expo;
    });

    it("app name is Back-End Office", () => {
      expect(expo.name).toBe("Back-End Office");
    });

    it("slug is backend-office", () => {
      expect(expo.slug).toBe("backend-office");
    });

    it("iOS bundle identifier is com.backendoffice.app", () => {
      const ios = expo.ios as Record<string, unknown>;
      expect(ios.bundleIdentifier).toBe("com.backendoffice.app");
    });
  });

  it("dev script uses --dev-client flag [BO-SPEC-031.AC7]", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts.dev).toContain("--dev-client");
  });
});
