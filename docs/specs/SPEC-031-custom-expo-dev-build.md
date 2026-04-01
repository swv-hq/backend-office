---
id: SPEC-031
title: Custom Expo Dev Build
status: draft
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-01
---

# SPEC-031: Custom Expo Dev Build

## Problem Statement

The app currently runs via Expo Go, which limits native module usage to whatever Expo Go ships. Features like `expo-secure-store`, custom native modules, and eventually push notifications and deep linking require native code that Expo Go doesn't include. Without a custom dev build, development is blocked on Expo's release cycle and module whitelist — we can't add arbitrary native dependencies or test the real app behavior on a device/simulator.

## Affected Users

| User Role | Impact |
| --------- | ------ |
| Developer | Unblocked to use any native module; faster iteration on native features |
| Beta tester | Dev builds can also serve as internal test builds via TestFlight |

## Desired Outcome

A custom Expo development client is configured and buildable locally (and optionally via EAS Build). The developer can install the custom dev build on the iOS simulator and a physical device, then iterate with `expo start --dev-client` just like Expo Go but with full native module support.

## Acceptance Criteria

- **SPEC-031.AC1** [native]: `expo-dev-client` package installed and configured in the native app
- **SPEC-031.AC2** [native]: `eas.json` created with at least `development` and `preview` build profiles for iOS
- **SPEC-031.AC3** [native]: `app.json` (or `app.config.ts`) updated with required fields: `ios.bundleIdentifier`, `slug`, and `name` reflecting "Back-End Office" branding
- **SPEC-031.AC4** [native]: Development build runs successfully on the iOS Simulator using `expo start --dev-client`
- **SPEC-031.AC5** [native]: Development build installable on a physical iOS device (via EAS Build or local `npx expo run:ios --device`)
- **SPEC-031.AC6** [native]: `expo-secure-store` and all existing native plugins function correctly in the custom dev build (verified manually)
- **SPEC-031.AC7** [native]: Dev scripts updated in `package.json`: `dev` command uses `--dev-client` flag
- **SPEC-031.AC8** [native, web]: All workspaces pass typecheck and lint with zero errors after changes

## Open Questions

- Should we use EAS Build (cloud) or local builds (`npx expo run:ios`) for day-to-day development? EAS Build is simpler but slower; local builds are faster but require Xcode setup.
- What `ios.bundleIdentifier` should we use? Suggestion: `com.backendoffice.app`
- Do we need an Android development profile now, or defer until Android work begins?

## Technical Notes

- Install `expo-dev-client` as a dependency. This replaces Expo Go with a custom development client that loads the same JS bundle but includes all native modules in the project.
- `eas.json` build profiles:
  - `development`: includes dev tools, internal distribution, simulator support (`"ios": { "simulator": true }`)
  - `preview`: ad-hoc distribution for physical device testing
- The `app.json` still has the old "NotesContract" naming — this spec should update it to "Back-End Office" (or "BackEndOffice" for the slug).
- EAS Build requires an Expo account and Apple Developer credentials (for device builds). Simulator builds don't need Apple credentials.
- After creating the dev build, the `expo start` command should use `--dev-client` instead of connecting to Expo Go.
- This is a prerequisite for SPEC-030 (App Store & Distribution) since EAS Build configuration established here is extended for production builds.

## Manual Test Scripts

<!-- Web: N/A — native only -->
<!-- Native: e2e/test-scripts/native/SPEC-031-custom-expo-dev-build.md -->
