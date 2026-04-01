---
id: SPEC-014
title: Voicemail Transcription & Summarization
status: draft
priority: P0
phase: 3
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-014: Voicemail Transcription & Summarization

## Problem Statement

Contractors don't have time to listen to voicemails. They need to quickly see who called and what they need. Transcribing and summarizing voicemails with AI lets the contractor glance at a card and know exactly what the caller wants — ready to call back prepared.

## Affected Users

| User Role | Impact |
| --------- | ------ |
| Contractor | Sees caller intent at a glance without listening to voicemails |

## Desired Outcome

When a caller leaves a voicemail, it is automatically transcribed and summarized into an actionable card: "John Smith — leaky kitchen faucet, available afternoons." If the voicemail describes work, the system offers to auto-generate a draft estimate.

## Acceptance Criteria

- **SPEC-014.AC1** [backend]: When a voicemail recording is available (via Twilio webhook), the audio file URL is stored on the call log record
- **SPEC-014.AC2** [backend]: Voicemail audio is sent to the STT provider (Deepgram) for transcription. Full transcript stored on the call log.
- **SPEC-014.AC3** [backend]: Transcript is sent to the AI provider (Claude) for summarization. Summary includes: caller name (if stated), what they need, urgency level, availability (if mentioned). Summary stored on the call log.
- **SPEC-014.AC4** [backend]: If the voicemail describes specific work (e.g., "I need someone to fix my leaky faucet"), the AI flags it as estimate-eligible and a draft estimate can be auto-generated (linked to SPEC-017/018)
- **SPEC-014.AC5** [backend]: Contact record updated with caller's name and any other info extracted from the voicemail (if the contact was previously phone-number-only)
- **SPEC-014.AC6** [native]: Voicemail card displayed in the app showing: caller name/number, one-line AI summary, urgency indicator (if detected), timestamp
- **SPEC-014.AC7** [native]: Tapping the voicemail card shows: full summary, full transcript, option to play the original audio, and "Generate Estimate" button if the voicemail is estimate-eligible
- **SPEC-014.AC8** [native]: "Generate Estimate" button on an estimate-eligible voicemail creates a draft estimate pre-populated from the voicemail content (flows into SPEC-017/018)
- **SPEC-014.AC9** [native]: Voicemail cards update in real-time as transcription and summarization complete (Convex subscription)
- **SPEC-014.AC10** [native]: Audio playback of original voicemail within the app
- **SPEC-014.AC11** [native]: UI note on voicemail cards: "Audio recordings are retained for 90 days"
- **SPEC-014.AC12** [backend]: All external API calls go through provider interfaces (SPEC-003)
- **SPEC-014.AC13** [backend]: Audit log entry for voicemail processing events
- **SPEC-014.AC14** [backend, native]: All code passes typecheck and lint

## Open Questions

- What is the typical voicemail length and how does that affect Deepgram costs?
- Should the 90-day retention be enforced server-side now (scheduled function to delete old audio) or just messaged in the UI?
- Should the contractor be able to manually trigger re-transcription if the initial result is poor?

## Technical Notes

- Twilio stores voicemail recordings and provides a URL. The recording can be accessed via the Twilio API or downloaded and stored in Convex file storage.
- Deepgram's pre-recorded transcription API accepts audio URLs or file uploads. Use the `nova-2` model with language detection enabled (English + Spanish).
- Claude summarization prompt should be tuned to extract: caller identity, job description, urgency, availability, and contact info. Output should be structured JSON.
- The "Generate Estimate" flow takes the voicemail transcript and pipes it through the same voice-to-estimate pipeline as SPEC-017, but instead of live microphone input, it uses the voicemail transcript as the source.
- Audio playback on React Native: use `expo-av` to stream the voicemail audio URL.
- For cost control, consider storing the Deepgram transcript once and not re-processing unless explicitly requested.
