---
id: BO-SPEC-011
title: Stripe Connect Onboarding
status: draft
priority: P0
phase: 1
created: 2026-04-01
updated: 2026-04-01
---

# BO-SPEC-011: Stripe Connect Onboarding

## Problem Statement

Contractors need to accept payments from customers and the app needs to auto-deduct subscription fees. Stripe Connect enables both: customer payments flow to the contractor's account, and the platform takes its fee. Two account types are needed: Express for new-to-Stripe contractors, Standard for those with existing Stripe accounts.

## Affected Users

| User Role  | Impact                                                               |
| ---------- | -------------------------------------------------------------------- |
| Contractor | Can accept card payments from customers; subscription is auto-billed |

## Desired Outcome

During onboarding (step 6), the contractor either connects an existing Stripe account or creates a new Express account. Both paths result in a Stripe Connect account linked to the platform, enabling customer payments and subscription billing.

## Acceptance Criteria

- **BO-SPEC-011.AC1** [native]: Two options presented: "I already have Stripe" (Standard connect) and "Set me up" (Express connect)
- **BO-SPEC-011.AC2** [native]: Standard path: opens Stripe OAuth flow where contractor logs into their existing Stripe account and authorizes the platform
- **BO-SPEC-011.AC3** [backend]: Standard path: Stripe OAuth callback processed, account ID stored on contractor profile (`stripeAccountId`, `stripeAccountType: standard`)
- **BO-SPEC-011.AC4** [native]: Express path: opens Stripe-hosted Express onboarding flow (name, DOB, SSN last 4, bank account)
- **BO-SPEC-011.AC5** [backend]: Express path: Stripe Connect account created via API, onboarding link generated, account ID stored on contractor profile (`stripeAccountId`, `stripeAccountType: express`)
- **BO-SPEC-011.AC6** [backend]: Stripe webhook handler for `account.updated` event — detects when onboarding is complete and account is ready for payouts
- **BO-SPEC-011.AC7** [native]: Success state shown when Stripe setup completes: "Payment account connected"
- **BO-SPEC-011.AC8** [native]: If contractor abandons Stripe onboarding mid-flow (closes the browser), they can retry from the same step
- **BO-SPEC-011.AC9** [native]: Error handling for Stripe connection failures with retry option
- **BO-SPEC-011.AC10** [backend]: All Stripe interactions go through the payments provider interface (BO-SPEC-003)
- **BO-SPEC-011.AC11** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should Stripe setup be skippable during onboarding? The contractor can't accept payments without it, but forcing it might cause drop-off if they don't have bank details handy.
- For Express accounts, should we pre-fill any information from the onboarding wizard (name, business name) into the Stripe flow?

## Technical Notes

- Stripe Connect Express onboarding uses Account Links: create an account, then generate an onboarding URL that opens in an in-app browser.
- Stripe Connect Standard uses OAuth: redirect to Stripe's authorization page, handle the callback.
- On native, use `expo-web-browser` to open the Stripe-hosted onboarding/OAuth flows.
- Stripe webhooks (`account.updated`) notify when the contractor completes identity verification and the account is ready.
- Webhook endpoint is a Convex HTTP action that verifies the Stripe signature and updates the contractor record.
- The subscription billing setup (BO-SPEC-023) builds on this foundation — it creates a Stripe subscription after the account is connected.
