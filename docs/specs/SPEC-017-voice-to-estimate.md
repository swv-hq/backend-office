---
id: SPEC-017
title: Voice-to-Estimate Generation
status: draft
priority: P0
phase: 4
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-017: Voice-to-Estimate Generation

## Problem Statement

Creating professional estimates is one of the biggest time sinks for solo contractors. Many give verbal estimates because writing them up is too slow, which looks unprofessional and leads to disputes. A contractor should be able to describe the work aloud and get a clean, professional estimate back instantly.

## Affected Users

| User Role | Impact |
| --------- | ------ |
| Contractor | Creates professional estimates in seconds by talking instead of typing |
| Customer | Receives clean, itemized estimates that build trust |

## Desired Outcome

The contractor speaks into the app describing the job. The app transcribes the speech (English, Spanish, or mixed), sends it to the AI with trade context and pricing data, and generates a structured estimate with itemized labor and materials. The estimate can also be seeded from voicemail transcripts or inbound customer text messages.

## Acceptance Criteria

- **SPEC-017.AC1** [native]: "New Estimate" screen with a large microphone button (voice memo UX). Press and hold to record, release to stop.
- **SPEC-017.AC2** [native]: Visual recording indicator (waveform or pulsing animation) while contractor is speaking
- **SPEC-017.AC3** [native]: Audio sent to STT provider (Deepgram) with multi-language detection enabled (English + Spanish + code-switching)
- **SPEC-017.AC4** [backend]: Transcript sent to AI provider (Claude) with prompt context: trade type, zip code, contractor name/business name. Prompt instructs AI to generate structured JSON estimate.
- **SPEC-017.AC5** [backend]: AI returns structured estimate: array of line items, each with: description, type (labor | material), quantity, unit, unitPrice, total. Plus laborSubtotal, materialsSubtotal, grandTotal.
- **SPEC-017.AC6** [backend]: External pricing service queried for material costs and labor rates based on trade type and zip code. Results provided to AI as context for pricing suggestions.
- **SPEC-017.AC7** [backend]: Estimate record created in `estimates` table with status: "draft", version: 1, and the generated line items
- **SPEC-017.AC8** [backend]: When seeded from a voicemail (SPEC-014), the voicemail transcript is used as input instead of live microphone recording. Same AI pipeline.
- **SPEC-017.AC9** [backend]: When seeded from an inbound SMS (SPEC-012), the SMS text is used as input. Same AI pipeline.
- **SPEC-017.AC10** [native]: After generation, estimate preview screen shown immediately (flows into SPEC-018 for review and refinement)
- **SPEC-017.AC11** [native]: Loading state shown during transcription and AI processing: "Generating your estimate..."
- **SPEC-017.AC12** [native]: Error handling: STT failure, AI failure, network error — each with clear retry option
- **SPEC-017.AC13** [backend]: All external calls go through provider interfaces (SPEC-003)
- **SPEC-017.AC14** [backend]: Audit log entry for estimate creation
- **SPEC-017.AC15** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should the contractor be able to see the raw transcript before the AI generates the estimate, or just go straight to the estimate preview?
- What is the maximum recording length? Long recordings increase STT cost and AI processing time.
- How should the pricing service fallback work when the external provider is unavailable or doesn't have data for a specific item?

## Technical Notes

- Audio recording: use `expo-av` for recording on React Native. Compress audio (e.g., AAC) to reduce upload size and STT cost.
- Deepgram pre-recorded API accepts audio uploads. Enable `detect_language: true` and set `model: "nova-2"` for best accuracy.
- Claude prompt for estimate generation should include: trade type, zip code, transcript, pricing data from external service, and instructions to output valid JSON matching the estimate line item schema.
- The pricing service provider (SPEC-003) may return empty results until the specific service is integrated. In that case, Claude uses its training knowledge as a fallback for pricing suggestions.
- The estimate is linked to a job (which is linked to a contact). If no job exists yet, one should be auto-created in "lead" status.
- Voicemail-seeded and SMS-seeded estimates skip the audio recording step — the text input is already available.
