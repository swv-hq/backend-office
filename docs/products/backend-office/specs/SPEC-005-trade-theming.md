---
id: BO-SPEC-005
title: Trade Theming System
status: draft
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-01
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

- **BO-SPEC-005.AC1** [native]: Theme provider component wraps the app, exposing current trade theme via context
- **BO-SPEC-005.AC2** [native]: Three complete trade themes defined: handyman, plumber, electrician — each with primary color, secondary color, accent color, and icon set
- **BO-SPEC-005.AC3** [native]: Terminology map per trade: job-related terms adapt (e.g., "service call" vs "job" vs "work order", trade-specific material categories)
- **BO-SPEC-005.AC4** [native]: All UI components consume theme from context — no hardcoded colors or trade-specific strings
- **BO-SPEC-005.AC5** [native]: Theme switches at runtime when contractor's trade type is loaded from their profile
- **BO-SPEC-005.AC6** [backend]: Trade-specific terminology available as a shared constant/config that both backend (for AI prompts) and frontend can reference
- **BO-SPEC-005.AC7** [web]: Customer-facing pages (estimates, invoices) reflect the contractor's trade theme — colors and terminology match what the contractor sees
- **BO-SPEC-005.AC8** [native]: Default/fallback theme displays correctly when trade type is not yet set (during onboarding before trade selection)
- **BO-SPEC-005.AC9** [native, web]: All themed screens pass visual review — no broken styles, unreadable text, or missing icons across all three trade themes

## Open Questions

- What are the specific color palettes for each trade? Need design input.
- Should the app icon on the home screen change per trade, or is that a post-launch consideration? (Expo supports alternate icons on iOS but it adds complexity.)
- How different should the icon sets be? Full custom icon packs or just accent icons?

## Technical Notes

- Use React context for the theme provider on native. The theme object includes colors, typography overrides, terminology map, and icon mappings.
- Terminology map is a key-value structure: `{ jobLabel: "Service Call", materialCategory: "Plumbing Supplies", ... }`. AI prompts on the backend reference the same map to generate trade-appropriate language in estimates and invoices.
- Customer-facing web pages receive the contractor's trade type via the estimate/invoice data and apply the corresponding theme.
- Keep the theme definitions in a shared location (e.g., `packages/backend-office-backend/convex/lib/themes.ts`) so backend AI prompts and frontend rendering use the same source of truth.
