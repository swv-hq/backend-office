import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sentryMocks = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
  setContext: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => sentryMocks);

describe("BO-SPEC-006: web Sentry integration [BO-SPEC-006.AC3]", () => {
  beforeEach(() => {
    sentryMocks.init.mockReset();
    sentryMocks.captureException.mockReset();
    sentryMocks.setContext.mockReset();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT;
  });

  it("initSentry is a no-op when no DSN is configured [BO-SPEC-006.AC3]", async () => {
    const { initSentry } = await import("../lib/monitoring/sentry");
    initSentry();
    expect(sentryMocks.init).not.toHaveBeenCalled();
  });

  it("initSentry forwards DSN and environment to @sentry/nextjs [BO-SPEC-006.AC3]", async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN =
      "https://abc@o0.ingest.sentry.io/12345";
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT = "test";
    vi.resetModules();
    const { initSentry } = await import("../lib/monitoring/sentry");
    initSentry();
    expect(sentryMocks.init).toHaveBeenCalledTimes(1);
    const call = sentryMocks.init.mock.calls[0]![0] as Record<string, unknown>;
    expect(call.dsn).toBe("https://abc@o0.ingest.sentry.io/12345");
    expect(call.environment).toBe("test");
  });

  it("captureException delegates to @sentry/nextjs and attaches context [BO-SPEC-006.AC3]", async () => {
    vi.resetModules();
    const { captureException } = await import("../lib/monitoring/sentry");
    const err = new Error("client-side boom");
    captureException(err, { route: "/dashboard" });
    expect(sentryMocks.captureException).toHaveBeenCalledTimes(1);
    expect(sentryMocks.captureException.mock.calls[0]![0]).toBe(err);
    const opts = sentryMocks.captureException.mock.calls[0]![1] as Record<
      string,
      unknown
    >;
    expect(opts.contexts).toMatchObject({
      app: { route: "/dashboard" },
    });
  });
});
