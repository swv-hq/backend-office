---
id: BO-SPEC-012
title: Missed Call Detection & SMS Auto-Reply
status: draft
priority: P0
phase: 2
created: 2026-04-01
updated: 2026-04-01
---

# BO-SPEC-012: Missed Call Detection & SMS Auto-Reply

## Problem Statement

Every missed call is a potential lost job. When a contractor is on a job site and can't answer, the caller moves on to the next contractor. An automatic SMS response within seconds of a missed call keeps the lead warm and shows professionalism — without the contractor lifting a finger.

## Affected Users

| User Role  | Impact                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------- |
| Contractor | Saves missed leads automatically; never loses a job because they couldn't pick up the phone |
| Customer   | Gets immediate acknowledgment that their call was received, reducing frustration            |

## Desired Outcome

When a call to the contractor's Twilio number goes unanswered, the app automatically sends a personalized SMS to the caller within 30 seconds. A new contact/lead is created in the app. If the caller sends a text message describing their needs, the app captures it and can seed a draft estimate.

## Acceptance Criteria

- **BO-SPEC-012.AC1** [backend]: Twilio webhook receives incoming call events on the contractor's provisioned number
- **BO-SPEC-012.AC2** [backend]: Missed call detected when call goes to voicemail or is not answered within configurable ring time (default: 20 seconds)
- **BO-SPEC-012.AC3** [backend]: SMS auto-reply sent to the caller within 30 seconds of the missed call via Twilio
- **BO-SPEC-012.AC4** [backend]: SMS template uses contractor's name and business name: "Hi! This is {firstName} from {businessName}. I saw you called — sorry I couldn't pick up, I'm on a job right now. I'll get back to you as soon as I'm free. Looking forward to connecting!"
- **BO-SPEC-012.AC5** [backend]: Auto-reply is not sent if the caller is already a known contact who called within the last 24 hours (prevent spam to repeat callers)
- **BO-SPEC-012.AC6** [backend]: New contact record auto-created in `contacts` table with: phone number, source: "missed_call", timestamp
- **BO-SPEC-012.AC7** [backend]: New call log record created in `callLogs` table with: direction: inbound, status: missed, callerPhone, timestamp
- **BO-SPEC-012.AC8** [backend]: Inbound SMS messages from contacts are captured and stored — if the message describes work needed, AI generates a draft estimate seed (links to BO-SPEC-017)
- **BO-SPEC-012.AC9** [native]: Contractor receives a push notification for each missed call: "{callerPhone} called — auto-reply sent"
- **BO-SPEC-012.AC10** [native]: Missed calls appear in a "Recent Calls" list with caller phone, timestamp, and auto-reply status
- **BO-SPEC-012.AC11** [backend]: All Twilio interactions go through the telephony provider interface (BO-SPEC-003)
- **BO-SPEC-012.AC12** [backend]: Audit log entry created for each auto-reply sent
- **BO-SPEC-012.AC13** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should the SMS template be customizable by the contractor, or fixed for MVP?
- Should the auto-reply be toggleable (e.g., contractor wants to turn it off on weekends)?
- How should we handle blocked/spam numbers? Twilio has caller lookup APIs.

## Technical Notes

- Twilio uses TwiML (XML) to define call handling behavior. Configure the number's voice webhook to play a voicemail greeting and record if unanswered.
- The missed call webhook flow: Twilio calls your HTTP endpoint -> check if answered -> if not answered after ring timeout, trigger the SMS action.
- Twilio's Messaging API sends the auto-reply SMS. Use the contractor's Twilio number as the sender so the customer can reply to it.
- Inbound SMS to the Twilio number hits a separate webhook. Store the message and, if it describes work, pass it to the AI provider for draft estimate seeding.
- Rate limit auto-replies per caller to prevent abuse.
