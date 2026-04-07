---
id: SPEC-004
title: Audit Logging
status: draft
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-06
---

# SPEC-004: Audit Logging

## Problem Statement

For SOC 2 readiness, debugging, and customer support, all significant data mutations and access events must be logged. Without audit logging, there is no trail of who did what and when, making incident investigation and compliance difficult.

## Affected Users

| User Role  | Impact                                                 |
| ---------- | ------------------------------------------------------ |
| Developer  | Debugging aid, ability to trace data changes           |
| Contractor | Assurance that their data access is tracked and secure |

## Desired Outcome

Every significant mutation (create, update, delete) and sensitive read operation is automatically logged to an audit log table. Logs include who performed the action, what entity was affected, and relevant details. Logs are append-only and cannot be modified by application code.

## Acceptance Criteria

- **SPEC-004.AC1** [backend]: `auditLogs` table stores: contractorId (optional — null for system actions), action (string: create, update, delete, access, auth_success, auth_failure), entityType (string: contractor, contact, job, jobSegment, estimate, invoice, callLog), entityId (string), details (optional object with before/after state or context), ipAddress (optional), timestamp
- **SPEC-004.AC2** [backend]: Helper function `logAudit()` that mutations and actions call to create audit log entries
- **SPEC-004.AC3** [backend]: All mutations that create, update, or delete contractors, contacts, jobs, jobSegments, estimates, invoices, or call logs call `logAudit()` with appropriate action and entity info. Segment status transitions (scheduled → in_progress → completed, and cancellation) are logged. Derived job status changes written back by `computeJobRollup` are also logged as `update` events on the parent job, with `details` indicating the previous and new status.
- **SPEC-004.AC4** [backend]: Auth events (login success, login failure) are logged when detectable via Clerk webhooks or session events
- **SPEC-004.AC5** [backend]: Audit log entries are append-only — no mutation exists to update or delete audit log records
- **SPEC-004.AC6** [backend]: Index on auditLogs by contractorId + timestamp for efficient querying
- **SPEC-004.AC7** [backend]: Index on auditLogs by entityType + entityId for entity-specific history
- **SPEC-004.AC8** [backend]: Backend passes typecheck with zero errors

## Open Questions

- Should audit logs be queryable by the contractor in-app (e.g., "activity history"), or are they internal/developer-only for MVP?
- What is the retention policy for audit logs? They could grow large over time.

## Technical Notes

- `logAudit()` should be an internal mutation so it can be called from both mutations and actions.
- Keep the `details` field lightweight — store relevant IDs and changed fields, not full document snapshots, to control storage growth.
- Audit logging should not block or slow down the primary mutation. Since Convex mutations are transactional, the audit log write happens in the same transaction as the data change, ensuring consistency.
- For auth events, Clerk can send webhooks to a Convex HTTP endpoint on login/logout events.
