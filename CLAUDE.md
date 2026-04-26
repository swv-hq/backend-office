# CLAUDE.md

This file provides repo-wide guidance to Claude Code (claude.ai/code). Product-specific rules live in [`docs/products/backend-office/CLAUDE.md`](docs/products/backend-office/CLAUDE.md) — read it before starting work.

## Repo Overview

**backend-office** — Turborepo + npm workspaces repo for the backend-office product. Three workspaces:

| Workspace                                                            | Purpose                                       |
| -------------------------------------------------------------------- | --------------------------------------------- |
| [`apps/backend-office-web`](apps/backend-office-web)                 | Next.js web app                               |
| [`apps/backend-office-native`](apps/backend-office-native)           | Expo / React Native app                       |
| [`packages/backend-office-backend`](packages/backend-office-backend) | Convex backend (schema, functions, use cases) |

Shared cross-workspace code lives in `packages/`. Product docs and specs live in [`docs/products/backend-office/`](docs/products/backend-office/).

## Critical Rules

- **Never commit, push, or create PRs without Brian's explicit approval.**
- **Always create backend, web, native, and e2e tests when adding new features.** Test edge cases: empty inputs, boundaries, auth states, error handling. Use TDD: write tests first, verify they fail, implement, verify they pass.
- **Do not run `npm run dev`** — Dev servers run in separate terminals; never start them from here.
- **Run typecheck after changes** — `npm run typecheck`. Fix any errors.
- **Run lint after changes** — `npm run lint`. Fix any errors.
- **Run format after changes** — `npm run format`. Fix any errors.
- **Run spec coverage after feature work** — `npm run test:spec-coverage`.
- **Run build after larger changes** — `npm run build`.
- **After changes run a security check.**
- **After changes run a performance check.**
- **Per-workspace test commands** live in [`docs/products/backend-office/CLAUDE.md`](docs/products/backend-office/CLAUDE.md). Run them after touching that workspace's code.

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

## Repo Commands

```bash
npm run dev                            # Start web + native + backend in parallel (TUI)
npm run build                          # Build all workspaces
npm run lint                           # Lint all packages (ESLint 9 flat config)
npm run typecheck                      # Type check all packages
npm run format                         # Prettier format all files
npm run clean                          # Clear build artifacts and node_modules
npm run test:spec-coverage             # Verify all AC IDs have linked tests
npm run test:spec-coverage:strict      # Fail if coverage is below 100%
```

## Backend Layered Architecture

**Read [docs/shared/architecture.md](docs/shared/architecture.md) before writing any Convex code.** The Convex backend lives in [`packages/backend-office-backend/convex/`](packages/backend-office-backend/convex/).

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

## Spec System

The `build` skill owns the feature/bug/enhancement workflow.

- **Specs** live in [`docs/products/backend-office/specs/`](docs/products/backend-office/specs/). Copy `_TEMPLATE.md` to `BO-SPEC-XXX-feature-name.md`. Status progression: `draft` → `in-review` → `approved` → `in-progress` → `in-testing` → `implemented`. Keep [`ROADMAP.md`](docs/products/backend-office/ROADMAP.md) in sync on every status change.
- **Acceptance criteria** use IDs like `BO-SPEC-001.AC1` and are platform-tagged `[web]`, `[native]`, `[backend]` (or combinations), mapping to the three workspaces above.
- **Tests are tagged with AC IDs**. Format: `it("does something [BO-SPEC-001.AC1]", ...)`. For markdown E2E scripts, include the AC ID inline.
- **Coverage check**: `npm run test:spec-coverage` validates every AC against the workspaces.
- **Manual E2E scripts** live at `e2e/test-scripts/{web,native}/BO-SPEC-XXX-*.md`.
- **Implementation order for a slice**: backend first (schema → data → use cases → API), then web and/or native.
- **Spec sign-off**: never move a spec to `implemented` without Brian's explicit approval.

## Key Documentation

| Document                                                                         | Purpose                                               |
| -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [docs/products/backend-office/CLAUDE.md](docs/products/backend-office/CLAUDE.md) | Product-specific conventions, workspace test commands |
| [docs/shared/architecture.md](docs/shared/architecture.md)                       | Backend layered architecture (4-layer pattern)        |
| [docs/products/backend-office/](docs/products/backend-office/)                   | BusinessPlan, EngineeringSpec, ROADMAP, specs         |

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
