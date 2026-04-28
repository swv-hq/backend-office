# BO-SPEC-006: Monitoring & Alerting — Native E2E Test Script

## Prerequisites

- A custom Expo dev build installed on a device or simulator (BO-SPEC-031)
- A test Sentry project (free tier is fine) with its DSN copied
- `apps/backend-office-native/.env.local` (or process env at start time) containing:
  - `EXPO_PUBLIC_SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>`
  - `EXPO_PUBLIC_SENTRY_ENVIRONMENT=local-e2e`
- `npx expo start --dev-client` running

> **Note:** AC2 (native Sentry integration) is the only AC that requires a real device + a real Sentry project to verify end-to-end. The wrapper module is unit-tested in `apps/backend-office-native/src/lib/monitoring/sentry.test.ts`.

---

## Test 1: JS error from a screen reaches Sentry [BO-SPEC-006.AC2]

**Prerequisites:**

- Add a temporary throwing button to any screen, e.g. in `LoginScreen.tsx`:
  ```tsx
  <Button
    title="spec-006"
    onPress={() => {
      throw new Error("bo-spec-006 native check");
    }}
  />
  ```
- Reload the app so `App.tsx` runs `initSentry()` with the configured DSN

**Instructions:**

1. Launch the app on the device/simulator
2. Tap the **spec-006** button
3. Wait ~15 seconds for ingestion
4. Open the test Sentry project's Issues view, filter by environment `local-e2e`

**Expected Result:**

- A new issue appears titled `Error: bo-spec-006 native check`
- Tags include `environment: local-e2e`, the device OS and version, app version
- Stack trace shows the button onPress frame from `LoginScreen.tsx`

---

## Test 2: Init no-ops when DSN is absent [BO-SPEC-006.AC2]

**Prerequisites:**

- Stop the dev server, unset `EXPO_PUBLIC_SENTRY_DSN` (e.g. comment it out), restart `npx expo start --dev-client`, and reload the app

**Instructions:**

1. Tap the **spec-006** button
2. Note the red box / LogBox error in the simulator
3. Watch the Sentry project Issues view for ~30 seconds

**Expected Result:**

- The error appears locally as expected
- No new Sentry issue appears (authoritative signal — wait at least 30 seconds, then refresh the Issues view)

> **Note:** Don't rely on the React Native DevTools "Network" tab to confirm absence of Sentry traffic. With `@sentry/react-native` and Expo modules registering native hosts, RN DevTools disables its network inspector ("multiple React Native hosts" message). The "no new Sentry issue" check is sufficient.

---

## Test 3: Cleanup

**Instructions:**

1. Remove the temporary spec-006 button
2. Restore `EXPO_PUBLIC_SENTRY_DSN` if desired or leave it disabled for local dev

---

## AC Coverage Matrix

| AC ID           | Test(s) | Notes                                                          |
| --------------- | ------- | -------------------------------------------------------------- |
| BO-SPEC-006.AC2 | 1, 2    | Native Sentry integration end-to-end, plus DSN-absent fallback |

ACs covered by automated tests in this spec (no manual verification needed):

- BO-SPEC-006.AC1 — `packages/backend-office-backend/convex/lib/monitoring.test.ts`
- BO-SPEC-006.AC3 — `apps/backend-office-web/src/__tests__/spec-006-monitoring-sentry.test.ts`
- BO-SPEC-006.AC4 — `convex/spec-006-health-checks.test.ts`
- BO-SPEC-006.AC5 — `convex/spec-006-provider-failures.test.ts`
- BO-SPEC-006.AC6 — `convex/spec-006-alert-dispatcher.test.ts`, `convex/spec-006-auth-anomaly.test.ts`
- BO-SPEC-006.AC7 — verified via `npm run typecheck` and `npm run lint` in CI
