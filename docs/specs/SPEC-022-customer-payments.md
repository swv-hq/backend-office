---
id: SPEC-022
title: Customer Payments
status: draft
priority: P0
phase: 5
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-022: Customer Payments

## Problem Statement

Getting paid is the final step. Customers need a frictionless way to pay after receiving an invoice. The payment should be as easy as tapping a link and entering a card. The money goes to the contractor's Stripe account, and both parties are notified instantly.

## Affected Users

| User Role | Impact |
| --------- | ------ |
| Customer | Pays instantly from their phone via a link in the invoice SMS |
| Contractor | Gets paid faster; no chasing checks or cash |

## Desired Outcome

The customer taps "Pay Now" on the invoice web page, enters their card via Stripe Checkout, and the payment is processed. The contractor gets a push notification that they've been paid. The job status transitions to "paid."

## Acceptance Criteria

- **SPEC-022.AC1** [web]: Public route `/invoice/[token]` renders the invoice as a mobile-first web page. No login required. Token-based access.
- **SPEC-022.AC2** [web]: Invoice page shows: contractor business name/logo, trade-themed colors, itemized line items, total amount due, "Pay Now" button
- **SPEC-022.AC3** [web]: "Pay Now" button opens Stripe Checkout (hosted payment page) pre-configured with the invoice amount and contractor's Stripe Connect account as the destination
- **SPEC-022.AC4** [backend]: Stripe Checkout session created with: amount, currency (USD), contractor's connected account, platform application fee (if applicable), success/cancel redirect URLs
- **SPEC-022.AC5** [backend]: Stripe `checkout.session.completed` webhook handled: invoice status updated to "paid", `paidAt` timestamp set, `stripePaymentId` stored
- **SPEC-022.AC6** [backend]: Job status auto-transitions to "paid" when the invoice is paid
- **SPEC-022.AC7** [native]: Contractor receives push notification: "Payment received: ${amount} from {customerName} for {jobDescription}"
- **SPEC-022.AC8** [web]: After successful payment, customer sees a confirmation page: "Payment received. Thank you!"
- **SPEC-022.AC9** [web]: Invoice page shows "Paid" badge with payment date if the invoice has already been paid (prevents double payment)
- **SPEC-022.AC10** [backend]: All Stripe interactions go through the payments provider interface (SPEC-003)
- **SPEC-022.AC11** [backend]: Stripe webhook signature verification on all incoming webhooks
- **SPEC-022.AC12** [backend]: Audit log entries for payment session created, payment received
- **SPEC-022.AC13** [backend, web]: All code passes typecheck and lint

## Open Questions

- Should we support partial payments or payment plans?
- Should we add a tip/gratuity option on the payment page?
- What happens if a payment is disputed/charged back? How is the contractor notified?

## Technical Notes

- Stripe Checkout is the fastest integration path: create a session with `stripe.checkout.sessions.create()`, redirect customer to the hosted page, handle the success webhook.
- Use Stripe Connect's `payment_intent_data.application_fee_amount` to take the platform fee on each transaction (if implementing transaction fees).
- The invoice token (same pattern as estimate tokens in SPEC-019) provides secure, no-auth access.
- Webhook endpoint: Convex HTTP action that verifies the Stripe webhook signature (`stripe.webhooks.constructEvent()`), then updates the invoice and job records.
- The success redirect URL should point back to the invoice page, which now shows the "Paid" status.
- Trade theming applies to the invoice page the same way it does for estimates (SPEC-019).
