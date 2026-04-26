# Feature Development Workflow

New capabilities that don't exist yet. Spec-driven, full TDD cycle with vertical slices.

## Issue Tracking

If the feature is linked to a GitHub issue (e.g. the spec was created in response to a feature request), update the issue as work progresses:

- **Before starting each phase** — Add a comment naming the phase about to begin and what it will produce (e.g. "Starting Phase 2: Slice Planning — will draft the slice plan in the spec and present it for confirmation"). For Phase 1, include a link to the spec file once it's created.
- **When Phase 4 (Code Review) completes** — Add a comment with the code review findings as a markdown table:

  | Priority              | Finding                           | Status              |
  | --------------------- | --------------------------------- | ------------------- |
  | critical / high / low | one-line description of the issue | fixed / outstanding |

- **At Phase 7 (Finalize)** — Close the issue with a summary of what was built, a link to the spec, and a clickable link to the commits that landed the work.

**Commit references in comments** — Whenever a comment mentions a commit, render the SHA as a clickable markdown link, never as plain text. Format: `[<short-sha>](<commit-url>)` — e.g. `[1c2d4ac](https://github.com/owner/repo/commit/1c2d4ac1f...)`. Get the URL with `gh browse <full-sha> -n` (prints the commit URL without opening a browser), or construct it from `gh repo view --json url -q .url` + `/commit/<full-sha>`. Features land as a commit at the end of Phase 7, so the close comment is the primary place this applies.

## Progress Tracking

Features run long and the user needs visibility into where you are. Use the task scheduler throughout the build so progress is observable without the user having to ask:

- **At the end of Phase 2 (Slice Planning)** — Call `TaskCreate` to create one task per slice, plus tasks for Phase 4 (Code Review), Phase 5 (E2E Test Script), Phase 6 (Spec Coverage), and Phase 7 (Finalize). Use the slice names from the spec's Slice Plan so task titles match the plan the user just approved. The Phase 5 task is not optional — if the project turns out to not use E2E scripts (see Phase 5 detection), close the task with a one-line note explaining why, do not silently delete it.
- **While building** — Call `TaskUpdate` to mark a task `in_progress` when you start it and `completed` as soon as it lands. Update immediately, not in batches — the user is watching this list to track progress.
- **If the slice plan changes mid-build** — Update both the spec's Slice Plan and the task list so they stay in sync.

## Phase 1: Spec Setup & Creation

If the project doesn't have a `docs/specs/` directory with a `_TEMPLATE.md`, install one:

1. Create `docs/specs/` directory
2. Copy [spec-template.md](spec-template.md) to `docs/specs/_TEMPLATE.md`

Then create the spec:

1. **Create the spec** — Copy `_TEMPLATE.md` to a new spec file with the next available ID (e.g., `SPEC-001-feature-name.md`)
2. **Define acceptance criteria** — Each AC gets a unique ID (e.g., `SPEC-XXX.AC1`; in multi-product repos, use the product-prefixed form, e.g. `BO-SPEC-XXX.AC1`). **ACs must be outcome-focused** — observable user- or system-visible behavior that maps to the Desired Outcome. No component names, function signatures, library picks, DB columns, API routes, or file paths. If a technical constraint matters, put it in `## Technical Notes`, not in an AC. A good AC is something you could demo; a bad AC reads like a code review checklist.
3. **Walk through open questions** — Surface ambiguities and resolve with the user
4. **Wireframe alternatives (UI-heavy work only)** — If the spec introduces a net-new screen, reshapes a user flow, or adds a non-trivial component, offer the wireframe alternatives step: sketch 2–3 structurally different low-fi HTML mocks, open them in the browser, and let the user pick before approval. See [wireframe-alternatives.md](wireframe-alternatives.md) for the full procedure. Record the outcome in the spec's `## Design Decision` section. Skip this step if the work isn't UI-heavy, and respect a "no" from the user without re-prompting.
5. **Get approval** — Don't start building until the user confirms the spec. Update status to `approved`

## Phase 2: Slice Planning

Break the spec into thin end-to-end slices. Each slice should:

- Cover one or more ACs
- Be independently testable
- Deliver working functionality (not just a backend layer or just a UI)

**Write the slice plan into the spec** under the `## Slice Plan` section before presenting it to the user. Each slice gets:

- A short name (e.g. "Slice 1: Read-only list view")
- The AC IDs it covers (e.g. `SPEC-XXX.AC1, AC2, AC3`)
- A one-line description of what the user can do once the slice lands
- Its position in the build order

Present the written plan to the user and get explicit confirmation before starting Phase 3. The plan stays in the spec as a record of how the work was decomposed — keep it updated if the slicing changes mid-build.

Once the plan is confirmed, seed the task scheduler with a task per slice plus tasks for Phases 5–7. See [Progress Tracking](#progress-tracking) for the full protocol.

## Phase 3: Build Each Slice (TDD)

Each slice runs the TDD cycle from [Universal Rules](SKILL.md#universal-rules). The cycle is non-negotiable: if you skip 3a, treat the slice as not-started and redo it. Do not write any implementation file for the slice before 3a's gate passes.

**Slice start declaration** — Right after marking the slice `in_progress` via `TaskUpdate`, emit a one-line declaration in your reply:

> `Slice N tests-first: writing <path/to/test>, expecting failures on <symbols/routes/behaviors>.`

This makes "I forgot 3a" impossible to hide. If you cannot name the failing symbols yet, you do not understand the slice well enough to implement it — re-read the ACs.

For each slice, repeat this cycle:

### 3a. Write Tests First — STOP gate

This is a hard checkpoint, not a step. You may not open or create any implementation file for this slice until every item below is satisfied:

1. Write unit tests that cover the ACs for this slice. Tag each test with the AC ID it verifies:
   ```typescript
   it("calculates compound interest correctly [BO-SPEC-XXX.AC2]", () => { ... });
   ```
2. Run the tests and **paste the failure output into your reply**. The paste is the evidence the gate passed; without it, the gate did not pass.
3. Inspect the failure mode. Acceptable failures are:
   - Module / import not found (the implementation file doesn't exist yet)
   - Function / export not found (the symbol under test doesn't exist yet)
   - Route / endpoint returns 404 or the framework's "not registered" error
   - Assertion failure on behavior that the implementation has not yet produced

   If the failure is anything else — a syntax error in the test, a setup/fixture failure, or a passing test — the tests are not testing the new behavior. Rewrite them and re-run before opening the implementation file.

**Anti-pattern (do not do this):** Writing the route/handler/component first because "the shape is fresh in my head," then bolting tests on after. This is a 3a violation. If you catch yourself doing it, stop, delete the implementation, and restart the slice from 3a.

### 3b. Implement

Build in this order (adapt to project architecture):

1. **Schema** — Database schema changes, migrations
2. **Data layer** — Database operations, models
3. **Business logic** — Use cases, services, domain logic
4. **API layer** — Thin wrappers that call business logic, with auth checks
5. **Frontend** — UI components that consume the API

After any schema or backend model changes, run codegen if the project requires it.

### 3c. Verify

1. **Run tests** — All new tests should pass. No existing tests should break.
2. **Run lint/format** — Fix any issues.
3. **Check dev server logs** — Look for runtime errors if dev servers are running.
4. **Run build** — Catch type errors and build failures.

### 3d. Refactor

With passing tests as a safety net:

- Remove duplication
- Simplify complex logic
- Improve naming
- **Security check** — Review for injection vulnerabilities, missing auth checks, exposed sensitive data
- **Performance check** — Review for N+1 queries, missing indexes, unbounded collections, unnecessary re-renders
- **Run tests again** after refactoring

## Phase 4: Code Review

Update the spec status to `in-review`.

Run the full [code review checklist](code-review.md). Present all findings to the user as a list, with each issue classified as critical, high, or low priority. For each issue, note whether it has been fixed or is still outstanding. Do not proceed to Phase 5 until the user confirms all critical and high-priority issues are resolved.

Code review runs before the E2E script so the script documents the final shipped behavior, not something still in flux from review fixes.

## Phase 5: E2E Test Script — STOP gate

This is a hard checkpoint, not a step. You may not mark the Phase 5 task complete or proceed to Phase 6 until every item below is satisfied. Skipping this phase silently — pretending it was never part of the workflow — is the most common failure mode in this skill. Do not do it.

**Detection (do this first, do not guess).** Run all of these and paste a one-line summary of what you found into your reply:

1. `ls e2e/test-scripts/ 2>/dev/null` (single-product) or `ls docs/products/<product>/e2e/test-scripts/ 2>/dev/null` (multi-product).
2. `grep -rn "e2e/test-scripts\|Manual Test Script" docs/ CLAUDE.md 2>/dev/null | head` to catch project-specific conventions.
3. Re-read the spec's `## Manual Test Script` section — `spec-template.md` already points at `e2e/test-scripts/SPEC-XXX-feature-name.md`, so the convention is the default unless the project explicitly opts out.

If **any** of those turn up an existing directory, prior script, or doc reference, the project uses E2E scripts — proceed with the steps below. Only skip if you have positive evidence the project does not (e.g. a CLAUDE.md line saying so). "I didn't see one" is not evidence; you have to look. If you skip, state in your reply _what you checked_ and _why you concluded the project opts out_, then close the Phase 5 task with that note.

**Steps when the project uses E2E scripts:**

1. **Create a test script** — One scenario per AC (or group related ACs). Path: `e2e/test-scripts/<SPEC-ID>-<feature-name>.md` (or the product-scoped path in multi-product repos).
2. **Structure each test**:
   - **Prerequisites** — What state must exist (logged in, data seeded, etc.)
   - **Instructions** — Step-by-step actions to perform
   - **Expected Result** — What to verify
3. **Tag with AC IDs** — Each test references the ACs it covers
4. **Include a coverage matrix** — AC ID to test mapping at the bottom
5. **Link from the spec** — Update the spec's `## Manual Test Script` section to point at the new file.
6. **Paste the file path** of the created script into your reply as evidence the gate passed, then mark the Phase 5 task complete.

## Phase 6: Spec Coverage Verification

Run the project's spec coverage tool to verify all ACs have linked tests. Fix any gaps before proceeding.

## Phase 7: Finalize

1. **Report to the user** using this structure:
   - **What was built** — One-paragraph summary of the feature and its slices
   - **ACs covered** — Bulleted list of every AC ID with a passing test
   - **Tests added** — Count and the key test files
   - **Commits** — Markdown-linked SHAs for the commits that landed the work (use the link format from the [Issue Tracking](#issue-tracking) section)
   - **Follow-ups** — Anything deferred, gaps in coverage, or related work to file as new issues
2. **Wait for the user** to request marking the spec as `implemented`. When they do:
   - Update the spec frontmatter status to `implemented`
   - Update the corresponding entry in `ROADMAP.md` to `implemented`
   - Ask the user if they'd like to commit the changes
