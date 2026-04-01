---
id: SPEC-006
title: Monitoring & Alerting
status: draft
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-006: Monitoring & Alerting

## Problem Statement

Without monitoring, issues like failed API calls, error spikes, or provider outages go unnoticed until a user complains. Proactive monitoring and alerting enables fast incident response and supports SOC 2 readiness.

## Affected Users

| User Role | Impact |
| --------- | ------ |
| Developer | Knows when things break before users report it |
| Contractor | Better uptime and faster issue resolution |

## Desired Outcome

Error tracking, provider health monitoring, and alerting are in place. The developer is notified of critical failures (API errors, payment failures, auth issues) within minutes.

## Acceptance Criteria

- **SPEC-006.AC1** [backend]: Error tracking service integrated (e.g., Sentry) — unhandled exceptions in Convex actions and mutations are captured with stack traces and context
- **SPEC-006.AC2** [native]: Sentry (or equivalent) integrated in the React Native app — crashes and JS errors captured with device info
- **SPEC-006.AC3** [web]: Sentry (or equivalent) integrated in the Next.js app — server and client errors captured
- **SPEC-006.AC4** [backend]: Provider health checks — each external provider (Twilio, Deepgram, Claude, Stripe) has a health check function that verifies API connectivity
- **SPEC-006.AC5** [backend]: Failed external API calls are logged with: provider name, endpoint, error message, response status, and timestamp
- **SPEC-006.AC6** [backend]: Alert notifications configured for critical events: payment processing failures, provider API errors exceeding threshold, auth anomalies (spike in failed logins)
- **SPEC-006.AC7** [backend, web, native]: All workspaces pass typecheck and lint with zero errors after integration

## Open Questions

- Which error tracking service? Sentry is the default recommendation — free tier covers early-stage usage. Alternatives: Bugsnag, Datadog.
- Where should alerts be sent? Email, Slack, PagerDuty? For a 1-person team, email or Slack is sufficient.
- Should provider health checks run on a schedule (Convex cron) or only on-demand?

## Technical Notes

- Sentry has official SDKs for React Native (sentry-expo), Next.js (@sentry/nextjs), and Node.js (@sentry/node) for Convex actions.
- For Convex, wrap action-level try/catch blocks to capture and report errors to Sentry before re-throwing.
- Provider health checks can be Convex actions that make lightweight API calls (e.g., Twilio account status, Stripe balance check). Run via Convex scheduled functions (cron) at a reasonable interval (every 15-30 minutes).
- Alert thresholds should be configurable — start with sensible defaults and adjust based on real traffic patterns.
