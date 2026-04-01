# Product Roadmap

## Context

- [Business Plan](../BackEndOffice_BusinessPlan.md) — Product vision, target customer, design principles
- [Engineering Spec](../BackEndOffice_EngineeringSpec.md) — Technical architecture, feature details, data model

## Architecture Decisions

| Decision | Choice | Notes |
| -------- | ------ | ----- |
| Framework | React Native (Expo 55) | iOS-first launch, Android waitlist |
| Backend | Convex | Serverless DB + functions, real-time subscriptions, shared by web + native |
| Auth | Clerk | Google + Apple OAuth + SMS OTP |
| Speech-to-Text | Deepgram | Single vendor for batch (voicemails) and streaming (voice input). English + Spanish. |
| AI Processing | Claude API (Anthropic) | Behind provider abstraction. Voicemail summarization, estimate generation, invoice adjustments, customer reply insights. |
| Telephony / SMS | Twilio | Phone number provisioning, call forwarding, missed call detection, SMS auto-reply, voicemail recording. |
| Payments | Stripe Connect | Express + Standard account types. Customer payments, contractor payouts, subscription auto-deduction. |
| Calendar Sync | Google Calendar API + Apple EventKit | Plus in-app "Back-End Office Calendar" option for contractors without an external calendar. |
| Voice Cloning | ElevenLabs | Post-launch. Deferred from MVP. |
| Push Notifications | Expo Push Notifications | Wraps APNs (iOS) and FCM (Android). |
| Pricing Data | External service (TBD) + Claude knowledge | External pricing provider behind abstraction. Provider to be selected. |

## Cross-Cutting Requirements

- **Provider abstraction layer**: All external integrations (AI, STT, telephony, payments, pricing) sit behind swappable interfaces.
- **Audit logging**: All significant mutations logged with who, what, when.
- **Trade theming**: App adapts terminology, colors, and icons based on contractor's trade selection.
- **Mobile-first customer pages**: All customer-facing web routes (estimates, invoices) designed for phone screens.
- **Voice-first design**: Primary input method for all contractor data entry.
- **Security**: Input sanitization, auth checks on all endpoints, no PII in logs.
- **90-day audio retention messaging**: UI communicates retention policy; server-side filter enforced.

## Spec Status Key

```
draft → in-review → approved → in-progress → in-testing → implemented
```

---

## Phase 0: Foundation & Teardown

Clear the slate, set up the new architecture. Everything else builds on this.

| Spec | Title | Priority | Status |
| ---- | ----- | -------- | ------ |
| [SPEC-001](SPEC-001-notes-domain-removal.md) | Notes Domain Removal | P0 | draft |
| [SPEC-002](SPEC-002-core-data-model.md) | Core Data Model | P0 | draft |
| [SPEC-003](SPEC-003-provider-abstraction-layer.md) | Provider Abstraction Layer | P0 | draft |
| [SPEC-004](SPEC-004-audit-logging.md) | Audit Logging | P0 | draft |
| [SPEC-005](SPEC-005-trade-theming.md) | Trade Theming System | P0 | draft |
| [SPEC-006](SPEC-006-monitoring-alerting.md) | Monitoring & Alerting | P0 | draft |

## Phase 1: Onboarding

Get the contractor set up and ready in under 10 minutes. Nothing works without this.

| Spec | Title | Priority | Status |
| ---- | ----- | -------- | ------ |
| [SPEC-007](SPEC-007-sms-otp-auth.md) | SMS OTP Authentication | P0 | draft |
| [SPEC-008](SPEC-008-onboarding-wizard.md) | Onboarding Wizard | P0 | draft |
| [SPEC-009](SPEC-009-phone-number-setup.md) | Phone Number Setup | P0 | draft |
| [SPEC-010](SPEC-010-calendar-connection.md) | Calendar Connection | P0 | draft |
| [SPEC-011](SPEC-011-stripe-connect-onboarding.md) | Stripe Connect Onboarding | P0 | draft |

## Phase 2: Contacts & Missed Call Auto-Reply

The first feature with immediate value — saving missed leads.

| Spec | Title | Priority | Status |
| ---- | ----- | -------- | ------ |
| [SPEC-012](SPEC-012-missed-call-auto-reply.md) | Missed Call Detection & SMS Auto-Reply | P0 | draft |
| [SPEC-013](SPEC-013-contact-management.md) | Contact Management | P0 | draft |

## Phase 3: Voicemail Intelligence & Callback Reminders

Contractor sees who called, why, and gets reminded to call back.

| Spec | Title | Priority | Status |
| ---- | ----- | -------- | ------ |
| [SPEC-014](SPEC-014-voicemail-transcription.md) | Voicemail Transcription & Summarization | P0 | draft |
| [SPEC-015](SPEC-015-push-notifications.md) | Push Notification Infrastructure | P0 | draft |
| [SPEC-016](SPEC-016-callback-reminders.md) | Time-Based Callback Reminders | P0 | draft |

## Phase 4: Voice-to-Estimate

The killer feature. Contractor talks, customer gets a professional estimate.

| Spec | Title | Priority | Status |
| ---- | ----- | -------- | ------ |
| [SPEC-017](SPEC-017-voice-to-estimate.md) | Voice-to-Estimate Generation | P0 | draft |
| [SPEC-018](SPEC-018-estimate-management.md) | Estimate Management & Iterative Refinement | P0 | draft |
| [SPEC-019](SPEC-019-customer-estimate-experience.md) | Customer Estimate Experience | P0 | draft |

## Phase 5: Jobs, Invoicing & Payments

Close jobs, get paid, subscription billing.

| Spec | Title | Priority | Status |
| ---- | ----- | -------- | ------ |
| [SPEC-020](SPEC-020-job-lifecycle.md) | Job Lifecycle | P0 | draft |
| [SPEC-021](SPEC-021-voice-to-invoice.md) | Voice-to-Invoice | P0 | draft |
| [SPEC-022](SPEC-022-customer-payments.md) | Customer Payments | P0 | draft |
| [SPEC-023](SPEC-023-subscription-billing.md) | Subscription Billing | P0 | draft |

## Phase 6: Geofencing & Time Tracking

Smart location-aware features for job time tracking and callback reminders.

| Spec | Title | Priority | Status |
| ---- | ----- | -------- | ------ |
| [SPEC-024](SPEC-024-geofencing-infrastructure.md) | Geofencing Infrastructure | P1 | draft |
| [SPEC-025](SPEC-025-job-time-tracking.md) | Job Time Tracking | P1 | draft |
| [SPEC-026](SPEC-026-geofencing-callback-reminders.md) | Geofencing Callback Reminders | P1 | draft |

## Phase 7: Privacy, Compliance & Settings

Pre-launch polish. Ensure legal compliance and give contractors control over their account.

| Spec | Title | Priority | Status |
| ---- | ----- | -------- | ------ |
| [SPEC-027](SPEC-027-privacy-data-management.md) | Privacy & Data Management | P0 | draft |
| [SPEC-028](SPEC-028-app-settings.md) | App Settings | P1 | draft |

## Phase 8: Launch Prep

Get to market. Marketing site, app store listing, beta distribution.

| Spec | Title | Priority | Status |
| ---- | ----- | -------- | ------ |
| [SPEC-029](SPEC-029-marketing-site.md) | Marketing Site Rebrand | P1 | draft |
| [SPEC-030](SPEC-030-app-store-distribution.md) | App Store & Distribution | P0 | draft |

---

## Post-MVP Features

Features discussed during planning that are deferred to post-launch phases. No specs created yet — these are captured here so context is not lost.

### Voice Cloning (ElevenLabs)

Contractor records ~30 seconds of speech during onboarding. ElevenLabs creates a voice clone. When a missed call triggers, the app generates a voicemail callback in the contractor's own voice instead of just an SMS. Differentiator feature, but adds onboarding complexity and a vendor dependency. Deferred to reduce MVP scope. When implemented: add voice recording step to onboarding (skippable), integrate ElevenLabs API for clone creation and TTS generation, deliver voicemail via Twilio outbound call.

### Live Call Assistant

When the contractor calls a customer back, the app listens to the call in real-time. It detects scheduling intent ("How about Thursday?"), shows available calendar slots, and auto-creates a calendar event when a time is confirmed. The most complex feature — requires real-time Deepgram streaming + Claude intent detection + calendar integration all during a live call. **Blocked on legal review**: two-party consent states require automated disclosure at call start. Legal counsel must review before development begins.

### Android App

iOS launches first. Android waitlist/interest form on the marketing site to gauge demand. When demand warrants, ship Android build from the same React Native / Expo codebase. Minimal extra code expected, but requires device testing and Play Store submission process.

### Web Contractor Dashboard

Read-only web dashboard for end-of-week review: see all jobs, invoices, payments, and profitability at a glance. Useful for tax prep and bookkeeping. Not needed for MVP since all contractor activity happens on the phone.

### Offline Support

Record voice input locally and sync when connectivity returns. Currently the app requires connectivity for all AI-powered features (voice-to-estimate, voicemail transcription, etc.) because the contractor needs immediate feedback. Add offline queueing if field testing shows connectivity is a frequent pain point.

### Contractor History-Based Pricing

After a contractor has done several estimates, suggest prices based on what they've previously charged for similar work. Supplements the external pricing service and Claude's knowledge. Requires enough estimate history to be useful — natural post-launch feature.

### Seeded Pricing Database

Build and maintain a table of common jobs per trade with regional rate ranges. More accurate than Claude's training knowledge alone. Effort to source and maintain the data. Add if the external pricing service doesn't cover enough scenarios.

### Multi-Language App UI

Full bilingual app interface (English + Spanish). MVP voice input handles English, Spanish, and code-switching via Deepgram, but the app UI is English-only. Translate all screens, notifications, and generated documents if demand warrants.

### Receipt Scanning (P2)

Snap photos of material receipts at the job site. App extracts amounts via OCR and tags them to the relevant job. Feeds into job profitability calculations.

### Expense Import (P2)

Connect a credit card or supply house account (Home Depot, etc.). Automatically import purchases and tag them to jobs. Requires financial data integrations (Plaid or similar).

### Job Profitability Report (P2)

Show the contractor how much they actually made on each job after factoring in materials, drive time, phone time, and shopping time. Requires time tracking + expense data to be meaningful.

### Customer Database / CRM (P3)

Searchable history of all customers, jobs, estimates, and invoices. See a customer's full history at a glance. Natural evolution of the contact management feature.

### Desktop Version (P3)

Full web-based dashboard beyond read-only. Create estimates, manage jobs, handle invoicing from a desktop. For contractors who want to do end-of-week admin on a bigger screen.

### Stripe Express to Standard Conversion

Allow contractors on Express accounts to switch to a full Standard Stripe account from settings. Involves disconnecting the Express account and re-linking a new Standard account. Low demand expected but important for contractor autonomy.

### SOC 2 Compliant Change Management

Formalize the change management process to SOC 2 standards: branch protection on main (require PRs, require CI to pass), PR template with security/test/spec-linkage checklist, deployment logging, and documented rollback procedures. For a solo developer, compensating controls include automated CI checks as an "automated reviewer," a documented self-review checklist per PR, and post-deployment monitoring. Adopt disciplined use of GitHub features: every PR links to a SPEC or issue, commits tagged with spec IDs, no direct pushes to main. This is low-effort but requires consistency.

### SOC 2 Audit & Policy Documents

Formal SOC 2 Type II audit. The codebase is built to SOC 2 standards (audit logging, monitoring, access controls) but the formal audit ($20-50K+) and policy documentation (incident response plan, vendor risk assessment, security policies) are deferred until enterprise customers or partners require it.

### Usage Tier-Based Pricing

Two-tier pricing model aligned to contractor business maturity. **Starter tier**: core functionality with usage limits — designed for contractors just getting their business going who need affordable tools to start winning jobs. **Pro tier**: increased usage limits plus additional non-core features (TBD) — designed for established businesses with steady deal flow that need more capacity and advanced capabilities. Pricing tiers are enforced via usage tracking and gating in the backend, with clear upgrade prompts when a Starter contractor approaches their limits. Requires defining specific usage dimensions to meter (e.g., estimates per month, active jobs, contacts, voicemail minutes), setting tier thresholds, and building the upgrade/downgrade flow integrated with Stripe subscription billing (SPEC-023). Pro-only features to be determined based on post-launch usage patterns and customer feedback.

### GDPR Compliance

Full GDPR compliance including consent management, data portability, right to erasure, and DPO appointment. Only needed if the app expands to EU markets.
