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

// BO-SPEC-006.AC4: poll registered provider health checks on a fixed cadence.
crons.interval(
  "provider health checks",
  { minutes: 15 },
  internal.monitoring.runAllHealthChecks,
  {},
);

// BO-SPEC-006.AC6: scan auditLogs for failed-login spikes and dispatch an alert
// when any single identifier crosses the configured threshold within the window.
crons.interval(
  "auth failed-login spike detection",
  { minutes: 5 },
  internal.monitoring.authAnomaly.checkFailedLoginSpike,
  {},
);

export default crons;
