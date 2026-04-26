# Bug Fix Workflow

Something is broken. Reproduce first, then fix with a regression test.

## Issue Tracking

If the bug was kicked off from a GitHub issue, update the issue status as work progresses:

- **Phase 1**: Add a comment noting investigation has started
- **Phase 4**: Add a comment noting the fix is in progress
- **Phase 7**: When the user has Claude commit, close the issue with a comment linking to the fix

**Commit references in comments** — Whenever a comment mentions a commit, render the SHA as a clickable markdown link, never as plain text. Format: `[<short-sha>](<commit-url>)` — e.g. `[1c2d4ac](https://github.com/owner/repo/commit/1c2d4ac1f...)`. Get the URL with `gh browse <full-sha> -n` (prints the commit URL without opening a browser), or construct it from `gh repo view --json url -q .url` + `/commit/<full-sha>`. This applies to every issue comment that references a commit, including the Phase 7 close comment.

## Phase 1: Understand the Bug

1. **Gather information** — Read the issue, error messages, stack traces, and any reproduction steps
2. **Identify the expected vs actual behavior** — What should happen? What happens instead?
3. **Determine scope** — Is this a single function, a data flow, a race condition, an integration issue?

If the bug report is vague, ask the user one round of clarifying questions. Don't start guessing without understanding what's broken.

## Phase 2: Define Acceptance Criteria

Before writing code, define what "fixed" looks like:

1. **Create ACs for the fix** — Each AC gets a unique ID. If a related spec exists, extend it (e.g., `SPEC-003.AC7`). In multi-product repos, prefix with the spec's product (e.g., `BO-SPEC-003.AC7`). If no spec exists, use the issue number (e.g., `BUG-123.AC1`) — the `BUG-` fallback needs no product prefix.
2. **Keep ACs outcome-focused** — describe the corrected observable behavior, not the code change. "Submitting a form with a trailing space saves successfully" is an AC; "trim input in `FormHandler.submit`" is a technical note. Root-cause details and implementation constraints belong in `## Technical Notes` on the spec (or the issue body for BUG-only fixes).
3. **Typical bug ACs**:
   - The original broken behavior no longer occurs
   - Edge cases related to the root cause are handled
   - No regression in surrounding functionality
4. **Confirm with the user** — Walk through the ACs before proceeding

## Phase 3: Reproduce — STOP gate

This is a hard checkpoint, not a step. You may not edit any production code to fix the bug until every item below is satisfied:

1. **Find the failing code path** — Trace from the symptom to the root cause
   - Read error messages and stack traces carefully
   - Search the codebase for relevant code
   - Check recent commits if this is a regression (`git log --oneline -20`)
2. **Write a failing test** that reproduces the bug
   - Tag each test with its AC ID: `[BUG-123.AC1]` or `[SPEC-003.AC7]`
   - The test should fail with the current code and pass after the fix
   - If multiple symptoms exist, write a test for each
3. **Run the test and paste the failure output into your reply.** The paste is the evidence the gate passed; without it, the gate did not pass. The failure must reproduce the reported bug — a setup error, syntax error, or unrelated assertion failure does not count. Rewrite and re-run if so.

**Anti-pattern (do not do this):** Patching the suspected line first to "see if it fixes it," then writing the regression test after. This is a Phase 3 violation — without a pre-fix red test, you have no proof the change addressed the reported bug rather than something incidental. If you catch yourself doing it, revert the fix, write the test, watch it fail, then reapply.

If the bug can't be reproduced with a unit test (e.g., it's a timing issue, environment-specific, or UI-only):

- Document why a unit test isn't feasible
- Plan to verify the fix manually or with an E2E test

## Phase 4: Root Cause Analysis

Before jumping to a fix, understand **why** the bug exists:

1. **Identify the root cause** — Not just where the error occurs, but why
2. **Check for related issues** — Is this a pattern? Are there similar bugs lurking nearby?
3. **Assess blast radius** — What else could be affected by changes in this area?

Common root cause patterns:

- **Missing validation** — Input not checked at system boundary
- **State management** — Race condition, stale state, missing initialization
- **Off-by-one / boundary** — Edge case not handled
- **Integration mismatch** — API contract violation between layers
- **Regression** — Previous change broke existing behavior

## Phase 5: Fix

1. **Make the minimal change** that fixes the root cause
   - Don't refactor surrounding code unless it's directly related to the bug
   - Don't fix "nearby" issues — file separate issues for those
2. **Run the reproduction test** — It should now pass
3. **Run the full test suite** — No existing tests should break
4. **Run lint/format** — Fix any issues
5. **Check dev server logs** — Verify no runtime errors
6. **Security check** — Review for injection vulnerabilities, missing auth checks, exposed sensitive data
7. **Performance check** — Review for N+1 queries, missing indexes, unbounded collections, unnecessary re-renders

## Phase 6: Verify Fix Completeness

1. **Check for related edge cases** — If the bug was a boundary issue, test adjacent boundaries
2. **Check related code paths** — If the same pattern exists elsewhere, determine if those are also buggy
   - If so, file separate issues rather than expanding scope (unless trivially fixable)
3. **Run build** — Catch any type errors

## Phase 7: Code Review

Run the [code review checklist](code-review.md), focused on:

- **Regression safety** — Does the fix introduce new risks?
- **Test coverage** — Does the regression test actually catch the bug if reintroduced?
- **Root cause addressed** — Is this a band-aid or a real fix?

Present all findings to the user as a list, with each issue classified as critical, high, or low priority. For each issue, note whether it has been fixed or is still outstanding. Do not proceed until the user confirms all critical and high-priority issues are resolved.

## Phase 8: Finalize

1. **Report to the user** — What was the root cause, what was the fix, what ACs were covered, and what tests were added
2. **Note any related issues** found during investigation that should be tracked separately
3. **Ask the user** if they'd like to commit the changes. When they do, update the GitHub issue accordingly (close with a comment linking the fix).
