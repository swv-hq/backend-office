---
id: SPEC-028
title: App Settings
status: draft
priority: P1
phase: 7
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-028: App Settings

## Problem Statement

After onboarding, contractors need a place to manage their account: update profile info, reconnect services, change their trade, manage notifications, and view billing. Settings should be simple and organized — not a sprawling menu of options.

## Affected Users

| User Role  | Impact                                                                     |
| ---------- | -------------------------------------------------------------------------- |
| Contractor | Can manage their account, update preferences, and troubleshoot connections |

## Desired Outcome

A clean settings screen organized into logical sections. Each setting is accessible with minimal taps. Changes are saved automatically where possible.

## Acceptance Criteria

- **SPEC-028.AC1** [native]: Settings screen accessible from the main navigation
- **SPEC-028.AC2** [native]: Profile section: edit first name, last name, business name, logo, zip code
- **SPEC-028.AC3** [native]: Trade section: change trade type (handyman / plumber / electrician). Theme updates immediately on change.
- **SPEC-028.AC4** [native]: Phone section: view current Twilio number, option to change forwarding settings (Path B from SPEC-009), test forwarding
- **SPEC-028.AC5** [native]: Calendar section: view connected calendar provider, disconnect/reconnect, switch between Google/Apple/in-app
- **SPEC-028.AC6** [native]: Payments section: view Stripe account status, view subscription plan and billing history, option to switch from Express to Standard (links to Stripe dashboard)
- **SPEC-028.AC7** [native]: Notifications section: toggle push notifications on/off (per notification type if granular, or master toggle for MVP)
- **SPEC-028.AC8** [native]: Privacy section: link to privacy policy, "Delete My Account" button (flows into SPEC-027)
- **SPEC-028.AC9** [native]: About section: app version, terms of service link, support contact
- **SPEC-028.AC10** [native]: Logout button
- **SPEC-028.AC11** [backend]: Profile update mutation with input validation and ownership verification
- **SPEC-028.AC12** [backend]: Audit log entries for profile changes and service reconnections
- **SPEC-028.AC13** [backend, native]: All code passes typecheck and lint

## Open Questions

- Should there be an "Auto-reply settings" section to customize the missed-call SMS template?
- Should callback reminder frequency be configurable here?
- Should there be a "Help / Contact Support" option with in-app chat or email?

## Technical Notes

- Settings screen: use a grouped list layout (similar to iOS Settings app). Each section is a header + list of rows.
- Trade type change triggers theme context update immediately (SPEC-005). Also updates the contractor profile in Convex.
- Calendar reconnection: disconnect the current provider, then re-run the appropriate OAuth/EventKit flow.
- Stripe account management: for most actions, link out to the Stripe Express Dashboard or the full Stripe Dashboard (Standard accounts) using `expo-web-browser`.
- Subscription billing history: query Stripe API for the contractor's invoices and display them in-app.
