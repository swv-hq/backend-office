---
id: SPEC-029
title: Marketing Site Rebrand
status: draft
priority: P1
phase: 8
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-029: Marketing Site Rebrand

## Problem Statement

The web app has a generic marketing homepage from the starter template. Before launch, it needs to be rebranded for Back-End Office with compelling copy, product visuals, and a clear call-to-action that drives app downloads.

## Affected Users

| User Role | Impact |
| --------- | ------ |
| Prospective customer | First impression of the product; determines whether they download the app |

## Desired Outcome

A single-page marketing site that communicates what Back-End Office does, who it's for, and why it's different — in under 60 seconds. One clear CTA: download the app. All marketing channels (Facebook groups, TikTok, referrals) point here.

## Acceptance Criteria

- **SPEC-029.AC1** [web]: Hero section: headline communicating the core value prop ("The back office that fits in your pocket"), subheadline targeting the solo tradesperson, prominent "Download on the App Store" button
- **SPEC-029.AC2** [web]: Problem section: 3-4 pain points that resonate with the target customer (missed calls, 9pm invoicing, unprofessional estimates, no idea what they earned)
- **SPEC-029.AC3** [web]: Features section: visual overview of key features with trade-relevant imagery (voice-to-estimate, auto missed-call reply, instant invoicing, get paid on the spot)
- **SPEC-029.AC4** [web]: Social proof section: testimonials from beta testers (or placeholder structure for them)
- **SPEC-029.AC5** [web]: Pricing section: simple pricing card with monthly rate, introductory offer, and what's included
- **SPEC-029.AC6** [web]: Footer: links to privacy policy, terms, support contact
- **SPEC-029.AC7** [web]: Android interest form: "Coming soon to Android" with email capture for waitlist
- **SPEC-029.AC8** [web]: Mobile-first responsive design — site looks great on phones since much of the traffic will come from social media links on mobile
- **SPEC-029.AC9** [web]: SEO basics: proper meta tags, Open Graph tags for social sharing, descriptive page title
- **SPEC-029.AC10** [web]: Demo video placeholder: section for a product demo video (can be populated later). YouTube or native video embed.
- **SPEC-029.AC11** [web]: Trade-specific messaging: content speaks to handymen, plumbers, and electricians — not generic "contractors"
- **SPEC-029.AC12** [web]: All code passes typecheck and lint

## Open Questions

- Do we have product screenshots or mockups ready for the features section?
- Should there be separate landing pages per trade (handyman.backendoffice.com, plumber.backendoffice.com)?
- Do we have a logo/brand identity finalized?

## Technical Notes

- Rebrand the existing Next.js marketing page components (Hero, Benefits, Testimonials, Footer). Reuse the component structure, replace the content.
- The App Store download button should link to the actual App Store listing (or TestFlight link during beta).
- Android waitlist: simple email capture form that stores submissions in Convex (a `waitlist` table with email, timestamp, platform: "android").
- SEO: use Next.js metadata API for page-level meta tags. Add structured data (JSON-LD) for the business.
- Open Graph tags: title, description, and image for link previews when shared on Facebook, Twitter, etc.
