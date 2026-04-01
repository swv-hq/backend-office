

**BACK-END OFFICE**

*The Back Office That Fits in Your Pocket*

Business Plan & Product Strategy

March 2026

**CONFIDENTIAL**

# **Table of Contents**

# **Executive Summary**

Back-End Office is a mobile-first application designed to eliminate the administrative burden that solo and small-crew tradespeople face every day. Handymen, plumbers, and electricians are exceptional at their craft but lose hours each evening to paperwork, missed calls, invoicing, and estimates. Back-End Office puts an intelligent back office in their pocket so they can focus on doing the work and living their lives.

The product will launch as trade-specific branded experiences: Handyman’s Back-End, Plumber’s Back-End, and Electrician’s Back-End. Each version speaks the language of the trade while sharing the same core platform underneath.

**Core philosophy:** If a feature adds work to the contractor’s day, it doesn’t ship. Every interaction should save time, not create tasks.

# **The Problem**

Solo tradespeople and small crews face a set of problems that compound throughout the day:

* **Missed calls \= lost revenue.** When a potential customer calls and doesn’t get an answer, they call the next contractor. There is no second chance.

* **Estimates look unprofessional or never get sent.** Many handymen give verbal estimates because writing them up takes too long. Plumbers and electricians are somewhat better, but still waste significant time on this step.

* **Invoicing happens at 9pm.** Instead of spending time with family, contractors sit at the kitchen table typing up invoices from handwritten notes.

* **No idea what they actually earned.** After materials, drive time, phone time, and shopping, most contractors have no idea whether a job was profitable.

* **Tech-averse audience.** Many existing solutions (ServiceTitan, Housecall Pro, FieldPulse) are designed for larger operations with office staff. Solo operators find them overwhelming, expensive, and hard to set up.

Back-End Office is purpose-built for the one-truck operator who has a phone and nothing else.

# **Target Customer**

The primary user is a solo operator or very small crew (1–3 people) in the handyman, plumbing, or electrical trade. Key characteristics:

* Works 6–12 jobs per week across residential and light commercial

* Has a smartphone but may not be highly tech-literate

* May not be a native English speaker

* Does not have office staff, a bookkeeper, or a dispatcher

* Currently manages leads, scheduling, and invoicing via text messages, handwritten notes, or memory

* Will abandon any tool that takes more than 10 minutes to set up or adds work to their day

# **Product Overview**

## **Design Principles**

| Principle | What It Means |
| :---- | :---- |
| **Mobile-Only (P1)** | Phone is the only device that matters for v1. Desktop is P2/P3. |
| **10-Minute Onboarding** | If setup takes longer than 10 minutes, we’ve lost the customer. |
| **Zero Extra Work** | Every feature must save time, never add it. If it creates a task, it doesn’t ship. |
| **Hands-Free First** | These guys are driving and working with their hands. Voice input is the primary interaction model. |
| **Don’t Sound Like a Robot** | Everything customer-facing must feel human and personal. If it sounds like AI, customers move on. |

## **Branding Strategy**

The product is branded as Back-End Office with trade-specific sub-brands that make each user feel the app was built specifically for them:

* **Handyman’s Back-End**

* **Plumber’s Back-End**

* **Electrician’s Back-End**

All versions share the same core codebase. The trade-specific branding extends to onboarding language, suggested pricing databases, and terminology used throughout the app.

# **Core Features (P1 — MVP)**

## **Feature 1: Smart Missed-Call Response**

When the contractor misses a call, the app automatically sends the caller a personalized text message and/or voicemail. The message is warm, human, and specific:

*“Hey, I saw that you called. Sorry I wasn’t able to answer — I’m in the middle of a job. I’ll call you back as soon as I’m free. Looking forward to talking to you.”*

Key details: The auto-response is vague on timing to accommodate unpredictable schedules. The voicemail version uses the contractor’s own cloned voice (recorded during onboarding) so it sounds like them, not a robot. The text version is personalized with the contractor’s name and business.

## **Feature 2: Voicemail Intelligence**

When a caller leaves a voicemail, the app transcribes it and generates a brief summary: who called, what they need, and any urgency indicators. When the contractor is ready to call back, they see a clean card that says something like: “John Smith — leaky kitchen faucet, available afternoons.” No need to listen to the voicemail.

## **Feature 3: Smart Callback Reminders**

The app detects when the contractor is back in their truck (using GPS/motion sensors) and sends a reminder to return missed calls. The reminder includes the caller summary so they can call back prepared, hands-free, while driving.

## **Feature 4: Live Call Assistant**

When the contractor calls the customer back, the app listens to the call (with appropriate legal disclosure). During the conversation, the app: identifies when the customer is trying to schedule an appointment, shows the contractor their available time slots, and once a time is agreed upon, automatically adds the appointment to the contractor’s calendar. The contractor never has to pull over, open a calendar, or write anything down.

*Legal note: Call recording/monitoring laws vary by state (one-party vs. two-party consent). A brief automated disclosure at the start of calls will be required in two-party consent states. Legal counsel should review before launch.*

## **Feature 5: Voice-to-Estimate**

At the job site, the contractor walks around with the customer and talks into their phone describing what they see: “Leaky faucet in the kitchen, need to replace the valve and the supply lines, probably about two hours of work plus parts.”

The app takes this rough voice input — even if it’s in broken English or mixed language — and transforms it into a clean, professional-looking estimate with line items for labor and materials. Multi-language support (especially Spanish) is a priority.

Market rate suggestions: The app suggests pricing based on the type of work and the contractor’s zip code. The contractor can accept the suggestion, adjust it, or enter their own price. This helps contractors who don’t know what to charge price their work competitively.

## **Feature 6: Instant Estimate Delivery & Approval**

Once the estimate looks good, the contractor taps send. The customer receives the estimate via text and email simultaneously. The customer can approve or decline directly from the message. The approval status flows back into the app in real time.

## **Feature 7: Voice-to-Invoice & Payment**

When the job is done, the contractor tells the app: “Job’s finished, no changes” and the invoice is generated matching the original estimate. If there were changes, they describe them verbally and the app adjusts. The invoice is sent to the customer via text and email with a payment link. The customer taps the link, enters their card, and pays — powered by Stripe or Square integration.

## **Feature 8: Calendar Sync**

The app syncs with the contractor’s existing calendar (Google Calendar, Apple Calendar) rather than requiring them to learn a new system. During onboarding, one tap connects it. This respects the 10-minute rule and zero learning curve principle.

# **Future Features (P2/P3)**

| Priority | Feature | Description |
| :---- | :---- | :---- |
| P2 | Receipt Scanning | Snap photos of receipts; app extracts amounts and tags them to the relevant job. |
| P2 | Expense Import | Connect a credit card or Home Depot/supply house account; automatically import purchases and tag to jobs. |
| P2 | Job Profitability Report | Show how much the contractor actually made on each job after factoring in materials, drive time, phone time, and shopping time. |
| P3 | Time Tracking | Start/stop job timer for contractors who bill hourly. |
| P3 | Desktop Version | Web-based dashboard for end-of-week review, reporting, and tax prep. |
| P3 | Customer Database / CRM | Searchable history of all customers, jobs, estimates, and invoices. |

# **Onboarding Flow**

The entire onboarding must be completable in under 10 minutes. Target: 5 minutes. Each step is one screen with minimal input:

1. Your name

2. Business name

3. Phone number

4. Trade type (Handyman / Plumber / Electrician)

5. Connect your calendar (Google / Apple — one tap)

6. Record your voice (read a short script so the app can clone your voice for voicemails)

7. Set up payment account (Stripe/Square connect — links to their existing account or creates one)

After onboarding, the app is fully functional. No tutorials, no feature tours. It just works.

# **Business Model**

## **Revenue Streams**

**Monthly subscription:** Recurring fee auto-deducted from the contractor’s connected payment account. No invoices, no manual payments. The contractor barely notices it. Pricing TBD but should be positioned well below competitors like Housecall Pro ($65+/mo) and ServiceTitan (enterprise pricing). Target range: $19–$39/month.

**Transaction fees (potential):** Small percentage on payments processed through the app, on top of Stripe/Square’s standard fees. This creates revenue that scales with the contractor’s success.

## **Key Advantage: Auto-Pay Subscription**

The subscription is automatically deducted from the contractor’s payment account. They never receive an invoice and never have to take action to pay. This dramatically reduces churn from forgotten payments and removes friction from the billing process.

# **Competitive Landscape**

The field service management space has several established players, but they all target larger operations:

| Competitor | Target | Pricing | Our Advantage |
| :---- | :---- | :---- | :---- |
| ServiceTitan | Mid-to-large contractors with office staff | Enterprise pricing, requires demo | Too complex and expensive for solo operators |
| Housecall Pro | Small-to-mid contractors | $65+/month | Still requires significant setup; not voice-first |
| FieldPulse | Small crews | $99+/month | Feature-heavy; overwhelming for solo operators |
| Invoice Fly | Freelancers | Free/low-cost | Invoicing only; no missed-call response, voice-to-estimate, or AI features |

**Back-End Office’s differentiation:** Voice-first design, AI-powered automation, 10-minute setup, priced for the little guy, and smart missed-call response that literally pays for itself on the first saved lead.

# **Marketing Strategy**

Budget: $0. All marketing will be organic and community-driven until revenue justifies paid acquisition.

## **Channel 1: Facebook Groups (Highest Priority)**

Tradespeople live in Facebook groups. Groups like “Handyman Tips & Tricks,” “Solo Plumber Life,” and local contractor communities are where these guys ask questions, share war stories, and recommend tools. The founders will join these groups, become genuinely helpful members, and introduce Back-End Office when it naturally fits the conversation.

This is the most targeted, highest-trust channel available for $0.

## **Channel 2: TikTok & Instagram Reels**

Short-form video content showing the pain point and the solution. Example: a 30-second video of a contractor sitting at the kitchen table at 9pm doing paperwork, then showing how Back-End Office eliminates that. TikTok’s algorithm is interest-based, not follower-based, so even a brand-new account can reach the right audience immediately. Authenticity beats polish — shaky iPhone footage is fine.

## **Channel 3: Referral Program**

Tradespeople all know each other. A simple referral program: give a contractor a free month for every person they refer who signs up. Word-of-mouth is the most trusted form of marketing in this space, and a referral program turns organic buzz into a systematic growth engine.

## **Additional Free Tactics**

* YouTube Shorts showing before/after comparisons of a day with vs. without Back-End Office

* Google Business Profile for local discoverability once the landing page is live

* Micro-influencer partnerships with trade TikTokers (under 10K followers) — offer free access in exchange for honest reviews

* Founder’s construction background as content credibility — someone who’s been in the trades talking to people in the trades

## **Conversion Funnel**

All marketing channels point to one simple landing page with: a 60-second demo video, a “Sign Up in 10 Minutes” call to action, and a direct link to the app store. One link. One action. No friction.

# **Launch Strategy**

The goal is to get to proof of concept as fast as possible. Ship the MVP, get it in the hands of 10–20 real contractors, learn what works and what doesn’t, and iterate.

8. Build the MVP with the core P1 features listed above

9. Recruit 10–20 beta testers from personal network and Facebook groups

10. Offer free access during beta in exchange for feedback

11. Iterate based on real usage — what features do they actually use? What’s confusing?

12. Soft launch on app stores with organic marketing push

# **Open Questions**

The following items need decisions before or during development:

| \# | Question | Notes |
| :---- | :---- | :---- |
| 1 | Voicemail auto-reply: text only, or text \+ cloned voice? | Cloned voice is a differentiator but adds complexity. Could start with text-only and add voice in a fast follow. |
| 2 | Call monitoring legal requirements by state | Need legal counsel. Two-party consent states require disclosure. Could use a brief automated message. |
| 3 | Subscription pricing | Target range $19–$39/month. Need to validate with beta users. |
| 4 | Transaction fee on payments | Additional revenue stream, but could deter price-sensitive users. Test during beta. |
| 5 | Multi-language support for voice input | Spanish is highest priority. How many languages for v1? |
| 6 | iOS-first or iOS \+ Android simultaneously? | React Native or Flutter could enable both. Depends on Brian’s preference and speed to market. |

