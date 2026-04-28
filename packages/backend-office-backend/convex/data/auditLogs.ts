import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { monitored } from "../lib/monitoring";

const ACTION = v.union(
  v.literal("create"),
  v.literal("update"),
  v.literal("delete"),
  v.literal("access"),
  v.literal("auth_success"),
  v.literal("auth_failure"),
);

const ENTITY_TYPE = v.union(
  v.literal("contractor"),
  v.literal("contact"),
  v.literal("job"),
  v.literal("jobSegment"),
  v.literal("estimate"),
  v.literal("invoice"),
  v.literal("callLog"),
);

const AUDIT_LOG_DOC = v.object({
  _id: v.id("auditLogs"),
  _creationTime: v.number(),
  contractorId: v.optional(v.id("contractors")),
  action: ACTION,
  entityType: ENTITY_TYPE,
  entityId: v.string(),
  details: v.optional(v.any()),
  ipAddress: v.optional(v.string()),
  timestamp: v.number(),
});

// Caps the audit `details` payload to keep entries lightweight (BO-SPEC-004.AC10)
// and prevent unbounded storage growth across millions of mutations.
const MAX_DETAILS_BYTES = 4_096;

const DAY_MS = 24 * 60 * 60 * 1000;
const RETENTION_DAYS = 365;
// Bound per-invocation deletes so the daily cron stays within Convex mutation
// limits (BO-SPEC-004.AC11). The cron can reschedule itself to drain a backlog.
const PURGE_BATCH_SIZE = 256;

export const logAudit = internalMutation({
  args: {
    contractorId: v.union(v.id("contractors"), v.null()),
    action: ACTION,
    entityType: ENTITY_TYPE,
    entityId: v.string(),
    details: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  returns: v.id("auditLogs"),
  handler: async (ctx, args) => {
    if (args.details !== undefined) {
      const size = JSON.stringify(args.details).length;
      if (size > MAX_DETAILS_BYTES) {
        throw new Error(
          `audit details payload too large (${size} bytes; max ${MAX_DETAILS_BYTES})`,
        );
      }
    }
    return await ctx.db.insert("auditLogs", {
      contractorId: args.contractorId ?? undefined,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      details: args.details,
      ipAddress: args.ipAddress,
      timestamp: args.timestamp ?? Date.now(),
    });
  },
});

export const listByContractor = internalQuery({
  args: {
    contractorId: v.id("contractors"),
    from: v.number(),
    to: v.number(),
  },
  returns: v.array(AUDIT_LOG_DOC),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_contractor_timestamp", (q) =>
        q
          .eq("contractorId", args.contractorId)
          .gte("timestamp", args.from)
          .lt("timestamp", args.to),
      )
      .collect();
  },
});

export const listByEntity = internalQuery({
  args: {
    entityType: ENTITY_TYPE,
    entityId: v.string(),
  },
  returns: v.array(AUDIT_LOG_DOC),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId),
      )
      .collect();
  },
});

export const purgeExpired = internalMutation({
  args: {
    now: v.optional(v.number()),
  },
  returns: v.object({ deleted: v.number(), hasMore: v.boolean() }),
  handler: monitored(
    "mutation:purgeExpired",
    async (ctx, args: { now?: number }, scope) => {
      scope.setTag("triggered_by", "cron");
      const now = args.now ?? Date.now();
      const cutoff = now - RETENTION_DAYS * DAY_MS;
      const expired = await ctx.db
        .query("auditLogs")
        .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
        .take(PURGE_BATCH_SIZE);
      for (const row of expired) {
        await ctx.db.delete(row._id);
      }
      return {
        deleted: expired.length,
        hasMore: expired.length === PURGE_BATCH_SIZE,
      };
    },
  ),
});
