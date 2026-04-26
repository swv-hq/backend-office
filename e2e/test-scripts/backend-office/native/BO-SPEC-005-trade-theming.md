# BO-SPEC-005: Trade Theming System — Native E2E Test Script

## Prerequisites

- Native dev build installed (see BO-SPEC-031)
- Convex dev server running
- Clerk-authenticated test user available

> **Note:** As of this spec, the contractor profile API and onboarding flow have not yet shipped (BO-SPEC-008+). Tests below exercise the theming system against the existing HomeScreen/LoginScreen with the ThemeProvider's `trade` prop temporarily set in `App.tsx` for verification, or by seeding `bo.trade` directly into SecureStore via a debugger. Update this script when onboarding lands.

---

## Test 1: Neutral default before trade is set [BO-SPEC-005.AC5]

**Prerequisites:**

- Fresh app install (no value at SecureStore key `bo.trade`)
- `App.tsx` `<ThemeProvider trade={undefined}>`

**Instructions:**

1. Launch the app
2. Observe LoginScreen and (after sign-in) HomeScreen

**Expected Result:**

- Backgrounds, text, and buttons use the neutral default palette (mid-gray primary `#4A4A4A`, blue accent `#3B82F6`, white background)
- Nothing looks like handyman charcoal/amber, plumber navy/amber, or electrician black/yellow
- All text remains comfortably readable

---

## Test 2: Plumber theme renders [BO-SPEC-005.AC1, AC2, AC10]

**Prerequisites:**

- Set `<ThemeProvider trade="plumber">` in `App.tsx`, rebuild

**Instructions:**

1. Launch the app
2. Inspect status-bar, screen background, button borders, and text colors on LoginScreen and HomeScreen

**Expected Result:**

- Status bar and primary surfaces use deep navy `#0B3D5C`
- Accents/highlights use amber `#E8A33D`
- HomeScreen subtitle reads "Your Service Calls" (plumber terminology)
- No clipped text, no missing icons, layout intact

---

## Test 3: Handyman theme renders [BO-SPEC-005.AC1, AC2, AC10]

**Instructions:**

1. Change to `<ThemeProvider trade="handyman">` and reload
2. Inspect both screens

**Expected Result:**

- Primary surfaces use charcoal `#2B2B2B`, accent amber `#E8A33D`
- HomeScreen subtitle reads "Your Jobs"
- Visually distinguishable from plumber even with no text visible

---

## Test 4: Electrician theme renders [BO-SPEC-005.AC1, AC2, AC10]

**Instructions:**

1. Change to `<ThemeProvider trade="electrician">` and reload
2. Inspect both screens

**Expected Result:**

- Primary surfaces use near-black `#111111`, accent electric yellow `#F5C518`
- HomeScreen subtitle reads "Your Service Calls"
- Visually distinguishable from plumber and handyman

---

## Test 5: Live update on trade change [BO-SPEC-005.AC4]

**Prerequisites:**

- Use a debug tool (React DevTools or a dev-only toggle) that lets you change the `trade` prop on `<ThemeProvider>` without app restart

**Instructions:**

1. Start the app with `trade="handyman"` — confirm charcoal/amber visible
2. Switch the prop to `trade="electrician"`
3. Observe screens without restarting

**Expected Result:**

- Colors and terminology update immediately on the visible screen
- No app restart required
- No UI flicker beyond the theme transition itself

---

## Test 6: First-paint persistence after restart [BO-SPEC-005.AC6]

**Prerequisites:**

- Set `<ThemeProvider trade="plumber">`, launch app once so `bo.trade=plumber` is persisted to SecureStore
- Then change `App.tsx` back to `<ThemeProvider trade={undefined}>` and rebuild (simulating: profile query hasn't resolved yet on a real boot)

**Instructions:**

1. Launch the app
2. Observe the very first frame painted

**Expected Result:**

- The plumber palette is visible on the first paint — no flash of neutral default
- After mount, the screen continues showing plumber colors

---

## Test 7: Default WCAG AA readability [BO-SPEC-005.AC9]

**Instructions:**

1. For each of the four themes (neutral, handyman, plumber, electrician), launch the app and visually inspect title and subtitle text against background

**Expected Result:**

- All body text is comfortably readable on its background under each theme
- No washed-out gray-on-white or low-contrast pairings

> Note: automated WCAG AA verification is enforced by `convex/lib/themes.test.ts` (token-level contrast tests) and the web theming test. The manual check above is a sanity sweep for real-device rendering.

---

## AC Coverage Matrix

| AC               | Tests                                                 |
| ---------------- | ----------------------------------------------------- |
| BO-SPEC-005.AC1  | Tests 2, 3, 4                                         |
| BO-SPEC-005.AC2  | Tests 2, 3, 4                                         |
| BO-SPEC-005.AC4  | Test 5                                                |
| BO-SPEC-005.AC5  | Test 1                                                |
| BO-SPEC-005.AC6  | Test 6                                                |
| BO-SPEC-005.AC9  | Test 7 (manual sanity); automated in `themes.test.ts` |
| BO-SPEC-005.AC10 | Tests 2, 3, 4                                         |
