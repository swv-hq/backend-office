# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## App Overview

**Back-End Office** — a mobile-first business management app for solo tradespeople (handymen, plumbers, electricians) to manage calls, scheduling, invoicing, and estimates from their phones.

This is a Turborepo monorepo with three workspaces:

- `apps/backend-office-web/` — Next.js 16 + React 19 + Tailwind CSS v4 + Clerk auth (marketing site + web dashboard)
- `apps/backend-office-native/` — React Native (Expo 55) + Clerk auth (primary mobile app)
- `packages/backend-office-backend/` — Convex backend shared by both apps (schema, queries, mutations, actions)

## Critical Rules

- **Always create backend, web, native, and e2e tests when adding new features.** Test edge cases: empty inputs, boundaries, auth states, error handling. Use TDD pattern: write tests first, verify they fail, implement the code, verify the tests pass.
- **Do not run `npm run dev`** — Dev servers run in separate terminals; never start them from here.
- **Run typecheck after changes** — Run `npm run typecheck` and fix any errors.
- **Run lint after changes** — Run `npm run lint` and fix any errors.
- **Run format after changes** — Run `npm run format` and fix any errors.
- **Run backend tests after Convex changes** — Run `cd packages/backend-office-backend && npm test` and fix any errors.
- **Run web tests after web changes** — Run `cd apps/backend-office-web && npm test` and fix any errors.
- **Run native tests after native changes** — Run `cd apps/backend-office-native && npm test` and fix any errors.
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
cd packages/backend-office-backend && npx convex dev     # Start Convex dev server
cd packages/backend-office-backend && npm test           # Run backend tests

# Web (Next.js)
cd apps/backend-office-web && npm run dev                # Start web dev server (port 3001)
cd apps/backend-office-web && npm test                   # Run web tests

# Native (Expo)
cd apps/backend-office-native && npx expo start          # Start Expo dev server
cd apps/backend-office-native && npm test                # Run native tests

# Spec Coverage
npm run test:spec-coverage                # Verify all AC IDs have linked tests
npm run test:spec-coverage:strict         # Fail if not 100% coverage
```

## Architecture

### Workspaces

- **`apps/backend-office-web/`** — Next.js 16, React 19, Tailwind CSS v4, Clerk auth, App Router
- **`apps/backend-office-native/`** — React Native, Expo 55, Clerk auth, React Navigation
- **`packages/backend-office-backend/`** — Convex (serverless database + functions), shared by both apps

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

- `apps/backend-office-web/src/app/` — Next.js App Router pages
- `apps/backend-office-web/src/components/` — Web UI components
- `apps/backend-office-native/src/screens/` — React Native screens
- `apps/backend-office-native/src/navigation/` — React Navigation setup
- `packages/backend-office-backend/convex/` — Convex schema, queries, mutations, actions
- `packages/backend-office-backend/convex/data/` — Data access layer (pure CRUD)
- `packages/backend-office-backend/convex/useCases/` — Business logic layer
- `packages/backend-office-backend/convex/lib/` — Shared validators and utilities
- `packages/backend-office-backend/convex/_generated/` — Auto-generated types (do not edit)
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

## Feature Development Conventions

The `build` skill owns the feature/bug/enhancement workflow. The project-specific conventions the skill relies on:

- **Specs** live in `docs/specs/`. Copy `_TEMPLATE.md` to `SPEC-XXX-feature-name.md`. Status progression: `draft` → `in-review` → `approved` → `in-progress` → `in-testing` → `implemented`. Keep `docs/specs/ROADMAP.md` in sync on every status change.
- **Acceptance criteria** use IDs `SPEC-XXX.AC1`, `SPEC-XXX.AC2`, … and are platform-tagged `[web]`, `[native]`, `[backend]` (or combinations).
- **Tests are tagged with AC IDs** and must live in the workspace matching the platform tag:
  - `[backend]` → `packages/backend-office-backend/convex/**/*.test.ts`
  - `[web]` → `apps/backend-office-web/src/**/*.test.ts(x)` or `e2e/test-scripts/web/`
  - `[native]` → `apps/backend-office-native/src/**/*.test.ts(x)` or `e2e/test-scripts/native/`
  - Format: `it("does something [SPEC-XXX.AC1]", ...)`; for markdown E2E scripts, include `[SPEC-XXX.AC1]` inline.
- **Coverage check**: `npm run test:spec-coverage` verifies every AC has a linked test in the right workspace.
- **Manual E2E scripts** are written per platform at `e2e/test-scripts/web/SPEC-XXX-*.md` and `e2e/test-scripts/native/SPEC-XXX-*.md`, each with Instructions + Expected Result and an AC coverage matrix.
- **Implementation order for a slice**: backend first (schema → data → use cases → API), then web and/or native.
- **Spec sign-off**: never move a spec to `implemented` without Brian's explicit approval.

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
