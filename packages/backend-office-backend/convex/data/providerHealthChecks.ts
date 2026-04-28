import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

const HEALTH_STATUS = v.union(
  v.literal("ok"),
  v.literal("degraded"),
  v.literal("down"),
  v.literal("stubbed"),
);

const HEALTH_CHECK_DOC = v.object({
  _id: v.id("providerHealthChecks"),
  _creationTime: v.number(),
  provider: v.string(),
  status: HEALTH_STATUS,
  latencyMs: v.optional(v.number()),
  error: v.optional(v.string()),
  details: v.optional(v.any()),
  checkedAt: v.number(),
});

export const recordHealthCheck = internalMutation({
  args: {
    provider: v.string(),
    status: HEALTH_STATUS,
    latencyMs: v.optional(v.number()),
    error: v.optional(v.string()),
    details: v.optional(v.any()),
    checkedAt: v.number(),
  },
  returns: v.id("providerHealthChecks"),
  handler: (ctx, args) => ctx.db.insert("providerHealthChecks", args),
});

export const latestPerProvider = internalQuery({
  args: { providers: v.array(v.string()) },
  returns: v.array(HEALTH_CHECK_DOC),
  handler: async (ctx, args) => {
    const out = [] as Array<typeof HEALTH_CHECK_DOC.type>;
    for (const provider of args.providers) {
      const row = await ctx.db
        .query("providerHealthChecks")
        .withIndex("by_provider_checkedAt", (q) => q.eq("provider", provider))
        .order("desc")
        .first();
      if (row) out.push(row);
    }
    return out;
  },
});
