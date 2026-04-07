---
name: issue
description: Create a GitHub Issue from the current conversation. Use when the user discovers a bug, wants an enhancement, or has a feature request and wants to capture it without leaving the terminal.
---

Create a GitHub Issue on the swv-hq/backend-office repository.

## Inputs

Gather the following from the user's message and recent conversation context. Ask only if truly ambiguous — one round of clarification at most.

1. **Title** — A concise summary (under 80 characters)
2. **Description** — What happened, expected behavior, or what's being requested
3. **Type** — One of: `bug`, `enhancement`, `feature`

### Inferring Type

Infer the type from context rather than always asking:

- **bug** — Something is broken, crashes, errors, wrong behavior, regressions
- **enhancement** — Improvement to an existing feature (better UX, performance, polish)
- **feature** — A new capability that doesn't exist yet

## Issue Body Format

Construct the issue body using this template:

```
## Description

[User's description, cleaned up for clarity]

## Context

- **Discovered during**: [brief note about what the user was working on, if apparent from conversation]
- **Related files**: [any files mentioned in conversation, if relevant]
```

If the user provided or mentioned screenshots, add:

```
## Screenshots

Screenshots were shared during development. Attach them to this issue in the browser.
```

## Creating the Issue

Use a HEREDOC for the body to preserve formatting:

```bash
gh issue create \
  --repo swv-hq/backend-office \
  --title "<title>" \
  --label "<type>" \
  --body "$(cat <<'EOF'
<body content>
EOF
)"
```

Where `<type>` is one of: `bug`, `enhancement`, `feature`.

## After Creation

1. Report the issue number and URL to the user
2. If screenshots were mentioned or shared, tell them: "Open the issue to drag-and-drop your screenshots: <url>"
3. Confirm briefly and return to the previous work — do not linger on the issue

## Rules

- **Be fast.** The whole point is to not interrupt flow.
- **Mine conversation context.** If the user says "track this as a bug" with no details, use the recent conversation to write a meaningful title and description.
- **Never block flow** with excessive questions. Infer what you can, ask once at most.
- **Do not assign** the issue or add it to a milestone unless explicitly asked.
- **Do not create duplicate issues.** If unsure, check with `gh issue list --repo swv-hq/backend-office --search "<keywords>" --json number,title --limit 5` first.
