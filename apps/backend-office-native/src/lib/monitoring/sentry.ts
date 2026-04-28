import * as Sentry from "@sentry/react-native";

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";
const ENVIRONMENT =
  process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ??
  (__DEV__ ? "development" : "production");
const RELEASE = process.env.EXPO_PUBLIC_SENTRY_RELEASE;

export function initSentry(): void {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: ENVIRONMENT,
    release: RELEASE,
    tracesSampleRate: 0,
    enableAutoPerformanceTracing: false,
  });
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  Sentry.captureException(error, {
    contexts: context ? { app: context } : undefined,
  });
}
