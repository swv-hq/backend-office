# SPEC-031: Custom Expo Dev Build — Native E2E Test Script

## Prerequisites

- Xcode installed with iOS Simulator
- Expo account (for EAS CLI)
- Apple Developer account (for physical device builds only)

---

## Test 1: Simulator Build [SPEC-031.AC4]

**Prerequisites:**

- Xcode installed with iOS Simulator
- Xcode Command Line Tools installed (`xcode-select --install`)
- CocoaPods installed (`pod --version` to verify)
- No backend or dev server needed

**Instructions:**

1. Open a terminal in `apps/backend-office-native/`
2. Run `npx expo run:ios`
3. Wait for the native build to complete (first build takes 5-15 minutes; subsequent builds are faster)
4. Observe the iOS Simulator launching

**Expected Result:**

- Build completes without errors
- App launches in the iOS Simulator with the name "Back-End Office"
- Dev client toolbar is visible at the bottom of the screen
- Dev menu is accessible via Cmd+D or shake gesture

---

## Test 2: Dev Server with Dev Client [SPEC-031.AC4] [SPEC-031.AC7]

**Prerequisites:**

- Development build installed on simulator (complete Test 1 first)
- No backend needed for this test (app may show a connection error screen, which is expected)

**Instructions:**

1. Open a terminal in `apps/backend-office-native/`
2. Run `npm run dev`
3. Observe the Expo CLI output
4. Open the dev build app on the simulator

**Expected Result:**

- Expo CLI starts and shows "Using development build" (not "Using Expo Go")
- The `--dev-client` flag is visible in the startup output
- The dev build on the simulator connects to the dev server
- Hot reload works when editing a source file

---

## Test 3: Physical Device Build [SPEC-031.AC5]

**Prerequisites:**

- Expo account logged in (`eas login`)
- Apple Developer account with an active membership
- Physical iOS device registered in your Apple Developer portal
- No backend needed for this test

**Instructions:**

1. Open a terminal in `apps/backend-office-native/`
2. Run `eas build --profile preview --platform ios`
3. Follow prompts for Apple Developer credentials (signing certificates, provisioning profiles)
4. Wait for the cloud build to complete (typically 10-20 minutes)
5. Install the resulting build on a physical iOS device via the provided link or QR code

**Expected Result:**

- EAS Build completes successfully
- Build is installable on a registered physical iOS device
- App launches and displays "Back-End Office" branding

---

## Test 4: Native Plugin Verification [SPEC-031.AC6]

**Prerequisites:**

- Development build running on simulator or device (complete Test 1 or Test 3 first)
- Dev server running (`npm run dev` in `apps/backend-office-native/`)
- **Convex backend running** (`cd packages/backend-office-backend && npx convex dev`)
- `.env.local` configured with valid `EXPO_PUBLIC_CONVEX_URL` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Network connectivity (Clerk auth requires internet)

**Instructions:**

1. Start the Convex dev server: `cd packages/backend-office-backend && npx convex dev`
2. Start the Expo dev server: `cd apps/backend-office-native && npm run dev`
3. Launch the dev build on the simulator or physical device
4. Navigate to the sign-in screen
5. Attempt to sign in with Clerk (which uses `expo-secure-store` for token storage)
6. If already signed in, sign out and sign back in

**Expected Result:**

- No "Module not found" or native module errors appear
- `expo-secure-store` operations succeed (Clerk auth tokens are stored and retrieved)
- `expo-font` loaded fonts render correctly throughout the app
- No red screen errors related to native modules

---

## Test 5: Cross-Workspace Typecheck and Lint [SPEC-031.AC8]

**Prerequisites:**

- No backend or dev server needed
- Node.js and npm installed

**Instructions:**

1. Open a terminal at the monorepo root
2. Run `npx turbo run typecheck --filter=@backend-office/native --filter=@backend-office/backend-office-backend`
3. Run `npx turbo run lint --filter=@backend-office/native`

**Expected Result:**

- Typecheck passes with zero errors for @backend-office/native and backend
- Lint passes with zero errors for @backend-office/native

---

## AC Coverage Matrix

| AC ID        | Test(s)                | Platform    |
| ------------ | ---------------------- | ----------- |
| SPEC-031.AC1 | Automated test         | native      |
| SPEC-031.AC2 | Automated test         | native      |
| SPEC-031.AC3 | Automated test         | native      |
| SPEC-031.AC4 | Test 1, Test 2         | native      |
| SPEC-031.AC5 | Test 3                 | native      |
| SPEC-031.AC6 | Test 4                 | native      |
| SPEC-031.AC7 | Test 2, Automated test | native      |
| SPEC-031.AC8 | Test 5                 | native, web |
