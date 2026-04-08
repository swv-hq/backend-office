---
id: BO-SPEC-020
title: Job Lifecycle
status: draft
priority: P0
phase: 5
created: 2026-04-01
updated: 2026-04-06
---

# BO-SPEC-020: Job Lifecycle

## Problem Statement

A contractor's work follows a natural progression: a lead comes in, they estimate the work, the customer approves, they do the job, and they get paid. The app needs to track this lifecycle so the contractor always knows the status of every job, and nothing falls through the cracks.

## Affected Users

| User Role  | Impact                                                       |
| ---------- | ------------------------------------------------------------ |
| Contractor | Clear view of all jobs and their statuses; nothing gets lost |

## Desired Outcome

Jobs flow through a defined lifecycle: lead -> estimated -> approved -> in_progress -> completed -> paid. The contractor sees all jobs organized by status, can move jobs through stages, and has a calendar view of scheduled work.

## Acceptance Criteria

- **BO-SPEC-020.AC1** [backend]: Job status is a derived rollup, computed by `convex/lib/jobStatus.ts:computeJobRollup` from the job's segments, estimates, and invoices. The values are: lead -> estimated -> approved -> in_progress -> completed -> paid. The result is written to `jobs.status` (denormalized cache) inside any mutation that mutates a segment, estimate, or invoice for the job.
- **BO-SPEC-020.AC2** [backend]: Jobs auto-created in "lead" status when: a missed call creates a new contact (BO-SPEC-012), a voicemail is received (BO-SPEC-014), or an estimate is started (BO-SPEC-017). On creation, `jobNumber` is assigned atomically from the contractor's `nextJobNumber` counter.
- **BO-SPEC-020.AC3** [backend]: Status transitions are emergent from the helper, not hand-coded: creating an estimate moves "lead" -> "estimated"; approving an estimate moves "estimated" -> "approved" and auto-creates `jobSegments` from the estimate's line item groupings (BO-SPEC-018); marking the first segment in_progress moves the job to "in_progress"; marking all non-canceled segments completed moves it to "completed"; marking all non-draft invoices paid moves it to "paid".
- **BO-SPEC-020.AC4** [native]: Jobs list screen with filter tabs by status: All, Leads, Estimated, Approved, In Progress, Completed, Paid. Backed by the `by_status` index on `jobs`.
- **BO-SPEC-020.AC5** [native]: Job detail screen showing: job number (e.g. "Job #1042"), contact info, status badge, description, scheduled window (`scheduledStartAt`-`scheduledCompleteAt` from the helper), address, list of segments with their individual schedules and statuses, linked estimates (all versions), linked invoices (deposit/progress/final), call history
- **BO-SPEC-020.AC6** [native]: "Start Segment" button on a scheduled segment transitions it to "in_progress" — records `startedAt` on the segment. Job status rolls up automatically.
- **BO-SPEC-020.AC7** [native]: "Complete Segment" button transitions a segment to "completed" — records `completedAt` on the segment. When all non-canceled segments are completed, the job rolls up to "completed" and flows into invoice creation (BO-SPEC-021).
- **BO-SPEC-020.AC8** [native]: In-app calendar view showing scheduled segments by date: day view and week view. Jobs with multiple segments appear as multiple calendar entries, one per segment.
- **BO-SPEC-020.AC9** [native]: Calendar view pulls from `jobSegments.scheduledAt` (via `by_contractorId_scheduledAt` index) and synced external calendar events.
- **BO-SPEC-020.AC10** [native]: Tapping a segment on the calendar opens the parent job detail screen with that segment focused.
- **BO-SPEC-020.AC11** [backend]: Job and segment queries filtered by authenticated contractor's ID (ownership enforced).
- **BO-SPEC-020.AC12** [backend]: Audit log entries for all segment status transitions and for the resulting job status changes.
- **BO-SPEC-020.AC13** [backend]: Segment cancellation is supported: a segment can be moved to `canceled`, which excludes it from job status rollups and from "bill all unpaid completed work" queries. Existing invoices that already reference the segment are untouched. Canceled segments can be reverted to `scheduled`.
- **BO-SPEC-020.AC14** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should contractors be able to manually override job status (e.g., skip from lead to in_progress for a walk-up job)?
- Should there be a "cancelled" status for jobs that don't happen?
- How should recurring jobs be handled (e.g., monthly maintenance)? Is this MVP or post-launch?

## Technical Notes

- The "state machine" is not hand-coded — it is the output of `computeJobRollup`. Any mutation that touches segments or invoices must call the helper and write the resulting `status` back to the job atomically. Never set `jobs.status` directly.
- `jobs.scheduledStartAt` / `jobs.scheduledCompleteAt` / job-level `completedAt` are not stored as columns; they come from the helper's return value and should be included in job-read API responses.
- Auto-creation of jobs from missed calls: when BO-SPEC-012 creates a contact from a missed call, also create a job in "lead" status linked to that contact. This gives every inbound lead a trackable job. `jobNumber` is assigned at creation time from `contractors.nextJobNumber`.
- Calendar view: use a React Native calendar library (e.g., `react-native-calendars`) for the calendar UI. Data comes from a Convex query that fetches `jobSegments` with `scheduledAt` within the visible date range using the `by_contractorId_scheduledAt` index.
- For external calendar sync (Google/Apple), `jobSegments` with a `scheduledAt` create corresponding calendar events (one event per segment). Calendar events from external sources should appear in the in-app calendar as "busy" blocks.
- Job description can be auto-populated from the voicemail summary or estimate description.
