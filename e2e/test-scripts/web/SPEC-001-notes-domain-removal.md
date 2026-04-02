# SPEC-001: Notes Domain Removal — Web E2E Test Script

## Prerequisites

- Web dev server running (`cd apps/web && npm run dev`)
- Clerk authentication configured

---

## Test 1: Notes pages are removed [SPEC-001.AC4]

**Instructions:**

1. Open browser to `http://localhost:3001/notes`

**Expected Result:**

- Page returns 404 (Not Found)

## Test 2: Notes detail page is removed [SPEC-001.AC4]

**Instructions:**

1. Open browser to `http://localhost:3001/notes/any-id`

**Expected Result:**

- Page returns 404 (Not Found)

## Test 3: Header navigation updated [SPEC-001.AC6]

**Instructions:**

1. Open browser to `http://localhost:3001`
2. Inspect the header navigation links

**Expected Result:**

- No links point to `/notes`
- Authenticated: "Dashboard" button links to `/`
- Unauthenticated: "Sign in" and "Get Started" buttons link to `/`

## Test 4: User dropdown updated [SPEC-001.AC6]

**Instructions:**

1. Sign in to the app
2. Click the user avatar in the header
3. Inspect the "Dashboard" dropdown menu link

**Expected Result:**

- "Dashboard" link points to `/`, not `/notes`

## Test 5: Site metadata updated [SPEC-001.AC12]

**Instructions:**

1. Open browser to `http://localhost:3001`
2. Check the browser tab title

**Expected Result:**

- Tab title shows "Back-End Office" (not "Notes App")

## Test 6: Typecheck passes [SPEC-001.AC9]

**Instructions:**

1. Run `cd apps/web && npm run typecheck`

**Expected Result:**

- Command exits with code 0, no type errors

## Test 7: Lint passes [SPEC-001.AC10]

**Instructions:**

1. Run `cd apps/web && npm run lint`

**Expected Result:**

- Command exits with code 0, no lint errors

## Test 8: Build succeeds [SPEC-001.AC11]

**Instructions:**

1. Run `cd apps/web && npm run build`

**Expected Result:**

- Build completes successfully with exit code 0
- Only `/` and `/_not-found` routes are listed (no `/notes` routes)

---

## AC Coverage Matrix

| AC            | Tests                                                                 |
| ------------- | --------------------------------------------------------------------- |
| SPEC-001.AC4  | Test 1, Test 2                                                        |
| SPEC-001.AC5  | Test 1, Test 2 (pages gone, components were only used by those pages) |
| SPEC-001.AC6  | Test 3, Test 4                                                        |
| SPEC-001.AC9  | Test 6                                                                |
| SPEC-001.AC10 | Test 7                                                                |
| SPEC-001.AC11 | Test 8                                                                |
| SPEC-001.AC12 | Test 5                                                                |
