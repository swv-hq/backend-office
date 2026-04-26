import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    server: { deps: { inline: ["convex-test"] } },
    environmentMatchGlobs: [["convex/**", "edge-runtime"]],
  },
});
