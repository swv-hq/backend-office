---
name: next
description: Show prioritized open issues and upcoming specs to help decide what to work on next. Use when the user is ready to start a new unit of work, wants to see the backlog, or asks what to work on.
---

Fetch and display prioritized open issues and upcoming spec features from the swv-hq/backend-office repository.

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

This monorepo hosts multiple products. Read the frontmatter of each spec file under **every** product:

- `docs/products/backend-office/specs/*.md` (prefix `BO-SPEC-`)
- `docs/products/auth-hub/specs/*.md` (prefix `AH-SPEC-`)

Use `docs/products/*/specs/*.md` and skip `_TEMPLATE.md`. Extract `id`, `title`, `status`, `priority`, and `phase` from each. Tag every spec with its product (derived from the path) so they can be grouped in the display.

Include specs with these statuses: `draft`, `in-review`, `approved`, `in-progress`, `in-testing`

Exclude specs with status: `implemented`

## Sorting and Prioritization

### Issues (always shown first)

1. **Bugs** — Issues with the `bug` label, sorted oldest first (always top priority)
2. **Enhancements & Features** — Issues with `enhancement` or `feature` labels, sorted oldest first
3. **Other** — Issues without a type label, sorted oldest first

### Specs (shown after issues, grouped by product)

Group specs by product first (backend-office, then auth-hub). Within each product, sort by phase (ascending), then spec number (ascending). The spec number order reflects the intended build sequence from the roadmap — respect it over priority. Priority is shown for context but does not change ordering.

Only show specs from the current and next phase **within each product** (i.e., if backend-office Phase 1 has unfinished specs, show backend-office Phase 1 and Phase 2 only; auth-hub phases are independent).

## Display Format

```
## What's Next (prioritized)

### Bugs (fix first)
1. #12 - Login form crashes on empty email (3 days ago)

### Enhancements & Features
2. #15 - Add dark mode toggle (2 days ago)

### Specs — backend-office — Phase 1: MVP
3. BO-SPEC-006 - Per-Holding User Overrides [draft, P1]
4. BO-SPEC-007 - Holdings Tagging System [draft, P1]

### Specs — backend-office — Phase 2: Tax & Cashflow
5. BO-SPEC-010 - Account-Level Metrics [draft, P1]

### Specs — auth-hub — Phase 1: Identity Core
6. AH-SPEC-001 - Tenants table + RS256 keys [draft, P0]
```

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

- **If an issue**: fetch full details with `gh issue view <number> --repo swv-hq/backend-office` and present them
- **If a spec**: read the full spec file at `docs/products/<product>/specs/SPEC-XXX-*.md` (resolve `<product>` from the spec ID prefix: `BO-` → `backend-office`, `AH-` → `auth-hub`) and present it

Then ask how they'd like to proceed.

## Edge Cases

- **No open issues and no pending specs**: Say "Everything is done — the backlog is clear."
- **No open issues but specs remain**: Skip the issues section, show specs only.
- **No pending specs but issues remain**: Skip the specs section, show issues only.
- **More than 20 total items**: Show the top 20 and note how many more remain.
- **Empty tiers**: Omit the tier heading entirely.
