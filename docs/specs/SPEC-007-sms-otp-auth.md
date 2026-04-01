---
id: SPEC-007
title: SMS OTP Authentication
status: draft
priority: P0
phase: 1
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-007: SMS OTP Authentication

## Problem Statement

The app currently supports Google and Apple OAuth for login. Many tradespeople may not have a Google account associated with their work, and phone number is the most natural identifier for this audience. SMS OTP login provides the lowest-friction auth option.

## Affected Users

| User Role | Impact |
| --------- | ------ |
| Contractor | Can sign up and log in with just their phone number — no Google or Apple account required |

## Desired Outcome

Contractors can sign up and log in by entering their phone number and verifying with a one-time code sent via SMS. This works alongside existing Google and Apple OAuth options.

## Acceptance Criteria

- **SPEC-007.AC1** [native]: Login screen shows three auth options: phone number, Google, Apple
- **SPEC-007.AC2** [native]: Phone login flow: enter phone number -> receive SMS code -> enter code -> authenticated
- **SPEC-007.AC3** [native]: Phone number input validates format before sending OTP (US numbers at minimum, international as supported by Clerk)
- **SPEC-007.AC4** [native]: Error states handled: invalid phone number, expired code, wrong code, rate limiting
- **SPEC-007.AC5** [native]: Resend code option available after a cooldown period (e.g., 30 seconds)
- **SPEC-007.AC6** [backend]: Clerk configured with SMS OTP authentication enabled
- **SPEC-007.AC7** [native]: New users who sign up via phone are created in Clerk and can proceed to onboarding
- **SPEC-007.AC8** [native]: Existing users who log in via phone are authenticated and proceed to the main app
- **SPEC-007.AC9** [web]: SMS OTP login available on web for customer-facing flows if needed in future (Clerk config supports it)
- **SPEC-007.AC10** [native]: All auth flows pass typecheck and lint

## Open Questions

- Should we support international phone numbers from the start, or US-only for MVP?
- Clerk SMS OTP uses their built-in SMS delivery. Is the cost per SMS acceptable, or should we configure Twilio as the SMS transport through Clerk?

## Technical Notes

- Clerk provides built-in phone number authentication with `useSignUp()` and `useSignIn()` hooks.
- The Clerk React Native SDK (clerk-expo) supports phone number verification flows out of the box.
- SMS OTP adds per-message cost through Clerk's SMS delivery. Monitor volume during beta.
- The phone number used for auth may or may not be the same as the Twilio business number set up during onboarding — these are separate concepts.
