# BO-SPEC-006: Monitoring & Alerting — Backend E2E Test Script

## Prerequisites

- A test Sentry project for the Convex backend (free tier is fine) with its DSN copied
- Convex dev deployment env vars set (one-time, persists across runs):
  - `npx convex env set SENTRY_DSN https://<key>@o<org>.ingest.sentry.io/<project>`
  - `npx convex env set SENTRY_ENVIRONMENT local-e2e`
- `npx convex dev` running (or be ready to `npx convex deploy` on demand)

> **Note:** AC1 has an automated test at `packages/backend-office-backend/convex/lib/monitoring.test.ts` that verifies envelope construction and DSN parsing with a mocked `fetch`. The mock cannot prove the Convex isolate's `fetch` actually reaches `*.ingest.sentry.io` with our envelope payload, so this manual run closes that gap.

---

## Test 1: A thrown exception in a Convex action reaches Sentry [BO-SPEC-006.AC1]

**Prerequisites:**

- Add a temporary action at `packages/backend-office-backend/convex/sentryCheck.ts`:

  ```ts
  import { v } from "convex/values";
  import { action } from "./_generated/server";
  import { withMonitoring } from "./lib/monitoring";

  export const throwTest = action({
    args: {},
    returns: v.null(),
    handler: async () => {
      const wrapped = withMonitoring(
        "sentryCheck.throwTest",
        async () => {
          throw new Error("bo-spec-006 backend check");
        },
        {
          environment: process.env.SENTRY_ENVIRONMENT,
          release: process.env.SENTRY_RELEASE,
        },
      );
      await wrapped(undefined);
      return null;
    },
  });
  ```

- Wait for `npx convex dev` to push the new action, or run `npx convex deploy`.

**Instructions:**

1. From the repo root: `npx --workspace @backend-office/backend convex run sentryCheck:throwTest` (or invoke from the Convex dashboard's Functions panel)
2. Wait ~10–30 seconds for ingestion
3. Open the test backend Sentry project's Issues view, filter by environment `local-e2e`

**Expected Result:**

- The CLI run **fails** with `Error: bo-spec-006 backend check` and a stack trace — correct, the wrapper re-throws after capturing
- A new issue appears in Sentry titled `Error: bo-spec-006 backend check`
- The issue's tags include `environment: local-e2e`
- The `contexts.app` payload includes `handler: "sentryCheck.throwTest"` (attached by `withMonitoring`)

---

## Test 2: Init no-ops when DSN is absent [BO-SPEC-006.AC1]

**Prerequisites:**

- `npx convex env remove SENTRY_DSN` (or set it to an empty string)
- Wait for the deployment to pick up the env change

**Instructions:**

1. Re-run `npx --workspace @backend-office/backend convex run sentryCheck:throwTest`
2. Watch the Sentry project Issues view for ~30 seconds

**Expected Result:**

- The CLI still fails with `Error: bo-spec-006 backend check` (the throw still happens)
- No new issue appears in the Sentry project
- No outbound failure or unhandled-promise warnings in the Convex logs (the envelope sender swallows fetch errors so monitoring never breaks the caller)

---

## Test 3: Cleanup

**Instructions:**

1. Delete `packages/backend-office-backend/convex/sentryCheck.ts`
2. Wait for `npx convex dev` to push, or run `npx convex deploy`
3. Restore `SENTRY_DSN` if desired (`npx convex env set SENTRY_DSN ...`) or leave it cleared for local dev

---

## AC Coverage Matrix

| AC ID           | Test(s) | Notes                                                                |
| --------------- | ------- | -------------------------------------------------------------------- |
| BO-SPEC-006.AC1 | 1, 2    | End-to-end: real Convex isolate → real Sentry, plus DSN-absent guard |

ACs covered by automated tests only (no manual verification needed):

- BO-SPEC-006.AC4 — `convex/spec-006-health-checks.test.ts`
- BO-SPEC-006.AC5 — `convex/spec-006-provider-failures.test.ts`
- BO-SPEC-006.AC6 — `convex/spec-006-alert-dispatcher.test.ts`, `convex/spec-006-auth-anomaly.test.ts`
- BO-SPEC-006.AC7 — verified via `npm run typecheck` and `npm run lint` in CI

ACs covered by their own platform's manual scripts:

- BO-SPEC-006.AC2 — `e2e/test-scripts/backend-office/native/BO-SPEC-006-monitoring-alerting.md`
- BO-SPEC-006.AC3 — `e2e/test-scripts/backend-office/web/BO-SPEC-006-monitoring-alerting.md`
