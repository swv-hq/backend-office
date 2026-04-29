---

## id: BO-SPEC-032

title: PR Preview Environments & CI/CD
status: approved
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-28

# BO-SPEC-032: PR Preview Environments & CI/CD

## Problem Statement

Today the application stack only runs locally. There is no shared environment where the full Convex + Next.js + React Native + Clerk auth stack can be exercised end-to-end, and there is no automated quality gate before changes land on `main`. We need a per-PR ephemeral environment so each pull request gets its own working full-stack preview (web + mobile + backend) to test against, and a CI pipeline that blocks merges on broken code.

## Affected Users

| User Role | Impact                                                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Developer | Every PR auto-deploys an isolated stack (web + mobile + backend); CI catches typecheck/lint/test failures before merge to `main` |
| Reviewer  | Can click a Vercel preview URL or scan a QR code on any PR and exercise that branch's behavior end-to-end on web and mobile      |

## Desired Outcome

When a developer opens a pull request:

1. GitHub Actions runs typecheck, lint, format, build, tests, and spec-coverage as required status checks.
2. Vercel auto-deploys a Preview build of the web app at a unique `*.vercel.app` URL.
3. Convex auto-provisions a Preview Deployment for that PR; the captured URL is wired into both the Vercel web build (`NEXT_PUBLIC_CONVEX_URL`) and the EAS Update for the native app (`EXPO_PUBLIC_CONVEX_URL`).
4. EAS Update publishes a per-PR over-the-air update on a branch named after the PR's git branch; a QR code is posted to the PR comment so reviewers can load that branch's JS bundle into their dev build.
5. Clerk authenticates against a shared dev instance whose allowed origins permit the wildcard web preview URL and accept the native app's redirect scheme.
6. The PR cannot be merged unless it is up-to-date with `main` and all required checks are green.

**Stack matrix:**

| Layer   | Tooling               | Per-PR artifact                                         |
| ------- | --------------------- | ------------------------------------------------------- |
| Web     | Vercel Preview        | `*-git-<branch>-<team>.vercel.app`                      |
| Mobile  | EAS Update (`--auto`) | OTA update on EAS branch matching the git branch name   |
| Backend | Convex Preview        | Transient `preview/<branch>` deployment with unique URL |

## Acceptance Criteria

### Convex (backend)

- **BO-SPEC-032.AC1** [backend]: CI and the web hosting platform have the credentials they need to provision per-PR backends without manual intervention.
- **BO-SPEC-032.AC2** [backend]: Opening a PR provisions a fresh, isolated backend deployment for that PR; subsequent pushes to the same PR redeploy into the same backend rather than creating a new one.
- **BO-SPEC-032.AC3** [backend]: A newly created per-PR backend is seeded with baseline test data so reviewers can exercise the app immediately on first load, without manual setup.

### Vercel (web)

- **BO-SPEC-032.AC4** [web]: Every PR triggers an automatic web build deployed to a publicly reachable preview URL with no manual setup per PR.
- **BO-SPEC-032.AC5** [web]: Each PR's web preview connects to that same PR's per-PR backend automatically — reviewers do not configure URLs, env vars, or backend selection.
- **BO-SPEC-032.AC6** [web]: Preview web builds connect to per-PR preview backends. Routing is determined by environment-scoped credentials, not by branch logic in application code.
- **BO-SPEC-032.AC7** [web]: The web preview URL appears as an automatic comment on every PR.

### Native (Expo / EAS)

- **BO-SPEC-032.AC8** [native]: The mobile build pipeline distinguishes development, preview, and production environments and points each at the correct backend and auth credentials.
- **BO-SPEC-032.AC9** [native]: A single installable mobile dev build exists on iOS that can load any PR's mobile bundle without the reviewer reinstalling the app.
- **BO-SPEC-032.AC10** [native]: Every PR publishes a per-PR mobile bundle keyed to that PR's git branch and configured to talk to that PR's per-PR backend.
- **BO-SPEC-032.AC11** [native]: Reviewers can scan a QR code on the PR to load that PR's mobile bundle into the installed dev build on their device.
- **BO-SPEC-032.AC12** [native]: When a PR includes changes that require a fresh native binary (versus a JS-only change), a new mobile binary is built and distributed instead of just publishing a JS update; reviewers are clearly notified which path applies.

### App Store Connect / Apple Developer Setup

Required so the iOS native-rebuild path (AC12) can produce installable TestFlight builds from CI without manual handling per build.

- **BO-SPEC-032.AC13** [native]: An active Apple Developer Program membership is in place with permissions sufficient for App Store Connect upload and management.
- **BO-SPEC-032.AC14** [native]: An App Store Connect app record exists for the iOS bundle, providing a destination for TestFlight uploads.
- **BO-SPEC-032.AC15** [native]: CI can authenticate to App Store Connect and submit iOS builds non-interactively — no manual sign-in or prompt during submission.
- **BO-SPEC-032.AC16** [native]: A TestFlight Internal Testing group exists with at least one tester (Brian); CI-uploaded builds appear in this group automatically and are immediately installable without Apple review.
- **BO-SPEC-032.AC17** [native]: Successive TestFlight uploads do not collide on duplicate build numbers — each upload is automatically assigned a fresh, monotonically-increasing build number.
- **BO-SPEC-032.AC18** [native]: TestFlight uploads process and become installable without per-upload manual gating (e.g., export-compliance prompt).
- **BO-SPEC-032.AC19** [native]: An end-to-end smoke run on a PR with a native-affecting change produces a TestFlight build that lands in the Internal Testing group and is installable by Brian within ~1 hour of quality-gates passing.

### Clerk (auth)

- **BO-SPEC-032.AC20** [web, native]: Authentication works on every per-PR web preview URL and every per-PR mobile build without per-PR configuration in the auth provider.
- **BO-SPEC-032.AC21** [web]: Sign-up, sign-in, and sign-out work end-to-end on a deployed web preview URL.
- **BO-SPEC-032.AC22** [native]: Sign-up, sign-in, and sign-out work end-to-end in the mobile dev build loaded against a PR's preview environment.

### GitHub Actions / CI

- **BO-SPEC-032.AC23** [backend, web, native]: Every PR runs the project's full quality gate — linting, type checking, format checking, build, the per-workspace test suites, and spec coverage — and fails fast on the first issue.
- **BO-SPEC-032.AC24** [backend, web, native]: Provisioning each PR's full preview environment (backend + web + mobile) happens automatically in CI; the developer takes no manual action beyond pushing the branch.
- **BO-SPEC-032.AC25** [backend, web, native]: No preview environment is provisioned for a PR whose quality gates are red — broken PRs do not consume preview build minutes or post stale preview artifacts.
- **BO-SPEC-032.AC26** [backend, web, native]: PRs with failing quality gates cannot be merged to `main`.
- **BO-SPEC-032.AC27** [backend, web, native]: PRs cannot be merged unless they include the latest changes from `main`.

### Cross-cutting

- **BO-SPEC-032.AC28** [backend, web, native]: No API keys, deploy keys, signing credentials, or other secrets are committed to the repository at any point during this spec; all secrets live in their respective platform secret stores.
- **BO-SPEC-032.AC29** [backend, web, native]: All workspaces pass typecheck and lint with zero errors after changes.

## Slice Plan

Slices are ordered so each one delivers an observable improvement and unblocks the next. Slice 1 establishes the merge-blocking quality gate first (so all subsequent slices are protected by it). Slices 2–4 build the per-PR preview environment bottom-up (backend → web → mobile-OTA). Slice 5 layers in the iOS native-rebuild path with full App Store Connect plumbing. Slice 6 closes the loop with branch protection + the deployment guide.

| #   | Slice                                                   | ACs covered                                                     | What works at the end                                                                                                                                 |
| --- | ------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Quality-gates CI workflow                               | AC23, AC26, AC29                                                | Every PR runs lint/typecheck/format/build/tests/spec-coverage in GitHub Actions and reports status; failing PRs block merge to `main`.                |
| 2   | Convex preview deployments per PR                       | AC1, AC2, AC3                                                   | Opening a PR provisions a fresh Convex preview backend seeded with baseline data; subsequent pushes redeploy in place.                                |
| 3   | Vercel preview wired to Convex preview                  | AC4, AC5, AC6, AC7, AC28                                        | Each PR's web preview URL boots against that PR's Convex preview backend; URL appears in PR comment; secrets remain out of the repo.                  |
| 4   | Clerk wildcard origins + EAS Update OTA path            | AC8, AC10, AC11, AC20, AC21, AC22                               | Auth works on any preview URL (web + native); each PR publishes a JS-only EAS Update with the per-PR Convex URL injected; QR posted to PR.            |
| 5   | iOS native-rebuild path (App Store Connect + EAS Build) | AC9, AC12, AC13, AC14, AC15, AC16, AC17, AC18, AC19, AC24, AC25 | PRs touching native code trigger a TestFlight Internal build; reviewers get an install link instead of just a QR; broken-quality PRs skip the build.  |
| 6   | Branch protection + deployment guide                    | AC27                                                            | `main` requires green CI and "branches up to date" before merge; `docs/deployment.md` documents how to run the whole pipeline manually if CI is down. |

**Notes on dependencies:**

- Slice 1 is a hard prerequisite for Slice 5 (gating depends on the quality-gates workflow existing).
- Slice 2 is a hard prerequisite for Slices 3 and 4 (web and mobile both wire to the per-PR Convex URL).
- Slice 5 has the longest tail (Apple Developer enrollment if not already active, ASC API key, TestFlight group setup) — schedule this slice with awareness that ASC enrollment can take 24–48h.

## Out of Scope

- **Twilio, Stripe, Deepgram, Anthropic, Sentry** integration / env-var plumbing — each will be handled by its own integration spec when that work is scheduled.
- **Android.** This product is iOS-only for the foreseeable future; no Android build, distribution, or testing is in scope. EAS profiles, change-detection, and TestFlight integration target iOS exclusively.
- **Production web domain** + **App Store public release** — this spec sets up the dev/preview pattern (TestFlight Internal + EAS Update). Public App Store submission for end-user release is owned by BO-SPEC-030 (App Store & Distribution).
- **Production Clerk instance + production Convex deployment** — this spec uses the dev Clerk instance and dev-tier Convex project. Provisioning the prod-tier mirror is a separate later spec.

## Open Questions

- ~~Should we use `--preview-run=<seedFunction>` to seed each preview deployment with sample data on first creation?~~ **Resolved:** Yes — use `internal.seed.devSeed`, kept minimal initially and expanded over time.
- ~~What's the expiration policy for preview deployments?~~ **Resolved:** Keep the Convex free-tier default of 5 days. PRs sitting longer than 5 days can re-trigger a preview by pushing a new commit.
- ~~Should the GitHub Actions quality-gates workflow split into parallel jobs?~~ **Resolved:** Sequential to start (`lint → typecheck → format → build → tests → spec-coverage`). Revisit if wall-clock becomes a bottleneck.
- ~~Distribution channel for the iOS dev build that hosts EAS Updates?~~ **Resolved:** Native rebuilds use **TestFlight (Internal)** on iOS. JS-only changes ride the EAS Update channel — no rebuild needed.
- ~~Do we want the EAS Update preview workflow to gate on the quality-gates workflow?~~ **Resolved:** Serial — the preview workflow (Convex deploy, Vercel preview, EAS update / build) only runs after quality-gates (lint, typecheck, format, build, tests, spec-coverage) passes. We only want to deploy when we think we have a good build.

## Technical Notes

### Convex Preview Deployments

- Provisioned via `npx convex deploy` when `CONVEX_DEPLOY_KEY` is a **preview key**. The CLI auto-derives the preview name from the git branch when run inside Vercel/Netlify/Cloudflare/GitHub Actions, so no `--preview-create=<name>` flag is needed in those environments.
- Reference format: `preview/<branch>`. Editable by all team members (like dev). Server logs and error details are sent to the client (like dev).
- Free / Starter plan deployments expire after **5 days**; Pro+ after 14. Each counts toward the team deployment limit.
- Per-PR seeding (AC3) runs `internal.seed.devSeed` via `--preview-run` on first creation. Keep the function minimal initially (one sample contractor + a few jobs) and grow it over time as new domains are added.
- Docs: [Convex multiple deployments § preview](https://docs.convex.dev/production/multiple-deployments#preview).

### Vercel Preview Environment

- Created automatically for every non-production-branch push and every PR when the GitHub integration is enabled. Branch-specific URL always points to latest commit on that branch; commit-specific URL is immutable.
- Env vars are scoped per environment (Production / Preview / Development) — set `CONVEX_DEPLOY_KEY` distinctly per scope.
- Docs: [Vercel preview environment](https://vercel.com/docs/deployments/environments#preview-environment-pre-production), [Convex + Vercel hosting](https://docs.convex.dev/production/hosting/vercel).

### EAS Update for Per-PR Mobile Previews

- Reviewer flow: install the **dev client build** (BO-SPEC-031) once on device → on each PR, scan the QR code from the PR comment → device loads that PR's JS bundle from the matching EAS Update branch.
- CLI: `eas update --auto` reads the current git branch and publishes to a same-named EAS branch. Equivalent to `eas update --branch <git-branch>`.
- The official `expo/expo-github-action/preview@v8` action runs the update and posts the QR-code PR comment automatically.
- **Dynamic per-PR Convex URL:** EAS env vars set via `eas env:create` are static per environment. To inject the per-PR Convex preview URL, the GitHub Actions workflow exports it inline before `eas update`:
  ```yaml
  - name: Provision Convex preview
    id: convex
    run: |
      OUTPUT=$(npx convex deploy)
      echo "url=$(...extract URL...)" >> "$GITHUB_OUTPUT"
    env:
      CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_PREVIEW_DEPLOY_KEY }}
  - name: Publish EAS Update
    uses: expo/expo-github-action/preview@v8
    env:
      EXPO_PUBLIC_CONVEX_URL: ${{ steps.convex.outputs.url }}
    with:
      command: eas update --auto
  ```
- Required secrets: `EXPO_TOKEN` (from expo.dev/settings/access-tokens) in GitHub Actions secrets.
- Docs: [EAS Update + GitHub Actions](https://docs.expo.dev/eas-update/github-actions/), [EAS environment variables](https://docs.expo.dev/eas/environment-variables/), [Expo + Convex guide](https://docs.expo.dev/guides/using-convex/).

### Native Change Detection (Update vs. Build)

Two PR paths for the native app, chosen automatically based on what the PR touches:

| PR contains                                               | Action                                                                                                      | Reviewer step                                      |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| JS / TS / asset changes only                              | `eas update --auto`                                                                                         | Scan QR code in PR comment with existing dev build |
| Native config / deps / SDK changes (see watch list below) | `eas build --profile preview --platform ios --auto-submit` → TestFlight Internal Testing, plus `eas update` | Install new TestFlight build, then scan QR         |

**Watch list** (any change here triggers a fresh dev build):

- `apps/backend-office-native/app.json`, `app.config.ts`, `app.config.js`
- `apps/backend-office-native/ios/`\*\*
- `apps/backend-office-native/package.json` (dep add / remove / version change)
- `apps/backend-office-native/eas.json` (build profile changes)
- Any config plugin file referenced by Expo

**Detection mechanism:** in the GitHub Actions preview workflow, run `git diff --name-only origin/main...HEAD` against the watch list (e.g. via `dorny/paths-filter` or a small bash script). If any match, branch into the build path; otherwise, run only the update path.

**Runtime version policy:** set `runtimeVersion.policy` in `app.config.ts` to `"appVersion"` or `"fingerprint"` so the EAS Update only loads in dev builds with compatible native code — preventing a stale OTA update from crashing on a new build.

**Reviewer experience:** the PR comment template should clearly state which path ran ("JS-only update — scan QR" vs. "Native rebuild required — install TestFlight build vX.Y.Z, then scan QR").

**iOS distribution (TestFlight Internal):** native rebuilds submit automatically via `eas build --auto-submit` to TestFlight, which calls `eas submit` using the App Store Connect API key registered with EAS. Distributed to the **Internal Testing** group — no Apple review required, build appears for testers within ~10–15 minutes of upload. Setup details below in "App Store Connect Setup."

### App Store Connect Setup (one-time)

The TestFlight path requires several one-time setup steps in Apple's systems before CI can submit non-interactively:

1. **Apple Developer Program enrollment** — sign up at [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/) ($99/yr individual, ~$299/yr organization). Allow 24–48h for verification.
2. **Create the App Store Connect app record** — at [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → My Apps → +. Use bundle identifier `com.backendoffice.app`, set name "Back-End Office," primary language, and a unique SKU (e.g. `backend-office-ios`).
3. **Generate App Store Connect API Key** — at App Store Connect → Users and Access → Integrations → App Store Connect API → +. Role: **App Manager**. Save the displayed Issuer ID, Key ID, and download the `.p8` file (this is your only chance to download it).
4. **Upload the API key to EAS** — run `eas credentials` → iOS → "Add ASC API Key" and paste the Issuer ID, Key ID, and `.p8` contents. EAS encrypts and stores them. Alternatively, set `submit.preview.ios.ascAppId` + `ascApiKeyId` + `ascApiIssuerId` + `ascApiKeyPath` in `eas.json`, but the `eas credentials` route avoids checking the path into the repo.
5. **Create the TestFlight Internal Testing group** — App Store Connect → My Apps → Back-End Office → TestFlight → Internal Testing → +. Name it "Internal" and add Brian (and any other dev/reviewer Apple IDs) as testers. Internal testers don't trigger Apple review.
6. **Wire `eas.json`** — add a `submit.preview.ios` profile that references the stored API key. Add `build.preview.ios.autoIncrement: "buildNumber"` so successive submissions don't collide.
7. **Disable export-compliance prompt** — set `ios.config.usesNonExemptEncryption: false` in `app.config.ts` (assuming the app uses no non-exempt cryptography beyond standard HTTPS, which is true today). This skips the per-upload compliance question and lets builds appear in TestFlight without manual gating.
8. **Smoke test** — open a PR with a trivial native-affecting change (e.g. bump `expo` patch version), let CI run end-to-end, and verify the build appears in TestFlight Internal Testing within ~15 min. Brian installs from TestFlight to confirm the install link works.

### Quality Gates Workflow (AC23)

The quality-gates GitHub Actions workflow runs on every `pull_request` event and on pushes to `main`. Runs as a single sequential job with fail-fast semantics:

1. `npm ci` (workspace-aware install)
2. `npm run lint`
3. `npm run typecheck`
4. `npm run format` (check mode — no auto-write)
5. `npm run build`
6. Per-workspace test suites (`packages/backend-office-backend && npm test`, `apps/backend-office-web && npm test`, `apps/backend-office-native && npm test`)
7. `npm run test:spec-coverage:strict`

Sequential rather than parallel to keep YAML simple and to ensure the cheapest checks (lint/typecheck) fail before the expensive ones (build/tests). Revisit if wall-clock becomes a bottleneck.

### Preview Workflow (AC24, AC25)

A second GitHub Actions workflow (`preview.yml`) runs on `pull_request` and depends on the quality-gates workflow succeeding (`workflow_run` trigger or `needs:` dependency). It executes:

1. **Provision Convex preview** — `npx convex deploy` with the preview deploy key in env. Capture the resulting deployment URL from CLI output.
2. **Trigger Vercel preview** — Vercel's GitHub integration handles this on push, but the workflow may need to wait for it to complete to gather the preview URL for the PR comment.
3. **Detect native scope** — `git diff --name-only origin/main...HEAD` against the watch list (see Native Change Detection below). Branches into either the EAS Update path or EAS Build + Update path.
4. **Run EAS update / build** — with `EXPO_PUBLIC_CONVEX_URL` set inline to the captured Convex preview URL.
5. **Post PR comment** — handled by `expo/expo-github-action/preview@v8`, includes QR code + (optionally) install link for fresh native builds.

Gating on quality-gates ensures broken PRs don't burn EAS or Convex preview build minutes (AC25).

### Clerk Configuration (AC20)

A single Clerk **dev instance** (existing `pk_test_`\* keys) backs all preview environments — no per-PR Clerk setup is required. To make the dev instance work across every PR's preview URL:

- **Allowed origins (web):** add the project's Vercel wildcard pattern (e.g. `https://*-backend-office-*.vercel.app`) to the Clerk dev instance's allowed origins. Each new PR's `*-git-<branch>-*.vercel.app` URL is then accepted automatically without per-PR Clerk config.
- **Custom URL scheme (native):** Clerk's mobile redirect uses the app's URL scheme (already set to `backend-office://` in `app.json`). Add this scheme to the Clerk dev instance's allowed redirect URLs.
- **Secret rotation:** if the Clerk dev keys are rotated, update Vercel env (Production + Preview scopes), GitHub Actions secrets, and EAS env (`eas env:create` for development + preview + production environments).

Production will use a **separate** Clerk prod instance, provisioned in a later spec when production deployment is wired up.

### Existing State (already in place — not blocking)

- Convex cloud dev deployment: `dev:healthy-retriever-92` (`https://healthy-retriever-92.convex.cloud`) — already exists; this spec adds the preview-deploy-key flow on top.
- `apps/backend-office-web/vercel.json` already runs `npx convex deploy --cmd … --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL` — close to AC5; verify exact form.
- `ConvexProviderWithClerk` is wired up in both web and native with `pk_test_`\* keys → Clerk dev instance is functional locally.

### GitHub Branch Protection

- Use GitHub's built-in branch protection on `main`: require status checks, require branches to be up to date, optionally require approvals.
- "Require branches to be up to date before merging" is the standard setting that satisfies AC27 — it forces PRs to merge in `main` before merge.

### Secrets Inventory

| Secret                                                 | Where it lives                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `CONVEX_DEPLOY_KEY` (prod)                             | Vercel env (Production scope) + GitHub Actions secret (`main` only)                     |
| `CONVEX_DEPLOY_KEY` (preview)                          | Vercel env (Preview scope) + GitHub Actions secret (PR workflow)                        |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`                    | Vercel env (Production + Preview) + EAS env (preview + production via `eas env:create`) |
| `CLERK_SECRET_KEY`                                     | Vercel env (Production + Preview)                                                       |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`                    | EAS env (development + preview + production)                                            |
| `EXPO_TOKEN`                                           | GitHub Actions secret (used by `expo-github-action`)                                    |
| App Store Connect API Key (`.p8` + Issuer ID + Key ID) | EAS credentials store (uploaded via `eas credentials`); never committed                 |
| Apple Developer team ID                                | `eas.json` `submit.preview.ios.appleTeamId` (non-secret, OK in repo)                    |

## Manual Test Scripts
