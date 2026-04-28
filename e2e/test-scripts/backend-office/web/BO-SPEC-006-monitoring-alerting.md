# BO-SPEC-006: Monitoring & Alerting — Web E2E Test Script

## Prerequisites

- `npm run dev` running for the web app on port 3001
- A test Sentry project (free tier is fine) with its DSN copied
- `apps/backend-office-web/.env.local` containing:
  - `NEXT_PUBLIC_SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>`
  - `NEXT_PUBLIC_SENTRY_ENVIRONMENT=local-e2e`

> **Note:** AC1, AC2, AC4, AC5, and AC6 are exercised by automated backend tests under `packages/backend-office-backend/convex/spec-006-*.test.ts`. This script covers AC3 (web Sentry integration), which requires a real browser and a real Sentry project to fully verify.

---

## Test 1: Server-side error reaches Sentry [BO-SPEC-006.AC3]

**Prerequisites:**

- Add a temporary throwing route at `apps/backend-office-web/src/app/sentry-check/route.ts` that exports `export function GET() { throw new Error("bo-spec-006 server check"); }`
- Restart the dev server so `instrumentation.ts` runs and `initSentry()` registers the DSN

**Instructions:**

1. Open `http://localhost:3001/sentry-check` in the browser
2. Wait ~10 seconds for Sentry ingestion
3. Open the test Sentry project's Issues view, filter by environment `local-e2e`

**Expected Result:**

- Browser shows an HTTP 500 response (the browser's default "This page isn't working" page — route handlers do not render the Next.js dev overlay since there is no React tree)
- A new issue appears in Sentry titled `Error: bo-spec-006 server check`
- The issue's tags include `environment: local-e2e` and a server runtime indicator (e.g. `runtime: node`)
- Stack trace shows the throwing route file

---

## Test 2: Client-side error reaches Sentry [BO-SPEC-006.AC3]

**Prerequisites:**

- Mount a temporary button on `src/app/page.tsx`:
  ```tsx
  <button
    onClick={() => {
      throw new Error("bo-spec-006 client check");
    }}
  >
    spec-006
  </button>
  ```
- Reload the home page so `instrumentation-client.ts` runs and `initSentry()` registers the DSN in the browser

**Instructions:**

1. Open `http://localhost:3001/` and click the **spec-006** button
2. Open the browser devtools console — note the thrown error
3. Wait ~10 seconds, then refresh the test Sentry project's Issues view

**Expected Result:**

- A new issue appears titled `Error: bo-spec-006 client check`
- Tags include `environment: local-e2e`, `browser: <your browser>`
- Stack trace shows the click handler frame

---

## Test 3: Init no-ops when DSN is absent [BO-SPEC-006.AC3]

**Prerequisites:**

- Comment out `NEXT_PUBLIC_SENTRY_DSN` in `.env.local` and restart the dev server

**Instructions:**

1. Trigger Test 1 again (server-side throw)
2. Watch the dev server logs

**Expected Result:**

- The server still throws and the browser shows the HTTP 500 response
- No outbound Sentry network request is made (verify in devtools Network tab → no requests to `*.ingest.sentry.io` and no requests to the `/monitoring/...` tunnel route)
- No new issue appears in the Sentry project

---

## Test 4: Cleanup

**Instructions:**

1. Remove the temporary `sentry-check` route
2. Remove the spec-006 button from `page.tsx`
3. Restore `NEXT_PUBLIC_SENTRY_DSN` if desired or leave it disabled for local dev

---

## AC Coverage Matrix

| AC ID           | Test(s) | Notes                                                         |
| --------------- | ------- | ------------------------------------------------------------- |
| BO-SPEC-006.AC3 | 1, 2, 3 | Web Sentry integration, server + client + DSN-absent fallback |

ACs covered by automated tests in this spec (no manual verification needed):

- BO-SPEC-006.AC1 — `convex/lib/monitoring.test.ts`
- BO-SPEC-006.AC2 — `apps/backend-office-native/src/lib/monitoring/sentry.test.ts`
- BO-SPEC-006.AC4 — `convex/spec-006-health-checks.test.ts`
- BO-SPEC-006.AC5 — `convex/spec-006-provider-failures.test.ts`
- BO-SPEC-006.AC6 — `convex/spec-006-alert-dispatcher.test.ts`, `convex/spec-006-auth-anomaly.test.ts`
- BO-SPEC-006.AC7 — verified via `npm run typecheck` and `npm run lint` in CI
