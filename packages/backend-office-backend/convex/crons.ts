import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// BO-SPEC-004.AC11: enforce 365-day audit log retention.
crons.daily(
  "purge expired audit logs",
  { hourUTC: 7, minuteUTC: 0 },
  internal.data.auditLogs.purgeExpired,
  {},
);

export default crons;
