---
id: BO-SPEC-025
title: Job Time Tracking
status: draft
priority: P1
phase: 6
created: 2026-04-01
updated: 2026-04-06
---

# BO-SPEC-025: Job Time Tracking

## Problem Statement

Contractors need to know how long they spend on each job — for billing hourly jobs, understanding profitability, and making better estimates in the future. Manual time tracking is forgotten more often than not. Automatic tracking via geofencing removes the burden.

## Affected Users

| User Role  | Impact                                                                                 |
| ---------- | -------------------------------------------------------------------------------------- |
| Contractor | Automatic time tracking per job; accurate hours for billing and profitability analysis |

## Desired Outcome

When the contractor arrives at a job site (geofence entry), a timer starts automatically. When they leave (geofence exit), the timer stops. The duration is logged on the job. Manual start/stop is available as a fallback or override.

## Acceptance Criteria

- **BO-SPEC-025.AC1** [native]: When geofence entry is detected for a segment (BO-SPEC-024), auto-start a time tracking session attached to that segment. Push notification: "Timer started for {segmentTitle or jobDescription} at {address}"
- **BO-SPEC-025.AC2** [native]: When geofence exit is detected, auto-stop the time tracking session. Push notification: "Timer stopped for {segmentTitle or jobDescription} — {duration} logged"
- **BO-SPEC-025.AC3** [backend]: Time tracking session stored: segmentId, jobId (denormalized for queries), contractorId, startTime, endTime (null while running), duration, source (geofence | manual)
- **BO-SPEC-025.AC4** [native]: Manual start/stop timer button on the segment row in the job detail screen, for contractors who don't use geofencing or need to override
- **BO-SPEC-025.AC5** [native]: Active timer visible as a persistent banner/indicator at the top of the app showing: segment title (or job name), elapsed time, stop button
- **BO-SPEC-025.AC6** [native]: Multiple time sessions per segment supported (contractor may leave for lunch and come back)
- **BO-SPEC-025.AC7** [native]: Job detail screen shows total time spent per segment AND total across the whole job: sum of all sessions, with a breakdown of each session (start, end, duration)
- **BO-SPEC-025.AC8** [native]: Contractor can edit/delete time entries (e.g., correct a geofence misfire or forgot to stop the manual timer)
- **BO-SPEC-025.AC9** [backend]: Per-segment total duration is derived by summing sessions for that segment; per-job total is the sum across all non-canceled segments. Neither is stored on the row — both are computed at read time.
- **BO-SPEC-025.AC10** [native]: When creating an invoice (BO-SPEC-021) for one or more segments, the total tracked time across the selected segments is shown as reference info so the contractor can factor in time spent
- **BO-SPEC-025.AC11** [backend]: Audit log entries for time session start, stop, edit, delete
- **BO-SPEC-025.AC12** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should auto-started timers require confirmation from the contractor, or just start silently?
- How to handle geofence misfires (contractor drives past the job site without stopping)?
- Should time tracking data feed into the AI for better future estimate suggestions?

## Technical Notes

- Time tracking sessions need a new table or can be embedded as an array on the job record. A separate `timeEntries` table is cleaner for querying and editing.
- The persistent timer banner: use React Native's state management to keep the active timer visible across all screens. The actual time tracking is based on stored start time vs. current time (not a running interval).
- Geofence-triggered start: when BO-SPEC-024 fires an entry event for a job, create a time entry with `startTime = now, endTime = null`. On exit event, update the entry with `endTime = now`.
- To handle misfires (brief geofence entry/exit): consider a minimum duration threshold (e.g., ignore sessions < 2 minutes) or require confirmation.
- Duration display format: "2h 15m" for readability.
