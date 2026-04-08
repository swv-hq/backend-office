# Phase 0 — Monorepo Reshape Checklist

Companion to `REQUIREMENTS.md` §7 Phase 0. This checklist is the concrete starting point for the first implementing session inside the `backend-office` repo.

**Goal:** rename the existing `backend-office` repo into a multi-project **agency monorepo**, with `backend-office` as one app among (eventually) several, and with room for `apps/auth-hub` to be added in Phase 1. The existing backend-office product **must continue to build, test, and deploy unchanged** at the end of Phase 0.

**Branch:** `auth-hub-phase-0`
**PR scope:** rename + path updates only. No behavioral changes. No new features. No new dependencies.

---

## 0. Pre-flight — read these first

Before touching any files, the implementing session must read:

- [ ] `docs/auth-hub/ARCHITECTURE.md`
- [ ] `docs/auth-hub/REQUIREMENTS.md` (especially §2 layout and §7 Phase 0)
- [ ] `docs/auth-hub/COMPLIANCE.md`
- [ ] Root `package.json`, `turbo.json`, `CLAUDE.md`
- [ ] `apps/web/package.json`, `apps/native/package.json`, `packages/backend/package.json`
- [ ] `packages/backend/convex/convex.config.ts` (if present) and `packages/backend/convex/schema.ts`
- [ ] Any deploy configs: `vercel.json`, `.github/workflows/*`, Convex deployment settings
- [ ] `e2e/` entry points — tests will need path updates
- [ ] `scripts/spec-coverage.ts` — may hardcode paths

**Then enter plan mode** and produce a concrete rename plan listing every file that needs updating. Do not execute until the plan is approved.

---

## 1. Known facts (from inspection done 2026-04-07)

- **Repo uses npm workspaces + Turborepo**, not pnpm. `package.json` → `"packageManager": "npm@10.9.2"`, `"workspaces": ["apps/*", "packages/*"]`. Keep npm.
- **Authoritative Convex folder is `packages/backend/convex/`.** Contains `schema.ts`, `auth.config.js`, `lib/`, `useCases/`, `data/`, test specs, `_generated/`, and `.env.local`. This is the real backend-office database.
- **Existing tooling to preserve:** Turbo, Husky, lint-staged, Prettier, Renovate, E2E harness, `scripts/spec-coverage.ts`, `.cursor/`, `.agents/`, `.claude/`, `docs/`, `CLAUDE.md`.

---

## 2. Rename map

All of the following should happen in a single PR. Grep for every old name and replace consistently.

### Directory renames

| Old                | New                               |
| ------------------ | --------------------------------- |
| `apps/web`         | `apps/backend-office-web`         |
| `apps/native`      | `apps/backend-office-native`      |
| `packages/backend` | `packages/backend-office-backend` |

> **Note on the repo name itself.** The repo is currently `backend-office`. REQUIREMENTS.md uses `agency-monorepo` as a placeholder. Phase 0 does **not** rename the repo on disk or on the remote — that is a separate decision the user will make before or after Phase 0. Just update the root `package.json` `"name"` field if the user wants to decouple the npm package name from the directory name now.

### `package.json` `"name"` field updates

| Old name                              | New name                                         |
| ------------------------------------- | ------------------------------------------------ |
| `convex-monorepo` (root)              | `@yourorg/agency-monorepo` (or final brand name) |
| whatever `apps/web` is called         | `@yourorg/backend-office-web`                    |
| whatever `apps/native` is called      | `@yourorg/backend-office-native`                 |
| whatever `packages/backend` is called | `@yourorg/backend-office-backend`                |

> The `@yourorg` scope is a placeholder — pick the real agency scope before execution. If the current code already uses a scope, reuse it.

---

## 3. Files likely to need updates

The implementing session must grep for and update each occurrence of `apps/web`, `apps/native`, `packages/backend`, and any existing package names. Expected touch points:

- [ ] Root `package.json` — `workspaces` field (wildcard probably still matches, but check)
- [ ] Root `turbo.json` — any pipeline tasks that hardcode workspace names
- [ ] Root `tsconfig.json` / `tsconfig.base.json` — path aliases
- [ ] Every `package.json` `dependencies` / `devDependencies` entry that references the old workspace package names
- [ ] Every import statement `from "@yourorg/backend"` (or whatever the current name is) across `apps/*` and `e2e/*`
- [ ] `e2e/` config files and test specs that reference app paths
- [ ] `scripts/spec-coverage.ts` — may hardcode `packages/backend/convex/`
- [ ] `.github/workflows/*.yml` — any `working-directory:` or `paths:` filters
- [ ] `vercel.json` / any deploy config — root directory per app
- [ ] `renovate.json` — package rules keyed on workspace names
- [ ] `.husky/` hooks — path references
- [ ] `CLAUDE.md`, `.cursor/`, `.agents/`, `.claude/` — any instructions that mention old paths
- [ ] `docs/` — any docs that reference `apps/web` etc.
- [ ] `README.md`
- [ ] `.gitignore` — likely fine, but check for hardcoded `apps/web/.next` etc.

---

## 4. Things to explicitly NOT do in Phase 0

- [ ] Do **not** create `apps/auth-hub` yet. That's Phase 1.
- [ ] Do **not** install `@convex-dev/better-auth` or `better-auth` yet. That's Phase 1.
- [ ] Do **not** modify `packages/backend-office-backend/convex/schema.ts` or any business logic. Renames and path updates only.
- [ ] Do **not** change the package manager. Stay on npm.
- [ ] Do **not** rename the repo directory on disk or the GitHub remote — user's call, separate step.
- [ ] Do **not** add the new auth packages (`auth-contracts`, `auth-client`, etc.). That's Phase 1 / Phase 3.
- [ ] Do **not** remove the existing auth setup in backend-office. It keeps working throughout Phase 0.
- [ ] Do **not** upgrade any dependencies.

---

## 5. Verification gate — all must pass before merging Phase 0

- [ ] `npm install` succeeds cleanly with no lockfile drift beyond the rename.
- [ ] `npm run typecheck` (via Turbo) passes in every workspace.
- [ ] `npm run lint` passes.
- [ ] `npm run build` produces the same artifacts as before the rename.
- [ ] `npm run dev` in `apps/backend-office-web` boots successfully and hits `packages/backend-office-backend/convex/`.
- [ ] `npm run dev` in `apps/backend-office-native` boots successfully (Expo).
- [ ] `npx convex dev` in `packages/backend-office-backend` still points at the correct deployment (check `.env.local` and `_generated/`).
- [ ] E2E smoke test passes.
- [ ] `npm run test:spec-coverage` still works (update the script if it hardcoded the old path).
- [ ] `git status` is clean; the diff is **only** renames and path updates.

---

## 6. Commit / PR guidance

- [ ] Use `git mv` for directory renames so history is preserved.
- [ ] Single PR, single logical change: "Phase 0: rename apps/packages for multi-project monorepo."
- [ ] PR description links to `docs/auth-hub/REQUIREMENTS.md` §7 Phase 0.
- [ ] Reviewer checklist: "No behavioral changes; renames and path updates only."

---

## 7. Handoff to Phase 1

Once Phase 0 is merged, the next session opens a new branch `auth-hub-phase-1` and starts on REQUIREMENTS.md §7 Phase 1 — Identity Core. First task in that session: scaffold `apps/auth-hub` as a new Next.js app with its own `convex/` folder and install the `@convex-dev/better-auth` component.
