import { v } from "convex/values";
import { internalAction } from "../_generated/server";

const HEALTH_RESULT = v.object({
  status: v.union(
    v.literal("ok"),
    v.literal("degraded"),
    v.literal("down"),
    v.literal("stubbed"),
  ),
  latencyMs: v.optional(v.number()),
  error: v.optional(v.string()),
  details: v.optional(v.any()),
});

const stubResult = { status: "stubbed" as const };

// Stub registrations for BO-SPEC-006.AC4. Each provider's integration spec
// replaces its stub with a live connectivity probe.
export const checkTwilio = internalAction({
  args: {},
  returns: HEALTH_RESULT,
  handler: async () => stubResult,
});

export const checkDeepgram = internalAction({
  args: {},
  returns: HEALTH_RESULT,
  handler: async () => stubResult,
});

export const checkClaude = internalAction({
  args: {},
  returns: HEALTH_RESULT,
  handler: async () => stubResult,
});

export const checkStripe = internalAction({
  args: {},
  returns: HEALTH_RESULT,
  handler: async () => stubResult,
});
