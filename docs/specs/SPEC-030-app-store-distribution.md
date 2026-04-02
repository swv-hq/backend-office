---
id: SPEC-030
title: App Store & Distribution
status: draft
priority: P0
phase: 8
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-030: App Store & Distribution

## Problem Statement

The app needs to get into the hands of beta testers and eventually the general public. This requires TestFlight setup for beta, App Store listing for launch, and an Android waitlist to gauge demand for the second platform.

## Affected Users

| User Role            | Impact                                           |
| -------------------- | ------------------------------------------------ |
| Beta tester          | Can install and test the app via TestFlight      |
| Prospective customer | Can find and download the app from the App Store |

## Desired Outcome

Beta testers can install the app via TestFlight. The App Store listing is polished and ready for public launch. An Android waitlist captures interest.

## Acceptance Criteria

- **SPEC-030.AC1** [native]: Expo EAS Build configured for iOS production builds
- **SPEC-030.AC2** [native]: TestFlight distribution set up: app uploaded, internal/external testing groups configured
- **SPEC-030.AC3** [native]: Beta invite link shareable with test group (10-20 initial testers)
- **SPEC-030.AC4** [native]: App Store listing prepared: app name ("Back-End Office"), subtitle, description, keywords, screenshots, app icon, privacy policy URL
- **SPEC-030.AC5** [native]: App icon designed reflecting the Back-End Office brand
- **SPEC-030.AC6** [native]: Screenshot set showing key features: onboarding, missed call notification, voice-to-estimate, invoice with payment
- **SPEC-030.AC7** [native]: App Store privacy "nutrition labels" accurately reflect data collection: phone number, location (geofencing), payment info, contacts
- **SPEC-030.AC8** [native]: App review submission notes prepared: explain Twilio integration, location usage, payment flows (Apple reviewers need context)
- **SPEC-030.AC9** [web]: Android waitlist functional on marketing site (SPEC-029 AC7): email stored, confirmation shown
- **SPEC-030.AC10** [native]: EAS Update configured for over-the-air JavaScript updates (bug fixes without full App Store review)
- **SPEC-030.AC11** [native, web]: All code passes typecheck and lint

## Open Questions

- What Apple Developer account will be used? Personal or organization?
- Are there any App Store guideline concerns with the auto-SMS feature or call recording disclosure?
- What is the TestFlight feedback collection process? Built-in TestFlight feedback, or a separate channel (Slack, email)?

## Technical Notes

- EAS Build: configure `eas.json` with production build profile. Use `eas build --platform ios --profile production`.
- TestFlight: after EAS builds the IPA, submit to App Store Connect. TestFlight is available automatically for uploaded builds.
- EAS Update: enables pushing JS bundle updates without going through App Store review. Configure with `eas update --branch production`.
- App Store screenshots: use the iOS Simulator to capture screenshots at required resolutions (6.7" and 6.1" displays minimum).
- Privacy nutrition labels: must accurately declare all data types collected. Location data (geofencing), contacts (phone numbers), financial data (Stripe), identifiers (user ID), and usage data.
- App Store review notes: important to explain that the app is a business tool for contractors, location is used for job-site detection (geofencing), and SMS is sent from Twilio (not the device).
