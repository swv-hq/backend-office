import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import {
  resetAlertTransportsForTests,
  setAlertTransportsForTests,
  stubTransport,
} from "./lib/alertDispatcher";
import { FAILED_LOGIN_SPIKE } from "./lib/alertThresholds";

const modules = (
  import.meta as unknown as {
    glob: (pattern: string) => Record<string, () => Promise<unknown>>;
  }
).glob("./**/*.{ts,tsx}");

async function seedAuthFailures(
  t: ReturnType<typeof convexTest>,
  identifier: string,
  count: number,
  baseTimestamp: number,
) {
  await t.run(async (ctx) => {
    for (let i = 0; i < count; i++) {
      await ctx.db.insert("auditLogs", {
        action: "auth_failure",
        entityType: "contractor",
        entityId: identifier,
        timestamp: baseTimestamp - i * 1000,
      });
    }
  });
}

describe("BO-SPEC-006: failed-login spike detection [BO-SPEC-006.AC6]", () => {
  beforeEach(() => {
    resetAlertTransportsForTests();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    resetAlertTransportsForTests();
    vi.restoreAllMocks();
  });

  it("threshold default is 5 failures within 10 minutes [BO-SPEC-006.AC6]", () => {
    expect(FAILED_LOGIN_SPIKE.count).toBe(5);
    expect(FAILED_LOGIN_SPIKE.windowMs).toBe(10 * 60 * 1000);
  });

  it("fires an alert when one identifier crosses the threshold within the window [BO-SPEC-006.AC6]", async () => {
    const t = convexTest(schema, modules);
    setAlertTransportsForTests([stubTransport()]);
    const now = Date.now();
    await seedAuthFailures(t, "user_a", 5, now);

    await t.action(internal.monitoring.authAnomaly.checkFailedLoginSpike, {
      now,
    });

    const alerts = await t.run((ctx) => ctx.db.query("alertHistory").collect());
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      source: "auth.failed_login_spike",
      severity: "critical",
    });
    expect(alerts[0].payload).toMatchObject({ identifier: "user_a", count: 5 });
  });

  it("does not fire when failures are below the threshold [BO-SPEC-006.AC6]", async () => {
    const t = convexTest(schema, modules);
    setAlertTransportsForTests([stubTransport()]);
    const now = Date.now();
    await seedAuthFailures(t, "user_b", 4, now);

    await t.action(internal.monitoring.authAnomaly.checkFailedLoginSpike, {
      now,
    });

    const alerts = await t.run((ctx) => ctx.db.query("alertHistory").collect());
    expect(alerts).toHaveLength(0);
  });

  it("does not fire when failures are spread across identifiers [BO-SPEC-006.AC6]", async () => {
    const t = convexTest(schema, modules);
    setAlertTransportsForTests([stubTransport()]);
    const now = Date.now();
    await seedAuthFailures(t, "user_c", 3, now);
    await seedAuthFailures(t, "user_d", 4, now);

    await t.action(internal.monitoring.authAnomaly.checkFailedLoginSpike, {
      now,
    });

    const alerts = await t.run((ctx) => ctx.db.query("alertHistory").collect());
    expect(alerts).toHaveLength(0);
  });

  it("does not fire when failures fall outside the window [BO-SPEC-006.AC6]", async () => {
    const t = convexTest(schema, modules);
    setAlertTransportsForTests([stubTransport()]);
    const now = Date.now();
    // 5 failures, but each one hour apart — none within the same 10-min window.
    await t.run(async (ctx) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("auditLogs", {
          action: "auth_failure",
          entityType: "contractor",
          entityId: "user_e",
          timestamp: now - i * 60 * 60 * 1000,
        });
      }
    });

    await t.action(internal.monitoring.authAnomaly.checkFailedLoginSpike, {
      now,
    });

    const alerts = await t.run((ctx) => ctx.db.query("alertHistory").collect());
    expect(alerts).toHaveLength(0);
  });
});
