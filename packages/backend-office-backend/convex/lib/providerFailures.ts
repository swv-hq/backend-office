import { internal } from "../_generated/api";
import type { ActionCtx, MutationCtx } from "../_generated/server";

export type ProviderFailureContext = {
  provider: string;
  endpoint: string;
  responseStatus?: number;
  context?: Record<string, unknown>;
};

type FailureCtx = ActionCtx | MutationCtx;

function isActionCtx(ctx: FailureCtx): ctx is ActionCtx {
  return typeof (ctx as ActionCtx).runMutation === "function";
}

/**
 * Record a provider call failure to the provider_failure_log table.
 * Safe to call from either a mutation or an action; never throws.
 */
export async function logProviderFailure(
  ctx: FailureCtx,
  args: ProviderFailureContext & { errorMessage: string },
): Promise<void> {
  const payload = {
    provider: args.provider,
    endpoint: args.endpoint,
    errorMessage: args.errorMessage,
    responseStatus: args.responseStatus,
    context: args.context,
    timestamp: Date.now(),
  };
  try {
    if (isActionCtx(ctx)) {
      await ctx.runMutation(
        internal.data.providerFailureLog.recordFailure,
        payload,
      );
    } else {
      await ctx.db.insert("providerFailureLog", payload);
    }
  } catch {
    // Never let failure logging itself break the caller.
  }
}

/**
 * Wrap a provider call so any thrown error is recorded to provider_failure_log
 * before being re-thrown. Use this at every call site that invokes a provider
 * method — once providers move beyond stubs, this is the single funnel for
 * all upstream failures (BO-SPEC-006.AC5).
 */
export async function withProviderFailureLogging<T>(
  ctx: FailureCtx,
  meta: ProviderFailureContext,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    await logProviderFailure(ctx, {
      ...meta,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
