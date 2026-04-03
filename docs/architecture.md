# Backend Architecture

## Layered Architecture

All Convex backend code follows a strict 4-layer architecture:

```
Layer 4: API Layer         (contractors.ts, jobs.ts, etc.)
         ↓ delegates to
Layer 3: Use Cases Layer   (useCases/ directory)
         ↓ uses
Layer 2: Data Layer        (data/ directory)
         ↓ accesses
Layer 1: Schema            (schema.ts)

Shared Utilities: lib/ directory
```

## Layer 1: Schema (`convex/schema.ts`)

- Define all tables with proper indexes
- Use `withIndex()` naming convention: `by_fieldName` or `by_field1_and_field2`
- Every query should use an index — never use `filter()`

## Layer 2: Data Access (`convex/data/`)

- Pure CRUD wrappers around `ctx.db` operations
- **No business logic** — only database queries
- One file per domain entity (e.g., `contractors.data.ts`, `jobs.data.ts`)
- Always use `withIndex()` instead of `filter()`

```typescript
// convex/data/contractors.data.ts
export async function getContractorByUserId(
  ctx: QueryCtx,
  userId: string,
): Promise<Doc<"contractors"> | null> {
  return await ctx.db
    .query("contractors")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}
```

## Layer 3: Use Cases (`convex/useCases/`)

- All business logic lives here
- One file per action/operation
- Call data layer for CRUD
- All authorization and permissions checks live here
- Use auth utilities for authentication
- Throw domain errors (`NotAuthenticatedError`, `NotFoundError`, etc.)
- Orchestrate complex operations via `ctx.runMutation()`

```typescript
// convex/useCases/contractors/createContractor.ts
export async function createContractor(
  ctx: MutationCtx,
  args: { firstName: string; lastName: string /* ... */ },
) {
  const userId = await requireAuth(ctx);
  // Business logic: check if contractor already exists, validate, etc.
  return await insertContractor(ctx, { ...args, userId });
}
```

## Layer 4: API Layer (`convex/*.ts`)

- Thin wrappers exposing Convex functions (query, mutation, action)
- **Always** include `args` and `returns` validators
- Queries catch errors and return null for auth failures
- Mutations delegate to use cases

```typescript
// convex/contractors.ts
export const create = mutation({
  args: { firstName: v.string(), lastName: v.string() /* ... */ },
  returns: v.id("contractors"),
  handler: async (ctx, args) => {
    return await createContractor(ctx, args);
  },
});
```

## Shared Utilities (`convex/lib/`)

- `validators.ts` — Reusable Convex validators (addressValidator, lineItemValidator, etc.)
- `constants.ts` — Application-wide constants and limits
- `dates.ts` — Date manipulation functions (as needed)

## Error Handling (`convex/useCases/shared/`)

- `errors.ts` — Domain error classes
- `authorization.ts` — Auth utilities (`requireAuth`, `verifyOwnership`)
- `types.ts` — Shared types for orchestration

## Authorization

All mutations and sensitive queries must verify the user is authenticated and owns the resource:

```typescript
// Require authenticated user — returns Clerk userId
const userId = await requireAuth(ctx);

// Verify contractor owns the resource
verifyOwnership(resource.contractorId, contractorId, "update", "job");
```

## Directory Structure

```
packages/backend/convex/
├── schema.ts                    # Layer 1: Table definitions + indexes
├── contractors.ts               # Layer 4: API — contractor endpoints
├── jobs.ts                      # Layer 4: API — job endpoints
├── estimates.ts                 # Layer 4: API — estimate endpoints
├── invoices.ts                  # Layer 4: API — invoice endpoints
├── callLogs.ts                  # Layer 4: API — call log endpoints
├── data/                        # Layer 2: Data access
│   ├── contractors.data.ts
│   ├── jobs.data.ts
│   ├── estimates.data.ts
│   ├── invoices.data.ts
│   └── callLogs.data.ts
├── useCases/                    # Layer 3: Business logic
│   ├── shared/
│   │   ├── errors.ts
│   │   ├── authorization.ts
│   │   └── types.ts
│   ├── contractors/
│   ├── jobs/
│   ├── estimates/
│   └── invoices/
├── lib/                         # Shared utilities
│   ├── validators.ts
│   └── constants.ts
├── _generated/                  # Auto-generated (do not edit)
└── auth.config.js               # Clerk auth config
```
