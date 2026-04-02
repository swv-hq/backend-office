---
name: dep-check
description: Run a dependency audit across all monorepo workspaces (backend, web, native), summarize outdated packages, recommend safe updates vs holds, and optionally apply safe updates.
user_invocable: true
---

# Dependency Check

Audit and summarize outdated dependencies across all three monorepo workspaces.

## Workflow

1. **Gather data** — Run `npm outdated` in each workspace in parallel:
   - `packages/backend`
   - `apps/web`
   - `apps/native`
   Also check latest versions of key dependencies (convex, @clerk/nextjs, expo) via `npm view`.

2. **Classify each outdated package** into one of:
   - **Update (safe)** — Patch or backward-compatible minor release. No known risk.
   - **Update (cautious)** — Minor release of a package known to have native or build implications (e.g., reanimated). Safe but test after.
   - **Hold** — Major version bump, pre-1.0 minor bump, or requires ecosystem alignment (e.g., TypeScript major, Expo SDK compatibility). Explain why.

3. **Present a summary** — For each workspace, show a table with: package name, current version, latest version, and recommendation (update/hold + reason).

4. **Cross-repo holds** — Call out packages that appear in multiple workspaces and should be held everywhere (e.g., TypeScript).

5. **Ask to apply** — Ask the user if they want to apply the safe updates. If yes:
   - Run `npm install <pkg>@<version>` with `--workspace` flag for each workspace
   - Run `npx turbo run typecheck` to verify nothing broke
   - Run available test suites (`npm test` in each workspace that has tests)
   - Report results

6. **iOS rebuild check** — After native updates, advise whether a fresh iOS build is needed:
   - New native modules or native code changes in updated packages = rebuild needed
   - JS-only changes = `npm run dev` is sufficient

## Classification Guidelines

### Always Hold
- Major version bumps (e.g., 5.x -> 6.x) unless changelog confirms no breaking changes
- Packages tied to framework versions (e.g., `@react-native/virtualized-lists` must match `react-native`)
- Pre-1.0 packages with minor bumps (0.7 -> 0.8 can break)
- `typescript` major — wait for Convex, Next.js, and Expo to confirm support
- `react-native` minor — must align with Expo SDK version
- `eslint` major — config format and plugin API may change
- `jest` major — config and transform changes

### Safe to Update
- Patch releases of any package
- Minor releases of stable (1.0+) packages with good semver track records
- `@types/*` patch updates
- `@babel/core` minor updates
- CSS tooling patches (postcss, tailwindcss patches)
