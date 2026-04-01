---
id: SPEC-026
title: Geofencing Callback Reminders
status: draft
priority: P1
phase: 6
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-026: Geofencing Callback Reminders

## Problem Statement

Time-based callback reminders (SPEC-016) work on a schedule, but the ideal moment to remind a contractor to call back is when they've just finished a job and are getting in their truck. Geofencing detects this moment — leaving a job site — and sends a contextual reminder.

## Affected Users

| User Role | Impact |
| --------- | ------ |
| Contractor | Gets callback reminders at the perfect moment — when they're free and in their truck |

## Desired Outcome

When the contractor leaves a job site (geofence exit), the app checks for pending callbacks. If there are any, it sends a push notification with caller details. This supplements the time-based reminders from SPEC-016 with smarter, context-aware triggers.

## Acceptance Criteria

- **SPEC-026.AC1** [native]: On geofence exit event (SPEC-024), check for pending callbacks (callbackStatus: "pending")
- **SPEC-026.AC2** [native]: If pending callbacks exist, send push notification: "You just left {address}. You have {count} people to call back."
- **SPEC-026.AC3** [native]: Tapping the notification opens the Pending Callbacks screen (same as SPEC-016)
- **SPEC-026.AC4** [native]: Notification includes an expandable preview of the first 1-2 pending callers with their AI summary
- **SPEC-026.AC5** [backend]: Geofence-triggered reminders do not duplicate time-based reminders — if a time-based reminder was sent within the last 30 minutes, skip the geofence reminder
- **SPEC-026.AC6** [backend]: Callback status updated to "reminded" after the geofence reminder is sent (same as time-based flow)
- **SPEC-026.AC7** [native]: If no pending callbacks, no notification is sent on geofence exit
- **SPEC-026.AC8** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should geofence reminders take priority over time-based reminders, or work as a supplement?
- Should the geofence exit also trigger a "job complete?" prompt if the job is still in "in_progress" status?

## Technical Notes

- This spec builds directly on SPEC-024 (geofencing infrastructure) and SPEC-016 (callback reminders). The geofence exit event triggers the same pending callback check.
- Deduplication logic: store `lastReminderSentAt` on each pending callback entry. Skip sending if the last reminder was recent.
- The notification payload should include the pending callback data so that tapping it navigates directly to the Pending Callbacks screen with full context.
- This feature requires "Always" location permission to work when the app is in the background.
