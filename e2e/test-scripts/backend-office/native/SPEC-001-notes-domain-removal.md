# BO-SPEC-001: Notes Domain Removal — Native E2E Test Script

## Prerequisites

- Expo dev server running (`cd apps/backend-office-native && npx expo start --dev-client`)
- iOS Simulator or physical device with dev client installed
- Clerk authentication configured

---

## Test 1: Authenticated user sees HomeScreen placeholder [BO-SPEC-001.AC8] [BO-SPEC-001.AC11]

**Instructions:**

1. Launch the app in the simulator
2. Sign in with Google or Apple OAuth

**Expected Result:**

- After sign-in, user lands on a HomeScreen placeholder
- Screen displays a welcome message with user's first name
- Screen displays "Back-End Office" subtitle
- A "Log out" button is visible

## Test 2: Unauthenticated user sees login [BO-SPEC-001.AC11]

**Instructions:**

1. Launch the app in the simulator (or log out if already signed in)

**Expected Result:**

- Login screen appears with Google and Apple sign-in buttons
- No references to "notes" anywhere on screen

## Test 3: No notes screens accessible [BO-SPEC-001.AC7]

**Instructions:**

1. Sign in to the app
2. Verify there is no way to navigate to notes-related screens

**Expected Result:**

- No notes dashboard, create note, or note detail screens exist
- Navigation only shows HomeScreen after authentication

## Test 4: Logout works from HomeScreen [BO-SPEC-001.AC8]

**Instructions:**

1. Sign in to the app
2. Tap "Log out" button on HomeScreen
3. On iOS: confirm via action sheet

**Expected Result:**

- User is signed out and returned to the LoginScreen

## Test 5: Typecheck passes [BO-SPEC-001.AC9]

**Instructions:**

1. Run `cd apps/backend-office-native && npm run typecheck`

**Expected Result:**

- Command exits with code 0, no type errors

## Test 6: Lint passes [BO-SPEC-001.AC10]

**Instructions:**

1. Run `cd apps/backend-office-native && npm run lint` (if lint script exists)

**Expected Result:**

- Command exits with code 0, no lint errors (or skip if no lint script configured)

---

## AC Coverage Matrix

| AC               | Tests          |
| ---------------- | -------------- |
| BO-SPEC-001.AC7  | Test 3         |
| BO-SPEC-001.AC8  | Test 1, Test 4 |
| BO-SPEC-001.AC9  | Test 5         |
| BO-SPEC-001.AC10 | Test 6         |
| BO-SPEC-001.AC11 | Test 1, Test 2 |
