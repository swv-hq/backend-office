---
id: SPEC-018
title: Estimate Management & Iterative Refinement
status: draft
priority: P0
phase: 4
created: 2026-04-01
updated: 2026-04-06
---

# SPEC-018: Estimate Management & Iterative Refinement

## Problem Statement

The first AI-generated estimate is a starting point, not the final product. Contractors need to review, refine, and adjust estimates before sending them. This refinement should be voice-first and iterative — the contractor has a conversation with the AI to get the estimate right, the same way they'd talk to an office manager.

## Affected Users

| User Role  | Impact                                                                         |
| ---------- | ------------------------------------------------------------------------------ |
| Contractor | Refines estimates by talking, not typing; full control over the final document |

## Desired Outcome

After the initial estimate is generated, the contractor enters an iterative refinement loop. They can adjust the estimate by voice ("make the labor 2 hours instead of 3", "add a line for drywall repair"), manually edit individual line items, view estimate history, and finalize when satisfied.

## Acceptance Criteria

- **SPEC-018.AC1** [native]: Estimate preview screen showing all line items in a clean list: description, quantity, unit price, line total. Labor and materials subtotals. Grand total.
- **SPEC-018.AC2** [native]: Microphone button on the preview screen for voice refinement: contractor speaks adjustments ("remove the valve replacement", "bump the labor to $85/hour", "add a line for cleanup")
- **SPEC-018.AC3** [backend]: Voice refinement transcript sent to AI provider with the current estimate state and conversation history. AI returns an updated estimate.
- **SPEC-018.AC4** [backend]: Conversation history stored on the estimate record so the AI has context of prior refinements within the same draft session
- **SPEC-018.AC5** [native]: After each voice refinement, updated estimate preview shown with changes highlighted (added/removed/modified line items)
- **SPEC-018.AC6** [native]: Manual edit fallback: tap any line item to edit description, quantity, or unit price directly. Totals recalculate automatically.
- **SPEC-018.AC7** [native]: Add line item manually: button to add a blank line item with text fields
- **SPEC-018.AC8** [native]: Delete line item: swipe to delete a line item
- **SPEC-018.AC9** [native]: "Finalize" button transitions estimate status from "draft" to "finalized" — no more AI refinement after this
- **SPEC-018.AC10** [native]: "Send" button on a finalized estimate triggers delivery to the customer (flows into SPEC-019)
- **SPEC-018.AC11** [backend]: When a new version is created (from customer feedback per SPEC-019), previous versions are preserved. Version number increments. Change notes captured.
- **SPEC-018.AC12** [native]: Estimate history view: see all versions of an estimate for a job, with change notes explaining what changed between versions
- **SPEC-018.AC13** [native]: Contractor can add notes to any version explaining why changes were made
- **SPEC-018.AC14** [backend]: Estimate status flow: draft (iterating with AI) -> finalized -> sent -> approved | declined
- **SPEC-018.AC15** [backend]: All AI interactions go through the provider interface (SPEC-003)
- **SPEC-018.AC16** [backend]: Audit log entries for estimate updates and status transitions
- **SPEC-018.AC17** [backend]: On estimate approval, `jobSegments` are auto-created from the estimate's line item groupings. Line items grouped by `(segmentId, segmentTitle)` produce one segment per group, in the order encountered. Line items with no segment grouping all attach to a single default segment ("Job") so even single-visit jobs get exactly one segment row. Pre-existing segments referenced by `segmentId` on line items are not duplicated. After segment creation, `computeJobRollup` is called and the resulting status written back to the job.
- **SPEC-018.AC18** [backend]: Estimate creation assigns `estimateNumber` atomically from the parent job's `nextEstimateVersion` counter. Format: `EST-{jobNumber}-{version}`.
- **SPEC-018.AC19** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should there be a limit on the number of voice refinement iterations per draft?
- Should the conversation history be visible to the contractor (like a chat thread), or hidden behind the scenes?
- When a new version is created from customer feedback, does it start as a new draft (iteratable) or go straight to finalized?

## Technical Notes

- The voice refinement prompt to Claude should include: the current estimate JSON, the full conversation history (prior adjustments), and the new voice instruction. This gives the AI full context to make accurate adjustments.
- Conversation history is an array of `{role: "contractor" | "ai", content: string}` entries stored on the estimate.
- Version management: each new version is a separate estimate record linked to the same job, with an incremented version number. The `changeNotes` field captures what changed.
- Change highlighting on the preview: compare current line items with the previous state to identify additions (green), removals (red), and modifications (yellow).
- Manual edits bypass the AI — they modify the estimate directly and update totals via client-side calculation.
