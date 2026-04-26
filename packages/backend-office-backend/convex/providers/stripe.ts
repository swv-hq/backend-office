import type {
  ChargeSubscriptionInput,
  ChargeSubscriptionResult,
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  CreateConnectAccountResult,
  CreateConnectExpressAccountInput,
  CreateSubscriptionInput,
  CreateSubscriptionResult,
  HandlePaymentWebhookInput,
  LinkConnectStandardAccountInput,
  LinkConnectStandardAccountResult,
  PaymentWebhookEvent,
  PaymentsProvider,
} from "./payments";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

export interface StripePaymentsProviderConfig {
  secretKey: string;
  webhookSecret: string;
}

interface StripeAccountResponse {
  id: string;
}

interface StripeAccountLinkResponse {
  url: string;
  expires_at: number;
}

interface StripeCheckoutSessionResponse {
  id: string;
  url: string;
}

interface StripeSubscriptionResponse {
  id: string;
  status: string;
  current_period_end?: number;
}

interface StripePaymentIntentResponse {
  id: string;
  status: string;
}

export class StripePaymentsProvider implements PaymentsProvider {
  private readonly secretKey: string;
  private readonly webhookSecret: string;

  constructor(config: StripePaymentsProviderConfig) {
    this.secretKey = config.secretKey;
    this.webhookSecret = config.webhookSecret;
  }

  async createConnectExpressAccount(
    input: CreateConnectExpressAccountInput,
  ): Promise<CreateConnectAccountResult> {
    const params = new URLSearchParams();
    params.set("type", "express");
    params.set("email", input.email);
    if (input.country) params.set("country", input.country);
    const data = await this.postForm<StripeAccountResponse>(
      "/accounts",
      params,
    );
    return { accountId: data.id, accountType: "express" };
  }

  async linkConnectStandardAccount(
    input: LinkConnectStandardAccountInput,
  ): Promise<LinkConnectStandardAccountResult> {
    const params = new URLSearchParams();
    params.set("account", input.accountId);
    params.set("type", "account_onboarding");
    params.set("refresh_url", input.refreshUrl);
    params.set("return_url", input.returnUrl);
    const data = await this.postForm<StripeAccountLinkResponse>(
      "/account_links",
      params,
    );
    return { url: data.url, expiresAt: data.expires_at };
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult> {
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", input.successUrl);
    params.set("cancel_url", input.cancelUrl);
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", input.currency);
    params.set("line_items[0][price_data][unit_amount]", String(input.amount));
    params.set(
      "line_items[0][price_data][product_data][name]",
      input.productName,
    );
    if (input.applicationFeeAmount !== undefined) {
      params.set(
        "payment_intent_data[application_fee_amount]",
        String(input.applicationFeeAmount),
      );
    }
    if (input.customerId) params.set("customer", input.customerId);
    const headers = input.connectedAccountId
      ? { "Stripe-Account": input.connectedAccountId }
      : undefined;
    const data = await this.postForm<StripeCheckoutSessionResponse>(
      "/checkout/sessions",
      params,
      headers,
    );
    return { sessionId: data.id, url: data.url };
  }

  async handlePaymentWebhook(
    input: HandlePaymentWebhookInput,
  ): Promise<PaymentWebhookEvent> {
    await verifyStripeSignature(
      input.rawBody,
      input.signatureHeader,
      this.webhookSecret,
    );
    return JSON.parse(input.rawBody) as PaymentWebhookEvent;
  }

  async createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<CreateSubscriptionResult> {
    const params = new URLSearchParams();
    params.set("customer", input.customerId);
    params.set("items[0][price]", input.priceId);
    const data = await this.postForm<StripeSubscriptionResponse>(
      "/subscriptions",
      params,
    );
    return {
      subscriptionId: data.id,
      status: data.status,
      currentPeriodEnd: data.current_period_end,
    };
  }

  async chargeSubscription(
    input: ChargeSubscriptionInput,
  ): Promise<ChargeSubscriptionResult> {
    const params = new URLSearchParams();
    params.set("amount", String(input.amount));
    params.set("currency", input.currency);
    params.set("customer", input.customerId);
    params.set("confirm", "true");
    params.set("off_session", "true");
    if (input.description) params.set("description", input.description);
    const data = await this.postForm<StripePaymentIntentResponse>(
      "/payment_intents",
      params,
    );
    return { paymentIntentId: data.id, status: data.status };
  }

  private async postForm<T>(
    path: string,
    params: URLSearchParams,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const response = await fetch(`${STRIPE_API_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        ...extraHeaders,
      },
      body: params.toString(),
    });
    if (!response.ok) {
      const detail = await safeReadError(response);
      throw new Error(`Stripe API error ${response.status}: ${detail}`);
    }
    return (await response.json()) as T;
  }
}

async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
): Promise<void> {
  const parts = header
    .split(",")
    .reduce<Record<string, string[]>>((acc, part) => {
      const [k, v] = part.split("=");
      if (!k || !v) return acc;
      (acc[k] ??= []).push(v);
      return acc;
    }, {});
  const timestamp = parts["t"]?.[0];
  const signatures = parts["v1"] ?? [];
  if (!timestamp || signatures.length === 0) {
    throw new Error("Invalid Stripe signature header");
  }
  const ageSeconds = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (
    Number.isNaN(ageSeconds) ||
    Math.abs(ageSeconds) > SIGNATURE_TOLERANCE_SECONDS
  ) {
    throw new Error("Stripe signature timestamp outside tolerance window");
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(`${timestamp}.${payload}`),
    ),
  );
  const matched = signatures.some((sig) => {
    const sigBytes = hexToBytes(sig);
    return (
      sigBytes !== null &&
      sigBytes.length === expected.length &&
      timingSafeEqualBytes(sigBytes, expected)
    );
  });
  if (!matched) {
    throw new Error("Invalid Stripe webhook signature");
  }
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = Number.parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) return null;
    out[i] = byte;
  }
  return out;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function safeReadError(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return response.statusText;
  }
}
