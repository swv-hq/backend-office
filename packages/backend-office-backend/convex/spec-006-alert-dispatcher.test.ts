import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import schema from "./schema";
import {
  dispatchAlert,
  resetAlertTransportsForTests,
  setAlertTransportsForTests,
  stubTransport,
} from "./lib/alertDispatcher";

const modules = (
  import.meta as unknown as {
    glob: (pattern: string) => Record<string, () => Promise<unknown>>;
  }
).glob("./**/*.{ts,tsx}");

describe("BO-SPEC-006: alert dispatcher [BO-SPEC-006.AC6]", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetAlertTransportsForTests();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    resetAlertTransportsForTests();
    logSpy.mockRestore();
  });

  it("stub transport writes a row to alertHistory and console.logs the payload [BO-SPEC-006.AC6]", async () => {
    const t = convexTest(schema, modules);
    setAlertTransportsForTests([stubTransport()]);
    await t.run(async (ctx) => {
      await dispatchAlert(ctx, {
        severity: "critical",
        source: "auth.failed_login_spike",
        title: "Failed login spike",
        message: "5 failures for identifier abc in 10m",
        payload: { identifier: "abc", count: 5 },
      });
    });

    const rows = await t.run((ctx) => ctx.db.query("alertHistory").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      severity: "critical",
      source: "auth.failed_login_spike",
      title: "Failed login spike",
      transport: "stub",
    });
    expect(rows[0].dispatchedAt).toBeTypeOf("number");
    expect(logSpy).toHaveBeenCalled();
  });

  it("dispatches to every configured transport [BO-SPEC-006.AC6]", async () => {
    const t = convexTest(schema, modules);
    const calls: string[] = [];
    setAlertTransportsForTests([
      {
        name: "memory-a",
        send: async (alert) => {
          calls.push(`a:${alert.title}`);
        },
      },
      {
        name: "memory-b",
        send: async (alert) => {
          calls.push(`b:${alert.title}`);
        },
      },
    ]);
    await t.run(async (ctx) => {
      await dispatchAlert(ctx, {
        severity: "warning",
        source: "test",
        title: "hello",
        message: "world",
      });
    });
    expect(calls).toEqual(["a:hello", "b:hello"]);
  });

  it("backend monitoring surface loads without import-time errors [BO-SPEC-006.AC7]", async () => {
    // Smoke-import every BO-SPEC-006 backend module so a future regression that
    // breaks typecheck or runtime initialization is caught here in addition to
    // CI's `npm run typecheck`. Coverage hook for AC7's backend slice.
    const monitoring = await import("./monitoring");
    const dispatcher = await import("./lib/alertDispatcher");
    const failures = await import("./lib/providerFailures");
    const sentry = await import("./lib/monitoring");
    const thresholds = await import("./lib/alertThresholds");
    const authAnomaly = await import("./monitoring/authAnomaly");
    expect(monitoring.runAllHealthChecks).toBeDefined();
    expect(typeof dispatcher.dispatchAlert).toBe("function");
    expect(typeof failures.withProviderFailureLogging).toBe("function");
    expect(typeof sentry.captureException).toBe("function");
    expect(thresholds.FAILED_LOGIN_SPIKE.count).toBeGreaterThan(0);
    expect(authAnomaly.checkFailedLoginSpike).toBeDefined();
  });

  it("a transport failure does not block other transports [BO-SPEC-006.AC6]", async () => {
    const t = convexTest(schema, modules);
    const calls: string[] = [];
    setAlertTransportsForTests([
      {
        name: "broken",
        send: async () => {
          throw new Error("transport offline");
        },
      },
      {
        name: "stub",
        send: async (alert) => {
          calls.push(alert.title);
        },
      },
    ]);
    await t.run(async (ctx) => {
      await dispatchAlert(ctx, {
        severity: "info",
        source: "test",
        title: "still-fires",
        message: "ok",
      });
    });
    expect(calls).toEqual(["still-fires"]);
  });
});
