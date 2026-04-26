---
id: BO-SPEC-004
title: Audit Logging
status: implemented
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-25
---

# BO-SPEC-004: Audit Logging

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

- **BO-SPEC-004.AC1** [backend]: Every create, update, and delete on contractors, contacts, jobs, jobSegments, estimates, invoices, and call logs produces an audit log entry capturing the actor, action, entity type, entity ID, timestamp, and a lightweight details payload describing what changed.
- **BO-SPEC-004.AC2** [backend]: Job segment status transitions (scheduled → in_progress → completed, and cancellation) are logged as discrete events.
- **BO-SPEC-004.AC3** [backend]: Derived job status changes (rolled up from segments) are logged as update events on the parent job, with details indicating previous and new status.
- **BO-SPEC-004.AC4** [backend]: Successful and failed authentication events are logged with timestamp, actor (when known), and IP address (when available).
- **BO-SPEC-004.AC5** [backend]: System-initiated actions with no human actor are logged with a null/system actor rather than being skipped.
- **BO-SPEC-004.AC6** [backend]: Audit log entries cannot be modified or deleted by application code — no API surface exists to mutate or remove an existing entry.
- **BO-SPEC-004.AC7** [backend]: An audit entry exists if and only if the underlying data change committed — a failed/aborted mutation produces no orphan audit record, and a committed change is never missing its audit record.
- **BO-SPEC-004.AC8** [backend]: Audit logs can be retrieved for a given contractor over a time range without scanning the full table.
- **BO-SPEC-004.AC9** [backend]: Audit logs can be retrieved for a specific entity (by entity type and ID) to reconstruct its full change history.
- **BO-SPEC-004.AC10** [backend]: Audit details payloads exclude sensitive values (auth tokens, passwords, full PII bodies); only identifiers and the names/values of changed fields relevant to the action are recorded.
- **BO-SPEC-004.AC11** [backend]: Audit log entries older than 365 days are automatically purged; entries within the retention window are never auto-deleted.
- **BO-SPEC-004.AC12** [backend]: Backend passes typecheck with zero errors.

## Resolved Decisions

- **Audience (MVP):** Internal/developer-only. No contractor-facing query API or activity-history UI. A user-facing activity feed, if/when needed, will be a separate spec with its own table and shape — not a view over `auditLogs`.
- **Retention:** 365 days, uniform across all event types, enforced by a daily scheduled job. Sufficient for a full SOC 2 audit cycle and most incident investigations; bounds storage growth and keeps privacy/data-deletion obligations tractable. Revisit if/when entering a regulated vertical (HIPAA, finance) that mandates longer retention.

## Technical Notes

- **Schema (`auditLogs` table):** `contractorId` (optional — null for system actions), `action` (string: `create`, `update`, `delete`, `access`, `auth_success`, `auth_failure`), `entityType` (string: `contractor`, `contact`, `job`, `jobSegment`, `estimate`, `invoice`, `callLog`), `entityId` (string), `details` (optional object), `ipAddress` (optional), `timestamp` (number).
- **Indexes:**
  - `by_contractor_timestamp` on `(contractorId, timestamp)` — supports AC8.
  - `by_entity` on `(entityType, entityId)` — supports AC9.
- **Helper:** Implement an internal mutation `logAudit()` that mutations and actions call to write entries. Keep it in `convex/data/auditLogs.ts` (data layer) with the calling logic in use cases.
- Keep the `details` field lightweight — relevant IDs and changed field names/values, not full document snapshots — to control storage growth (supports AC10).
- Convex mutations are transactional, so writing the audit entry inside the same mutation as the data change satisfies AC7 without extra coordination.
- For auth events (AC4), wire Clerk webhooks to a Convex HTTP endpoint that calls `logAudit()` with `auth_success` / `auth_failure`.
- Derived job status changes (AC3) are written by `computeJobRollup`; have it call `logAudit()` whenever the rolled-up status differs from the prior value.
- **Retention enforcement (AC11):** A Convex cron runs daily and deletes entries with `timestamp < now - 365 days`. Use the `by_contractor_timestamp` index (or a dedicated `by_timestamp` index if needed) to scan the tail efficiently, and batch deletes to stay within mutation limits. The purge runs as an internal mutation; it is the only code path permitted to delete from `auditLogs`, and AC6's "no API surface to mutate or remove" applies to all callers other than this scheduled purge.

## Scope Note

This spec lands the audit-logging **foundation** only: the `auditLogs` table, the `logAudit()` helper, internal retrieval queries, append-only enforcement, and the daily retention cron. The downstream feature specs that introduce entity mutations (BO-SPEC-007 auth, BO-SPEC-012 calls, BO-SPEC-013 contacts, BO-SPEC-020 jobs, BO-SPEC-017/018 estimates, BO-SPEC-021 invoices) are responsible for calling `logAudit()` from their own mutations to satisfy AC1–AC5 and AC7 in their domains. AC6, AC8, AC9, AC10, AC11, AC12 are fully satisfied by this build. AC1–AC5/AC7 are satisfied at the contract level (helper accepts the right shapes; transactional invariant holds because it runs inside the calling mutation).

## Slice Plan

1. **Slice 1 — Schema + `logAudit` helper** [AC1, AC5, AC7, AC10]
   Add `auditLogs` table with `by_contractor_timestamp`, `by_entity`, and `by_timestamp` indexes. Implement `internalMutation logAudit` in `convex/data/auditLogs.ts`. Tests verify entry shape, that null/system actor is accepted, and that the helper enforces the lightweight `details` contract.

2. **Slice 2 — Retrieval queries** [AC8, AC9]
   Internal queries `listByContractor(contractorId, from, to)` and `listByEntity(entityType, entityId)`. Tests verify range scans use the indexes and that results are scoped correctly.

3. **Slice 3 — Append-only surface** [AC6]
   Lock the module surface so only `logAudit` (insert), the two read queries, and the purge (Slice 4) can touch the table. Tests assert no exported update/delete API exists outside the purge.

4. **Slice 4 — Daily retention purge cron** [AC11]
   Internal mutation that batch-deletes entries with `timestamp < now - 365 days`, registered in `convex/crons.ts`. Tests verify boundary behavior (kept vs. deleted) and batching.

5. **Slice 5 — Typecheck / lint / build pass** [AC12]
   Final verification across the workspace.

## Manual Test Script

No manual E2E script. This is a backend-only infrastructure spec with no user-facing surface — the audit log table is internal and has no UI. All verification is automated in `packages/backend-office-backend/convex/spec-004-audit-logging.test.ts` via `convex-test`. Downstream feature specs that wire `logAudit()` into their own mutations will include their own E2E scripts as part of those features.
