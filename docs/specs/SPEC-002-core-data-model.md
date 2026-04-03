---
id: SPEC-002
title: Core Data Model
status: implemented
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-03
---

# SPEC-002: Core Data Model

## Problem Statement

The app needs a new data model to support contractor profiles, contacts, jobs, estimates, invoices, and call logs. The existing schema (notes only) has been removed in SPEC-001 and must be replaced with the core entities for Back-End Office.

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

## Acceptance Criteria

- **SPEC-002.AC1** [backend]: `contractors` table created with fields: userId, firstName, lastName, businessName, phone, tradeType (handyman | plumber | electrician), zipCode, stripeAccountId (optional), stripeAccountType (optional), calendarProvider (optional: google | apple | in_app), twilioPhoneNumber (optional), forwardingConfigured (optional boolean), logoFileId (optional), onboardingCompleted (boolean), createdAt
- **SPEC-002.AC2** [backend]: `contacts` table created with fields: contractorId, phone, name (optional), email (optional), address (optional structured object: street, unit (optional), city, state, zip), source (missed_call | manual | voicemail | sms), notes (optional), createdAt, updatedAt
- **SPEC-002.AC3** [backend]: `jobs` table created with fields: contractorId, contactId (optional), status (lead | estimated | approved | in_progress | completed | paid), description (optional), scheduledAt (optional), completedAt (optional), address (optional structured object: street, unit (optional), city, state, zip), createdAt, updatedAt
- **SPEC-002.AC4** [backend]: `estimates` table created with fields: jobId, contractorId, version (number), lineItems (array of objects: description, quantity, unit, unitPrice, total, type (string)), total, status (draft | finalized | sent | approved | declined), changeNotes (optional), conversationHistory (optional array for AI refinement context), sentAt (optional), approvedAt (optional), declinedAt (optional), createdAt
- **SPEC-002.AC5** [backend]: `invoices` table created with fields: jobId, contractorId, estimateId, lineItems (array matching estimate line item format), total, status (draft | sent | paid | overdue), paidAt (optional), stripePaymentId (optional), sentAt (optional), createdAt
- **SPEC-002.AC6** [backend]: `callLogs` table created with fields: contractorId, contactId (optional), direction (inbound | outbound), callerPhone, status (missed | answered | voicemail), voicemailUrl (optional), voicemailFileId (optional), transcript (optional), summary (optional), callbackStatus (pending | reminded | completed), twilioCallSid (optional), duration (optional), expiresAt (optional), createdAt
- **SPEC-002.AC7** [backend]: `accessTokens` table created with fields: entityType (string), entityId (string), token (string), expiresAt (optional), usedAt (optional), createdAt
- **SPEC-002.AC8** [backend]: Indexes created for common query patterns: contractors by userId; contacts by contractorId, by contractorId+phone; jobs by contractorId, by contactId, by status; estimates by jobId, by contractorId; invoices by jobId, by contractorId, by status; callLogs by contractorId, by contactId, by callbackStatus; accessTokens by token, by entityType+entityId
- **SPEC-002.AC9** [backend]: All tables have proper Convex validators using `v.object()`, `v.string()`, `v.optional()`, `v.union()`, `v.literal()` etc.
- **SPEC-002.AC10** [backend]: Generated types (`_generated/dataModel.d.ts`) compile without errors
- **SPEC-002.AC11** [backend]: Backend passes typecheck with zero errors

## Technical Notes

- All `contractorId` fields reference the `contractors` table. Convex doesn't enforce foreign keys at the schema level, but queries should validate ownership.
- The `conversationHistory` field on estimates stores the iterative voice refinement context so the AI can reference prior adjustments during draft editing.
- Status enums are represented as `v.union(v.literal("..."), ...)` in Convex validators.
- The structured address object is reused across `contacts` and `jobs` — define a shared validator for consistency.
- All monetary values (unitPrice, total, subtotals) are stored in cents (integers) to avoid floating point issues.
- Read `convex/_generated/ai/guidelines.md` before implementing to follow Convex best practices.
