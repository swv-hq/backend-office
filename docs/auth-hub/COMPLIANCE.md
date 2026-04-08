# Auth Hub — Compliance & Security Baseline

The minimum compliance posture for operating the Auth Hub as a multi-tenant IdP for small-business client apps. Companion to `REQUIREMENTS.md` and `ARCHITECTURE.md`.

This document is the spine for future security questionnaires, DPAs, and audits. Every control below should be treated as a checkbox item with an owner and a verification method.

## 1. Compliance Regimes Committed To

| Regime                                | Trigger              | Status                              |
| ------------------------------------- | -------------------- | ----------------------------------- |
| **GDPR / UK GDPR**                    | Any EU/UK end user   | Committed — baseline posture        |
| **CCPA / CPRA**                       | California end users | Committed — privacy policy + rights |
| **US state breach-notification laws** | Any US end user      | Committed — IR plan required        |
| **PIPEDA (Canada), LGPD (Brazil)**    | End users in-region  | Covered by GDPR-equivalent posture  |

### Deferred (do not accept tenants requiring these until explicit uplift)

- **HIPAA** — no healthcare tenants. Requires BAA, encryption-at-rest audit, stricter access controls.
- **PCI-DSS** — out of scope; payments offloaded to Stripe/Square.
- **SOC 2** — not pursued until an enterprise customer demands it.
- **COPPA** — no apps targeting children under 13 without legal review.
- **ISO 27001 / formal pentests** — deferred.

## 2. Controller vs. Processor Split

Two distinct compliance surfaces, both must be handled correctly in ToS and DPAs:

1. **Agency as Data Controller** — for your own marketing site, tenant admins, billing data. GDPR/CCPA apply directly.
2. **Agency as Data Processor** — for end users of client apps (`bakery.com` shoppers, `gym.com` members). The **tenant is the controller**, the agency is the processor. Requires a **DPA with each tenant** defining the relationship.

## 3. Legal / Contractual Must-Haves

- [ ] **Privacy policy** published on the Auth Hub and on every client app.
- [ ] **Terms of Service** for tenant businesses.
- [ ] **DPA template** signed with every tenant before go-live.
- [ ] **Sub-processor list** published and kept current (Convex, Vercel, Twilio, email provider, etc.).
- [ ] **Data retention policy** — documented and enforced:
  - Deleted users: purge within 30 days.
  - Revoked refresh tokens: retain 90 days for audit, then purge.
  - Audit logs: retain ≥ 365 days.
- [ ] **Incident response plan** written down _before_ first user:
  - Who gets paged.
  - How tenants are notified.
  - How end users are notified.
  - Regulator notification timelines (GDPR: 72h).
- [ ] **Cookie consent** on Hub login page for any non-essential cookies/analytics. Auth cookies are "strictly necessary" and exempt.

## 4. Security Baseline — Day-One Controls

These are non-negotiable before the first real user logs in.

### Passwords & credentials

- [ ] **Argon2id** (or bcrypt cost ≥ 12) via BetterAuth. Never plaintext, never MD5/SHA1/unsalted-SHA256.
- [ ] No secrets in git. `.env*` in `.gitignore`. Secrets in Convex env vars or a secret manager.
- [ ] No secrets in client bundles (web or mobile).

### Transport

- [ ] TLS 1.2+ everywhere. No HTTP fallback.
- [ ] **HSTS** enabled on the Hub domain with `includeSubDomains` and `preload`.
- [ ] Secure cookies only (`Secure`, `HttpOnly`, `SameSite=None` for cross-domain auth cookies set via BFF proxy).

### Tokens

- [ ] **RS256** JWT signing. Private key in Convex env vars.
- [ ] **JWKS endpoint** at `/.well-known/jwks.json` with key rotation support (overlapping keys).
- [ ] Key rotation at least **annually**.
- [ ] Access tokens ≤ **15 min**.
- [ ] Refresh tokens **rotated on every use**.
- [ ] Refresh tokens stored **hashed** in Convex, never plaintext.
- [ ] **Audience (`aud`) claim** names the tenant; client apps must validate.
- [ ] JWT verification clock-skew tolerance ~60s.
- [ ] No tokens in URL query strings or fragments; no tokens in server logs.

### Endpoint hardening

- [ ] **Rate limiting** on `/login`, `/register`, `/refresh`, `/forgot-password`, `/otp`, `/token`.
- [ ] **Brute-force protection**: account lockout or exponential backoff after N failed attempts.
- [ ] **MFA available** on every tenant (BetterAuth Two-Factor plugin).
- [ ] **PKCE required** on all OAuth flows, web and mobile.
- [ ] **State** parameter on every auth request (CSRF protection).
- [ ] **Nonce** in ID tokens, validated client-side.
- [ ] **Exact-match redirect URIs** per tenant. No wildcards, no prefix matching.
- [ ] **Open redirect prevention** on post-login `returnTo` — only allow pre-registered tenant origins.

### Audit & observability

- [ ] **Audit log table** in Hub Convex. Records: login success/failure, logout, password change, MFA enrollment/change, token issuance/revocation, admin actions, tenant config changes.
- [ ] Audit log retention ≥ **365 days**.
- [ ] Log access is itself audited.

### Operational hygiene

- [ ] **Dependabot / Renovate** on for all workspace packages.
- [ ] Critical vulnerabilities patched within **7 days**.
- [ ] **Backups** — Convex handles these; documented RPO/RTO; test restore at least once.
- [ ] **Principle of least privilege** — human access to prod Convex is MFA-gated and limited.
- [ ] **No prod secrets on developer laptops** beyond what's required for local dev against staging.

## 5. OAuth / OIDC Correctness Checklist

Because the Hub is an IdP, spec correctness is a security control.

- [ ] `/authorize`, `/token`, `/userinfo`, `/logout`, `/revoke`, `/.well-known/openid-configuration`, `/.well-known/jwks.json` all implemented.
- [ ] PKCE (S256) required.
- [ ] State + nonce enforced.
- [ ] Redirect URIs exact-match per tenant.
- [ ] Custom URI scheme redirects (`bakeryapp://auth/callback`) registered per tenant.
- [ ] Bearer-mode refresh endpoint for mobile.
- [ ] Cookie-mode refresh endpoint for web (via BFF proxy).
- [ ] Refresh token rotation + reuse detection (if a rotated token is presented twice, revoke the whole chain).
- [ ] `id_token` includes `iss`, `sub`, `aud`, `exp`, `iat`, `nonce`, `tenantId`.

## 6. Data Subject Rights (GDPR / CCPA)

The Hub must support, for any end user:

- [ ] **Access** — export all data tied to the user (`users`, `memberships`, `audit_log` entries, active sessions).
- [ ] **Deletion** — hard-delete user + cascade to memberships + revoke all refresh tokens. Audit log entries may be retained (pseudonymized) for legal basis.
- [ ] **Rectification** — update profile fields.
- [ ] **Portability** — machine-readable export (JSON).
- [ ] **Objection / restriction** — disable account without deleting.

These should be exposed as Convex admin functions at minimum; a self-service UI can come later.

## 7. What Is Explicitly Deferred

- Formal SOC 2 Type II audit.
- Third-party penetration testing.
- ISO 27001 certification.
- Dedicated DPO (not required at current scale).
- WAF beyond what Vercel/Cloudflare provide by default.
- Full FedRAMP / HIPAA / PCI uplift.

Each of these is revisited when a specific tenant or enterprise customer demands it.

## 8. Review Cadence

- **This document**: reviewed every 6 months or on any material architecture change.
- **Sub-processor list**: reviewed every 6 months.
- **Key rotation**: at least annually.
- **Incident response plan**: tabletop exercise annually.
- **Dependency audit**: continuous (Dependabot) + monthly manual review.
- **Backup restore test**: at least annually.

## 9. Open Items

- [ ] Choose SMS provider (Twilio vs. alternatives) — must be GDPR-compatible.
- [ ] Choose transactional email provider.
- [ ] Draft initial privacy policy.
- [ ] Draft initial DPA template.
- [ ] Draft initial incident response runbook.
- [ ] Decide audit log storage (Convex table vs. external sink for tamper-evidence).
