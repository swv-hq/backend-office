---
id: BO-SPEC-023
title: Subscription Billing
status: draft
priority: P0
phase: 5
created: 2026-04-01
updated: 2026-04-01
---

# BO-SPEC-023: Subscription Billing

## Problem Statement

Back-End Office charges a monthly subscription. The billing must be automatic — deducted from the contractor's Stripe balance so they "barely notice it." A promotional introductory rate for the first month reduces friction for new signups. The contractor should never receive a manual invoice for the subscription.

## Affected Users

| User Role  | Impact                                                                |
| ---------- | --------------------------------------------------------------------- |
| Contractor | Seamless auto-billing; no invoices to manage for the app subscription |

## Desired Outcome

After the contractor completes onboarding and their Stripe account is active, a subscription is created with an introductory first-month rate. Subsequent months charge the full rate. Billing is automatic and the contractor is notified of charges.

## Acceptance Criteria

- **BO-SPEC-023.AC1** [backend]: Stripe subscription created for the contractor after their Stripe Connect account is fully onboarded and verified
- **BO-SPEC-023.AC2** [backend]: Subscription uses Stripe Billing with a product/price configured for Back-End Office monthly plan
- **BO-SPEC-023.AC3** [backend]: Introductory pricing: first month at a reduced rate (configurable). Subsequent months at full rate. Implemented via Stripe coupon or promotional price.
- **BO-SPEC-023.AC4** [backend]: Subscription amount deducted directly from the contractor's Stripe connected account balance (not charged to a separate payment method)
- **BO-SPEC-023.AC5** [backend]: Stripe `invoice.payment_succeeded` webhook updates contractor's subscription status to "active"
- **BO-SPEC-023.AC6** [backend]: Stripe `invoice.payment_failed` webhook: contractor notified via push notification. Grace period before account features are limited.
- **BO-SPEC-023.AC7** [backend]: Stripe `customer.subscription.deleted` webhook: handle cancellation gracefully
- **BO-SPEC-023.AC8** [native]: Contractor can view their subscription status and billing history in settings (BO-SPEC-028)
- **BO-SPEC-023.AC9** [native]: Push notification sent on each successful billing cycle: "Your Back-End Office subscription has been renewed"
- **BO-SPEC-023.AC10** [backend]: Subscription pricing (introductory and standard rates) configurable via environment variables or Convex config — not hardcoded
- **BO-SPEC-023.AC11** [backend]: All Stripe interactions go through the payments provider interface (BO-SPEC-003)
- **BO-SPEC-023.AC12** [backend]: Audit log entries for subscription creation, renewal, failure, and cancellation
- **BO-SPEC-023.AC13** [backend, native]: All code passes typecheck and lint

## Open Questions

- What are the exact subscription prices? Business plan says $19-39/month. Need to decide for beta.
- What is the introductory rate? (e.g., $1 first month, 50% off first month, etc.)
- What happens when payment fails? Grace period length? Feature degradation (read-only mode) or full lockout?
- Should contractors be able to cancel their subscription in-app, or only through Stripe?

## Technical Notes

- Stripe Billing: create a `Product` and `Price` for the subscription. Use `stripe.subscriptions.create()` with the contractor's connected account.
- For deducting from the Stripe balance: use Stripe's Direct Charges on the connected account. The platform creates charges against the connected account's balance.
- Introductory pricing: use Stripe Coupons (`stripe.coupons.create()`) with a `duration: "once"` for the first month discount. Apply the coupon when creating the subscription.
- Webhook events to handle: `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Grace period for failed payments: Stripe has built-in retry logic (Smart Retries). Configure dunning behavior in Stripe Dashboard.
- The subscription should be created asynchronously after the Stripe `account.updated` webhook confirms the account is fully verified (not during onboarding itself).
