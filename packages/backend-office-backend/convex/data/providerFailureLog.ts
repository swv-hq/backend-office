import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const recordFailure = internalMutation({
  args: {
    provider: v.string(),
    endpoint: v.string(),
    errorMessage: v.string(),
    responseStatus: v.optional(v.number()),
    context: v.optional(v.any()),
    timestamp: v.number(),
  },
  returns: v.id("providerFailureLog"),
  handler: (ctx, args) => ctx.db.insert("providerFailureLog", args),
});
