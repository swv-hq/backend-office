import { internal } from "../_generated/api";
import type { ActionCtx, MutationCtx } from "../_generated/server";

export type AlertSeverity = "critical" | "warning" | "info";

export type Alert = {
  severity: AlertSeverity;
  source: string;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
};

type DispatchCtx = ActionCtx | MutationCtx;

function isActionCtx(ctx: DispatchCtx): ctx is ActionCtx {
  return typeof (ctx as ActionCtx).runMutation === "function";
}

export type AlertTransport = {
  name: string;
  send: (alert: Alert, ctx: DispatchCtx) => Promise<void>;
};

/**
 * Stub transport: persists the alert payload to alertHistory and console-logs
 * it. Replace or supplement with a real transport (email/Slack) in a later
 * spec; the dispatcher itself stays channel-agnostic (BO-SPEC-006.AC6).
 */
export function stubTransport(): AlertTransport {
  return {
    name: "stub",
    send: async (alert, ctx) => {
      const row = {
        severity: alert.severity,
        source: alert.source,
        title: alert.title,
        message: alert.message,
        payload: alert.payload,
        transport: "stub",
        dispatchedAt: Date.now(),
      };
      if (isActionCtx(ctx)) {
        await ctx.runMutation(internal.data.alertHistory.recordAlert, row);
      } else {
        await ctx.db.insert("alertHistory", row);
      }
      console.log(
        `[alert:${alert.severity}] ${alert.source} — ${alert.title}: ${alert.message}`,
      );
    },
  };
}

let configuredTransports: AlertTransport[] = [stubTransport()];

export function setAlertTransportsForTests(transports: AlertTransport[]): void {
  configuredTransports = transports;
}

export function resetAlertTransportsForTests(): void {
  configuredTransports = [stubTransport()];
}

export async function dispatchAlert(
  ctx: DispatchCtx,
  alert: Alert,
): Promise<void> {
  for (const transport of configuredTransports) {
    try {
      await transport.send(alert, ctx);
    } catch (err) {
      // Channel failures must never prevent other transports from firing,
      // and must never propagate to the caller.
      console.error(
        `[alert-dispatch-failure] transport=${transport.name} ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
