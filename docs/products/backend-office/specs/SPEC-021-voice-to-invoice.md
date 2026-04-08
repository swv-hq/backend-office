---
id: SPEC-021
title: Voice-to-Invoice
status: draft
priority: P0
phase: 5
created: 2026-04-01
updated: 2026-04-06
---

# SPEC-021: Voice-to-Invoice

## Problem Statement

Contractors spend evenings typing up invoices from handwritten notes. When the job is done, they should be able to close it out on the spot — either confirming the estimate was accurate or describing changes verbally. The invoice should be generated and sent before they leave the job site.

A single job may produce multiple invoices over its lifetime: an upfront deposit, optional progress invoices as segments are completed, and a final remainder invoice that closes out the job. This spec covers all three types and the deposit-credit flow that ensures the customer's running balance is always accurate.

## Affected Users

| User Role  | Impact                                                   |
| ---------- | -------------------------------------------------------- |
| Contractor | Closes out jobs instantly on-site; no more 9pm paperwork |
| Customer   | Receives the invoice immediately; can pay right away     |

## Desired Outcome

When a contractor completes a job, they tap "Complete Job" and choose: "No changes" (invoice matches the approved estimate) or "Describe changes" (voice input). The invoice is generated, previewed, and sent to the customer with a payment link — all before leaving the site.

## Acceptance Criteria

- **SPEC-021.AC1** [native]: "New Invoice" entry point on a job presents three invoice types: **Deposit**, **Progress**, **Final**. The contractor picks the type up front; the type is stored on the invoice and never changes.
- **SPEC-021.AC2** [native]: Deposit path: contractor enters (or speaks) a flat amount and an optional description (e.g., "50% deposit"). No segments are referenced (`segmentIds: []`). Single positive line item generated with `type: "deposit"`. Allowed at any point in the job's lifecycle, including before any segment is scheduled. Multiple deposits allowed on the same job.
- **SPEC-021.AC3** [native]: Progress / Final path — segment selection screen: lists all non-canceled `jobSegments` for the job that are `completed` AND not yet referenced by any non-draft invoice (the "uncredited unbilled" set). Contractor selects one or more. "Select All" defaults are provided. The Final type closes out the job — the contractor declares this explicitly at creation time.
- **SPEC-021.AC4** [native]: After segment selection, two refinement modes: "No Changes — Use estimate line items for the selected segments" or "Describe Changes". Line items from the approved estimate that match the selected `segmentId`s are copied as the starting point.
- **SPEC-021.AC5** [native]: "Describe Changes" path: microphone button for voice input. Contractor describes what changed ("ended up needing an extra hour of labor", "used a different part that cost more"). Voice transcribed via Deepgram and sent to Claude with the seeded line items as context. AI returns adjusted line items.
- **SPEC-021.AC6** [backend]: Deposit credit injection — at creation time, the use case queries paid deposit invoices for the same job whose `_id` is not in any sibling invoice's `creditedDepositInvoiceIds`. For each, append a negative-amount line item to the new invoice with `type: "deposit_credit"` and a description referencing the source invoice number and paid date (e.g., "Deposit applied (INV-1042-1, paid 2026-04-02)"). Populate `creditedDepositInvoiceIds` with the source ids. This applies to **progress** and **final** invoices only — never to deposits.
- **SPEC-021.AC7** [native]: Invoice preview screen showing: invoice number (e.g., `INV-1042-3`), invoice type badge, segment summary ("Day 1: Rough-in, Day 2: Trim"), positive line items, deposit credit lines as negative-amount entries, total (`sum(lineItems)`), contractor business info. Customer-facing math is always `sum(lineItems)` — no special rendering logic.
- **SPEC-021.AC8** [native]: Manual edit on invoice preview: tap any line item to adjust. Same editing capabilities as estimate management (SPEC-018). Deposit credit lines are read-only (cannot be edited or deleted from the preview — they are derived state).
- **SPEC-021.AC9** [native]: "Send Invoice" button triggers delivery to customer
- **SPEC-021.AC10** [backend]: Invoice record created in `invoices` table linked to the job and estimate, with: `invoiceNumber` assigned atomically from the parent job's `nextInvoiceSequence` counter (format `INV-{jobNumber}-{sequence}`), `invoiceType`, `segmentIds`, `creditedDepositInvoiceIds`, `lineItems`, `total = sum(lineItems)`, `status: "sent"`. Once persisted the line items are immutable for the life of the document — the customer always sees the same invoice.
- **SPEC-021.AC11** [backend]: After invoice creation, `computeJobRollup` is called and the resulting status written back to the job. If all selected segments are now completed AND every non-draft invoice for the job is paid, the job will eventually roll up to "paid" once payment lands.
- **SPEC-021.AC12** [backend]: Invoice delivery via SMS (Twilio) + email (if on file). Message includes link to the payment page (SPEC-022). The deep link is a per-invoice URL (one payment session per invoice).
- **SPEC-021.AC13** [backend]: All external calls go through provider interfaces (SPEC-003)
- **SPEC-021.AC14** [backend]: Audit log entries for invoice creation and delivery
- **SPEC-021.AC15** [native]: A "Bill all unpaid completed work" shortcut on the job detail screen: pre-fills a Progress invoice with all currently uncredited unbilled completed segments selected. Useful for catch-up billing.
- **SPEC-021.AC16** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should the contractor be able to create an invoice without a prior estimate (for jobs where they skipped the estimate step)?
- Should there be a "Save as draft" option if the contractor isn't ready to send immediately?
- Should voice-to-invoice support the same iterative refinement loop as estimates (SPEC-018)?

## Technical Notes

- The AI prompt for invoice adjustment includes: the seeded line items (for the selected segments), the voice transcript of changes, and instructions to output adjusted line items. The AI should explain each change.
- Reuses the same STT + AI pipeline as voice-to-estimate. The key difference is the AI is making modifications to existing line items, not generating from scratch.
- Change highlighting: compare invoice line items to the seeded estimate line items to show additions, removals, and modifications. Deposit credit lines are excluded from this diff.
- The "Send Invoice" action generates a secure token (in `accessTokens`) for the payment page URL and sends it via the telephony provider.
- Deposit credit derivation is a use-case concern, not a schema concern. The "uncredited paid deposits" query is: `paid` deposit invoices for the job whose `_id` does not appear in `creditedDepositInvoiceIds` of any sibling invoice. Build it via a single fetch of all invoices for the job (`by_jobId` index) — small N, no scaling concern.
- Job "paid" state is derived by `computeJobRollup`, not set by this spec. This spec ends with "invoice marked paid by Stripe webhook"; the rollup follows.
- Edge case: a final invoice whose total is zero or negative (over-deposited) is allowed at the data layer but the UI flags it and asks the contractor to confirm. Refunds are out of scope and handled by a future spec.
