**BACK-END OFFICE**

Engineering Spec for Brian

**This doc tells you exactly what to build.**

Each section has the what, the why (one sentence), and your action items.

No business strategy. No marketing fluff. Just the build.

March 2026 — v1.0

# **Architecture Decisions**

Make these choices first. Everything else depends on them.

| Decision                                 | Recommendation                                                                                                                                                            |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Framework**                            | React Native or Flutter. Either works. Pick whichever you’re faster in. Cross-platform is mandatory — iOS \+ Android from day one.                                        |
| **Backend**                              | Supabase or Firebase. Both give you auth, DB, storage, and push notifications out of the box. Supabase if you want Postgres; Firebase if you want faster prototyping.     |
| **Voice-to-Text (real-time)**            | Whisper API (OpenAI) or Deepgram. Need high accuracy on rough English and Spanish. Deepgram has better real-time streaming.                                               |
| **AI Processing (estimates, summaries)** | Claude API (Anthropic). Use for: voicemail summarization, voice-to-estimate generation, voice-to-invoice adjustments, market rate suggestions.                            |
| **Voice Cloning**                        | ElvenLabs API. Contractor records \~30 seconds during onboarding. API generates voicemails in their voice. Can defer to P1.5 if needed — start with text-only auto-reply. |
| **Payments**                             | Stripe Connect. Handles contractor payouts, customer payments, and your subscription fee auto-deduction all in one integration.                                           |
| **Calendar Sync**                        | Google Calendar API \+ Apple EventKit. Sync to their existing calendar. Don’t build your own calendar UI for v1.                                                          |
| **Telephony / SMS**                      | Twilio. Handles auto-reply SMS, voicemail detection, call recording, and the legal disclosure announcement.                                                               |

# **Onboarding Flow**

Must be completable in under 10 minutes. Target 5\. One screen per step. Big buttons, minimal text input.

| Step | Screen          | Input                                     | Tech Notes                                                                             |
| :--- | :-------------- | :---------------------------------------- | :------------------------------------------------------------------------------------- |
| 1    | Your Name       | First name, last name                     | Text fields. Auto-capitalize.                                                          |
| 2    | Business Name   | Business name (optional logo upload)      | Text field \+ image picker. Logo goes on estimates/invoices.                           |
| 3    | Phone Number    | Their business phone number               | Twilio number provisioning. This becomes the number the app monitors for missed calls. |
| 4    | Trade Type      | Tap one: Handyman / Plumber / Electrician | Determines branding, default price book, and terminology throughout the app.           |
| 5    | Calendar        | Tap to connect Google or Apple Calendar   | OAuth for Google. EventKit for Apple. Read+write access.                               |
| 6    | Voice Recording | Read a 3-sentence script aloud            | Record audio, send to ElevenLabs to create voice clone. Can be skipped and done later. |
| 7    | Payment Setup   | Connect Stripe account                    | Stripe Connect onboarding flow (hosted). Creates their merchant account.               |

**Action items:**

- Build a 7-screen onboarding wizard with a progress bar at the top

- Each screen: one question, one input, one “Next” button

- Skip button on voice recording (can do it later from settings)

- Time yourself going through it — if it takes you more than 3 minutes as a dev, it’s too slow for the user

# **Feature 1: Smart Missed-Call Response**

_Why: Every missed call is a lost job. This saves them money without them lifting a finger._

## **How It Works**

1. Incoming call detected on their Twilio number

2. Call goes unanswered (rings to voicemail or is declined)

3. Within 30 seconds, app sends an SMS to the caller from the contractor’s number

4. If voice clone is set up, also send a voicemail callback in the contractor’s voice

5. New lead is created in the app’s contact database with the caller’s number and timestamp

## **SMS Template**

_“Hi\! This is \[contractor name\] from \[business name\]. I saw you called — sorry I couldn’t pick up, I’m on a job right now. I’ll get back to you as soon as I’m free. Looking forward to connecting\!”_

Keep it vague on timing. Don’t promise “30 minutes” because their day is unpredictable.

**Action items:**

- Set up Twilio webhook for missed calls on the contractor’s provisioned number

- Build SMS auto-reply with template variables: {contractor_name}, {business_name}

- Integrate ElevenLabs API for voice clone voicemail generation (can defer to v1.5)

- Auto-create a lead/contact record for every missed call with: phone number, timestamp, voicemail transcript (if left)

- If caller leaves voicemail: transcribe with Whisper/Deepgram, then pass to Claude API to generate a 1-sentence summary (who \+ what they need)

# **Feature 2: Smart Callback Reminders**

_Why: Contractors forget to call back. This reminds them when they’re actually able to do it._

## **How It Works**

6. App monitors GPS \+ accelerometer in background

7. Detects “in vehicle” state (sustained motion at driving speed)

8. If there are pending callbacks, push notification: “You have 2 people to call back. Tap to see who.”

9. Notification card shows: caller name (if available) \+ 1-sentence summary of what they need

**Action items:**

- Implement background location \+ motion detection (iOS: Core Motion \+ Core Location; Android: Activity Recognition API)

- Build a “pending callbacks” queue in the local database

- Push notification with expandable card showing caller info and voicemail summary

- Tapping the notification opens the dialer with the number pre-filled

- Battery optimization: use geofencing or significant location changes, not continuous GPS

# **Feature 3: Live Call Assistant**

_Why: The contractor can schedule appointments hands-free while driving instead of pulling over to write in a book._

## **How It Works**

10. Contractor initiates a call from the app (or app detects outgoing call to a known lead)

11. Brief legal disclosure plays: “This call may be assisted by scheduling technology.”

12. App streams audio to Deepgram for real-time transcription

13. Claude API monitors transcript for scheduling intent (“How about Thursday?”, “Are you free next week?”)

14. When scheduling detected: app pulls contractor’s calendar availability and shows available slots on screen

15. When time is confirmed in the conversation, app auto-creates calendar event with customer name, address (if mentioned), and job description

**Action items:**

- Route calls through Twilio so you can tap into the audio stream server-side

- Set up Deepgram streaming transcription on the audio

- Build a lightweight Claude API integration that watches the transcript for scheduling keywords/intent

- When triggered: query the calendar API for available slots in the discussed timeframe

- Display available times as an overlay on the call screen (contractor glances at it)

- On confirmation: create calendar event via Google Calendar API / EventKit

- LEGAL: Add configurable call disclosure message. Research two-party consent states before launch. Flag this as needing a lawyer’s review.

# **Feature 4: Voice-to-Estimate**

_Why: This is the killer feature. A handyman who barely speaks English gets the same professional estimate that a company with office staff would send._

## **How It Works**

16. Contractor taps “New Estimate” and talks into phone

17. Speech-to-text via Whisper/Deepgram (must handle broken English, Spanish, accents)

18. Transcript sent to Claude API with prompt: “Convert this contractor’s verbal description into a professional estimate with line items for labor and materials. Trade type: \[plumber/electrician/handyman\]. Zip code: \[zip\].”

19. Claude returns structured JSON: line items with descriptions, quantities, and suggested prices based on trade \+ location

20. App renders a clean estimate preview. Contractor can adjust any line or price by tapping on it.

21. Contractor taps “Send” → estimate goes to customer via SMS \+ email

## **Market Rate Suggestions**

When Claude generates the estimate, it should suggest pricing based on typical rates for that type of work in the contractor’s zip code. Use a combination of pre-built pricing data and Claude’s training knowledge. The contractor sees the suggestion and can accept, adjust, or override.

**Action items:**

- Build a “New Estimate” screen with a big microphone button (think voice memo UX)

- Integrate Whisper/Deepgram for speech-to-text with multi-language support (English \+ Spanish minimum)

- Design the Claude API prompt for estimate generation — output must be structured JSON with: description, quantity, unit, unit_price, total per line item

- Build an estimate preview screen: line items in a clean list, each tappable to edit

- Total auto-calculates. Include labor subtotal and materials subtotal.

- Build a pricing suggestion database seeded with common jobs per trade \+ average rates by region (can start with Claude-generated seed data)

- “Send” button triggers SMS (via Twilio) \+ email to the customer

- Customer receives a link to a web-hosted version of the estimate with “Approve” / “Decline” buttons

- Approval/decline status syncs back to the app in real time via webhook or push notification

# **Feature 5: Voice-to-Invoice & Payment**

_Why: The contractor closes out the job before they leave the site. No more 9pm paperwork._

## **How It Works**

22. Contractor opens the job and taps “Complete Job”

23. Two options: “No changes” (invoice matches estimate exactly) or “Describe changes” (talk into phone)

24. If changes: speech-to-text \+ Claude adjusts the estimate line items accordingly

25. Invoice preview shown. Contractor taps “Send Invoice.”

26. Customer receives SMS \+ email with invoice and a “Pay Now” button

27. Customer pays via Stripe checkout. Money goes to contractor’s connected Stripe account.

**Action items:**

- Build “Complete Job” flow branching into “No changes” (auto-generate invoice from estimate) or “Describe changes” (voice input)

- Reuse the same Whisper/Deepgram \+ Claude pipeline from estimates, but with a “modify existing estimate” prompt

- Generate a customer-facing invoice web page with Stripe Checkout embedded

- Handle payment webhooks: mark invoice as paid, notify contractor via push notification

- Stripe Connect: configure so your subscription fee is auto-deducted from the contractor’s Stripe balance each month — no separate billing needed

# **Feature 6: Calendar Sync**

_Why: Don’t make them learn a new calendar. Plug into what they already use._

**Action items:**

- Google Calendar: OAuth 2.0 flow during onboarding. Read \+ write scopes.

- Apple Calendar: EventKit framework. Request calendar access permission.

- All appointments created by the Live Call Assistant (Feature 3\) write to the synced calendar

- When checking availability for scheduling, read from the synced calendar

- Two-way sync: if the contractor adds something directly to their calendar, the app knows about it

# **Suggested Build Order**

Ship fast. Here’s the order that gets you to a usable product the fastest, with each step building on the last.

| Phase | What to Build                                           | Why This Order                                                                                                                                                |
| :---- | :------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1** | Project scaffolding \+ onboarding                       | Get the app installable and the user through setup. Nothing works without this.                                                                               |
| **2** | Twilio integration \+ missed call auto-reply (SMS only) | The simplest feature with the most immediate value. Contractor installs the app, sets up their number, and is already saving missed leads.                    |
| **3** | Voicemail transcription \+ summary                      | Builds on the Twilio integration. Adds Whisper/Deepgram. Now the contractor sees who called and why.                                                          |
| **4** | Calendar sync \+ callback reminders                     | Now the contractor gets nudged to call back when they’re in the truck. Requires GPS/motion detection.                                                         |
| **5** | Voice-to-estimate \+ delivery \+ approval               | The big feature. Requires Whisper/Deepgram \+ Claude API \+ customer-facing web pages. Most complex, but the previous phases give you all the infrastructure. |
| **6** | Voice-to-invoice \+ Stripe payments                     | Reuses the estimate pipeline. Adds Stripe Connect for payments and subscription billing.                                                                      |
| **7** | Live call assistant                                     | The most complex feature. Save for last. Requires real-time transcription \+ Claude \+ calendar integration all working together during a live call.          |

# **Core Data Model**

Minimum tables/collections you need. Keep it simple — you can always add fields later.

| Entity         | Key Fields                                                                                                 | Notes                                                                                           |
| :------------- | :--------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **Contractor** | id, name, business_name, phone, trade_type, zip_code, stripe_account_id, calendar_provider, voice_clone_id | One record per user. Created during onboarding.                                                 |
| **Contact**    | id, contractor_id, phone, name, email, source, created_at                                                  | Auto-created from missed calls. Updated as info is gathered.                                    |
| **Job**        | id, contractor_id, contact_id, status, description, scheduled_at, completed_at                             | Status: lead → estimated → approved → in_progress → completed → paid                            |
| **Estimate**   | id, job_id, line_items (JSON), total, status, sent_at, approved_at                                         | Line items: \[{description, qty, unit_price, total}\]. Status: draft → sent → approved/declined |
| **Invoice**    | id, job_id, estimate_id, line_items (JSON), total, status, paid_at, stripe_payment_id                      | Generated from estimate. Status: draft → sent → paid                                            |
| **CallLog**    | id, contractor_id, contact_id, direction, voicemail_url, transcript, summary, callback_status              | Every call in/out. Callback status: pending → reminded → completed                              |

# **API Integration Summary**

Every external service you’ll need, what it does, and what to sign up for.

| Service             | Used For                                                                                                           | Key Endpoint                                 | Pricing Model               |
| :------------------ | :----------------------------------------------------------------------------------------------------------------- | :------------------------------------------- | :-------------------------- |
| **Twilio**          | Phone number provisioning, SMS auto-reply, voicemail recording, call routing                                       | Programmable Voice \+ Messaging APIs         | Pay per use                 |
| **Deepgram**        | Real-time speech-to-text for call assistant; batch transcription for voicemails                                    | Streaming \+ pre-recorded transcription APIs | Pay per audio minute        |
| **Claude API**      | Voicemail summarization, voice-to-estimate, voice-to-invoice, scheduling intent detection, market rate suggestions | /v1/messages                                 | Pay per token               |
| **ElevenLabs**      | Voice cloning for personalized voicemails                                                                          | Voice Clone \+ Text-to-Speech APIs           | Pay per character           |
| **Stripe Connect**  | Customer payments, contractor payouts, subscription auto-deduction                                                 | Connect Accounts \+ Checkout \+ Billing      | 2.9% \+ 30¢ per transaction |
| **Google Calendar** | Read/write calendar events                                                                                         | Calendar API v3                              | Free                        |

# **Decisions You Need to Make**

These are things only you can decide based on what you’re fastest with. Pick one and move.

| Decision                         | Options                                                                                                                                                                         |
| :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **React Native vs Flutter?**     | Whichever you ship faster in. Both work. Don’t overthink this.                                                                                                                  |
| **Supabase vs Firebase?**        | Supabase \= Postgres \+ Row Level Security. Firebase \= faster prototyping \+ better mobile SDKs. Pick based on what you know.                                                  |
| **Whisper vs Deepgram for STT?** | Deepgram has better streaming (important for live call assistant). Whisper is great for batch (voicemails). Could use both.                                                     |
| **Voice clone at launch?**       | Can ship v1 with text-only auto-reply and add voice clone in a fast follow. Reduces launch complexity.                                                                          |
| **Phone number strategy?**       | Does each contractor get a Twilio number, or do you intercept calls on their existing number? Twilio number is simpler technically but means customers call a different number. |
| **Monorepo or separate repos?**  | Up to you. Monorepo is usually simpler for a 1-person team.                                                                                                                     |

**That’s the build. Questions? Ask Claude.**
