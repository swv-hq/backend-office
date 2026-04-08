# Auth Hub — Requirements

Captures the architectural and structural decisions made for the "Silent Auth Hub" project. Companion to `ARCHITECTURE.md` (the original spec) and `COMPLIANCE.md` (the security/legal floor).

## 1. Purpose & Scope

Build a multi-tenant centralized identity provider ("Auth Hub") that serves authentication for several small-business client apps (web + mobile) built and operated by a single agency. The Hub is internal infrastructure, not a product sold to third parties.

The Auth Hub lives inside the **agency monorepo** (previously named `backend-office`, now renamed and repurposed to host multiple client projects). **`backend-office` is the agency's flagship product and will be the Auth Hub's first real client.** Building the Hub and migrating backend-office onto it happens in the same repository, which means every Hub feature is dogfooded against a real production consumer from day one.

- **Hub domain:** `auth.youragency.com`
- **Clients:** multiple small businesses, each with a web app and (optionally) a native mobile app. The first client is **backend-office** (the existing product). Additional client businesses are added as new `apps/*` + `packages/*-backend` pairs.
- **Model:** Multi-tenant centralized IdP with proxy-based secure sessions (BFF pattern for web, PKCE + system browser for mobile).

### Supported authentication methods

The Hub must support all of the following out of the box. Tenants opt in to the subset they want via `allowedMethods` in their `tenants` row.

1. **Email + password** — Argon2id hashing via BetterAuth. Password reset via email link.
2. **Email OTP** — one-time code delivered via transactional email. Passwordless login and/or step-up.
3. **SMS / Text OTP** — one-time code delivered via SMS (Twilio or equivalent). Passwordless login and/or step-up.
4. **Social login** — at minimum Google and Apple on day one; extensible to GitHub, Microsoft, Facebook as tenants require.
5. **Multi-Factor Authentication (MFA)** — TOTP authenticator apps and SMS/email second factor via BetterAuth's Two-Factor plugin. Tenants may require MFA, make it optional, or disable it.

## 2. Repository Structure — Monorepo

The project is an **npm workspaces + Turborepo monorepo** (inherited from the existing `backend-office` tooling setup, which already has Turbo, Husky, lint-staged, Prettier, Renovate, an E2E harness, and spec-coverage scripts wired up). Rationale:

- Shared JWT claim shapes, cookie names, and tenant schema must stay in lockstep across the Hub and every client.
- Atomic refactors across Hub + clients in a single PR.
- Fast client-app bootstrapping: adding client #50 = new folder in `apps/` + tenant row in Convex.
- Web + React Native can share typed contracts.

### Layout

```
agency-monorepo/                     # renamed from backend-office
├── apps/
│   ├── auth-hub/                    # NEW — Next.js, auth.youragency.com
│   │   ├── convex/                  # Hub's OWN DB (tenants, memberships, refresh_tokens, BetterAuth)
│   │   └── app/
│   ├── backend-office-web/          # renamed from apps/web (existing product)
│   └── backend-office-native/       # renamed from apps/native (existing product)
│   # Future clients: additional apps/<business>-web and apps/<business>-native folders
├── packages/
│   ├── backend-office-backend/      # renamed from packages/backend — existing Convex
│   │   ├── convex/                  # Shared backend-office DB
│   │   └── src/index.ts             # re-exports generated api + Doc/Id types
│   ├── auth-contracts/              # NEW — JWT claim types, cookie names, tenant schema
│   ├── auth-client/                 # NEW — client glue for verifying Hub JWTs
│   │   ├── web/                     # HttpOnly cookie proxy, Next.js middleware
│   │   └── native/                  # expo-secure-store + bearer token helpers
│   ├── convex-helpers/              # NEW — requireAuth() etc. imported into each convex/ folder
│   └── ui-branding/                 # NEW — shared themable login/UI components
├── docs/
├── e2e/
├── scripts/
└── turbo.json
```

> **Naming note:** `agency-monorepo` is a placeholder — pick the final repo name (e.g. the agency's brand). The repo is being renamed from `backend-office` because it now hosts multiple projects, with backend-office becoming one app among several.

### Extraction hedge

Even inside the monorepo, the Hub is treated as if it might one day be extracted:

- Client apps **never** import from `apps/auth-hub` directly. They depend only on `packages/auth-client` and `packages/auth-contracts`.
- The Hub communicates with clients only over HTTP (proxy + JWKS endpoint).
- Separate env files and deploy pipelines per app.
- Extraction path = `git filter-repo`, not rewrite.

## 3. Convex Deployment Model

**Rule: deployment boundary = one `convex/` folder = one database.**

- **Auth Hub** has its own `convex/` at `apps/auth-hub/convex/`. It is the **only** place `tenants`, `memberships`, and `refresh_tokens` live. Client apps never touch these tables.
- **Single-app business backends** can live inside the app (`apps/foo/convex/`).
- **Shared backends (web + mobile for the same business)** are promoted to `packages/<business>-backend/convex/`. Web and mobile apps both import from the package and both point their Convex client at the same `CONVEX_URL`.

### Sharing generated types

```ts
// packages/backend-office-backend/src/index.ts
export { api } from "../convex/_generated/api";
export type { Doc, Id } from "../convex/_generated/dataModel";
```

Frontends:

```ts
import { api } from "@yourorg/backend-office-backend";
useQuery(api.orders.list);
```

Renaming a Convex function breaks both web and mobile at compile time — intended.

### Env vars

Each app has its own `.env.local` / `.env`. Web and mobile apps that share a backend set the **same** `CONVEX_URL` value.

## 4. Auth Hub Surface Area

The Hub itself is **web-only**. There is no native Auth Hub app, ever.

### Rationale

- The Hub's only UI is the login page (branded OTP/social/MFA).
- RFC 8252 mandates native apps use the **system browser** (`ASWebAuthenticationSession` on iOS, Custom Tabs on Android), not embedded webviews or a separate native auth app. This gives SSO, passkeys, biometric autofill, and App Store compliance for free.
- One login UI to maintain.

### Hub must support

1. **PKCE** on `/authorize` and `/token` — for _all_ clients, web and mobile.
2. **Custom URI scheme redirect URIs** per tenant (e.g. `backendoffice://auth/callback`), registered in Convex alongside web origins.
3. **Exact-match redirect URI validation.** No wildcards, no prefix matches.
4. **State parameter** on every auth request (CSRF).
5. **Nonce** in ID tokens, validated client-side.
6. **Bearer-token mode** on `/refresh` and `/userinfo` in addition to cookie mode. Web clients use HttpOnly cookies via backend proxy; mobile clients send `Authorization: Bearer <refresh_token>` and receive JSON. Mode is selected by `Accept` header or `client_type` param.
7. **Responsive login page** — mobile users see it in a system-browser sheet.
8. **Tenant branding:** `/login?tenant=slug` fetches `brandingConfig` from Convex (colors, logo) and renders a 100% matched UI.
9. **JWKS endpoint** at `/.well-known/jwks.json` for public key distribution and rotation.

## 5. Token & Session Strategy

### JWT

- **Algorithm:** RS256. Private key stored in Convex environment variables. Public key distributed via JWKS endpoint.
- **Access token:** 15 min, contains `sub`, `tenantId`, `aud` (= tenant), roles.
- **Refresh token:** 30 days, database-backed (`refresh_tokens` table) for instant revocation, **rotated on every use**, stored **hashed** (never plaintext).
- **Clock skew tolerance:** 60s.
- **Key rotation:** overlapping keys supported via JWKS; rotate ≥ annually.

### Web clients (BFF pattern)

- Client backend (e.g. `backend-office.com`) runs a proxy route `/api/auth/[...path]` that forwards to the Hub. Because the browser thinks it's talking to the client domain, cookies are set first-party on that domain — no third-party cookie problems.
- Two HttpOnly, Secure, SameSite=None cookies on the **client domain**: `at` (15 min) and `rt` (30 days).
- Client middleware verifies `at` locally using the Hub's public key (JWKS). Zero-latency auth checks, no network call to Hub on hot paths.
- On `at` expiry, middleware silently proxies `/refresh` to the Hub, Hub validates hashed `rt`, rotates it, returns a new `at`. Transparent to the user.
- **Tenant Guard:** middleware rejects requests whose JWT `aud`/`tenantId` doesn't match the current client's tenant.

### Mobile clients

- Login flow: `expo-auth-session` opens `ASWebAuthenticationSession` / Custom Tab → Hub PKCE login → redirect to the app's registered scheme (e.g. `backendoffice://auth/callback?code=...`) → app exchanges code for tokens at Hub's `/token` endpoint.
- **Refresh token** stored in `expo-secure-store` (Keychain/Keystore). Never in AsyncStorage, never in JS memory longer than needed.
- **Access token** sent as `Authorization: Bearer` on Convex and backend calls.
- Silent refresh: app exchanges refresh token for new access token before expiry.

## 6. Data Schema (Hub Convex)

- **`tenants`** — `slug`, `brandingConfig` (colors, logo, fonts), `allowedMethods` (email OTP, SMS, social providers, MFA requirements), `allowedRedirectUris` (web origins + custom schemes), `allowedOrigins`.
- **`memberships`** — `userId` + `tenantId` + `role`. A user may belong to multiple tenants.
- **`refresh_tokens`** — hashed token, `userId`, `tenantId`, `issuedAt`, `expiresAt`, `revokedAt`, device/client metadata. Enables instant revocation and session listing.
- **`audit_log`** — see Compliance.
- **BetterAuth tables** — managed by BetterAuth's Organization, Two-Factor, and RBAC plugins (roles, permissions, role assignments).

## 7. Implementation Roadmap

### Phase 0 — Monorepo Reshape

- Rename the repo from `backend-office` to the final agency name (`agency-monorepo` placeholder).
- Rename `apps/web` → `apps/backend-office-web`, `apps/native` → `apps/backend-office-native`, `packages/backend` → `packages/backend-office-backend`. Update all imports, Turbo pipelines, and deploy configs.
- Resolve any double-`convex/` ambiguity — each Convex deployment must map to exactly one folder.
- Commit. The existing backend-office product must continue to build, test, and deploy unchanged after this phase.

### Phase 1 — Identity Core

- Scaffold `apps/auth-hub` (Next.js) with its own `convex/` folder.
- Install `@convex-dev/better-auth` + `better-auth`; register the component in `apps/auth-hub/convex/convex.config.ts`.
- Implement `tenants`, `memberships`, `refresh_tokens`, `audit_log`.
- Configure BetterAuth with **Organization**, **Two-Factor**, **Admin (RBAC)**, **Email OTP**, **Phone Number (SMS OTP)**, and social provider plugins.
- Generate RS256 key pair; store private key in Convex env vars; publish JWKS.

### Phase 2 — Universal Login UI

- `layout.tsx` fetches branding from Convex via `?tenant=slug`.
- Login methods: Email + password, Email OTP, SMS OTP, Social, MFA challenge.
- Implement OAuth/OIDC endpoints: `/authorize`, `/token`, `/userinfo`, `/.well-known/jwks.json`, `/.well-known/openid-configuration`, `/logout`, `/revoke`.
- PKCE, state, nonce, exact redirect URI validation.
- Rate limiting + brute-force protection on all auth endpoints.

### Phase 3 — Client Starter Kit

- `packages/auth-contracts` — JWT claim types, cookie names, tenant types.
- `packages/auth-client/web` — Next.js middleware (JWT verify via `jose` + JWKS cache), proxy route (`/api/auth/[...path]`), tenant guard.
- `packages/auth-client/native` — `expo-auth-session` helpers, secure-store wrapper, bearer token interceptor.
- `packages/convex-helpers` — `requireAuth()` wrapper for client-app Convex functions that verifies the Hub JWT and extracts `tenantId`.

### Phase 4 — Migrate backend-office onto the Hub

- Register `backend-office` as the first tenant in Hub Convex with branding + allowed redirect URIs (web origins + `backendoffice://auth/callback`).
- Wire `apps/backend-office-web` to `packages/auth-client/web` (BFF proxy + middleware). Run it side-by-side with the existing auth behind a feature flag.
- Wire `apps/backend-office-native` to `packages/auth-client/native`.
- Update `packages/backend-office-backend/convex/` functions to use `packages/convex-helpers` `requireAuth()` and validate `aud === "backend-office"`.
- End-to-end smoke test of login, silent refresh, logout, revocation, MFA enrollment, RBAC enforcement.
- Flip the feature flag; remove the legacy auth path.

### Phase 5 — Second Tenant

- Add a second client business as a new `apps/<business>-web` (+ optional mobile + backend package) to validate the cross-tenant isolation tests required by §8.

## 8. Cross-Cutting Invariants

These are good hygiene regardless of whether the Hub ever goes public. Treat them as non-negotiable from day one.

### Tenant isolation as a hard boundary

`tenantId` is a first-class boundary everywhere in the Hub, not just a filter convention:

- Every Convex query and mutation in the Hub filters by `tenantId`. No function reads or writes rows without an explicit tenant scope (or an explicit, audited "cross-tenant admin" path).
- Every log line, metric, and trace span carries `tenantId`.
- Every rate-limit bucket is keyed on `tenantId` (in addition to IP / user / endpoint), so one tenant's traffic or abuse cannot exhaust another tenant's budget.
- Every audit log entry is tenant-scoped and exportable per tenant.
- Tests include a "cross-tenant leakage" suite that asserts tenant A can never read or mutate tenant B's data via any endpoint.

### Append-only, tenant-scoped audit logs

The `audit_log` table is append-only from the start. No update or delete paths in normal code. Per-tenant export is a first-class query.

### Versioned OIDC contract

The Hub's public contract is versioned so future breaking changes have a migration path:

- JWTs include a `ver` claim (integer, starts at `1`).
- The OIDC discovery document (`/.well-known/openid-configuration`) is served under a versioned path or carries an explicit version field. Breaking changes bump the version; the previous version is kept live during a documented deprecation window.
- Client verification libraries (`packages/auth-client`) check `ver` and fail closed on unknown versions.

## 9. Non-Goals

- **No native Auth Hub app.**
- **No Auth Hub as a public SaaS product.** Internal infrastructure only.
- **No shared business tables across tenants.** Each business has its own backend deployment.
- **No third-party cookie reliance.** Cookies are always first-party to the client domain via BFF proxy.
- **No HIPAA tenants** until explicit compliance uplift.
- **No PCI scope** — payments are offloaded to Stripe/Square.
