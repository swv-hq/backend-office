import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = (
  import.meta as unknown as {
    glob: (pattern: string) => Record<string, () => Promise<unknown>>;
  }
).glob("./**/*.{ts,tsx}");

describe("BO-SPEC-006: provider health-check framework [BO-SPEC-006.AC4]", () => {
  it("runAllHealthChecks records one stubbed result per registered provider [BO-SPEC-006.AC4]", async () => {
    const t = convexTest(schema, modules);
    await t.action(internal.monitoring.runAllHealthChecks, {});

    const rows = await t.run((ctx) =>
      ctx.db.query("providerHealthChecks").collect(),
    );
    const byProvider = new Map(rows.map((r) => [r.provider, r]));

    expect(new Set(rows.map((r) => r.provider))).toEqual(
      new Set(["twilio", "deepgram", "claude", "stripe"]),
    );
    for (const provider of ["twilio", "deepgram", "claude", "stripe"]) {
      const row = byProvider.get(provider)!;
      expect(row.status).toBe("stubbed");
      expect(row.checkedAt).toBeTypeOf("number");
    }
  });

  it("latestHealthChecks returns the most recent result per provider [BO-SPEC-006.AC4]", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("providerHealthChecks", {
        provider: "twilio",
        status: "stubbed",
        checkedAt: 1000,
      });
      await ctx.db.insert("providerHealthChecks", {
        provider: "twilio",
        status: "ok",
        checkedAt: 2000,
        latencyMs: 42,
      });
      await ctx.db.insert("providerHealthChecks", {
        provider: "stripe",
        status: "stubbed",
        checkedAt: 1500,
      });
    });

    const latest = await t.query(api.monitoring.latestHealthChecks, {});
    const byProvider = new Map(latest.map((r) => [r.provider, r]));
    expect(byProvider.get("twilio")?.status).toBe("ok");
    expect(byProvider.get("twilio")?.checkedAt).toBe(2000);
    expect(byProvider.get("stripe")?.checkedAt).toBe(1500);
  });

  it("runHealthChecksOnDemand returns the same set the cron would record [BO-SPEC-006.AC4]", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = t.withIdentity({ subject: "admin_user" });
    const results = await asAdmin.action(
      api.monitoring.runHealthChecksOnDemand,
      {},
    );
    expect(results).toHaveLength(4);
    expect(new Set(results.map((r) => r.provider))).toEqual(
      new Set(["twilio", "deepgram", "claude", "stripe"]),
    );
    for (const r of results) expect(r.status).toBe("stubbed");

    const rows = await t.run((ctx) =>
      ctx.db.query("providerHealthChecks").collect(),
    );
    expect(rows).toHaveLength(4);
  });

  it("runHealthChecksOnDemand rejects unauthenticated callers [BO-SPEC-006.AC4]", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.action(api.monitoring.runHealthChecksOnDemand, {}),
    ).rejects.toThrow(/Authentication required/);
  });
});
