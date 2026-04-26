---
id: BO-SPEC-003
title: Provider Abstraction Layer
status: implemented
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-25
---

# BO-SPEC-003: Provider Abstraction Layer

## Problem Statement

The app integrates with multiple external services (AI, speech-to-text, telephony, payments, pricing). If these integrations are tightly coupled to specific vendors, switching providers later requires rewriting business logic. A provider abstraction layer decouples business logic from vendor-specific implementations.

## Affected Users

| User Role | Impact                                                            |
| --------- | ----------------------------------------------------------------- |
| Developer | Can swap vendors without rewriting features; cleaner architecture |

## Desired Outcome

Each external integration category has a TypeScript interface defining the contract. Concrete implementations wrap specific vendors. Business logic calls the interface, never the vendor SDK directly. Switching providers means writing a new implementation, not changing calling code.

## Acceptance Criteria

- **BO-SPEC-003.AC1** [backend]: AI provider interface defined with methods for: summarize text, generate estimate from transcript, adjust estimate from voice input, analyze customer reply, parse contact from voice input
- **BO-SPEC-003.AC2** [backend]: STT (speech-to-text) provider interface defined with methods for: transcribe audio file (batch), transcribe audio stream (for future streaming use)
- **BO-SPEC-003.AC3** [backend]: Telephony provider interface defined with methods for: provision phone number, configure call forwarding, send SMS, get voicemail recording URL, initiate outbound call
- **BO-SPEC-003.AC4** [backend]: Payments provider interface defined with methods for: create connect account (express), link connect account (standard), create checkout session, handle payment webhook, create subscription, charge subscription
- **BO-SPEC-003.AC5** [backend]: Pricing data provider interface defined with methods for: get material prices by trade and zip, get labor rates by trade and zip
- **BO-SPEC-003.AC6** [backend]: Claude API implementation of AI provider interface created
- **BO-SPEC-003.AC7** [backend]: Deepgram implementation of STT provider interface created
- **BO-SPEC-003.AC8** [backend]: Twilio implementation of telephony provider interface created
- **BO-SPEC-003.AC9** [backend]: Stripe implementation of payments provider interface created
- **BO-SPEC-003.AC10** [backend]: Provider factory or registry that returns the configured implementation for each interface
- **BO-SPEC-003.AC11** [backend]: No Convex action or mutation imports a vendor SDK directly — all external calls go through the provider layer
- **BO-SPEC-003.AC12** [backend]: Backend passes typecheck with zero errors

## Resolved Decisions

- **Pricing provider:** Define the interface and ship a stub implementation returning empty/null. Claude's AI provider serves as the fallback for pricing suggestions using training knowledge until an external pricing vendor is selected.
- **Provider configuration:** Environment variables (read via `process.env` in the registry), set via `npx convex env set`. Same surface as vendor SDK API keys; no separate Convex config table.

## Technical Notes

- Interfaces live in a `providers/` directory within the Convex package (e.g., `convex/providers/ai.ts`, `convex/providers/stt.ts`).
- Concrete implementations live alongside (e.g., `convex/providers/claude.ts`, `convex/providers/deepgram.ts`).
- The factory/registry can start simple — a single file that exports the active implementation for each interface. No need for runtime DI containers.
- Convex actions are where external API calls happen. The provider implementations will be used within actions.

## Slice Plan

Each slice ships an interface + its concrete implementation + a registry entry, end-to-end testable via convex-test. Slice 1 establishes the pattern (registry scaffold, env-var wiring, test conventions); slices 2–5 follow the template.

1. **Slice 1: Registry scaffold + AI provider (Claude)** — `BO-SPEC-003.AC1`, `AC6`, partial `AC10`. Sets up `convex/providers/` directory, the registry pattern, env-var configuration, and the first interface + Claude implementation.
2. **Slice 2: STT provider (Deepgram)** — `BO-SPEC-003.AC2`, `AC7`. Adds STT interface and Deepgram impl to the registry.
3. **Slice 3: Telephony provider (Twilio)** — `BO-SPEC-003.AC3`, `AC8`. Adds telephony interface and Twilio impl.
4. **Slice 4: Payments provider (Stripe)** — `BO-SPEC-003.AC4`, `AC9`. Adds payments interface and Stripe Connect impl.
5. **Slice 5: Pricing provider (stub) + boundary guard** — `BO-SPEC-003.AC5`, completes `AC10`, `AC11`, `AC12`. Adds pricing interface with stub returning empty results. Adds a guard test that scans `convex/*.ts` and `convex/useCases/**` for direct vendor SDK imports. Final typecheck pass.
