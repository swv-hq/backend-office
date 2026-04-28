import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import {
  logProviderFailure,
  withProviderFailureLogging,
} from "./lib/providerFailures";

const modules = (
  import.meta as unknown as {
    glob: (pattern: string) => Record<string, () => Promise<unknown>>;
  }
).glob("./**/*.{ts,tsx}");

describe("BO-SPEC-006: provider failure logging [BO-SPEC-006.AC5]", () => {
  it("recordFailure mutation writes a row with all expected fields [BO-SPEC-006.AC5]", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.data.providerFailureLog.recordFailure, {
      provider: "twilio",
      endpoint: "/v1/Calls",
      errorMessage: "ECONNRESET",
      responseStatus: 502,
      timestamp: 1234,
      context: { callSid: "CA_x" },
    });

    const rows = await t.run((ctx) =>
      ctx.db.query("providerFailureLog").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      provider: "twilio",
      endpoint: "/v1/Calls",
      errorMessage: "ECONNRESET",
      responseStatus: 502,
      timestamp: 1234,
    });
  });

  it("logProviderFailure works from a mutation context [BO-SPEC-006.AC5]", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await logProviderFailure(ctx, {
        provider: "deepgram",
        endpoint: "/listen",
        errorMessage: "timeout",
        responseStatus: 504,
      });
    });
    const rows = await t.run((ctx) =>
      ctx.db.query("providerFailureLog").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      provider: "deepgram",
      endpoint: "/listen",
      errorMessage: "timeout",
      responseStatus: 504,
    });
    expect(rows[0].timestamp).toBeTypeOf("number");
  });

  it("withProviderFailureLogging records on throw and re-throws [BO-SPEC-006.AC5]", async () => {
    const t = convexTest(schema, modules);
    let caught: unknown = null;
    await t.run(async (ctx) => {
      try {
        await withProviderFailureLogging(
          ctx,
          {
            provider: "twilio",
            endpoint: "/voice/forward",
            responseStatus: 503,
          },
          async () => {
            throw new Error("upstream-503");
          },
        );
      } catch (err) {
        caught = err;
      }
    });
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe("upstream-503");
    const rows = await t.run((ctx) =>
      ctx.db.query("providerFailureLog").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      provider: "twilio",
      endpoint: "/voice/forward",
      errorMessage: "upstream-503",
      responseStatus: 503,
    });
  });

  it("withProviderFailureLogging is a no-op on success [BO-SPEC-006.AC5]", async () => {
    const t = convexTest(schema, modules);
    let result: string | undefined;
    await t.run(async (ctx) => {
      result = await withProviderFailureLogging(
        ctx,
        { provider: "stripe", endpoint: "/charges" },
        async () => "ok",
      );
    });
    expect(result).toBe("ok");
    const rows = await t.run((ctx) =>
      ctx.db.query("providerFailureLog").collect(),
    );
    expect(rows).toHaveLength(0);
  });
});
