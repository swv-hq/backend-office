---
id: SPEC-009
title: Phone Number Setup
status: draft
priority: P0
phase: 1
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-009: Phone Number Setup

## Problem Statement

The app's core telephony features (missed call detection, SMS auto-reply, voicemail recording) require calls to flow through Twilio. Contractors need either a new Twilio-provisioned business number or call forwarding from their existing number to a Twilio number. Both paths must be supported to avoid losing contractors who already have an established business number.

## Affected Users

| User Role  | Impact                                                               |
| ---------- | -------------------------------------------------------------------- |
| Contractor | Gets a business phone number that the app can monitor and respond to |

## Desired Outcome

During onboarding (step 4), the contractor chooses one of two paths. Both result in a Twilio number that the app monitors for incoming calls. The setup is fast and the contractor understands what they're getting.

## Acceptance Criteria

- **SPEC-009.AC1** [native]: Two clear options presented: "Get a new business number" and "Use my existing number"
- **SPEC-009.AC2** [native]: Path A — New number: contractor selects area code preference, app provisions a Twilio number in that area code
- **SPEC-009.AC3** [backend]: Path A — Twilio API called to provision a local phone number with voice and SMS capabilities
- **SPEC-009.AC4** [backend]: Path A — Provisioned number stored on contractor profile (`twilioPhoneNumber`)
- **SPEC-009.AC5** [native]: Path A — Contractor sees their new number displayed with a brief explanation: "This is your new business line. Share it with customers — the app manages it for you."
- **SPEC-009.AC6** [native]: Path B — Existing number: contractor enters their current business phone number
- **SPEC-009.AC7** [backend]: Path B — Twilio number provisioned behind the scenes (contractor doesn't see it directly)
- **SPEC-009.AC8** [native]: Path B — Step-by-step guided instructions for setting up call forwarding from their carrier to the Twilio number (carrier-specific instructions for major US carriers: AT&T, Verizon, T-Mobile)
- **SPEC-009.AC9** [native]: Path B — "Test my forwarding" button that initiates a test call to verify forwarding is working
- **SPEC-009.AC10** [backend]: Path B — `forwardingConfigured` flag set to true after successful test
- **SPEC-009.AC11** [backend]: Twilio webhooks configured on the provisioned number for: incoming call, voicemail, SMS received
- **SPEC-009.AC12** [native]: Error handling: Twilio provisioning failure shows a retry option with a clear error message
- **SPEC-009.AC13** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should we support number porting (transferring an existing number to Twilio) as a future option? This takes days to complete but gives the best experience.
- What area codes should be available for new number provisioning? Local to contractor's zip code?
- How do we handle the ~$1/month/number Twilio cost? Passed through to contractor or absorbed?

## Technical Notes

- Twilio's Phone Number API provisions numbers: `POST /2010-04-01/Accounts/{AccountSid}/IncomingPhoneNumbers`
- Use Twilio's AvailablePhoneNumbers API to search by area code before provisioning.
- Webhook URLs point to Convex HTTP endpoints that handle incoming calls, voicemail, and SMS events.
- Call forwarding setup varies by carrier. Common method: dial `*72` + forwarding number. Provide carrier-specific instructions for the top 3 US carriers.
- The test call for Path B can be a Twilio-initiated outbound call to the contractor's existing number that, when forwarded, hits the Twilio webhook and confirms the forwarding works.
- All Twilio interactions go through the telephony provider interface (SPEC-003).
