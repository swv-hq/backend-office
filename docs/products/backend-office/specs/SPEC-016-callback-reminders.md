---
id: SPEC-016
title: Time-Based Callback Reminders
status: draft
priority: P0
phase: 3
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-016: Time-Based Callback Reminders

## Problem Statement

Contractors miss calls during jobs and forget to call back. By the time they remember, the customer has moved on. Periodic reminders about pending callbacks ensure no lead goes cold because the contractor was busy.

## Affected Users

| User Role  | Impact                                          |
| ---------- | ----------------------------------------------- |
| Contractor | Never forgets to return a call; leads stay warm |

## Desired Outcome

The app maintains a queue of pending callbacks. At configurable intervals, push notifications remind the contractor who they need to call back, with a one-line summary of what the caller needs. One tap starts the call.

## Acceptance Criteria

- **SPEC-016.AC1** [backend]: Pending callbacks queue derived from call logs where `callbackStatus = "pending"` and `status = "missed"` or `status = "voicemail"`
- **SPEC-016.AC2** [backend]: Convex scheduled function runs at a configurable interval (default: every 2 hours during business hours 7am-8pm) to check for pending callbacks
- **SPEC-016.AC3** [backend]: When pending callbacks exist, push notification sent to contractor: "You have {count} people to call back. Tap to see who."
- **SPEC-016.AC4** [native]: Tapping the reminder notification opens a "Pending Callbacks" screen
- **SPEC-016.AC5** [native]: Pending Callbacks screen shows each pending callback as a card: caller name/number, one-line AI summary (from voicemail if available), time since they called
- **SPEC-016.AC6** [native]: One-tap "Call" button on each card opens the dialer with the number pre-filled
- **SPEC-016.AC7** [native]: Swipe or tap to mark a callback as "completed" (manually) — removes it from the pending queue
- **SPEC-016.AC8** [backend]: When contractor makes an outbound call to a contact with a pending callback (detected via Twilio outbound call log), automatically mark callback as "completed"
- **SPEC-016.AC9** [backend]: Callback status transitions: pending -> reminded -> completed
- **SPEC-016.AC10** [native]: Pending callback count shown as a badge on the main navigation
- **SPEC-016.AC11** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should the reminder interval be user-configurable from settings, or fixed for MVP?
- Should reminders respect "quiet hours" or is that handled at the push notification infrastructure level (SPEC-015)?
- Should old pending callbacks (e.g., > 72 hours) auto-expire or stay until manually dismissed?

## Technical Notes

- Convex scheduled functions (cron) can run the reminder check. Define in `convex/crons.ts`.
- The scheduled function queries call logs with `callbackStatus: "pending"`, groups by contractor, and sends a push notification per contractor who has pending items.
- Business hours check: compare current time against a default or contractor-configured timezone.
- Auto-complete detection (AC8): when a Twilio outbound call webhook fires, check if the called number matches a pending callback contact. If so, update the callback status.
- This is the time-based reminder system. Geofencing-triggered reminders (SPEC-026) supplement this in Phase 6.
