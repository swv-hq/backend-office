import type { AIProvider } from "./ai";
import { ClaudeAIProvider } from "./claude";
import { DeepgramSTTProvider } from "./deepgram";
import type { STTProvider } from "./stt";
import type { PaymentsProvider } from "./payments";
import type { PricingProvider } from "./pricing";
import { StubPricingProvider } from "./pricingStub";
import { StripePaymentsProvider } from "./stripe";
import type { TelephonyProvider } from "./telephony";
import { TwilioTelephonyProvider } from "./twilio";

const DEFAULT_CLAUDE_MODEL = "claude-opus-4-7";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Configure it with \`npx convex env set ${name} <value>\`.`,
    );
  }
  return value;
}

export function getAIProvider(): AIProvider {
  const apiKey = requireEnv("ANTHROPIC_API_KEY");
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_CLAUDE_MODEL;
  return new ClaudeAIProvider({ apiKey, model });
}

export function getSTTProvider(): STTProvider {
  const apiKey = requireEnv("DEEPGRAM_API_KEY");
  const model = process.env.DEEPGRAM_MODEL;
  return new DeepgramSTTProvider({ apiKey, model });
}

export function getTelephonyProvider(): TelephonyProvider {
  const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
  const authToken = requireEnv("TWILIO_AUTH_TOKEN");
  return new TwilioTelephonyProvider({
    accountSid,
    authToken,
    twimlAppSid: process.env.TWILIO_TWIML_APP_SID,
  });
}

export function getPaymentsProvider(): PaymentsProvider {
  const secretKey = requireEnv("STRIPE_SECRET_KEY");
  const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET");
  return new StripePaymentsProvider({ secretKey, webhookSecret });
}

export function getPricingProvider(): PricingProvider {
  const choice = process.env.PRICING_PROVIDER ?? "stub";
  if (choice === "stub") {
    return new StubPricingProvider();
  }
  throw new Error(
    `PRICING_PROVIDER="${choice}" is not a known pricing provider. ` +
      `Set PRICING_PROVIDER=stub or unset it to use the stub.`,
  );
}
