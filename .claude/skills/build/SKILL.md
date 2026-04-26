---
name: build
description: Structured development workflow for features, bug fixes, and enhancements. Activate ONLY when (1) the user says "follow the rules/workflow/build rules", (2) the user begins work on a GitHub issue, or (3) the user begins implementing a spec (SPEC-XXX or <PREFIX>-SPEC-XXX).
user-invocable: false
---

# Development Workflow

Route to the appropriate workflow based on the work type.

## Determine Work Type

Infer the type from the user's request and conversation context:

- **`feature`** — New capability that doesn't exist yet. Spec-driven, full TDD cycle. See [feature-workflow.md](feature-workflow.md).
- **`bug`** — Something is broken, crashes, errors, wrong behavior. Reproduce-first approach. See [bug-workflow.md](bug-workflow.md).
- **`enhancement`** — Improvement to an existing feature (better UX, performance, polish, refactor). See [enhancement-workflow.md](enhancement-workflow.md).

If the type isn't clear from arguments, ask the user once: "Is this a **new feature**, a **bug fix**, or an **enhancement** to something existing?"

## Project Context

Read the project's CLAUDE.md for project-specific conventions (test commands, spec system, architecture patterns, issue tracking, etc.). CLAUDE.md is the source of truth — use it to fill in project-specific details throughout the workflow.

## Repo Layout Detection

Detect once, before routing to a workflow:

- If `docs/products/` exists with one or more product subdirectories, this is a **multi-product monorepo**. Otherwise it is a **single-product** repo.
- In multi-product mode, every operation that touches specs, ROADMAP, or e2e scripts must be scoped to a specific product. Resolve the product in this order:
  1. Explicit user input or spec prefix (e.g. `/build BO-SPEC-018` → product = `backend-office`)
  2. `cwd` inside `apps/<product>-*` or `packages/<product>-*` → that product
  3. Ask the user, listing names from `docs/products/*/`

Specs in multi-product mode live at `docs/products/<product>/specs/` and use product-prefixed IDs (e.g. `BO-SPEC-018`). The ROADMAP and e2e scripts are likewise per-product.

## After Work Type is Determined

Follow the linked workflow document for the selected type. All three workflows share the same [code review checklist](code-review.md) at the end.

## Universal Rules

These apply to all work types:

- **TDD pattern**: Write tests first, verify they fail, implement, verify they pass, refactor, verify again. This is a gate, not a guideline — for features, paste the failure output before opening any implementation file (see [feature-workflow.md §3a](feature-workflow.md#3a-write-tests-first--stop-gate)). Writing the implementation first and adding tests after is a violation, even if the tests pass at the end.
- **Vertical slices**: Deliver working end-to-end functionality in each increment, not horizontal layers
- **Verify after every change**: Run tests, lint, and check for dev server errors before moving on
- **Don't skip the review**: Every completed unit of work gets a code review pass before declaring done
- **Ask before proceeding** when you encounter ambiguity in requirements — one round of clarification, then move forward with your best judgment
- **Keep spec and ROADMAP in sync**: Whenever a spec status changes, always update the corresponding entry in `ROADMAP.md` to match
