---
id: BO-SPEC-010
title: Calendar Connection
status: draft
priority: P0
phase: 1
created: 2026-04-01
updated: 2026-04-06
---

# BO-SPEC-010: Calendar Connection

## Problem Statement

Contractors need to see their schedule and have appointments created automatically. Some contractors already use Google or Apple Calendar; others don't use any digital calendar. The app must work for all three scenarios without forcing anyone to adopt a new tool.

## Affected Users

| User Role  | Impact                                                                             |
| ---------- | ---------------------------------------------------------------------------------- |
| Contractor | Their schedule is managed in the app, optionally synced to their existing calendar |

## Desired Outcome

During onboarding (step 5), the contractor picks one of three options. All three result in the app being able to read and write schedule data. External calendar sync is two-way where supported.

## Acceptance Criteria

- **BO-SPEC-010.AC1** [native]: Three options presented as equal choices (not "connect or skip"): "Google Calendar", "Apple Calendar", "Back-End Office Calendar"
- **BO-SPEC-010.AC2** [native]: "Back-End Office Calendar" option pitched as a feature: "We'll manage your schedule for you"
- **BO-SPEC-010.AC3** [native]: Google Calendar: OAuth 2.0 flow launched, requesting read+write calendar scopes
- **BO-SPEC-010.AC4** [backend]: Google Calendar: OAuth tokens stored securely, refresh token handling implemented
- **BO-SPEC-010.AC5** [native]: Apple Calendar: EventKit permission prompt triggered, read+write access requested
- **BO-SPEC-010.AC6** [native]: Apple Calendar: Permission denial handled gracefully — explain why access is needed, offer retry or switch to Back-End Office Calendar
- **BO-SPEC-010.AC7** [backend]: Selected calendar provider stored on contractor profile (`calendarProvider`: google | apple | in_app)
- **BO-SPEC-010.AC8** [native]: After connection, a confirmation message shows: "Calendar connected" with the selected provider name
- **BO-SPEC-010.AC9** [native]: Calendar can be changed later from app settings (BO-SPEC-028)
- **BO-SPEC-010.AC10** [backend, native]: All code passes typecheck and lint

## Open Questions

- For Google Calendar, which calendar within the account should we sync to? The primary calendar, or should we create a "Back-End Office" calendar within their Google account?
- How frequently should two-way sync run? Real-time push notifications from Google (via webhooks) or periodic polling?
- Should the in-app calendar have an export/import capability (e.g., ICS file) for contractors who want to move data later?

## Technical Notes

- Google Calendar OAuth: Use `expo-auth-session` for the OAuth flow on native. Store tokens in Convex (encrypted or via a secrets mechanism).
- Apple Calendar: Use `expo-calendar` (wraps EventKit) for iOS. Read and write events directly on device.
- For Google Calendar two-way sync, Google's Calendar API supports push notifications (webhooks) to notify of changes. This requires a publicly accessible endpoint — Convex HTTP endpoints work.
- The in-app calendar option means all scheduling data lives in the Convex `jobSegments` table (using `scheduledAt` per segment). A single job with multiple segments produces multiple calendar entries — one per segment. No external API calls needed for the in-app option.
- A calendar abstraction (similar to the provider pattern in BO-SPEC-003) may be useful here: a calendar interface with Google, Apple, and InApp implementations. The unit of sync is a `jobSegment`, not a `job`. Each provider implementation maps a segment to a calendar event (one-to-one) and persists the external event id back on the segment for two-way sync.
- Sync queries should use the `by_contractorId_scheduledAt` index on `jobSegments` to fetch segments within a date window.
