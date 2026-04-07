---
id: SPEC-002
title: Core Data Model
status: in-progress
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-06
---

# SPEC-002: Core Data Model

## Problem Statement

The app needs a new data model to support contractor profiles, contacts, jobs, estimates, invoices, and call logs. The existing schema (notes only) has been removed in SPEC-001 and must be replaced with the core entities for Back-End Office.

**Reopen note (2026-04-06):** The original implementation modeled a job as a single schedulable unit with a 1:1 estimate→invoice relationship. Real-world contractor jobs are often split into multiple work segments scheduled across different days, and a single job can produce multiple invoices over its lifecycle (deposit up front, optional progress invoices per completed segment, and a final remainder invoice). The model is being extended with a `jobSegments` table, an explicit invoice type + segment-set model, deposit credit handling, per-job numbering, and a derived job-status helper.

## Affected Users

| User Role  | Impact                                                   |
| ---------- | -------------------------------------------------------- |
| Developer  | Foundation schema that all features build upon           |
| Contractor | Data structures that represent their business operations |

## Desired Outcome

A complete Convex schema with all core entities, proper indexes, and type-safe generated types. The schema supports the full job lifecycle (lead -> estimated -> approved -> in_progress -> completed -> paid) and all planned features through Phase 6.

## Design Decisions

1. **Line item types are freeform strings** — not a fixed union. The AI defaults to "labor" and "material", but contractors can use custom types like "permit", "disposal", "subcontractor", "travel", etc.
2. **Subtotals are computed, not stored** — `laborSubtotal`, `materialsSubtotal`, and per-type subtotals are derived at read time by grouping line items on their `type` field. This avoids stale data and supports arbitrary custom types.
3. **Addresses are structured objects** — `street`, `unit` (optional), `city`, `state`, `zip`. Used on both contacts (home base) and jobs (job site). The AI parses spoken addresses into this structure during estimate creation.
4. **Estimate versioning is per-job** — query estimates by `jobId` + sort by `version`. No parent-child linking needed since revisions are linear within a job.
5. **Contact deduplication by phone** — `contractorId + phone` is a logical unique key. Implementations should upsert on this combination to avoid duplicate contacts from repeat callers.
6. **Audit logging owned by SPEC-004** — the `auditLogs` table is not defined here. SPEC-004 owns the full audit logging schema.
7. **SMS message tracking owned by SPEC-012** — the `smsMessages` table is not defined here. SPEC-012 owns SMS-related schema.
8. **Currency is USD** — no currency field. All monetary values are in US dollars for MVP.
9. **Customer-facing access uses tokens** — a dedicated `accessTokens` table provides secure, expirable access to public pages (estimates, invoices) without requiring customer login.
10. **Segments are the schedulable unit** — a new `jobSegments` table holds scheduling. `scheduledAt`/`completedAt` are removed from `jobs`. Even a simple single-visit job is one job with one segment row. Calendar views, time tracking, and geofencing all key off segments rather than jobs.
11. **Invoice type is explicit at creation time** — `invoiceType: deposit | progress | final`. `final` is set explicitly, not derived, so the contractor's intent ("this closes out the job") is captured in the data.
12. **Invoices reference segments via an array** — `segmentIds: v.array(v.id("jobSegments"))`. Empty array = deposit (no work being billed). One element = standard progress invoice. Multiple elements = catch-up or final invoice covering several segments at once. The "bill all currently unpaid completed work" flow is just a query for non-canceled completed segments not yet referenced by any non-draft invoice.
13. **Deposit credits are snapshot negative line items** — when a progress or final invoice is created, paid deposit invoices for the same job that haven't yet been credited get appended as negative-amount line items with `type: "deposit_credit"`. Tracked via `creditedDepositInvoiceIds[]` on the new invoice to prevent double-crediting. Multiple deposits supported. Once an invoice is created its line items are immutable — the customer always sees the same document.
14. **Job status, scheduled window, and completedAt are derived** — a single helper at `convex/lib/jobStatus.ts` exports `computeJobRollup(job, segments, invoices) → { status, scheduledStartAt, scheduledCompleteAt, completedAt }` and is the only source of truth for these values. `jobs.status` remains as a denormalized cache column (to preserve the `by_status` index) but use cases must call the helper and write the result back atomically inside any mutation that touches segments or invoices. `scheduledStartAt`/`scheduledCompleteAt`/`completedAt` are not stored as columns — they are returned by the helper at read time.
15. **Per-contractor job numbering with per-job sub-counters** — `contractors.nextJobNumber` (default 1000) issues `jobs.jobNumber`. Each job carries `nextEstimateVersion` and `nextInvoiceSequence` (default 1) for its child documents. Estimates and invoices store the formatted number string at creation time (`EST-1000-1`, `INV-1000-1`) so the customer always sees the same identifier even if the format changes later.
16. **Segment cancellation is a soft state** — `status: canceled` excludes the segment from auto-billing queries and from job status rollups, but leaves any existing invoices that already referenced the segment untouched. A canceled segment can be reverted to `scheduled`. Refunds for already-paid canceled work are out of scope here and handled by a future spec.

## Acceptance Criteria

- **SPEC-002.AC1** [backend]: `contractors` table created with fields: userId, firstName, lastName, businessName, phone, tradeType (handyman | plumber | electrician), zipCode, stripeAccountId (optional), stripeAccountType (optional), calendarProvider (optional: google | apple | in_app), twilioPhoneNumber (optional), forwardingConfigured (optional boolean), logoFileId (optional), onboardingCompleted (boolean), nextJobNumber (number, default 1000 at create time), createdAt
- **SPEC-002.AC2** [backend]: `contacts` table created with fields: contractorId, phone, name (optional), email (optional), address (optional structured object: street, unit (optional), city, state, zip), source (missed_call | manual | voicemail | sms), notes (optional), createdAt, updatedAt
- **SPEC-002.AC3** [backend]: `jobs` table created with fields: contractorId, contactId (optional), jobNumber (number), status (lead | estimated | approved | in_progress | completed | paid — denormalized cache, written via the jobStatus helper), description (optional), address (optional structured object: street, unit (optional), city, state, zip), nextEstimateVersion (number, default 1), nextInvoiceSequence (number, default 1), createdAt, updatedAt. Scheduling and completion timestamps live on `jobSegments`, not on `jobs`.
- **SPEC-002.AC4** [backend]: `estimates` table created with fields: jobId, contractorId, estimateNumber (string, e.g. "EST-1000-1"), version (number), lineItems (array of objects: description, quantity, unit, unitPrice, total, type (string), segmentId (optional id of jobSegments), segmentTitle (optional string)), total, status (draft | finalized | sent | approved | declined), changeNotes (optional), conversationHistory (optional array for AI refinement context), sentAt (optional), approvedAt (optional), declinedAt (optional), createdAt
- **SPEC-002.AC5** [backend]: `invoices` table created with fields: jobId, contractorId, estimateId, invoiceNumber (string, e.g. "INV-1000-1"), invoiceType (deposit | progress | final), segmentIds (array of ids of jobSegments — empty for deposits), creditedDepositInvoiceIds (array of ids of invoices, default empty), lineItems (array matching estimate line item format; may include negative-amount entries with type "deposit_credit"), total, status (draft | sent | paid | overdue), paidAt (optional), stripePaymentId (optional), sentAt (optional), createdAt
- **SPEC-002.AC6** [backend]: `callLogs` table created with fields: contractorId, contactId (optional), direction (inbound | outbound), callerPhone, status (missed | answered | voicemail), voicemailUrl (optional), voicemailFileId (optional), transcript (optional), summary (optional), callbackStatus (pending | reminded | completed), twilioCallSid (optional), duration (optional), expiresAt (optional), createdAt
- **SPEC-002.AC7** [backend]: `accessTokens` table created with fields: entityType (string), entityId (string), token (string), expiresAt (optional), usedAt (optional), createdAt
- **SPEC-002.AC8** [backend]: Indexes created for common query patterns: contractors by userId; contacts by contractorId, by contractorId+phone; jobs by contractorId, by contactId, by status, by contractorId+jobNumber; jobSegments by jobId, by contractorId, by contractorId+scheduledAt, by contractorId+status; estimates by jobId, by contractorId; invoices by jobId, by contractorId, by status; callLogs by contractorId, by contactId, by callbackStatus; accessTokens by token, by entityType+entityId
- **SPEC-002.AC9** [backend]: All tables have proper Convex validators using `v.object()`, `v.string()`, `v.optional()`, `v.union()`, `v.literal()` etc.
- **SPEC-002.AC10** [backend]: Generated types (`_generated/dataModel.d.ts`) compile without errors
- **SPEC-002.AC11** [backend]: Backend passes typecheck with zero errors
- **SPEC-002.AC12** [backend]: `jobSegments` table created with fields: jobId (id of jobs), contractorId (id of contractors, denormalized for ownership queries), sequence (number), title (optional string), description (optional string), status (scheduled | in_progress | completed | canceled), scheduledAt (optional unix ms), scheduledDuration (optional minutes), startedAt (optional), completedAt (optional), createdAt, updatedAt
- **SPEC-002.AC13** [backend]: `lineItemValidator` extended with optional `segmentId` (id of jobSegments) and optional `segmentTitle` (string). The `type` field remains a freeform string and the convention `type: "deposit_credit"` is used for negative-amount deposit credit lines on progress/final invoices.
- **SPEC-002.AC14** [backend]: `convex/lib/jobStatus.ts` exports a pure function `computeJobRollup(job, segments, invoices) → { status, scheduledStartAt, scheduledCompleteAt, completedAt }`. Status rules: `lead` when no estimate exists; `estimated` when estimate(s) exist but none approved; `approved` when an approved estimate exists and no segment has progressed past `scheduled`; `in_progress` when any non-canceled segment is `in_progress` or some-but-not-all are `completed`; `completed` when all non-canceled segments are `completed`; `paid` when `completed` AND every non-draft invoice for the job is `paid`. Canceled segments are excluded from rollups. `scheduledStartAt`/`scheduledCompleteAt` are min/max of non-canceled segment `scheduledAt` values; `completedAt` is the max of non-canceled segment `completedAt` values when status is `completed` or `paid`.
- **SPEC-002.AC15** [backend]: Numbering format is stored as a string at creation time. Estimates use the format `EST-{jobNumber}-{version}`; invoices use the format `INV-{jobNumber}-{sequence}`. Once stored, these strings are immutable for the life of the document.
- **SPEC-002.AC16** [backend]: `nextJobNumber` defaults to 1000 on contractor creation. Per-job counters `nextEstimateVersion` and `nextInvoiceSequence` default to 1 on job creation.
- **SPEC-002.AC17** [backend]: The schema permits `lineItems[].unitPrice` and `lineItems[].total` to be negative (no positivity constraint), so deposit credit lines can be expressed within the existing line item shape.

## Technical Notes

- All `contractorId` fields reference the `contractors` table. Convex doesn't enforce foreign keys at the schema level, but queries should validate ownership.
- The `conversationHistory` field on estimates stores the iterative voice refinement context so the AI can reference prior adjustments during draft editing.
- Status enums are represented as `v.union(v.literal("..."), ...)` in Convex validators.
- The structured address object is reused across `contacts` and `jobs` — define a shared validator for consistency. Segments inherit the job address; per-segment address overrides are not in scope for this round.
- All monetary values (unitPrice, total, subtotals) are stored in cents (integers) to avoid floating point issues.
- Read `convex/_generated/ai/guidelines.md` before implementing to follow Convex best practices.
- The `jobs.status` column is a denormalized cache; the source of truth is `computeJobRollup`. Any mutation that creates/updates segments or invoices must call the helper and write the result back atomically. Never set `jobs.status` directly from a use case.
- `scheduledStartAt`, `scheduledCompleteAt`, and `completedAt` for a job are derived (returned by `computeJobRollup`), not stored as columns. Use cases that need to expose them on a job-read response should compute them via the helper.
- "Bill all unpaid completed work" is a query for non-canceled `jobSegments` where `status = completed` and the segment id does not appear in `segmentIds` of any non-draft invoice for the job.
- Canceled segments do not change job status rollups in either direction; reverting `canceled` → `scheduled` similarly excludes/includes them via the helper without special-case logic.
