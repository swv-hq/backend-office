---
id: BO-SPEC-024
title: Geofencing Infrastructure
status: draft
priority: P1
phase: 6
created: 2026-04-01
updated: 2026-04-06
---

# BO-SPEC-024: Geofencing Infrastructure

## Problem Statement

Several features (job time tracking, smart callback reminders) need to detect when the contractor arrives at or leaves a job site. Geofencing provides battery-efficient, App Store-friendly location detection by monitoring entry/exit from a defined radius around a job address.

## Affected Users

| User Role  | Impact                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------- |
| Contractor | Automatic detection of arrival/departure at job sites powers time tracking and smart reminders |

## Desired Outcome

When a job has a scheduled address, the app creates a geofence around it. The app detects entry and exit events — even in the background — and triggers the appropriate downstream actions (time tracking in BO-SPEC-025, callback reminders in BO-SPEC-026).

## Acceptance Criteria

- **BO-SPEC-024.AC1** [native]: Location permissions requested with clear explanation: "Back-End Office uses your location to automatically track job time and remind you to call people back when you leave a job site"
- **BO-SPEC-024.AC2** [native]: "When In Use" location permission requested initially. "Always" permission requested with justification when geofencing is first needed.
- **BO-SPEC-024.AC3** [native]: When a `jobSegment` is in `scheduled` or `in_progress` status and its parent job has an address, a geofence is created around that address. The geofence is keyed off the segment, not the job — a job with three segments produces up to three geofences (one per segment). When a segment is completed or canceled, its geofence is removed.
- **BO-SPEC-024.AC4** [native]: Geofence radius configurable (default: 200 meters)
- **BO-SPEC-024.AC5** [backend]: Job address geocoded to lat/long coordinates using a geocoding service. Coordinates stored on the job record (segments inherit the parent job's coordinates).
- **BO-SPEC-024.AC6** [native]: iOS Core Location region monitoring used for geofencing (CLCircularRegion). Respects the 20-geofence iOS limit. When more than 20 segments are eligible, prioritize by `scheduledAt` (soonest first).
- **BO-SPEC-024.AC7** [native]: Geofence entry event detected and logged: contractorId, jobId, segmentId, timestamp, eventType: "enter"
- **BO-SPEC-024.AC8** [native]: Geofence exit event detected and logged: contractorId, jobId, segmentId, timestamp, eventType: "exit"
- **BO-SPEC-024.AC9** [native]: Geofence events fire reliably when app is in the background
- **BO-SPEC-024.AC10** [native]: Active geofences managed automatically: created when jobs are scheduled, removed when jobs are completed or cancelled
- **BO-SPEC-024.AC11** [native]: Graceful degradation if location permission is denied: time tracking and geofence reminders disabled, manual alternatives available
- **BO-SPEC-024.AC12** [native]: Battery impact is minimal — no continuous GPS, only region monitoring
- **BO-SPEC-024.AC13** [backend, native]: All code passes typecheck and lint

## Open Questions

- Which geocoding service to use? Apple's built-in geocoder (CLGeocoder), Google Maps Geocoding API, or a free alternative like Nominatim?
- How to handle the 20-geofence iOS limit if a contractor has many scheduled jobs? Prioritize by date (nearest first)?
- Should geofence events be synced to the backend in real-time, or batched?

## Technical Notes

- iOS: use `expo-location`'s `startGeofencingAsync()` which wraps Core Location's region monitoring.
- Region monitoring uses cell tower and WiFi triangulation primarily, switching to GPS only when near a boundary. This is what makes it battery-efficient.
- The 20-geofence iOS limit means we should only monitor upcoming jobs (today + tomorrow) and rotate geofences as jobs complete.
- Geocoding: Apple's `CLGeocoder` is free and built-in on iOS. Use it for MVP. The geocoding result (lat/long) should be stored on the job to avoid repeated lookups.
- Geofence events from the background wake the app briefly — use this to log the event to Convex and trigger downstream actions.
- Android equivalent (for future): Google Play Services Geofencing API supports up to 100 geofences.
