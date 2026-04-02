---
id: SPEC-027
title: Privacy & Data Management
status: draft
priority: P0
phase: 7
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-027: Privacy & Data Management

## Problem Statement

The app handles sensitive data: phone numbers, voicemail recordings, call transcripts, payment information, and business details. CCPA compliance requires a privacy policy, data disclosure, and the ability for users to delete their data. Additionally, the app must communicate its audio retention policy clearly.

## Affected Users

| User Role  | Impact                                                             |
| ---------- | ------------------------------------------------------------------ |
| Contractor | Knows what data is collected, can delete their account and data    |
| Customer   | Understands data handling when interacting with estimates/invoices |

## Desired Outcome

A privacy policy is published, contractors can delete their account and all associated data, and the 90-day audio retention policy is clearly communicated throughout the app.

## Acceptance Criteria

- **SPEC-027.AC1** [web]: Privacy policy page published at `/privacy` — covers: what data is collected, how it's used, who it's shared with (Twilio, Stripe, Deepgram, Anthropic), data retention, user rights under CCPA
- **SPEC-027.AC2** [web]: Privacy policy link included in the app footer, customer-facing estimate/invoice pages, and during onboarding
- **SPEC-027.AC3** [native]: "Delete My Account" option in settings. Requires confirmation ("This will permanently delete all your data including contacts, jobs, estimates, invoices, and recordings.")
- **SPEC-027.AC4** [backend]: Account deletion mutation: deletes or anonymizes all contractor data — profile, contacts, jobs, estimates, invoices, call logs, voicemail recordings, time entries, audit logs. Stripe account disconnected (not deleted — that's Stripe's domain).
- **SPEC-027.AC5** [backend]: Account deletion is a cascading operation: all related records across all tables are removed
- **SPEC-027.AC6** [backend]: Voicemail and voice recording audio files deleted from Convex file storage as part of account deletion
- **SPEC-027.AC7** [native]: 90-day audio retention notice displayed wherever voicemail recordings appear: "Audio recordings are retained for 90 days"
- **SPEC-027.AC8** [backend]: Server-side query filter: voicemail audio URLs are not returned for recordings older than 90 days (even if the file hasn't been cleaned up yet)
- **SPEC-027.AC9** [native]: Terms of service acceptance during onboarding (checkbox or "By continuing, you agree to our Terms and Privacy Policy" with links)
- **SPEC-027.AC10** [backend]: Audit log entry for account deletion (logged before the deletion occurs, with contractor ID for record-keeping)
- **SPEC-027.AC11** [backend, web, native]: All code passes typecheck and lint

## Open Questions

- Should account deletion be immediate or have a 30-day grace period (in case of accidental deletion)?
- Should we offer a data export option before deletion (download your data)?
- Do we need a separate Terms of Service, or does the privacy policy suffice for MVP?

## Technical Notes

- CCPA requires: right to know what data is collected, right to delete, right to opt-out of data sale (we don't sell data, so just state that).
- Privacy policy should be written in plain language — no legalese. Consider a lawyer review before launch.
- Account deletion cascade: query all tables with `contractorId` matching the user, delete all records. Use a Convex action that calls multiple internal mutations to handle the cascade.
- The 90-day audio filter (AC8): modify voicemail queries to null out `voicemailUrl` and `voicemailFileId` when `createdAt` is more than 90 days ago. The actual file cleanup can be a scheduled function (cron) that runs weekly.
- Stripe account disconnection: call `stripe.accounts.del()` or just remove the link. The contractor's Stripe account continues to exist independently.
