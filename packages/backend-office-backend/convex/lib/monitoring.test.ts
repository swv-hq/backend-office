import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetMonitoringForTests,
  captureException,
  monitored,
  withMonitoring,
} from "./monitoring";

const TEST_DSN = "https://abc123@o0.ingest.sentry.io/12345";

describe("BO-SPEC-006: backend monitoring [BO-SPEC-006.AC1]", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    originalFetch = globalThis.fetch;
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    __resetMonitoringForTests();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    __resetMonitoringForTests();
  });

  it("no-ops when SENTRY_DSN is not configured [BO-SPEC-006.AC1]", async () => {
    await captureException(new Error("boom"), { dsn: undefined });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends exception with stack and context to Sentry envelope endpoint [BO-SPEC-006.AC1]", async () => {
    const err = new Error("kaboom");
    await captureException(err, {
      dsn: TEST_DSN,
      context: { contractorId: "ctr_1", action: "demo" },
      release: "test-release",
      environment: "test",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://o0.ingest.sentry.io/api/12345/envelope/");
    expect(init.method).toBe("POST");
    const body = String(init.body);
    expect(body).toContain('"type":"event"');
    expect(body).toContain('"type":"Error"');
    expect(body).toContain('"value":"kaboom"');
    expect(body).toContain("contractorId");
    expect(body).toContain("test-release");
    expect(body).toContain('"environment":"test"');
  });

  it("captures exceptions thrown inside withMonitoring and re-throws [BO-SPEC-006.AC1]", async () => {
    const handler = vi.fn(async () => {
      throw new Error("handler-failed");
    });
    const wrapped = withMonitoring("demo.action", handler, {
      dsn: TEST_DSN,
      release: "rel",
      environment: "test",
    });

    await expect(wrapped({ foo: 1 })).rejects.toThrow("handler-failed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = String(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body,
    );
    expect(body).toContain('"value":"handler-failed"');
    expect(body).toContain("demo.action");
  });

  it("passes through return values when no error is thrown [BO-SPEC-006.AC1]", async () => {
    const handler = vi.fn(async (args: { foo: number }) => args.foo + 1);
    const wrapped = withMonitoring("demo.ok", handler, { dsn: TEST_DSN });
    await expect(wrapped({ foo: 41 })).resolves.toBe(42);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe("monitored() Convex-shaped wrapper", () => {
    it("passes ctx, args, and scope through to the inner handler and returns its result [BO-SPEC-006.AC1]", async () => {
      const ctx = { kind: "fake-ctx" };
      const args = { id: "abc", count: 3 };
      const handler = vi.fn(async (c: typeof ctx, a: typeof args) => ({
        ctxKind: c.kind,
        sum: a.count + 1,
      }));
      const wrapped = monitored("query:demo", handler, { dsn: TEST_DSN });
      await expect(wrapped(ctx, args)).resolves.toEqual({
        ctxKind: "fake-ctx",
        sum: 4,
      });
      expect(handler).toHaveBeenCalledTimes(1);
      const callArgs = handler.mock.calls[0]! as unknown as [
        typeof ctx,
        typeof args,
        import("./monitoring").MonitorScope,
      ];
      expect(callArgs[0]).toBe(ctx);
      expect(callArgs[1]).toBe(args);
      expect(callArgs[2]).toMatchObject({
        setContext: expect.any(Function),
        setTag: expect.any(Function),
        setUser: expect.any(Function),
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("captures thrown errors and re-throws with handler name in context [BO-SPEC-006.AC1]", async () => {
      const wrapped = monitored(
        "mutation:demo",
        async () => {
          throw new Error("inner-fail");
        },
        { dsn: TEST_DSN, environment: "test" },
      );
      await expect(wrapped({}, {})).rejects.toThrow("inner-fail");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const body = String(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body,
      );
      expect(body).toContain('"value":"inner-fail"');
      expect(body).toContain('"handler":"mutation:demo"');
      expect(body).toContain('"environment":"test"');
    });

    it("flushes scope.setContext entries onto the captured event only on error [BO-SPEC-006.AC1]", async () => {
      const wrapped = monitored(
        "action:demo",
        async (_ctx, _args, scope) => {
          scope.setContext("estimate", { trade: "plumbing", lineCount: 3 });
          throw new Error("ctx-fail");
        },
        { dsn: TEST_DSN },
      );
      await expect(wrapped({}, {})).rejects.toThrow("ctx-fail");
      const body = String(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body,
      );
      expect(body).toContain('"estimate"');
      expect(body).toContain('"trade":"plumbing"');
      expect(body).toContain('"lineCount":3');
    });

    it("flushes scope.setTag entries as top-level tags on the event [BO-SPEC-006.AC1]", async () => {
      const wrapped = monitored(
        "action:demo",
        async (_ctx, _args, scope) => {
          scope.setTag("contractorId", "ctr_42");
          scope.setTag("trade", "electrical");
          throw new Error("tag-fail");
        },
        { dsn: TEST_DSN },
      );
      await expect(wrapped({}, {})).rejects.toThrow("tag-fail");
      const body = String(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body,
      );
      expect(body).toContain('"tags"');
      expect(body).toContain('"contractorId":"ctr_42"');
      expect(body).toContain('"trade":"electrical"');
    });

    it("flushes scope.setUser onto the event only on error [BO-SPEC-006.AC1]", async () => {
      const wrapped = monitored(
        "action:demo",
        async (_ctx, _args, scope) => {
          scope.setUser({ id: "user_7", email: "x@y.z" });
          throw new Error("user-fail");
        },
        { dsn: TEST_DSN },
      );
      await expect(wrapped({}, {})).rejects.toThrow("user-fail");
      const body = String(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body,
      );
      expect(body).toContain('"user"');
      expect(body).toContain('"id":"user_7"');
      expect(body).toContain('"email":"x@y.z"');
    });

    it("does not flush scope to Sentry when handler succeeds [BO-SPEC-006.AC1]", async () => {
      const wrapped = monitored(
        "query:demo",
        async (_ctx, _args, scope) => {
          scope.setContext("estimate", { trade: "plumbing" });
          scope.setTag("contractorId", "ctr_42");
          return "ok";
        },
        { dsn: TEST_DSN },
      );
      await expect(wrapped({}, {})).resolves.toBe("ok");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("no-ops the capture when DSN is absent but still re-throws [BO-SPEC-006.AC1]", async () => {
      const wrapped = monitored(
        "action:demo",
        async () => {
          throw new Error("no-dsn-fail");
        },
        {},
      );
      await expect(wrapped({}, {})).rejects.toThrow("no-dsn-fail");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("auto-emits func and func_type tags from the name convention [BO-SPEC-006.AC1]", async () => {
      for (const [name, expectedType] of [
        ["query:foo", "query"],
        ["mutation:bar", "mutation"],
        ["action:baz", "action"],
        ["http_action:qux", "http_action"],
      ] as const) {
        fetchMock.mockClear();
        const wrapped = monitored(
          name,
          async () => {
            throw new Error(`fail-${expectedType}`);
          },
          { dsn: TEST_DSN },
        );
        await expect(wrapped({}, {})).rejects.toThrow();
        const body = String(
          (fetchMock.mock.calls[0] as [string, RequestInit])[1].body,
        );
        expect(body).toContain(`"func":"${name.split(":")[1]}"`);
        expect(body).toContain(`"func_type":"${expectedType}"`);
      }
    });

    it("auto-emits server_name from CONVEX_CLOUD_URL [BO-SPEC-006.AC1]", async () => {
      const original = process.env.CONVEX_CLOUD_URL;
      process.env.CONVEX_CLOUD_URL = "https://happy-animal-123.convex.cloud";
      try {
        const wrapped = monitored(
          "action:demo",
          async () => {
            throw new Error("server-name-fail");
          },
          { dsn: TEST_DSN },
        );
        await expect(wrapped({}, {})).rejects.toThrow();
        const body = String(
          (fetchMock.mock.calls[0] as [string, RequestInit])[1].body,
        );
        expect(body).toContain('"server_name":"happy-animal-123"');
      } finally {
        if (original === undefined) delete process.env.CONVEX_CLOUD_URL;
        else process.env.CONVEX_CLOUD_URL = original;
      }
    });

    it("auto-emits user tag from ctx.auth.getUserIdentity tokenIdentifier [BO-SPEC-006.AC1]", async () => {
      const ctx = {
        auth: {
          getUserIdentity: async () => ({
            tokenIdentifier: "https://clerk.example.com|user_42",
            subject: "user_42",
          }),
        },
      };
      const wrapped = monitored(
        "mutation:demo",
        async () => {
          throw new Error("user-auto-fail");
        },
        { dsn: TEST_DSN },
      );
      await expect(wrapped(ctx, {})).rejects.toThrow();
      const body = String(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body,
      );
      expect(body).toContain('"user"');
      expect(body).toContain('"id":"https://clerk.example.com|user_42"');
    });

    it("does not throw if ctx.auth.getUserIdentity itself fails during error capture [BO-SPEC-006.AC1]", async () => {
      const ctx = {
        auth: {
          getUserIdentity: async () => {
            throw new Error("auth-resolution-failed");
          },
        },
      };
      const wrapped = monitored(
        "action:demo",
        async () => {
          throw new Error("primary-fail");
        },
        { dsn: TEST_DSN },
      );
      // Original error must still surface; auth failure during capture is swallowed.
      await expect(wrapped(ctx, {})).rejects.toThrow("primary-fail");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("scope.setUser overrides the auto-resolved user [BO-SPEC-006.AC1]", async () => {
      const ctx = {
        auth: {
          getUserIdentity: async () => ({
            tokenIdentifier: "auto-user",
          }),
        },
      };
      const wrapped = monitored(
        "action:demo",
        async (_ctx, _args, scope) => {
          scope.setUser({ id: "explicit-user" });
          throw new Error("override-fail");
        },
        { dsn: TEST_DSN },
      );
      await expect(wrapped(ctx, {})).rejects.toThrow();
      const body = String(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body,
      );
      expect(body).toContain('"id":"explicit-user"');
      expect(body).not.toContain('"id":"auto-user"');
    });

    it("merges static opts.context with handler name and dynamic scope context [BO-SPEC-006.AC1]", async () => {
      const wrapped = monitored(
        "action:demo",
        async (_ctx, _args, scope) => {
          scope.setContext("dynamic", { runtime: "node" });
          throw new Error("merge-fail");
        },
        {
          dsn: TEST_DSN,
          context: { staticContext: { region: "us-east" } } as Record<
            string,
            unknown
          >,
        },
      );
      await expect(wrapped({}, {})).rejects.toThrow("merge-fail");
      const body = String(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body,
      );
      expect(body).toContain('"handler":"action:demo"');
      expect(body).toContain('"region":"us-east"');
      expect(body).toContain('"runtime":"node"');
    });
  });
});
