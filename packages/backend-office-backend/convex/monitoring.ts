import { v } from "convex/values";
import {
  action,
  internalAction,
  query,
  type ActionCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import {
  HEALTH_CHECK_REGISTRY,
  REGISTERED_PROVIDERS,
  type HealthCheckResult,
} from "./monitoring/registry";
import { monitored } from "./lib/monitoring";

const HEALTH_STATUS = v.union(
  v.literal("ok"),
  v.literal("degraded"),
  v.literal("down"),
  v.literal("stubbed"),
);

const HEALTH_RESULT_VALUE = v.object({
  provider: v.string(),
  status: HEALTH_STATUS,
  latencyMs: v.optional(v.number()),
  error: v.optional(v.string()),
  details: v.optional(v.any()),
  checkedAt: v.number(),
});

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

async function executeAndRecord(
  ctx: ActionCtx,
): Promise<Array<typeof HEALTH_RESULT_VALUE.type>> {
  const results: Array<typeof HEALTH_RESULT_VALUE.type> = [];
  for (const { provider, ref } of HEALTH_CHECK_REGISTRY) {
    const startedAt = Date.now();
    let outcome: HealthCheckResult;
    try {
      outcome = await ctx.runAction(ref, {});
    } catch (err) {
      outcome = {
        status: "down",
        error: err instanceof Error ? err.message : String(err),
      };
    }
    const checkedAt = Date.now();
    const latencyMs = outcome.latencyMs ?? checkedAt - startedAt;
    const record = {
      provider,
      status: outcome.status,
      latencyMs,
      error: outcome.error,
      checkedAt,
    };
    await ctx.runMutation(
      internal.data.providerHealthChecks.recordHealthCheck,
      record,
    );
    results.push(record);
  }
  return results;
}

export const runAllHealthChecks = internalAction({
  args: {},
  returns: v.array(HEALTH_RESULT_VALUE),
  handler: monitored("action:runAllHealthChecks", async (ctx, _args, scope) => {
    scope.setTag("triggered_by", "cron");
    return executeAndRecord(ctx);
  }),
});

export const runHealthChecksOnDemand = action({
  args: {},
  returns: v.array(HEALTH_RESULT_VALUE),
  handler: monitored("action:runHealthChecksOnDemand", async (ctx) => {
    // Restrict ad-hoc health-check runs to authenticated callers so anonymous
    // clients cannot trigger a fan-out to every provider on demand.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required to run health checks on demand");
    }
    return executeAndRecord(ctx);
  }),
});

export const latestHealthChecks = query({
  args: {},
  returns: v.array(HEALTH_CHECK_DOC),
  handler: monitored("query:latestHealthChecks", async (ctx) => {
    const out = [] as Array<typeof HEALTH_CHECK_DOC.type>;
    for (const provider of REGISTERED_PROVIDERS) {
      const row = await ctx.db
        .query("providerHealthChecks")
        .withIndex("by_provider_checkedAt", (q) => q.eq("provider", provider))
        .order("desc")
        .first();
      if (row) out.push(row);
    }
    return out;
  }),
});
