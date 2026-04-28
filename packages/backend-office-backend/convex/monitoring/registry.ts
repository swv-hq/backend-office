import type { FunctionReference } from "convex/server";
import { internal } from "../_generated/api";

export type HealthCheckResult = {
  status: "ok" | "degraded" | "down" | "stubbed";
  latencyMs?: number;
  error?: string;
  details?: unknown;
};

export type HealthCheckRegistration = {
  provider: string;
  ref: FunctionReference<
    "action",
    "internal",
    Record<string, never>,
    HealthCheckResult
  >;
};

// Adding a provider here makes it visible to the cron runner, the on-demand
// admin action, and the latest-status query. Each entry's `ref` should be
// replaced with a live connectivity probe in that provider's integration spec.
export const HEALTH_CHECK_REGISTRY: HealthCheckRegistration[] = [
  { provider: "twilio", ref: internal.monitoring.stubs.checkTwilio },
  { provider: "deepgram", ref: internal.monitoring.stubs.checkDeepgram },
  { provider: "claude", ref: internal.monitoring.stubs.checkClaude },
  { provider: "stripe", ref: internal.monitoring.stubs.checkStripe },
];

export const REGISTERED_PROVIDERS: string[] = HEALTH_CHECK_REGISTRY.map(
  (r) => r.provider,
);
