# BO-SPEC-005: Trade Theming System — Web E2E Test Script

## Prerequisites

- `npm run dev` running for the web app on port 3001
- Customer-facing estimate/invoice routes (delivered by BO-SPEC-019) are not yet implemented

> **Note:** This spec ships the web theming primitives (`themeStyleVars`, `<ThemeProvider>`); the customer-facing pages that will consume them ship in BO-SPEC-019. The tests below verify the primitives via a temporary verification page or by mounting `<ThemeProvider>` around an existing route in development.

---

## Test 1: Themed wrapper applies CSS variables [BO-SPEC-005.AC8, AC10]

**Prerequisites:**

- Mount `<ThemeProvider trade="plumber">` around the home page (`src/app/page.tsx`) or a temp verification page
- Place a child element styled with `style={{ background: "var(--bo-color-primary)" }}` inside the provider

**Instructions:**

1. Open `http://localhost:3001/`
2. Inspect the wrapper element and the child via browser devtools

**Expected Result:**

- The `<div data-bo-theme="plumber">` wrapper has inline custom properties: `--bo-color-primary: #0B3D5C`, `--bo-color-accent: #E8A33D`, etc.
- The child element using `var(--bo-color-primary)` renders with the plumber navy color
- Computed background of the child resolves to `rgb(11, 61, 92)`

---

## Test 2: Each trade emits distinct CSS variables [BO-SPEC-005.AC2 (web), AC8]

**Instructions:**

1. Repeat Test 1 with `trade="handyman"` then `trade="electrician"`
2. Inspect the wrapper's inline style each time

**Expected Result:**

- handyman: `--bo-color-primary: #2B2B2B`, accent `#E8A33D`
- electrician: `--bo-color-primary: #111111`, accent `#F5C518`
- All three trades produce visibly distinct primary and accent variables

---

## Test 3: Neutral default when trade is undefined [BO-SPEC-005.AC5]

**Instructions:**

1. Set `<ThemeProvider trade={undefined}>` and reload

**Expected Result:**

- Wrapper element has `data-bo-theme="neutral"`
- Inline style emits `--bo-color-primary: #4A4A4A` (neutral medium gray) and `--bo-color-accent: #3B82F6`
- Page is fully readable with no broken layouts

---

## Test 4: WCAG AA contrast on customer-facing copy [BO-SPEC-005.AC9]

**Prerequisites:**

- Provider mounted with each trade in turn

**Instructions:**

1. For each trade, render a sample customer-facing card with body text using `var(--bo-color-text-primary)` over `var(--bo-color-background)`
2. Use a contrast checker (e.g., DevTools Lighthouse, Stark, or WebAIM Contrast Checker) to measure the rendered colors

**Expected Result:**

- All four themes (neutral + 3 trades) report textPrimary-on-background contrast ≥ 4.5:1
- All four themes report textSecondary-on-background contrast ≥ 4.5:1

> Note: automated WCAG AA verification is enforced by `apps/backend-office-web/src/__tests__/spec-005-web-theming.test.tsx`. The manual check above is for real-browser rendering verification.

---

## AC Coverage Matrix

| AC                     | Tests                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| BO-SPEC-005.AC3 (web)  | covered by automated test `apps/backend-office-web/src/__tests__/spec-005-terminology.test.ts` |
| BO-SPEC-005.AC5        | Test 3                                                                                         |
| BO-SPEC-005.AC8        | Tests 1, 2                                                                                     |
| BO-SPEC-005.AC9 (web)  | Test 4 (manual sanity); automated in `spec-005-web-theming.test.tsx`                           |
| BO-SPEC-005.AC10 (web) | Tests 1, 2, 3                                                                                  |
