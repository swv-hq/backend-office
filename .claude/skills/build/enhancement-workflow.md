# Enhancement Workflow

Improvements to existing features: better UX, performance, polish, refactoring. The feature already works — you're making it better.

## Issue Tracking

If the enhancement was kicked off from a GitHub issue, update the issue status as work progresses:

- **Phase 1**: Add a comment noting work has started
- **Phase 4**: Add a comment noting implementation is in progress
- **Phase 7**: When the user has Claude commit, close the issue with a comment linking the changes

**Commit references in comments** — Whenever a comment mentions a commit, render the SHA as a clickable markdown link, never as plain text. Format: `[<short-sha>](<commit-url>)` — e.g. `[1c2d4ac](https://github.com/owner/repo/commit/1c2d4ac1f...)`. Get the URL with `gh browse <full-sha> -n` (prints the commit URL without opening a browser), or construct it from `gh repo view --json url -q .url` + `/commit/<full-sha>`. This applies to every issue comment that references a commit, including the Phase 7 close comment.

## Phase 1: Scope the Enhancement

1. **Understand what exists** — Read the current implementation before proposing changes
2. **Define "better"** — What specifically improves? Be concrete:
   - **UX improvement** — What's the user pain point? What does the improved experience look like?
   - **Performance** — What's slow? What's the target? Profile before optimizing.
   - **Refactor** — What's the code smell? What's the cleaner structure?
   - **Polish** — What's rough? What does polished look like?
3. **Confirm scope with the user** — Enhancements easily balloon. Agree on what's in and what's out.

## Phase 2: Define Acceptance Criteria

Before writing code, define what "enhanced" looks like:

1. **Find the related spec** — Search `docs/specs/` (or `docs/products/<product>/specs/` in multi-product repos) for the spec that covers the feature being enhanced
2. **Prefer extending an existing spec** — Add new ACs to the existing spec (e.g., if `SPEC-003` has AC1-AC5, add `SPEC-003.AC6`, `SPEC-003.AC7`). This keeps all criteria for a feature in one place. **New ACs must reuse the spec's existing prefix** — do not add `SPEC-003.AC8` to a `BO-SPEC-003` spec.
3. **Create a new spec only if** the enhancement is unrelated to any existing spec or is substantial enough to stand on its own
4. **Keep ACs outcome-focused** — each new AC should describe observable user- or system-visible behavior tied to the enhancement's goal, not the code that delivers it. No component names, function signatures, library picks, or file paths in an AC. Implementation constraints (performance budgets, specific libraries, refactor boundaries) go in `## Technical Notes` on the spec.
5. **Confirm with the user** — Walk through the new ACs before proceeding

## Phase 3: Characterize Existing Behavior

Before changing anything:

1. **Run existing tests** — Establish a green baseline. If tests are failing before you start, flag it.
2. **Write characterization tests** if coverage is thin in the area you're changing:
   - These tests document current behavior, not desired behavior
   - They protect against accidental regressions while you refactor
   - Tag with the spec AC ID: `[SPEC-003.AC6]`
3. **For performance enhancements** — Capture baseline metrics before changing anything

## Phase 4: Plan the Change

Decide on the approach:

- **If it's a refactor**: Plan the transformation steps. Can you do it incrementally (each step leaves tests green) or does it require a bigger swap?
- **If it's a UX change**: Identify which components and data flows are affected. If the change reshapes a user flow or introduces a non-trivial new component, offer the wireframe alternatives step — see [wireframe-alternatives.md](wireframe-alternatives.md) — and record the outcome in the related spec's `## Design Decision` section before implementing. Skip for small UX polish.
- **If it's performance**: Identify the bottleneck with profiling, not guessing

For multi-step enhancements, use vertical slices — each slice should leave the system working.

## Phase 5: Build (TDD)

Each slice (or, for a single-shot enhancement, the whole change) runs the TDD cycle from [Universal Rules](SKILL.md#universal-rules). The cycle is non-negotiable: if you skip 5a, treat the work as not-started and redo it. Do not edit production code for the enhancement until 5a's gate passes.

**Start declaration** — Before opening any production file for the change, emit a one-line declaration in your reply:

> `Enhancement tests-first: updating/adding <path/to/test>, expecting failures on <symbols/behaviors>.`

If you cannot name the failing symbols or behaviors, you do not understand the change well enough to implement it — re-read the ACs and characterization tests.

### 5a. Update or Write Tests — STOP gate

This is a hard checkpoint, not a step. You may not edit production code for the enhancement until every item below is satisfied:

1. **Modify existing tests** to reflect the new desired behavior, and **add new tests** for new behavior being introduced. Tag each with its AC ID: `[SPEC-003.AC6]`.
2. **Run the tests and paste the failure output into your reply.** The paste is the evidence the gate passed; without it, the gate did not pass.
3. The failure must come from the new/changed assertions — module-not-found, symbol-not-found, route-not-registered, or an assertion on behavior the implementation has not yet produced. A passing test, a setup/fixture error, or a syntax error means the tests aren't testing the new behavior — rewrite and re-run.

**Note for pure refactors:** if the goal is to preserve behavior with no observable change, characterization tests from Phase 3 already provide the safety net and 5a's red-test requirement does not apply — the gate becomes "characterization tests are green before you touch anything." Any AC that _does_ describe a behavior change still goes through the full STOP gate.

**Anti-pattern (do not do this):** Tweaking the implementation first because "the change is small," then updating the tests to match. This is a 5a violation — tests written after the fact silently codify whatever the implementation happens to do, including bugs. If you catch yourself doing it, revert the implementation, rewrite the tests, watch them fail, then reapply.

### 5b. Implement

- Make changes incrementally, keeping the system working at each step
- For refactors: rename/restructure in small commits, running tests between each
- For UX changes: update the UI layer, verify with dev server
- For performance: change one thing at a time, measure after each change

### 5c. Verify

1. **Run all tests** — New, modified, and existing tests should pass
2. **Run lint/format** — Fix any issues
3. **Check dev server logs** — Verify no runtime errors
4. **Run build** — Catch type errors
5. **For performance**: Compare against baseline metrics

### 5d. Refactor

With passing tests as a safety net, clean up:

- Remove dead code from the old implementation
- Simplify any overly complex logic introduced during the change
- **Security check** — Review for injection vulnerabilities, missing auth checks, exposed sensitive data
- **Performance check** — Review for N+1 queries, missing indexes, unbounded collections, unnecessary re-renders
- **Run tests again** after refactoring

## Phase 6: Code Review

Run the [code review checklist](code-review.md), focused on:

- **Backward compatibility** — Does this break any existing workflows or APIs?
- **Test coverage** — Are characterization tests still valid? Do new tests cover the enhancement?
- **Performance** — If this was a perf enhancement, verify the improvement. If not, verify no regression.
- **Scope discipline** — Did you stay within the agreed scope?

Present all findings to the user as a list, with each issue classified as critical, high, or low priority. For each issue, note whether it has been fixed or is still outstanding. Do not proceed until the user confirms all critical and high-priority issues are resolved.

## Phase 7: Finalize

1. **Clean up characterization tests** — Remove any that are now redundant (covered by better tests)
2. **Report to the user** — What changed, what's better, what ACs were covered, and what tests verify it
3. **Note any related issues** found during investigation that should be tracked separately
4. **Ask the user** if they'd like to commit the changes. When they do, update the GitHub issue accordingly (close with a comment linking the changes).
