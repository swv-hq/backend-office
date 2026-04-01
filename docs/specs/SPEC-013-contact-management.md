---
id: SPEC-013
title: Contact Management
status: draft
priority: P0
phase: 2
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-013: Contact Management

## Problem Statement

Contractors interact with customers across multiple channels: missed calls, voicemails, texts, and in-person meetings. Contact information is scattered and incomplete. The app needs a central place to view all contacts, add new ones (preferably by voice), and enrich contact records as more information becomes available.

## Affected Users

| User Role | Impact |
| --------- | ------ |
| Contractor | Single view of all customers/leads with relevant details |

## Desired Outcome

Contractors see a searchable list of all their contacts, auto-created from calls or manually added via voice or text input. Contact records grow richer over time as the contractor learns more about the customer.

## Acceptance Criteria

- **SPEC-013.AC1** [native]: Contact list screen showing all contacts sorted by most recent interaction
- **SPEC-013.AC2** [native]: Search bar filters contacts by name, phone number, or notes
- **SPEC-013.AC3** [native]: Contact detail screen showing: name, phone, email, address, source, notes, and linked jobs/estimates/invoices
- **SPEC-013.AC4** [native]: Voice-first contact creation: tap microphone button, speak contact details ("John Smith, 555-0123, met him at Home Depot, needs kitchen remodel"), AI parses into structured fields
- **SPEC-013.AC5** [backend]: AI provider parses voice transcript into structured contact fields: name, phone, email (if mentioned), address (if mentioned), notes
- **SPEC-013.AC6** [native]: Manual contact creation form as fallback: text fields for name, phone, email, address, notes
- **SPEC-013.AC7** [native]: Edit contact: tap any field to modify, save updates
- **SPEC-013.AC8** [native]: Tap phone number to initiate a call; tap email to compose an email
- **SPEC-013.AC9** [backend]: Contacts query filtered by authenticated contractor's ID (ownership enforced)
- **SPEC-013.AC10** [backend]: Duplicate detection: when auto-creating a contact from a missed call, check if the phone number already exists for this contractor. If so, update the existing record rather than creating a duplicate.
- **SPEC-013.AC11** [backend]: Audit log entries for contact creation, updates, and deletion
- **SPEC-013.AC12** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should contacts be deletable, or only archivable? Deletion could lose history tied to jobs and invoices.
- Should the contact detail screen show a timeline of all interactions (calls, estimates, invoices)?

## Technical Notes

- Voice-to-contact uses the same Deepgram STT + Claude AI pipeline as voice-to-estimate. The AI prompt extracts structured contact fields from free-form speech.
- Contact list should use Convex's real-time subscriptions so new contacts (from missed calls) appear immediately without refresh.
- The contact detail screen links to related entities (jobs, estimates, invoices) via `contactId` foreign key lookups.
- Phone number normalization: store in E.164 format (+1XXXXXXXXXX) for consistent matching.
