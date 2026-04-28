import * as Sentry from "@sentry/nextjs";
import { initSentry } from "@/lib/monitoring/sentry";

export function register(): void {
  initSentry();
}

export const onRequestError = Sentry.captureRequestError;
