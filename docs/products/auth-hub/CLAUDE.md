# auth-hub — CLAUDE.md

Product-specific guidance for the **Auth Hub**, a multi-tenant centralized identity provider serving authentication for several agency client apps. Internal infrastructure, not a public SaaS.

This file is loaded in addition to the monorepo root [CLAUDE.md](../../../CLAUDE.md). Read both before doing work scoped to this product.

## Status

**Phase 0 complete** (monorepo rename). **No `apps/auth-hub` workspace exists yet** — Phase 1 (Identity Core) creates it. Until Phase 1 lands, work in this product is documentation- and planning-only.

See [REQUIREMENTS.md §7](./REQUIREMENTS.md) for the phase plan and [PHASE-0-CHECKLIST.md](./PHASE-0-CHECKLIST.md) for the just-completed reshape.

## Workspaces (planned)

- **`apps/auth-hub/`** — Next.js, hosted at `auth.youragency.com`. The Hub's own `convex/` folder lives inside this app. Web-only by design (RFC 8252 — mobile clients use the system browser).
- **`packages/auth-contracts/`** — JWT claim types, cookie names, tenant schema. Imported by every client app.
- **`packages/auth-client/web/`** — Next.js middleware + BFF proxy + JWT verification.
- **`packages/auth-client/native/`** — Expo helpers (`expo-auth-session`, `expo-secure-store`).
- **`packages/convex-helpers/`** — `requireAuth()` wrapper for client-app Convex functions.

None of these exist on disk yet.

## Spec System

- **Prefix:** `AH-SPEC-XXX`
- **Specs dir:** `docs/products/auth-hub/specs/`
- **Template:** `docs/products/auth-hub/specs/_TEMPLATE.md`
- **Roadmap:** Phase plan lives in [REQUIREMENTS.md §7](./REQUIREMENTS.md). Once Phase 1 begins, create a `ROADMAP.md` here mirroring backend-office's structure.

### Platform → Workspace Test Mapping (planned)

| Platform tag | Test location                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| `[backend]`  | `apps/auth-hub/convex/**/*.test.ts`                                                                    |
| `[web]`      | `apps/auth-hub/src/**/*.test.{ts,tsx}` or `e2e/test-scripts/auth-hub/web/`                             |
| `[native]`   | `e2e/test-scripts/auth-hub/native/` (no native app — only client-side integration scripts when needed) |

Example AC test name: `it("rejects unknown tenants [AH-SPEC-002.AC1]", ...)`.

## Cross-Cutting Invariants

These are non-negotiable from day one — see [REQUIREMENTS.md §8](./REQUIREMENTS.md) and [COMPLIANCE.md](./COMPLIANCE.md):

- **Tenant isolation** is a hard boundary, not a filter convention. Every Convex query/mutation, log line, metric, rate-limit bucket, and audit-log entry is `tenantId`-scoped.
- **Append-only audit logs**, retained ≥ 365 days.
- **Versioned OIDC contract** — JWTs include a `ver` claim; client verification fails closed on unknown versions.
- **OAuth/OIDC correctness** is a security control: PKCE required, exact-match redirect URIs, state + nonce enforced, refresh token rotation with reuse detection.

## Key Documentation

| Document                                                     | Purpose                                                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                         | Original "Silent Auth Hub" design — multi-tenant centralized IdP with proxy-based secure sessions |
| [REQUIREMENTS.md](./REQUIREMENTS.md)                         | Architectural decisions, repo structure, phase roadmap, cross-cutting invariants                  |
| [COMPLIANCE.md](./COMPLIANCE.md)                             | GDPR/CCPA baseline, day-one security controls, OAuth/OIDC checklist                               |
| [PHASE-0-CHECKLIST.md](./PHASE-0-CHECKLIST.md)               | The just-completed monorepo reshape                                                               |
| [../../shared/architecture.md](../../shared/architecture.md) | Layered Convex pattern (also applies to the Hub's `convex/`)                                      |
