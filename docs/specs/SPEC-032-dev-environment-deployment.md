---
id: SPEC-032
title: Dev Environment Deployment
status: draft
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-032: Dev Environment Deployment

## Problem Statement

The entire application stack (Convex backend, Next.js web app, React Native app) only runs locally today. There is no shared dev environment where the full system works end-to-end against real external services (Clerk auth, Twilio, Stripe, etc.). Without a deployed dev environment, we can't test real authentication flows, webhook integrations, push notifications, or share progress with testers.

## Affected Users

| User Role | Impact |
| --------- | ------ |
| Developer | Can test full integration against real services; catch deployment-specific issues early |
| Beta tester | Can access the web app and connect the native app to a real backend |

## Desired Outcome

A fully deployed dev environment where the Convex backend, Next.js web app, and React Native app all connect to real (dev-tier) external services. The developer can deploy updates with simple commands and the environment stays running for ongoing testing.

## Acceptance Criteria

- **SPEC-032.AC1** [backend]: Convex project deployed to a persistent dev deployment (not just `npx convex dev` local)
- **SPEC-032.AC2** [backend]: Environment variables configured in the Convex dashboard for dev-tier external services (Clerk, and placeholder values for Twilio/Stripe/Deepgram/Anthropic keys as those integrations are built)
- **SPEC-032.AC3** [web]: Next.js web app deployed to Vercel (or equivalent) connected to the dev Convex deployment
- **SPEC-032.AC4** [web]: Clerk authentication functional on the deployed web app (sign-up, sign-in, sign-out work end-to-end)
- **SPEC-032.AC5** [native]: React Native app configured to connect to the deployed dev Convex backend (via environment config, not hardcoded URLs)
- **SPEC-032.AC6** [native]: Clerk authentication functional in the native app against the deployed backend
- **SPEC-032.AC7** [backend, web]: Deployment commands documented in the project README or a `docs/deployment.md` guide
- **SPEC-032.AC8** [backend]: Convex deployment uses a separate project/deployment from any future production environment (clear dev/prod separation)
- **SPEC-032.AC9** [web]: Environment-specific configuration (Convex URL, Clerk publishable key) managed via environment variables, not committed secrets
- **SPEC-032.AC10** [backend, web, native]: All workspaces pass typecheck and lint with zero errors after changes

## Open Questions

- Which Vercel plan/account for the web app? Free tier should be sufficient for dev.
- Do we need a custom domain for the dev web app, or is the default Vercel URL fine for now?
- Should the native dev build (SPEC-031) connect to the deployed dev backend by default, or should that be a toggle?
- Do we need separate Clerk applications for dev vs. production, or can we use Clerk's dev/prod instance modes?

## Technical Notes

- **Convex**: `npx convex deploy` pushes the schema and functions to the cloud deployment. The Convex dashboard at dashboard.convex.dev manages environment variables. Each Convex project has separate dev and prod deployments.
- **Vercel**: `vercel` CLI or GitHub integration for the web app. Set `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` as Vercel environment variables. Use preview deployments for PRs.
- **Native app**: Use Expo's environment config (`.env` files or `app.config.ts` with `process.env`) to switch Convex URLs between local dev and deployed dev.
- **Clerk**: Recommend separate Clerk dev and prod instances. The dev instance allows test phone numbers for SMS OTP without real SMS sends. Configure redirect URLs for both localhost and deployed origins.
- **Secrets management**: Never commit API keys. Use Convex dashboard for backend secrets, Vercel dashboard for web secrets, `.env.local` for local dev (gitignored).
- This spec intentionally does NOT cover CI/CD automation — that can be added later. The goal is manual but repeatable deployment commands.

## Manual Test Scripts

<!-- Web: e2e/test-scripts/web/SPEC-032-dev-environment-deployment.md -->
<!-- Native: e2e/test-scripts/native/SPEC-032-dev-environment-deployment.md -->
