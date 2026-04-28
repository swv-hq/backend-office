/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  setContext: jest.fn(),
  ReactNativeTracing: jest.fn(),
}));

describe("BO-SPEC-006: native Sentry integration [BO-SPEC-006.AC2]", () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    delete process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT;
    jest.resetModules();
  });

  it("initSentry is a no-op when no DSN is configured [BO-SPEC-006.AC2]", () => {
    const Sentry = require("@sentry/react-native");
    const { initSentry } = require("./sentry");
    initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("initSentry forwards DSN and environment to @sentry/react-native [BO-SPEC-006.AC2]", () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = "https://abc@o0.ingest.sentry.io/9";
    process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT = "test";
    const Sentry = require("@sentry/react-native");
    const { initSentry } = require("./sentry");
    initSentry();
    expect(Sentry.init).toHaveBeenCalledTimes(1);
    const config = (Sentry.init as jest.Mock).mock.calls[0][0];
    expect(config.dsn).toBe("https://abc@o0.ingest.sentry.io/9");
    expect(config.environment).toBe("test");
  });

  it("captureException delegates to @sentry/react-native and attaches context [BO-SPEC-006.AC2]", () => {
    const Sentry = require("@sentry/react-native");
    const { captureException } = require("./sentry");
    const err = new Error("native-boom");
    captureException(err, { screen: "EstimateForm" });
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect((Sentry.captureException as jest.Mock).mock.calls[0][0]).toBe(err);
    const opts = (Sentry.captureException as jest.Mock).mock.calls[0][1];
    expect(opts.contexts).toEqual({ app: { screen: "EstimateForm" } });
  });
});
