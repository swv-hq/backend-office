---
id: BO-SPEC-031
title: Custom Expo Dev Build
status: implemented
priority: P0
phase: 0
created: 2026-04-01
updated: 2026-04-01
---

# BO-SPEC-031: Custom Expo Dev Build

## Problem Statement

The app currently runs via Expo Go, which limits native module usage to whatever Expo Go ships. Features like `expo-secure-store`, custom native modules, and eventually push notifications and deep linking require native code that Expo Go doesn't include. Without a custom dev build, development is blocked on Expo's release cycle and module whitelist — we can't add arbitrary native dependencies or test the real app behavior on a device/simulator.

## Affected Users

| User Role   | Impact                                                                  |
| ----------- | ----------------------------------------------------------------------- |
| Developer   | Unblocked to use any native module; faster iteration on native features |
| Beta tester | Dev builds can also serve as internal test builds via TestFlight        |

## Desired Outcome

A custom Expo development client is configured and buildable locally (and optionally via EAS Build). The developer can install the custom dev build on the iOS simulator and a physical device, then iterate with `expo start --dev-client` just like Expo Go but with full native module support.

## Acceptance Criteria

- **BO-SPEC-031.AC1** [native]: `expo-dev-client` package installed and configured in the native app
- **BO-SPEC-031.AC2** [native]: `eas.json` created with at least `development` and `preview` build profiles for iOS
- **BO-SPEC-031.AC3** [native]: `app.json` (or `app.config.ts`) updated with required fields: `ios.bundleIdentifier`, `slug`, and `name` reflecting "Back-End Office" branding
- **BO-SPEC-031.AC4** [native]: Development build runs successfully on the iOS Simulator using `expo start --dev-client`
- **BO-SPEC-031.AC5** [native]: Development build installable on a physical iOS device (via EAS Build or local `npx expo run:ios --device`)
- **BO-SPEC-031.AC6** [native]: `expo-secure-store` and all existing native plugins function correctly in the custom dev build (verified manually)
- **BO-SPEC-031.AC7** [native]: Dev scripts updated in `package.json`: `dev` command uses `--dev-client` flag
- **BO-SPEC-031.AC8** [native, web]: All workspaces pass typecheck and lint with zero errors after changes

## Decisions

- **Local vs cloud builds**: Local builds (`npx expo run:ios`) for day-to-day development (faster feedback loop). EAS Build for `preview` profile builds distributed via TestFlight to beta testers.
- **Bundle identifier**: `com.backendoffice.app`. Can be changed with minimal effort any time before App Store submission (Phase 8). After App Store submission, a new bundle ID means a new app listing.
- **Android**: Deferred. Android development profile will be added to `eas.json` when Android work begins (post-MVP). iOS-only for now.

## Technical Notes

### Current State

- `app.json` uses old "NotesContract" naming for `name` and `slug` — needs to be updated to "Back-End Office" branding
- `ios.bundleIdentifier` is missing from `app.json` — required for dev builds
- No `eas.json` exists yet
- `expo-secure-store` and `expo-font` are already configured as plugins
- `package.json` `dev` script currently runs `expo start` (Expo Go) — needs `--dev-client` flag

### Implementation

1. **Install `expo-dev-client`** as a dependency. This replaces Expo Go with a custom development client that loads the same JS bundle but includes all native modules in the project.
2. **Update `app.json`**:
   - `name`: "Back-End Office"
   - `slug`: "backend-office"
   - `ios.bundleIdentifier`: "com.backendoffice.app"
   - Keep existing `scheme`, plugins, splash, and icon config
3. **Create `eas.json`** with iOS-only build profiles:
   - `development`: includes dev tools, internal distribution, simulator support (`"ios": { "simulator": true }`)
   - `preview`: ad-hoc distribution for physical device testing via TestFlight
4. **Update `package.json` scripts**: `dev` command uses `--dev-client` flag
5. **Local build workflow**: `npx expo run:ios` for simulator builds (no Apple credentials needed). `eas build --profile preview --platform ios` for physical device builds (requires Apple Developer credentials).

### Prerequisites

- Xcode installed with iOS Simulator
- Expo account (free) for EAS CLI
- Apple Developer account (for physical device builds only, not needed for simulator)

### Dependencies

- This is a prerequisite for BO-SPEC-030 (App Store & Distribution) since EAS Build configuration established here is extended for production builds.

## Manual Test Scripts

<!-- Web: N/A — native only -->
<!-- Native: e2e/test-scripts/backend-office/native/BO-SPEC-031-custom-expo-dev-build.md -->
