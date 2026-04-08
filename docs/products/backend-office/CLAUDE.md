# backend-office — CLAUDE.md

Product-specific guidance for **backend-office**, a mobile-first business management app for solo tradespeople (handymen, plumbers, electricians) to manage calls, scheduling, invoicing, and estimates from their phones.

This file is loaded in addition to the monorepo root [CLAUDE.md](../../../CLAUDE.md). Read both before doing work scoped to this product.

## Workspaces

- **`apps/backend-office-web/`** — Next.js 16, React 19, Tailwind CSS v4, Clerk auth, App Router (marketing site + web dashboard)
- **`apps/backend-office-native/`** — React Native, Expo 55, Clerk auth, React Navigation (primary mobile app)
- **`packages/backend-office-backend/`** — Convex (serverless DB + functions), shared by web and native

## Per-Workspace Test Commands

After touching a workspace, run its tests:

```bash
cd packages/backend-office-backend && npm test     # backend (Convex)
cd apps/backend-office-web && npm test             # web
cd apps/backend-office-native && npm test          # native
```

Other useful commands:

```bash
cd packages/backend-office-backend && npx convex dev     # Convex dev server
cd apps/backend-office-web && npm run dev                # Next.js dev (port 3001)
cd apps/backend-office-native && npx expo start          # Expo dev server
```

## Spec System

- **Prefix:** `BO-SPEC-XXX`
- **Specs dir:** `docs/products/backend-office/specs/`
- **Roadmap:** [`docs/products/backend-office/ROADMAP.md`](./ROADMAP.md)
- **Template:** `docs/products/backend-office/specs/_TEMPLATE.md`

### Platform → Workspace Test Mapping

When tagging an AC with a platform, the test must live in the matching workspace:

| Platform tag | Test location                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------ |
| `[backend]`  | `packages/backend-office-backend/convex/**/*.test.ts`                                            |
| `[web]`      | `apps/backend-office-web/src/**/*.test.{ts,tsx}` or `e2e/test-scripts/backend-office/web/`       |
| `[native]`   | `apps/backend-office-native/src/**/*.test.{ts,tsx}` or `e2e/test-scripts/backend-office/native/` |

Example AC test name: `it("rejects estimates without a contractorId [BO-SPEC-018.AC3]", ...)`.

## Manual E2E Scripts

Per-platform Markdown scripts at:

- `e2e/test-scripts/backend-office/web/BO-SPEC-XXX-feature-name.md`
- `e2e/test-scripts/backend-office/native/BO-SPEC-XXX-feature-name.md`

Each script has Instructions, Expected Result, and an AC coverage matrix at the bottom.

## Implementation Order for a Slice

Backend first (schema → data → use cases → API), then web and/or native. Vertical slices, not horizontal layers.

## Spec Sign-Off

**Never move a spec to `implemented` without Brian's explicit approval.** Status `in-testing` is the highest you can self-assign.

## Key Documentation

| Document                                                     | Purpose                                            |
| ------------------------------------------------------------ | -------------------------------------------------- |
| [BusinessPlan.md](./BusinessPlan.md)                         | Product vision, target customer, design principles |
| [EngineeringSpec.md](./EngineeringSpec.md)                   | Technical architecture, features, data model       |
| [ROADMAP.md](./ROADMAP.md)                                   | Phase-ordered spec index and status                |
| [../../shared/architecture.md](../../shared/architecture.md) | Layered Convex pattern (cross-product)             |
