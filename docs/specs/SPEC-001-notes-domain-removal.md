---
id: SPEC-001
title: Notes Domain Removal
status: approved
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-001: Notes Domain Removal

## Problem Statement

The codebase contains a starter/example "notes" domain (CRUD + AI summaries) across all three workspaces. This code is unrelated to Back-End Office and must be removed to provide a clean foundation for the new product.

## Affected Users

| User Role | Impact                                                          |
| --------- | --------------------------------------------------------------- |
| Developer | Clean codebase with no dead code or confusing starter artifacts |

## Desired Outcome

All notes-related code is removed from the backend, web, and native workspaces. The app compiles and runs with only authentication and empty navigation shells remaining. No references to notes, OpenAI summaries, or the old data model remain.

## Acceptance Criteria

- **SPEC-001.AC1** [backend]: Notes table removed from Convex schema
- **SPEC-001.AC2** [backend]: All notes queries, mutations, and actions deleted (getNotes, getNote, createNote, deleteNote)
- **SPEC-001.AC3** [backend]: OpenAI integration removed (summary action, openai module, OPENAI_API_KEY references)
- **SPEC-001.AC4** [web]: Notes pages removed (/notes, /notes/[slug])
- **SPEC-001.AC5** [web]: Notes components removed (Notes, NoteItem, NoteDetails, CreateNote, DeleteNote, Checkbox, ComplexToggle)
- **SPEC-001.AC6** [web]: Navigation updated to remove notes links; header points to placeholder or home only
- **SPEC-001.AC7** [native]: Notes screens removed (NotesDashboardScreen, CreateNoteScreen, InsideNoteScreen)
- **SPEC-001.AC8** [native]: Navigation updated to remove notes screens; post-auth lands on an empty shell or placeholder
- **SPEC-001.AC9** [backend, web, native]: All workspaces pass typecheck (`turbo run typecheck`) with zero errors
- **SPEC-001.AC10** [backend, web, native]: All workspaces pass lint (`turbo run lint`) with zero errors
- **SPEC-001.AC11** [web, native]: App compiles and runs — authenticated user sees an empty shell, unauthenticated user sees login
- **SPEC-001.AC12** [web]: Site metadata in layout.tsx updated from "Notes App" to "Back-End Office" branding
- **SPEC-001.AC13** [backend]: OpenAI npm dependency removed from packages/backend/package.json

## Open Questions

None.

## Technical Notes

- The Convex `_generated/` directory will auto-regenerate after schema changes — do not manually edit it.
- The web marketing homepage (Hero, Benefits, Testimonials, Footer) contains notes-era branding and broken `/notes` links after removal. These will be addressed in SPEC-029 (Marketing Site Rebrand) — leave them as-is for now.
- Clerk auth integration must remain fully functional across both apps.
- OpenAI dependency can be removed from package.json if no other code references it.
