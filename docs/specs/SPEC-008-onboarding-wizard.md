---
id: SPEC-008
title: Onboarding Wizard
status: draft
priority: P0
phase: 1
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-008: Onboarding Wizard

## Problem Statement

New contractors must set up their profile, connect services, and configure their account before the app is useful. The onboarding must be completable in under 10 minutes (target: 5 minutes). Each step must be one screen with minimal input. If onboarding is slow or confusing, contractors will abandon the app.

## Affected Users

| User Role | Impact |
| --------- | ------ |
| Contractor | First-run experience that determines whether they keep or delete the app |

## Desired Outcome

A 6-step wizard guides new contractors through setup. Each screen has one question, one input, and one "Next" button. A progress bar shows how far along they are. At the end, the app is fully functional.

## Acceptance Criteria

- **SPEC-008.AC1** [native]: Onboarding wizard launches automatically for new users (onboardingCompleted === false)
- **SPEC-008.AC2** [native]: Progress bar at the top shows current step out of total steps
- **SPEC-008.AC3** [native]: Step 1 — Your Name: first name and last name text fields with auto-capitalize
- **SPEC-008.AC4** [native]: Step 2 — Business Info: business name text field + optional logo upload via image picker
- **SPEC-008.AC5** [native]: Step 3 — Trade Type: tap one of three options (Handyman / Plumber / Electrician). Selection applies trade theme immediately (SPEC-005).
- **SPEC-008.AC6** [native]: Step 4 — Phone Number Setup: dual path per SPEC-009 ("Get a new business number" or "Use my existing number")
- **SPEC-008.AC7** [native]: Step 5 — Calendar: connect Google Calendar, Apple Calendar, or "Back-End Office Calendar" per SPEC-010
- **SPEC-008.AC8** [native]: Step 6 — Payments: Stripe Connect setup per SPEC-011
- **SPEC-008.AC9** [native]: "Back" button on each step (except step 1) to return to previous step without losing entered data
- **SPEC-008.AC10** [native]: All entered data persists across steps — navigating back and forward does not lose input
- **SPEC-008.AC11** [backend]: On completion, contractor profile is created/updated in the `contractors` table with `onboardingCompleted: true`
- **SPEC-008.AC12** [native]: After onboarding completes, user is taken to the main app (not shown onboarding again)
- **SPEC-008.AC13** [native]: Users who have completed onboarding bypass the wizard on subsequent app launches
- **SPEC-008.AC14** [native]: Onboarding is completable in under 5 minutes by a developer (benchmark test)
- **SPEC-008.AC15** [native]: Each step validates required input before allowing "Next" — clear inline error messages on invalid input
- **SPEC-008.AC16** [native, backend]: All code passes typecheck and lint

## Open Questions

- Should partially completed onboarding be saved so the user can resume if they close the app mid-setup?
- Should onboarding steps 4-6 (phone, calendar, payments) be skippable with a "Set up later" option, or are they required?
- What is the fallback if Twilio number provisioning or Stripe Connect setup fails during onboarding?

## Technical Notes

- Use React Navigation stack for the wizard flow — each step is a screen with forward/back navigation.
- Store in-progress onboarding data in local state (React context or zustand). Persist to Convex only on completion or step-by-step if we want resume capability.
- The trade type selection in step 3 triggers the theme provider (SPEC-005) to switch themes immediately, giving a preview of their personalized experience.
- Steps 4, 5, and 6 delegate to dedicated specs (SPEC-009, SPEC-010, SPEC-011) for the actual integration logic. The onboarding wizard orchestrates the flow.
- Logo upload uses Expo ImagePicker and stores the image in Convex file storage.
