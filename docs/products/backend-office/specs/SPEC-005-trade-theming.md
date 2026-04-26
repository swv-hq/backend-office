---
id: BO-SPEC-005
title: Trade Theming System
status: implemented
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-25
---

# BO-SPEC-005: Trade Theming System

## Problem Statement

Back-End Office ships as a single app but must feel like it was built specifically for each trade. Contractors should see their trade's language, colors, and icons throughout the app. A theming system allows the app to adapt at runtime based on the contractor's trade selection during onboarding.

## Affected Users

| User Role  | Impact                                                              |
| ---------- | ------------------------------------------------------------------- |
| Contractor | App feels personalized to their trade — builds trust and engagement |

## Desired Outcome

After selecting their trade during onboarding, the entire app adapts: color scheme, iconography, and terminology change to match the handyman, plumber, or electrician experience. The theming is consistent across all screens and components.

## Acceptance Criteria

- **BO-SPEC-005.AC1** [native]: After a contractor's trade is set, every screen in the app displays that trade's colors, icons, and terminology — no screen falls back to generic styling.
- **BO-SPEC-005.AC2** [native]: Handyman, plumber, and electrician each present a visually distinct experience — a contractor opening the app can identify their trade without reading text.
- **BO-SPEC-005.AC3** [native, web]: Trade-specific terminology replaces generic labels throughout the contractor's experience (e.g., a plumber sees "service call" where a handyman sees "job").
- **BO-SPEC-005.AC4** [native]: When the contractor's trade is loaded or changed, the app's appearance and language update without requiring a restart or manual refresh.
- **BO-SPEC-005.AC5** [native]: During onboarding, before a trade is selected, the app displays a neutral default appearance that is fully readable and usable.
- **BO-SPEC-005.AC6** [native]: After app restart, the contractor's themed experience appears immediately on first paint — no flash of an incorrect or default theme.
- **BO-SPEC-005.AC7** [backend]: AI-generated estimate and invoice content uses the contractor's trade-specific terminology and tone.
- **BO-SPEC-005.AC8** [web]: Customer-facing estimate and invoice pages display the contractor's trade theme — the customer sees the same colors and language the contractor uses in the app.
- **BO-SPEC-005.AC9** [native, web]: All three themes meet WCAG AA contrast standards for body text, headings, and interactive elements.
- **BO-SPEC-005.AC10** [native, web]: Every themed screen renders correctly across all three trades — no broken layouts, clipped text, unreadable contrast, or missing icons.

## Open Questions

- ~~What are the specific color palettes for each trade?~~ **Resolved (2026-04-25):** Provisional palettes per trade, all verified color-blind-safe (deuteranopia, protanopia, tritanopia) — see Technical Notes. Refine with designer pre-launch.
- ~~Should the app icon on the home screen change per trade?~~ **Resolved (2026-04-25):** Post-launch. v1 ships a single brand icon. Per-trade alternate icons (Expo iOS alternate icons / Android activity-alias) are deferred until designed assets exist and v1 has real-user feedback.
- ~~How different should the icon sets be?~~ **Resolved (2026-04-25):** Accent icons only. Shared base icon library across all trades for nav/actions/forms; trade-specific icons used only in surfaces where trade flavor matters: material categories, empty states, onboarding, and dashboard hero artwork.

## Technical Notes

- Use a React context provider on native to expose the current theme (colors, typography overrides, terminology map, icon mappings) to all components. Components must consume from context — no hardcoded colors or trade-specific strings.
- Terminology is a key-value map per trade: `{ jobLabel: "Service Call", materialCategory: "Plumbing Supplies", ... }`. Backend AI prompts and frontend rendering must reference the same map to stay consistent.
- Define theme + terminology in a shared location (e.g., `packages/backend-office-backend/convex/lib/themes.ts`) so backend AI prompts and frontend rendering use one source of truth. Web customer-facing pages receive the contractor's trade via estimate/invoice payload and apply the matching theme.
- Persist the last-known trade locally on native (e.g., MMKV/SecureStore) so the correct theme is available on first paint after restart, before the profile query resolves (AC6).
- Default theme is a neutral palette used during onboarding pre-trade-selection (AC5). It must not look like any specific trade.
- Verify WCAG AA contrast (AC9) with an automated check against each theme's color tokens; do not rely solely on visual review.
- **Provisional trade palettes** (color-blind-safe — distinguishable under deuteranopia, protanopia, and tritanopia simulation; never rely on hue alone for state — pair with icon/label/shape):
  - **Handyman** — primary `#2B2B2B` (charcoal), secondary `#5A5A5A` (slate), accent `#E8A33D` (amber). Warm/neutral pairing safe across CVD types.
  - **Plumber** — primary `#0B3D5C` (deep navy), secondary `#1F6F8B` (steel blue), accent `#E8A33D` (amber). Blue/amber is the canonical CVD-safe pairing.
  - **Electrician** — primary `#111111` (near-black), secondary `#3A3A3A` (graphite), accent `#F5C518` (electric yellow). High-luminance contrast keyed off lightness, not hue.
  - Status colors (success/warning/error) are shared across themes and must use shape/icon redundancy (e.g., ✓ / ⚠ / ✕), not color alone.
  - Run palettes through a CVD simulator (e.g., Sim Daltonism, Stark) and a contrast checker before merge.
- **Iconography strategy:** one shared base icon library (e.g., Lucide or Phosphor) for nav, actions, and form controls — never swapped per trade. Trade-specific icons appear only in: material category pickers, empty-state illustrations, onboarding screens, and dashboard hero artwork. This keeps the UI language consistent and the bundle lean while preserving trade flavor where it matters.

## Slice Plan

Phase 0 foundational work. Native today has only HomeScreen + LoginScreen and customer-facing web pages don't exist yet, so this spec ships _the system_ and integrates with what exists. AC1 ("every screen") and AC10 ("renders correctly across all three trades") are enforced as system-level guarantees (theme provider wraps the app; no hardcoded colors/strings) so future specs inherit them.

Build order is backend foundation → native vertical → web vertical.

1. **Slice 1: Shared theme + terminology source of truth** — `convex/lib/themes.ts` exports all three trade themes + neutral default + terminology map. Automated WCAG AA contrast + CVD-safe tests. Covers AC9 (token-level contrast verification).
2. **Slice 2: Native ThemeProvider + persistence + neutral default** — `<ThemeProvider>` wrapping app, `useTheme()`, MMKV-persisted `tradeType` for first-paint, neutral default pre-onboarding, live update on profile change. HomeScreen + LoginScreen consume tokens. Covers AC1, AC4, AC5, AC6.
3. **Slice 3: Three-trade visual distinctness on native** — All three palettes wired; render tests prove existing screens render correctly under all three trades. Covers AC2, AC10 (native).
4. **Slice 4: Terminology hook (native + shared web util)** — `useTerminology()` on native; shared terminology lookup importable by web. Demonstrated on an existing label. Covers AC3.
5. **Slice 5: Backend AI prompt terminology helper** — `buildPromptContext(tradeType)` helper injecting trade terminology + tone; consumed by future AI specs (017/018/021). Covers AC7.
6. **Slice 6: Web customer-facing theming + terminology** — Web theme provider driven by trade in estimate/invoice payload; sample customer route renders themed; contrast tests. Covers AC8, AC9 (web), AC10 (web).

## Manual Test Script

- Native: [`e2e/test-scripts/backend-office/native/BO-SPEC-005-trade-theming.md`](../../../../e2e/test-scripts/backend-office/native/BO-SPEC-005-trade-theming.md)
- Web: [`e2e/test-scripts/backend-office/web/BO-SPEC-005-trade-theming.md`](../../../../e2e/test-scripts/backend-office/web/BO-SPEC-005-trade-theming.md)
