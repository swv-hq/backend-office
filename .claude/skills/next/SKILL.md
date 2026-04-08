---
name: next
description: Show prioritized open issues and upcoming specs to help decide what to work on next. Use when the user is ready to start a new unit of work, wants to see the backlog, or asks what to work on.
---

Fetch and display prioritized open issues and upcoming spec features from the swv-hq/backend-office repository.

## Repo Layout Detection

Detect once, before fetching:

- If `docs/products/` exists with one or more product subdirectories, this is a **multi-product monorepo**. Otherwise it is **single-product**.
- In multi-product mode, specs live at `docs/products/<product>/specs/` and each product has its own phases. Phase scoping ("current and next phase only") is **per product**.

Note: `swv-hq/backend-office` is filled in at install time. If the GitHub repo is later renamed, re-run install or derive the slug via `gh repo view --json nameWithOwner`.

## Fetching Data

### GitHub Issues

```bash
gh issue list \
  --repo swv-hq/backend-office \
  --state open \
  --json number,title,labels,createdAt,body \
  --limit 50
```

### Specs

Read the frontmatter of each spec file. In single-product mode, scan `docs/specs/`. In multi-product mode, iterate `docs/products/*/specs/` and tag each spec with its product. Exclude `_TEMPLATE.md` and `ROADMAP.md`. Extract `id`, `title`, `status`, `priority`, and `phase` from each.

Include specs with these statuses: `draft`, `in-review`, `approved`, `in-progress`, `in-testing`

Exclude specs with status: `implemented`

## Sorting and Prioritization

### Issues (always shown first)

1. **Bugs** — Issues with the `bug` label, sorted oldest first (always top priority)
2. **Enhancements & Features** — Issues with `enhancement` or `feature` labels, sorted oldest first
3. **Other** — Issues without a type label, sorted oldest first

### Specs (shown after issues)

Sort by phase (ascending), then spec number (ascending). The spec number order reflects the intended build sequence from the roadmap — respect it over priority. Priority is shown for context but does not change ordering.

Only show specs from the current and next phase (i.e., if Phase 1 has unfinished specs, show Phase 1 and Phase 2 only). In multi-product mode this scoping is **per product** — each product has its own current/next phases.

## Display Format

```
## What's Next (prioritized)

### Bugs (fix first)
1. #12 - Login form crashes on empty email (3 days ago)

### Enhancements & Features
2. #15 - Add dark mode toggle (2 days ago)

### Specs — Phase 1: MVP
3. SPEC-006 - Per-Holding User Overrides [draft, P1]
4. SPEC-007 - Holdings Tagging System [draft, P1]

### Specs — Phase 2: Tax & Cashflow
5. SPEC-010 - Account-Level Metrics [draft, P1]
```

In multi-product mode, headings include the product name and spec IDs use the product prefix:

```
### Specs — backend-office — Phase 1: MVP
3. BO-SPEC-006 - Per-Holding User Overrides [draft, P1]

### Specs — auth-hub — Phase 1: Foundations
4. AH-SPEC-002 - SSO Provider Wiring [draft, P1]
```

Suppress any product heading whose spec list is empty — do not print empty sections.

For issues show:

- Issue number with `#` prefix
- Title
- Age as relative time

For specs show:

- Spec ID
- Title
- Status and priority in brackets

## After Display

Ask: **"Which item would you like to work on?"**

When the user picks one:

- **If an issue**: fetch full details with `gh issue view <number> --repo swv-hq/backend-office` and present them. If the issue carries a `product:<name>` label, set product context so the downstream `build` skill inherits it.
- **If a spec**: read the full spec file (`docs/specs/SPEC-XXX-*.md` in single-product mode, or `docs/products/<product>/specs/<PREFIX>-SPEC-XXX-*.md` in multi-product mode) and present it. Derive product context from the spec's prefix/path.

Then ask how they'd like to proceed.

## Edge Cases

- **No open issues and no pending specs**: Say "Everything is done — the backlog is clear."
- **No open issues but specs remain**: Skip the issues section, show specs only.
- **No pending specs but issues remain**: Skip the specs section, show issues only.
- **More than 20 total items**: Show the top 20 and note how many more remain.
- **Empty tiers**: Omit the tier heading entirely.
