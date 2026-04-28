---
id: BO-SPEC-006
title: Monitoring & Alerting
status: implemented
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-28
---

# BO-SPEC-006: Monitoring & Alerting

## Problem Statement

Without monitoring, issues like failed API calls, error spikes, or provider outages go unnoticed until a user complains. Proactive monitoring and alerting enables fast incident response and supports SOC 2 readiness.

## Affected Users

| User Role  | Impact                                         |
| ---------- | ---------------------------------------------- |
| Developer  | Knows when things break before users report it |
| Contractor | Better uptime and faster issue resolution      |

## Desired Outcome

Error tracking, provider health monitoring, and alerting are in place. The developer is notified of critical failures (API errors, payment failures, auth issues) within minutes.

## Acceptance Criteria

- **BO-SPEC-006.AC1** [backend]: Error tracking service integrated (e.g., Sentry) — unhandled exceptions in Convex actions and mutations are captured with stack traces and context
- **BO-SPEC-006.AC2** [native]: Sentry (or equivalent) integrated in the React Native app — crashes and JS errors captured with device info
- **BO-SPEC-006.AC3** [web]: Sentry (or equivalent) integrated in the Next.js app — server and client errors captured
- **BO-SPEC-006.AC4** [backend]: Provider health check infrastructure — a health-check registry, scheduled runner (Convex cron), and result-storage table exist. Each currently-stubbed provider (Twilio, Deepgram, Claude, Stripe) registers a health-check action that returns `{ status: "stubbed" }`; live API connectivity checks are added in each provider's own integration spec
- **BO-SPEC-006.AC5** [backend]: Failed external API calls are logged with: provider name, endpoint, error message, response status, and timestamp (applies once providers move beyond stubs; logging helper must be in place and used by the stub layer)
- **BO-SPEC-006.AC6** [backend]: Alert notification infrastructure configured for critical events (payment processing failures, provider API errors exceeding threshold, auth anomalies). This spec delivers the channel-agnostic dispatcher, threshold config, an alert-history table, and a stub transport that records the alert payload and console-logs it. Real delivery transports (email, Slack) and per-event wiring land in later specs; one wired example (auth failed-login spike from BO-SPEC-004 audit logs) exercises the dispatcher end-to-end against the stub transport
- **BO-SPEC-006.AC7** [backend, web, native]: All workspaces pass typecheck and lint with zero errors after integration

## Open Questions

- ~~Which error tracking service?~~ **Resolved 2026-04-25:** Sentry. Official SDKs for Next.js (`@sentry/nextjs`), Expo (`sentry-expo`), and Node/Convex actions (`@sentry/node`); free tier (5k errors/mo) covers solo-dev phase; built-in source-map and release tracking.
- ~~Where should alerts be sent?~~ **Resolved 2026-04-25:** Deferred. Alert _transport_ (email/Slack/etc.) is stubbed in this spec — the dispatcher writes alert payloads to a Convex table and console-logs them. Real delivery lands in a later spec once an email provider (likely Resend) is chosen. Dispatcher is built channel-agnostic so transports plug in by config.
- ~~Should provider health checks run on a schedule (Convex cron) or only on-demand?~~ **Resolved 2026-04-25:** Both. A Convex cron runs every 15 minutes and iterates the health-check registry, recording each result; an on-demand action exposes the same registry for ad-hoc admin/debug calls. While providers are stubbed, the cron still runs and records `{ status: "stubbed" }` to validate the plumbing.

## Scope Note: Stubbed Providers

External providers (Twilio, Deepgram, Claude, Stripe) are stubbed at the time this spec is implemented. BO-SPEC-006 delivers the **monitoring foundation** — error tracking, the health-check framework, the API-failure logging helper, and the alert dispatcher — not live provider connectivity checks. Each provider's integration spec is responsible for replacing its stubbed health check with a real connectivity probe and wiring its failure paths into the logger and alert dispatcher introduced here.

## Slice Plan

1. **Slice 1: Sentry error tracking (backend + web + native)** — covers AC1, AC2, AC3. Install and initialize Sentry SDKs (`@sentry/node` for Convex actions/mutations, `@sentry/nextjs` for the web app, `sentry-expo` for the native app). Once landed, an unhandled exception in any workspace surfaces in Sentry with stack trace and context.
2. **Slice 2: Provider health-check framework + stub registrations** — covers AC4. Adds a `providerHealthChecks` table, a health-check registry module, an on-demand admin action, and a Convex cron that runs every 15 minutes. Twilio, Deepgram, Claude, and Stripe each register a stub health check returning `{ status: "stubbed" }`. Once landed, the cron records four stub results every 15 minutes and the admin action returns the same set on demand.
3. **Slice 3: Provider failure logging helper** — covers AC5. Adds a `providerFailureLog` table and a `logProviderFailure` helper (provider, endpoint, error message, response status, timestamp), wired into the stub provider layer's failure paths. Once landed, any stubbed provider failure is durable and queryable.
4. **Slice 4: Alert dispatcher + failed-login spike wiring** — covers AC6. Adds a channel-agnostic alert dispatcher, threshold config, an `alertHistory` table, and a stub transport that records the payload and console-logs it. Wires one example: a scheduled query over BO-SPEC-004 `auditLog` that fires the dispatcher when a single identifier accumulates ≥5 failed logins within 10 minutes. Once landed, the spike condition produces a row in `alertHistory` end-to-end.

AC7 (typecheck/lint clean) is verified at the end of every slice via the standard verify step.

## Technical Notes

- Sentry has official SDKs for React Native (sentry-expo), Next.js (@sentry/nextjs), and Node.js (@sentry/node) for Convex actions.
- For Convex, wrap action-level try/catch blocks to capture and report errors to Sentry before re-throwing.
- Provider health checks can be Convex actions that make lightweight API calls (e.g., Twilio account status, Stripe balance check). Run via Convex scheduled functions (cron) at a reasonable interval (every 15-30 minutes).
- Alert thresholds should be configurable — start with sensible defaults and adjust based on real traffic patterns.

## Manual Test Script

- Backend: [`e2e/test-scripts/backend-office/backend/BO-SPEC-006-monitoring-alerting.md`](../../../../e2e/test-scripts/backend-office/backend/BO-SPEC-006-monitoring-alerting.md) — covers AC1
- Web: [`e2e/test-scripts/backend-office/web/BO-SPEC-006-monitoring-alerting.md`](../../../../e2e/test-scripts/backend-office/web/BO-SPEC-006-monitoring-alerting.md) — covers AC3
- Native: [`e2e/test-scripts/backend-office/native/BO-SPEC-006-monitoring-alerting.md`](../../../../e2e/test-scripts/backend-office/native/BO-SPEC-006-monitoring-alerting.md) — covers AC2

AC4, AC5, AC6, and AC7 are fully covered by automated backend tests; no manual verification needed. AC1's automated test mocks `fetch`, so a manual end-to-end run against a real Sentry project is required to prove the Convex isolate can actually reach Sentry — see the backend script above.
