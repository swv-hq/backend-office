# Wireframe Alternatives

An optional step for UI-heavy work: before committing to a shape, sketch 2–3 structurally different alternatives as low-fi HTML wireframes, open them in the browser, and let the user pick. The goal is to surface tradeoffs and UX patterns, not to produce polished visuals.

This procedure is referenced from both [feature-workflow.md](feature-workflow.md) (Phase 1) and [enhancement-workflow.md](enhancement-workflow.md) (Phase 4).

## When to Offer This Step

Propose wireframe alternatives when **any** of these are true:

- The work introduces a net-new screen, page, or panel
- The work reshapes an existing user flow (new steps, reordering, new entry points)
- The work introduces a non-trivial component (e.g. table → kanban, form → wizard, list → split-pane)

**Skip** for: copy tweaks, single-field additions, color/spacing adjustments, bug-shaped UI fixes, or any change where you already know the shape.

The step is **offered, not mandatory**. Ask the user once — "This spec introduces two new screens. Want me to sketch 2–3 alternative layouts before we lock the shape?" — and respect their answer. Don't re-prompt.

## Style Rules

Wireframes are deliberately rough. Their job is to make structural tradeoffs visible, not to look like the finished product.

- **Single static HTML file**, no build step, no project dependencies
- **Inline `<style>` block** — no Tailwind, no CDN fonts, no frameworks
- **Rough visual style** — boxes with borders, labels, placeholder text (`Lorem ipsum` or realistic sample data), minimal color. Think whiteboard, not Figma.
- **No interactivity** — static markup only. No JS, no hover states, no transitions.
- **Label every region** — users should be able to read the wireframe without guessing what a box represents.

## Structural Divergence

The 2–3 alternatives **must be structurally different**. Three color variants of the same layout defeat the point. Examples of genuine divergence:

- Modal vs. inline vs. dedicated page
- Single-pane vs. split-pane vs. tabbed
- Wizard (multi-step) vs. single long form vs. progressive disclosure
- Master-detail vs. drill-down vs. everything-on-one-screen

If you can't think of 2 genuinely different approaches, the work probably isn't UI-heavy enough to warrant this step — skip it.

## File Layout

One HTML file per spec. All alternatives live side-by-side in that file so they can be compared at a glance.

**Path:**

- **Single-product repo**: `docs/wireframes/<SPEC-ID>-<short-name>.html`
- **Multi-product repo**: `docs/products/<product>/wireframes/<SPEC-ID>-<short-name>.html` (the SPEC ID already carries the product prefix, e.g. `BO-SPEC-018`)

Create the `wireframes/` directory if it doesn't exist.

**File structure:**

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>SPEC-XXX Wireframes: Feature Name</title>
    <style>
      /* Inline CSS — size as needed. Aim for readable, not pretty. */
    </style>
  </head>
  <body>
    <header>
      <h1>SPEC-XXX: Feature Name</h1>
      <p>Low-fi wireframe alternatives. Pick one, or blend elements.</p>
    </header>

    <section class="option">
      <h2>Option A: <short descriptor></h2>
      <p class="tradeoffs"><strong>Tradeoffs:</strong> what this approach is good/bad at, what it assumes about the user.</p>
      <div class="mock"><!-- the wireframe --></div>
    </section>

    <section class="option">
      <h2>Option B: <short descriptor></h2>
      <p class="tradeoffs">...</p>
      <div class="mock">...</div>
    </section>

    <!-- Optional Option C -->
  </body>
</html>
```

Each option's `tradeoffs` paragraph is load-bearing — it's how the user evaluates structural choices instead of just comparing looks.

## Procedure

1. **Confirm the step is wanted** — Offer it once; proceed only if the user says yes.
2. **Draft the alternatives in the spec first** — In the spec's `## Design Decision` section, list the 2–3 options by name with a one-line description and the tradeoffs you intend to illustrate. Get a nod before writing HTML so you don't build mocks for options the user wants to drop.
3. **Write the HTML file** at the path above, following the style rules.
4. **Open it in the browser** — Use Bash: `open <path>` on macOS, `xdg-open <path>` on Linux, `start <path>` on Windows. If unsure, print the absolute path and ask the user to open it.
5. **Walk the user through the alternatives** — Briefly narrate each option's structural tradeoffs. Don't editorialize toward a favorite; the user is choosing.
6. **Capture the decision** — Once the user picks (or asks for a blend), fill in the spec's `## Design Decision` section:
   - **Chosen option** — which one, with a one-line summary
   - **Alternatives considered** — the others, with the tradeoff that lost
   - **Reasoning** — why the chosen option won
   - **Wireframe file** — markdown link to the archived HTML file
7. **Iterate if asked** — The user may want a revised option or a merged design. Update the HTML in place; keep the archive to one file.

## What the Archive Is (and Isn't)

The archived HTML is a **record of the decision point**, not a design spec the implementation must match pixel-for-pixel. Implementation may refine the shape; the spec's `## Design Decision` section is the authoritative record of _why_ the chosen shape was chosen. Don't update the wireframe file after implementation — it's a snapshot.
