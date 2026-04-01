---
id: SPEC-020
title: Job Lifecycle
status: draft
priority: P0
phase: 5
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-020: Job Lifecycle

## Problem Statement

A contractor's work follows a natural progression: a lead comes in, they estimate the work, the customer approves, they do the job, and they get paid. The app needs to track this lifecycle so the contractor always knows the status of every job, and nothing falls through the cracks.

## Affected Users

| User Role | Impact |
| --------- | ------ |
| Contractor | Clear view of all jobs and their statuses; nothing gets lost |

## Desired Outcome

Jobs flow through a defined lifecycle: lead -> estimated -> approved -> in_progress -> completed -> paid. The contractor sees all jobs organized by status, can move jobs through stages, and has a calendar view of scheduled work.

## Acceptance Criteria

- **SPEC-020.AC1** [backend]: Job status enforced as a state machine: lead -> estimated -> approved -> in_progress -> completed -> paid. Invalid transitions rejected.
- **SPEC-020.AC2** [backend]: Jobs auto-created in "lead" status when: a missed call creates a new contact (SPEC-012), a voicemail is received (SPEC-014), or an estimate is started (SPEC-017)
- **SPEC-020.AC3** [backend]: Job status auto-transitions: "lead" -> "estimated" when first estimate is created; "estimated" -> "approved" when customer approves estimate; "completed" -> "paid" when payment is received
- **SPEC-020.AC4** [native]: Jobs list screen with filter tabs by status: All, Leads, Estimated, Approved, In Progress, Completed, Paid
- **SPEC-020.AC5** [native]: Job detail screen showing: contact info, status badge, description, scheduled date/time, address, linked estimates (all versions), linked invoices, call history
- **SPEC-020.AC6** [native]: "Start Job" button transitions approved job to "in_progress" — records start time
- **SPEC-020.AC7** [native]: "Complete Job" button transitions in_progress job to "completed" — records completion time, flows into invoice creation (SPEC-021)
- **SPEC-020.AC8** [native]: In-app calendar view showing scheduled jobs by date: day view and week view
- **SPEC-020.AC9** [native]: Calendar view pulls from both the jobs table (scheduledAt) and synced external calendar events
- **SPEC-020.AC10** [native]: Tapping a job on the calendar opens the job detail screen
- **SPEC-020.AC11** [backend]: Job queries filtered by authenticated contractor's ID (ownership enforced)
- **SPEC-020.AC12** [backend]: Audit log entries for all job status transitions
- **SPEC-020.AC13** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should contractors be able to manually override job status (e.g., skip from lead to in_progress for a walk-up job)?
- Should there be a "cancelled" status for jobs that don't happen?
- How should recurring jobs be handled (e.g., monthly maintenance)? Is this MVP or post-launch?

## Technical Notes

- The state machine can be implemented as a validation function in the Convex mutation that checks allowed transitions before updating.
- Auto-creation of jobs from missed calls: when SPEC-012 creates a contact from a missed call, also create a job in "lead" status linked to that contact. This gives every inbound lead a trackable job.
- Calendar view: use a React Native calendar library (e.g., `react-native-calendars`) for the calendar UI. Data comes from a Convex query that fetches jobs with `scheduledAt` within the visible date range.
- For external calendar sync (Google/Apple), jobs with a `scheduledAt` should create corresponding calendar events. Calendar events from external sources should appear in the in-app calendar as "busy" blocks.
- Job description can be auto-populated from the voicemail summary or estimate description.
