---
id: BO-SPEC-033
title: Third-Party Integration Setup (Dev)
status: draft
priority: P0
phase: 8
created: 2026-04-25
updated: 2026-04-28
---

# BO-SPEC-033: Third-Party Integration Setup (Dev)

## Problem Statement

The ROADMAP tracks features that consume third-party services (Clerk, Twilio, Deepgram, Anthropic, Stripe Connect, Google Calendar, Expo Push, external pricing) but never explicitly covers the platform-side provisioning of those vendor accounts. Without a dedicated setup spec, account creation, API key management, webhook configuration, and secrets storage are scattered implicitly across feature specs and risk being forgotten, duplicated, or done inconsistently. This spec consolidates one-time vendor onboarding **for the dev environment only** into a single Phase 0 deliverable so feature specs can assume credentials and webhooks already exist in dev. A later spec will handle prod promotion.

## Scope: Dev Only

This spec is intentionally scoped to the **dev Convex deployment** and vendor sandbox/test modes. Production accounts, live keys, and prod webhook endpoints are explicitly **out of scope** and deferred to a later phase. However, all dev setup must be done in a way that **minimizes the friction of replicating to prod later** — see "Prod-Readiness Discipline" below.

## Affected Users

| User Role         | Impact                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| Solo developer    | One-time dev setup checklist; clear ownership of dev accounts, keys, and rotation                 |
| Contractor (user) | No direct impact, but blocks any feature that relies on a vendor until that vendor is provisioned |

## Desired Outcome

Every third-party vendor required for the MVP has a provisioned dev/sandbox account, working test credentials in the dev Convex deployment, documented dev webhook endpoints (where applicable), and a written rotation procedure. Feature specs in later phases can integrate with each vendor in dev without first re-doing platform setup. Configuration shape is identical to what prod will need, so the future prod-promotion spec is a credentials-and-URLs swap, not a re-architecture.

## Vendors In Scope (Dev Setup)

| Vendor             | Purpose                                                | Dev Mode            | Webhook(s)                                      |
| ------------------ | ------------------------------------------------------ | ------------------- | ----------------------------------------------- |
| Clerk              | Auth (Google, Apple, SMS OTP)                          | Dev instance        | User lifecycle → Convex                         |
| Twilio             | Phone numbers, SMS auto-reply, voicemail, callbacks    | Test credentials    | Incoming SMS, voice, voicemail recording status |
| Deepgram           | STT (batch + streaming, EN/ES)                         | API key, no sandbox | Async transcription callbacks                   |
| Anthropic (Claude) | AI summarization, estimate/invoice generation          | API key             | None                                            |
| Stripe Connect     | Customer payments + contractor payouts + subscriptions | Test mode           | Account, payment, subscription, payout events   |
| Google Calendar    | Calendar sync (OAuth)                                  | OAuth dev project   | Push notifications (watch channel)              |
| Apple EventKit     | Native calendar sync (no server credentials)           | n/a                 | n/a                                             |
| Expo Push          | iOS/Android push delivery                              | EAS dev project     | None (delivery receipts pulled)                 |
| External Pricing   | Job pricing data (provider TBD)                        | TBD                 | TBD                                             |
| ElevenLabs         | Voice cloning (post-MVP)                               | Deferred            | Deferred                                        |
| Sentry             | Error monitoring (covered by SPEC-006)                 | Already in flight   | n/a                                             |

## Prod-Readiness Discipline

To minimize the cost of a future prod-promotion spec, all dev setup must follow these rules:

- **Env-var naming is environment-agnostic** — use `TWILIO_ACCOUNT_SID`, not `TWILIO_DEV_SID`. Prod uses the same variable name with a different value.
- **Webhook URLs are derived from a single base URL env var** (`CONVEX_SITE_URL` or equivalent), so prod swap is a single value change.
- **Vendor accounts that support multi-environment in one account (Stripe test/live, Clerk dev/prod instances) use that built-in separation** rather than creating duplicate logical accounts.
- **Vendor accounts that don't support multi-env (Twilio, Deepgram, Anthropic, Expo)** are provisioned with the long-term **owner identity** (company email/billing) from day one, even in dev — so prod is a credential generation, not an account migration.
- **Webhook signature verification is implemented now**, against dev keys, so prod swap doesn't require new code paths.
- **Config accessors throw if a required env var is missing**, with a message that names the var — making prod misconfiguration loud and obvious.
- **A `prod-readiness.md` checklist** in `docs/products/backend-office/integrations/` enumerates exactly what must change per vendor for prod (key swap, webhook URL update, billing upgrade, etc.).

## Acceptance Criteria

- **BO-SPEC-033.AC1** [backend]: Each in-scope MVP vendor has a documented dev account owner, billing owner, and login recovery method recorded in `docs/products/backend-office/integrations/`.
- **BO-SPEC-033.AC2** [backend]: All vendor dev API keys/secrets are stored in the dev Convex deployment's environment variables; no secret is committed to the repo. Variable names are environment-agnostic (no `_DEV_` suffix) so prod uses the same names with different values.
- **BO-SPEC-033.AC3** [backend]: A `convex/lib/integrations.ts` (or per-provider module) exposes a typed accessor for each vendor's config, throwing a clear error naming the missing env var when invoked without the required value.
- **BO-SPEC-033.AC4** [backend]: For each vendor with webhooks (Clerk, Twilio, Stripe, Google Calendar), the inbound HTTP endpoint is registered in `convex/http.ts` with signature verification implemented (against dev keys) and a stub handler that logs and returns 200; downstream handling is deferred to feature specs.
- **BO-SPEC-033.AC5** [backend]: All webhook URLs registered with vendors are derived from a single base-URL env var so prod promotion is a one-value change, not per-vendor reconfiguration.
- **BO-SPEC-033.AC6** [backend]: Each in-scope MVP vendor's stubbed health check from BO-SPEC-006 is replaced with a real connectivity probe (e.g., Twilio account status, Stripe balance retrieve, Deepgram projects list, Anthropic models list, Clerk session verify, Google Calendar token introspect) registered against the BO-SPEC-006 health-check registry, and the 15-minute cron records live `ok`/`error` results for each in dev.
- **BO-SPEC-033.AC7** [backend]: Documented dev secret rotation procedure exists for each vendor, including which env vars to update and how to verify post-rotation; the same procedure is reusable for prod.
- **BO-SPEC-033.AC8** [backend]: Twilio dev has at least one test phone number provisioned; Stripe Connect platform account is created with Express + Standard enabled in test mode; Clerk dev instance has Google, Apple, and SMS OTP providers enabled.
- **BO-SPEC-033.AC9** [backend]: An integration matrix in `docs/products/backend-office/integrations/README.md` lists each vendor, dev status (provisioned / pending / deferred), env var names, dev webhook URL(s), and the feature spec(s) that depend on it.
- **BO-SPEC-033.AC10** [backend]: A `prod-readiness.md` checklist in `docs/products/backend-office/integrations/` enumerates per-vendor what must change for prod promotion (key swap, webhook URL update, billing tier, account-level toggles), so the future prod spec inherits a complete punch list.

## Open Questions

- External pricing provider: which vendor? (Decision blocks AC1/AC2 for that row.)
- Twilio: do we use a single account with dev test credentials now, planning to add a prod subaccount later, or provision a subaccount structure up-front?
- Stripe Connect: register webhooks once against the dev Convex URL, or use Stripe CLI forwarding for local dev iteration?
- Should secret rotation be calendar-scheduled (e.g., yearly) via a `/schedule` agent, or only triggered on suspected compromise?

## Technical Notes

- This spec is **dev-environment infrastructure only** — no product features ship as a result, and no prod credentials or accounts are touched. Feature specs (SPEC-007, 009, 011, 012, 014, 017, 022, 023, etc.) build on top of the dev credentials and webhook stubs established here.
- Prod promotion is deferred to a later spec (likely sequenced near launch prep). That spec's job is to: create prod accounts where needed, generate prod keys, set them in the prod Convex deployment using the same env var names, update webhook URLs to the prod Convex site URL, and run through `prod-readiness.md`.
- Webhook signature verification helpers belong in `convex/lib/integrations/<vendor>.ts` so feature specs can reuse them and prod inherits the same verification path.
- **Relationship to BO-SPEC-006**: BO-SPEC-006 ships the health-check registry, cron runner, results table, and stub registrations returning `{ status: "stubbed" }`. This spec replaces each stub with a live dev connectivity probe. After this spec lands, the same cron and admin action surface real `ok`/`error` results in dev without changing the registry contract; prod promotion just runs the same code against prod credentials.
- Each live probe should be cheap and read-only (e.g., account status, list-models, balance retrieve) — never a write that could incur cost or side effects.
- Voice Cloning (ElevenLabs) is intentionally deferred; tracked for visibility only.
- Sentry setup is owned by SPEC-006 and is referenced here, not duplicated.

## Manual Test Scripts

<!-- Created during development. Backend-only spec — no native/web E2E scripts expected. -->
<!-- Backend smoke test: e2e/test-scripts/backend-office/backend/BO-SPEC-033-integrations-check.md -->
