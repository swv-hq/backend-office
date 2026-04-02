# SPEC-031: Custom Expo Dev Build — Web E2E Test Script

This spec is primarily native-focused. The only web-relevant AC is AC8 (cross-workspace typecheck and lint).

---

## Test 1: Cross-Workspace Typecheck and Lint [SPEC-031.AC8]

**Prerequisites:**

- No backend or dev server needed
- Node.js and npm installed

**Instructions:**

1. Open a terminal at the monorepo root
2. Run `npx turbo run typecheck`
3. Run `npx turbo run lint`

**Expected Result:**

- Typecheck passes with zero errors across all workspaces
- Lint passes with zero errors across all workspaces

---

## AC Coverage Matrix

| AC ID        | Test(s) | Platform    |
| ------------ | ------- | ----------- |
| SPEC-031.AC8 | Test 1  | native, web |
