---
id: SPEC-021
title: Voice-to-Invoice
status: draft
priority: P0
phase: 5
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-021: Voice-to-Invoice

## Problem Statement

Contractors spend evenings typing up invoices from handwritten notes. When the job is done, they should be able to close it out on the spot — either confirming the estimate was accurate or describing changes verbally. The invoice should be generated and sent before they leave the job site.

## Affected Users

| User Role | Impact |
| --------- | ------ |
| Contractor | Closes out jobs instantly on-site; no more 9pm paperwork |
| Customer | Receives the invoice immediately; can pay right away |

## Desired Outcome

When a contractor completes a job, they tap "Complete Job" and choose: "No changes" (invoice matches the approved estimate) or "Describe changes" (voice input). The invoice is generated, previewed, and sent to the customer with a payment link — all before leaving the site.

## Acceptance Criteria

- **SPEC-021.AC1** [native]: "Complete Job" screen presents two options: "No Changes — Invoice matches estimate" and "Describe Changes"
- **SPEC-021.AC2** [backend]: "No Changes" path: invoice auto-generated from the approved estimate's line items. Total, line items, and structure copied directly.
- **SPEC-021.AC3** [native]: "Describe Changes" path: microphone button for voice input. Contractor describes what changed ("ended up needing an extra hour of labor", "used a different part that cost more").
- **SPEC-021.AC4** [backend]: Voice changes transcribed via STT provider (Deepgram), then sent to AI provider (Claude) with the original estimate as context. AI returns adjusted line items.
- **SPEC-021.AC5** [native]: Invoice preview screen showing: adjusted line items (with changes highlighted vs. original estimate), totals, contractor business info
- **SPEC-021.AC6** [native]: Manual edit on invoice preview: tap any line item to adjust. Same editing capabilities as estimate management (SPEC-018).
- **SPEC-021.AC7** [native]: "Send Invoice" button triggers delivery to customer
- **SPEC-021.AC8** [backend]: Invoice record created in `invoices` table linked to the job and estimate, with status: "sent"
- **SPEC-021.AC9** [backend]: Job status transitions to "completed" when the invoice is created
- **SPEC-021.AC10** [backend]: Invoice delivery via SMS (Twilio) + email (if on file). Message includes link to the payment page (SPEC-022).
- **SPEC-021.AC11** [backend]: All external calls go through provider interfaces (SPEC-003)
- **SPEC-021.AC12** [backend]: Audit log entries for invoice creation and delivery
- **SPEC-021.AC13** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should the contractor be able to create an invoice without a prior estimate (for jobs where they skipped the estimate step)?
- Should there be a "Save as draft" option if the contractor isn't ready to send immediately?
- Should voice-to-invoice support the same iterative refinement loop as estimates (SPEC-018)?

## Technical Notes

- The AI prompt for invoice adjustment includes: the original estimate JSON, the voice transcript of changes, and instructions to output adjusted line items. The AI should explain each change.
- Reuses the same STT + AI pipeline as voice-to-estimate. The key difference is the AI has the original estimate as context and is making modifications rather than generating from scratch.
- Change highlighting: compare invoice line items to the original estimate to show additions, removals, and modifications.
- The "Send Invoice" action generates a secure token for the payment page URL and sends it via the telephony provider.
