import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

const SEVERITY = v.union(
  v.literal("critical"),
  v.literal("warning"),
  v.literal("info"),
);

export const recordAlert = internalMutation({
  args: {
    severity: SEVERITY,
    source: v.string(),
    title: v.string(),
    message: v.string(),
    payload: v.optional(v.any()),
    transport: v.string(),
    dispatchedAt: v.number(),
  },
  returns: v.id("alertHistory"),
  handler: (ctx, args) => ctx.db.insert("alertHistory", args),
});
