---
id: BO-SPEC-015
title: Push Notification Infrastructure
status: draft
priority: P0
phase: 3
created: 2026-04-01
updated: 2026-04-01
---

# BO-SPEC-015: Push Notification Infrastructure

## Problem Statement

The app needs to reach the contractor when they're not actively using it — missed call alerts, callback reminders, estimate approvals, payment notifications. Push notifications are the primary outbound communication channel to the contractor.

## Affected Users

| User Role  | Impact                                                               |
| ---------- | -------------------------------------------------------------------- |
| Contractor | Receives timely alerts about business events without opening the app |

## Desired Outcome

Push notification infrastructure is set up and reusable across all features. Notifications are delivered reliably, tapping a notification opens the relevant screen, and contractors can configure their preferences.

## Acceptance Criteria

- **BO-SPEC-015.AC1** [native]: Expo push notification permissions requested on first app launch (after onboarding)
- **BO-SPEC-015.AC2** [native]: Device push token registered and stored on the contractor's profile in Convex
- **BO-SPEC-015.AC3** [backend]: `sendPushNotification()` utility function that sends notifications via Expo Push API, accepting: contractorId, title, body, data (for deep linking)
- **BO-SPEC-015.AC4** [backend]: Notification queue/table that logs all sent notifications with: contractorId, type, title, body, sentAt, tappedAt (optional)
- **BO-SPEC-015.AC5** [native]: Tapping a notification opens the app to the relevant screen based on notification type (e.g., missed call -> contact detail, estimate approved -> estimate detail)
- **BO-SPEC-015.AC6** [native]: In-app notification handling — if the app is in the foreground, show an in-app banner instead of an OS notification
- **BO-SPEC-015.AC7** [native]: Permission denial handled gracefully — app works without push notifications, but shows a settings prompt explaining the value
- **BO-SPEC-015.AC8** [native]: Badge count updated on the app icon reflecting unread notifications
- **BO-SPEC-015.AC9** [backend]: Notification types defined as an enum for consistent categorization: missed_call, voicemail, callback_reminder, estimate_approved, estimate_declined, payment_received, geofence_reminder
- **BO-SPEC-015.AC10** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should notification preferences be granular (per type) or just an on/off toggle for MVP?
- Should we implement quiet hours (no notifications between e.g., 10pm-6am)?
- How should we handle token refresh when the app updates or is reinstalled?

## Technical Notes

- Expo Push Notifications: use `expo-notifications` library for token registration, permission handling, and notification reception.
- Expo Push API: `POST https://exp.host/--/api/v2/push/send` with the device token.
- Store the Expo push token on the contractor record. Handle token refresh by updating the stored token whenever the app starts.
- Deep linking: use the `data` field in the notification payload to include a screen name and entity ID. React Navigation's linking config handles the routing.
- The notification log table is useful for analytics (what notifications do contractors engage with?) and debugging.
- In-app banner: use a library like `react-native-notifee` for in-app display, or build a simple custom banner component.
