import tseslint from "typescript-eslint";

// BO-SPEC-003.AC11 — vendor SDKs and direct vendor URLs must only be used from
// `convex/providers/`. Any other Convex file (queries, mutations, actions, use
// cases, data layer, etc.) must call the provider abstractions instead.
const VENDOR_SDK_PATTERNS = [
  "@anthropic-ai/sdk",
  "@anthropic-ai/sdk/*",
  "@deepgram/sdk",
  "@deepgram/sdk/*",
  "twilio",
  "twilio/*",
  "stripe",
  "stripe/*",
];

// Forward slashes are escaped because the selector parser uses `/.../` as the
// regex literal delimiter — an unescaped `/` inside terminates the literal.
const VENDOR_URL_REGEX =
  "https?:\\/\\/(api\\.anthropic\\.com|api\\.deepgram\\.com|api\\.twilio\\.com|api\\.stripe\\.com)";

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.mjs", "vitest.config.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["convex/**/*.ts"],
    ignores: [
      "convex/providers/**",
      "convex/_generated/**",
      "convex/**/*.test.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: VENDOR_SDK_PATTERNS.map((pattern) => ({
            group: [pattern],
            message:
              "BO-SPEC-003.AC11: import vendor SDKs only from convex/providers/. Call the provider abstraction instead.",
          })),
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=/${VENDOR_URL_REGEX}/]`,
          message:
            "BO-SPEC-003.AC11: vendor API URLs must only appear in convex/providers/. Call the provider abstraction instead.",
        },
        {
          selector: `TemplateElement[value.raw=/${VENDOR_URL_REGEX}/]`,
          message:
            "BO-SPEC-003.AC11: vendor API URLs must only appear in convex/providers/. Call the provider abstraction instead.",
        },
      ],
    },
  },
  {
    ignores: ["convex/_generated/"],
  },
);
