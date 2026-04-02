---
id: SPEC-002
title: Core Data Model
status: draft
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-01
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

## Acceptance Criteria

- **SPEC-002.AC1** [backend]: `contractors` table created with fields: userId, firstName, lastName, businessName, phone, tradeType (handyman | plumber | electrician), zipCode, stripeAccountId (optional), stripeAccountType (optional), calendarProvider (optional: google | apple | in_app), twilioPhoneNumber (optional), forwardingConfigured (optional boolean), logoFileId (optional), onboardingCompleted (boolean), createdAt
- **SPEC-002.AC2** [backend]: `contacts` table created with fields: contractorId, phone, name (optional), email (optional), address (optional), source (missed_call | manual | voicemail | sms), notes (optional), createdAt, updatedAt
- **SPEC-002.AC3** [backend]: `jobs` table created with fields: contractorId, contactId, status (lead | estimated | approved | in_progress | completed | paid), description (optional), scheduledAt (optional), completedAt (optional), address (optional), createdAt, updatedAt
- **SPEC-002.AC4** [backend]: `estimates` table created with fields: jobId, contractorId, version (number), lineItems (array of objects: description, quantity, unit, unitPrice, total), laborSubtotal, materialsSubtotal, total, status (draft | finalized | sent | approved | declined), changeNotes (optional), conversationHistory (optional array for AI refinement context), sentAt (optional), approvedAt (optional), declinedAt (optional), createdAt
- **SPEC-002.AC5** [backend]: `invoices` table created with fields: jobId, contractorId, estimateId, lineItems (array matching estimate format), total, status (draft | sent | paid | overdue), paidAt (optional), stripePaymentId (optional), sentAt (optional), createdAt
- **SPEC-002.AC6** [backend]: `callLogs` table created with fields: contractorId, contactId (optional), direction (inbound | outbound), callerPhone, status (missed | answered | voicemail), voicemailUrl (optional), voicemailFileId (optional), transcript (optional), summary (optional), callbackStatus (pending | reminded | completed), twilioCallSid (optional), duration (optional), createdAt
- **SPEC-002.AC7** [backend]: `auditLogs` table created with fields: contractorId (optional), action, entityType, entityId, details (optional), timestamp (see SPEC-004 for full audit logging spec)
- **SPEC-002.AC8** [backend]: Indexes created for common query patterns: contractors by userId; contacts by contractorId; jobs by contractorId, by contactId, by status; estimates by jobId, by contractorId; invoices by jobId, by contractorId, by status; callLogs by contractorId, by contactId, by callbackStatus
- **SPEC-002.AC9** [backend]: All tables have proper Convex validators using `v.object()`, `v.string()`, `v.optional()`, `v.union()`, `v.literal()` etc.
- **SPEC-002.AC10** [backend]: Generated types (`_generated/dataModel.d.ts`) compile without errors
- **SPEC-002.AC11** [backend]: Backend passes typecheck with zero errors

## Open Questions

- Should `lineItems` in estimates/invoices distinguish between labor and material line items via a `type` field, or is that inferred from the description?
- Should `address` on jobs be a structured object (street, city, state, zip) or a freeform string for MVP?

## Technical Notes

- All `contractorId` fields reference the `contractors` table. Convex doesn't enforce foreign keys at the schema level, but queries should validate ownership.
- The `conversationHistory` field on estimates stores the iterative voice refinement context so the AI can reference prior adjustments during draft editing.
- Status enums are represented as `v.union(v.literal("..."), ...)` in Convex validators.
- The `auditLogs` table is defined here but populated per SPEC-004 (Audit Logging).
- Read `convex/_generated/ai/guidelines.md` before implementing to follow Convex best practices.
