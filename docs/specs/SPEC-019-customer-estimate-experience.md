---
id: SPEC-019
title: Customer Estimate Experience
status: draft
priority: P0
phase: 4
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-019: Customer Estimate Experience

## Problem Statement

Once the contractor sends an estimate, the customer needs a clean, professional way to view it, approve or decline it, and communicate back. This experience must be mobile-first (customers open it from an SMS link on their phone) and require no login or app download.

## Affected Users

| User Role | Impact |
| --------- | ------ |
| Customer | Views professional estimates, approves/declines, and communicates — all from a link on their phone |
| Contractor | Gets real-time status updates and AI-processed customer feedback |

## Desired Outcome

The customer receives an SMS (and email if available) with a link to a mobile-first web page showing the estimate. They can approve, decline, or reply with questions/requests. The contractor's app updates in real-time. Customer replies are AI-processed into actionable insights, and can auto-generate revised estimates.

## Acceptance Criteria

- **SPEC-019.AC1** [web]: Public route `/estimate/[token]` renders the estimate as a mobile-first web page. No login required. Token-based access for security.
- **SPEC-019.AC2** [web]: Estimate page shows: contractor business name and logo (if uploaded), trade-themed colors, itemized line items with descriptions and prices, labor subtotal, materials subtotal, grand total
- **SPEC-019.AC3** [web]: "Approve" and "Decline" buttons prominently displayed
- **SPEC-019.AC4** [web]: On approve: estimate status updated to "approved", job status updated to "approved", contractor notified via push notification
- **SPEC-019.AC5** [web]: On decline: estimate status updated to "declined", contractor notified via push notification
- **SPEC-019.AC6** [web]: Reply text field: customer can type a message with questions, change requests, or feedback before or instead of approving/declining
- **SPEC-019.AC7** [backend]: Customer reply stored and sent to AI provider for analysis. AI extracts: sentiment, specific change requests, scheduling preferences, questions that need answering.
- **SPEC-019.AC8** [backend]: If the customer reply contains change requests (e.g., "can you do it without the valve?"), AI auto-generates a revised draft estimate for the contractor to review (new version per SPEC-018)
- **SPEC-019.AC9** [native]: Contractor receives push notification with AI summary of customer reply: "Customer wants to remove valve replacement to lower cost" or "Customer approved but wants to schedule for Thursday"
- **SPEC-019.AC10** [native]: Contractor can view customer reply and AI insights on the estimate detail screen
- **SPEC-019.AC11** [backend]: Estimate delivery via SMS (Twilio) to customer's phone number. Email sent if email address is on file.
- **SPEC-019.AC12** [backend]: Access token generated per estimate for URL security — tokens are unique, non-guessable, and expire after a configurable period (e.g., 30 days)
- **SPEC-019.AC13** [web]: Estimate page shows contractor's business name and contact phone number so the customer can call with questions
- **SPEC-019.AC14** [web]: Responsive design — works well on all phone screen sizes. Tested on iPhone SE (smallest) through iPhone Pro Max.
- **SPEC-019.AC15** [backend]: Audit log entries for estimate sent, viewed, approved, declined, customer reply
- **SPEC-019.AC16** [backend, web]: All code passes typecheck and lint

## Open Questions

- Should the customer be able to approve/decline after replying, or does replying replace the approve/decline action?
- Should there be a "Request Changes" button separate from the reply field for clearer intent?
- Should the estimate page show an expiration date?

## Technical Notes

- The public web route uses Next.js dynamic routing: `apps/web/src/app/estimate/[token]/page.tsx`
- Token-based access: generate a secure random token when the estimate is sent. Store it on the estimate record. The web page queries the estimate by token (no auth required).
- Customer replies are stored on a new `customerReplies` field or a separate table linked to the estimate.
- AI analysis of customer replies uses the same Claude provider interface. The prompt includes the original estimate, the customer's message, and instructions to extract actionable insights.
- Auto-generated revised estimates: the AI creates a modified version of the estimate based on the customer's request. This is stored as a new draft version that the contractor must review and approve before it's sent back.
- Trade theming on the web page: load the contractor's trade type from the estimate data and apply the corresponding color scheme (SPEC-005).
