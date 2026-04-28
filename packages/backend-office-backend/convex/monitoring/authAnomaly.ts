import { v } from "convex/values";
import {
  internalAction,
  internalQuery,
  type ActionCtx,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { dispatchAlert } from "../lib/alertDispatcher";
import { FAILED_LOGIN_SPIKE } from "../lib/alertThresholds";
import { monitored } from "../lib/monitoring";

export const recentFailedLogins = internalQuery({
  args: { sinceTimestamp: v.number() },
  returns: v.array(
    v.object({
      entityId: v.string(),
      timestamp: v.number(),
    }),
  ),
  handler: async (ctx, { sinceTimestamp }) => {
    const rows = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", sinceTimestamp))
      .collect();
    return rows
      .filter((r) => r.action === "auth_failure")
      .map((r) => ({ entityId: r.entityId, timestamp: r.timestamp }));
  },
});

async function detectAndAlert(ctx: ActionCtx, now: number): Promise<void> {
  const since = now - FAILED_LOGIN_SPIKE.windowMs;
  const failures = await ctx.runQuery(
    internal.monitoring.authAnomaly.recentFailedLogins,
    { sinceTimestamp: since },
  );

  const counts = new Map<string, number>();
  for (const row of failures) {
    counts.set(row.entityId, (counts.get(row.entityId) ?? 0) + 1);
  }

  for (const [identifier, count] of counts) {
    if (count >= FAILED_LOGIN_SPIKE.count) {
      await dispatchAlert(ctx, {
        severity: "critical",
        source: "auth.failed_login_spike",
        title: "Failed login spike detected",
        message: `${count} failed logins for ${identifier} in the last ${
          FAILED_LOGIN_SPIKE.windowMs / 60_000
        } minutes`,
        payload: {
          identifier,
          count,
          windowMs: FAILED_LOGIN_SPIKE.windowMs,
        },
      });
    }
  }
}

export const checkFailedLoginSpike = internalAction({
  args: { now: v.optional(v.number()) },
  returns: v.null(),
  handler: monitored(
    "action:checkFailedLoginSpike",
    async (ctx, { now }: { now?: number }, scope) => {
      scope.setTag("triggered_by", "cron");
      await detectAndAlert(ctx, now ?? Date.now());
      return null;
    },
  ),
});
