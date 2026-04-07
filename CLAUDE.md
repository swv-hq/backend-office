# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## App Overview

**Back-End Office** — a mobile-first business management app for solo tradespeople (handymen, plumbers, electricians) to manage calls, scheduling, invoicing, and estimates from their phones.

This is a Turborepo monorepo with three workspaces:

- `apps/web/` — Next.js 16 + React 19 + Tailwind CSS v4 + Clerk auth (marketing site + web dashboard)
- `apps/native/` — React Native (Expo 55) + Clerk auth (primary mobile app)
- `packages/backend/` — Convex backend shared by both apps (schema, queries, mutations, actions)

## Critical Rules

- **Always create backend, web, native, and e2e tests when adding new features.** Test edge cases: empty inputs, boundaries, auth states, error handling. Use TDD pattern: write tests first, verify they fail, implement the code, verify the tests pass.
- **Do not run `npm run dev`** — Dev servers run in separate terminals; never start them from here.
- **Run typecheck after changes** — Run `npm run typecheck` and fix any errors.
- **Run lint after changes** — Run `npm run lint` and fix any errors.
- **Run format after changes** — Run `npm run format` and fix any errors.
- **Run backend tests after Convex changes** — Run `cd packages/backend && npm test` and fix any errors.
- **Run web tests after web changes** — Run `cd apps/web && npm test` and fix any errors.
- **Run native tests after native changes** — Run `cd apps/native && npm test` and fix any errors.
- **Run spec coverage after feature work** — Run `npm run test:spec-coverage` to verify all ACs have linked tests.
- **Run build after larger changes** — Run `npm run build` to catch build errors.
- **After changes run a security check and make sure the changes are secure.**
- **After changes run a performance check and make sure the changes are performant.**

## Code Quality Rules

### Security

- Sanitize all user inputs before database operations
- Use parameterized queries, never string interpolation for queries
- Validate and escape data at system boundaries
- Never log sensitive data (tokens, passwords, PII)
- Use secure defaults (httpOnly cookies, HTTPS, etc.)

### Performance

- Avoid N+1 queries — batch database calls
- Use database indexes for filtered/sorted queries
- Memoize expensive computations
- Lazy load components and routes where appropriate
- Profile before optimizing — don't prematurely optimize

## Development Commands

```bash
# Monorepo
npm run dev              # Start all apps + backend in parallel (TUI)
npm run build            # Build all workspaces
npm run lint             # Lint all packages (ESLint 9 flat config)
npm run typecheck        # Type check all packages
npm run format           # Prettier format all files
npm run clean            # Clear build artifacts and node_modules

# Backend (Convex)
cd packages/backend && npx convex dev     # Start Convex dev server
cd packages/backend && npm test           # Run backend tests

# Web (Next.js)
cd apps/web && npm run dev                # Start web dev server (port 3001)
cd apps/web && npm test                   # Run web tests

# Native (Expo)
cd apps/native && npx expo start          # Start Expo dev server
cd apps/native && npm test                # Run native tests

# Spec Coverage
npm run test:spec-coverage                # Verify all AC IDs have linked tests
npm run test:spec-coverage:strict         # Fail if not 100% coverage
```

## Architecture

### Workspaces

- **`apps/web/`** — Next.js 16, React 19, Tailwind CSS v4, Clerk auth, App Router
- **`apps/native/`** — React Native, Expo 55, Clerk auth, React Navigation
- **`packages/backend/`** — Convex (serverless database + functions), shared by both apps

### Backend Layered Architecture

**Read [docs/architecture.md](docs/architecture.md) before writing any Convex code.** All backend code follows a strict 4-layer pattern:

| Layer        | Directory          | Responsibility                                                                               |
| ------------ | ------------------ | -------------------------------------------------------------------------------------------- |
| 4. API       | `convex/*.ts`      | Thin wrappers — `query()`, `mutation()`, `action()` with validators. Delegates to use cases. |
| 3. Use Cases | `convex/useCases/` | All business logic. Auth and permission checks, validation, orchestration.                   |
| 2. Data      | `convex/data/`     | Pure CRUD. `ctx.db` queries only, always use `withIndex()`. No business logic.               |
| 1. Schema    | `convex/schema.ts` | Table definitions and indexes.                                                               |
| Shared       | `convex/lib/`      | Reusable validators, constants, date utilities.                                              |

**Rules:**

- Never put business logic in the API layer or data layer
- Never access `ctx.db` directly outside the data layer
- Always use `withIndex()` — never use `filter()`
- Every API function must include `args` and `returns` validators

### Key Directories

- `apps/web/src/app/` — Next.js App Router pages
- `apps/web/src/components/` — Web UI components
- `apps/native/src/screens/` — React Native screens
- `apps/native/src/navigation/` — React Navigation setup
- `packages/backend/convex/` — Convex schema, queries, mutations, actions
- `packages/backend/convex/data/` — Data access layer (pure CRUD)
- `packages/backend/convex/useCases/` — Business logic layer
- `packages/backend/convex/lib/` — Shared validators and utilities
- `packages/backend/convex/_generated/` — Auto-generated types (do not edit)
- `docs/specs/` — Feature specifications with acceptance criteria
- `scripts/` — Development utility scripts (spec coverage)

## Key Documentation

| Document                                                                       | Purpose                                            |
| ------------------------------------------------------------------------------ | -------------------------------------------------- |
| [docs/BackEndOffice_BusinessPlan.md](docs/BackEndOffice_BusinessPlan.md)       | Product vision, target customer, design principles |
| [docs/BackEndOffice_EngineeringSpec.md](docs/BackEndOffice_EngineeringSpec.md) | Technical architecture, features, data model       |
| [docs/architecture.md](docs/architecture.md)                                   | Backend layered architecture (4-layer pattern)     |
| [docs/specs/ROADMAP.md](docs/specs/ROADMAP.md)                                 | Product roadmap and spec index                     |

**Read the relevant doc before working in that area.**

## Feature Development Workflow

Every new feature follows a spec-driven, test-linked process:

### 1. Create a Spec

- Copy `docs/specs/_TEMPLATE.md` to `docs/specs/SPEC-XXX-feature-name.md`
- Assign a unique `SPEC-XXX` ID
- Define acceptance criteria with IDs: `SPEC-XXX.AC1`, `SPEC-XXX.AC2`, etc.
- Tag each AC with platforms: `[web]`, `[native]`, `[backend]`, or combinations like `[web, native]`
- Walk through open questions with the user before marking `status: approved`
- Spec status progression: `draft` → `in-review` → `approved` → `in-progress` → `in-testing` → `implemented`

### 2. Build in Vertical Slices

Break the spec into thin end-to-end slices, each delivering working functionality:

1. **Plan the slice** — identify which ACs it covers
2. **Write tests first (TDD)** — tag with AC IDs, verify they fail
3. **Implement** — backend first (schema → queries → mutations), then web and/or native
4. **Verify** — run tests, typecheck, lint, build
5. **Repeat** for next slice

### 3. Link Tests to Acceptance Criteria

Tag every test with the AC ID it verifies:

```typescript
describe("Feature [SPEC-XXX]", () => {
  it("does something specific [SPEC-XXX.AC1]", async () => { ... });
});
```

For E2E test scripts, reference AC IDs in markdown: `[SPEC-XXX.AC1]`

Tests must live in the correct workspace for their platform tag:

- `[backend]` ACs → tests in `packages/backend/convex/**/*.test.ts`
- `[web]` ACs → tests in `apps/web/src/**/*.test.ts(x)` or `e2e/test-scripts/web/`
- `[native]` ACs → tests in `apps/native/src/**/*.test.ts(x)` or `e2e/test-scripts/native/`

### 4. Verify Spec Coverage

Run `npm run test:spec-coverage` to verify all acceptance criteria have linked tests in the correct workspace(s). The script scans `docs/specs/` for AC IDs with platform tags and checks for matches in test files across all workspaces.

### 5. Write Manual E2E Test Scripts

Create manual testing scripts separately for each platform:

- **Web**: `e2e/test-scripts/web/SPEC-XXX-feature-name.md`
- **Native**: `e2e/test-scripts/native/SPEC-XXX-feature-name.md`

Each test has: **Instructions** (step-by-step actions) and **Expected Result** (what to verify). Tag each test with AC IDs: `[SPEC-XXX.AC1]`. Include an AC coverage matrix at the bottom. Update spec status to `in-testing`.

### 6. Code Review

Before marking a spec as implemented, review all changes:

- **Architecture**: Backend logic in Convex functions, not in frontend components. Shared backend serves both web and native.
- **Security**: Auth checks on all endpoints, ownership verification, input sanitization, no sensitive data in logs.
- **Performance**: No N+1 queries, bounded `.take(n)` instead of `.collect()`, proper index usage.
- **Type safety**: No `as any` casts. Use proper Convex types.
- **Test completeness**: All ACs have tests in the correct workspaces. Test happy path and error cases. Test auth boundaries.
- **Cross-platform**: Features tagged for both web and native work correctly on both platforms. Shared backend changes don't break either client.
- **Accessibility**: `aria-invalid`, `aria-describedby` on web form inputs. Proper accessibility labels on native components.

### 7. Update Spec Status

- After code review fixes and manual testing pass, update the spec frontmatter to `status: implemented`
- If issues found during testing or review, fix and re-verify before marking implemented

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.

<!-- convex-ai-end -->

<!-- swv-skills-start -->

## Claude Skills

The following Claude Code skills are installed in `.claude/skills/`:

- **build** — Structured development workflow for features, bug fixes, and enhancements
- **issue** — Capture a bug, enhancement, or feature as a GitHub Issue from the terminal
- **next** — Show prioritized open issues and upcoming specs to decide what to work on next

<!-- swv-skills-end -->
