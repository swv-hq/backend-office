import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { PaymentsProvider } from "./payments";
import { StripePaymentsProvider } from "./stripe";
import { getPaymentsProvider } from "./index";
import * as crypto from "node:crypto";

const okJson = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body,
});

describe("BO-SPEC-003: Payments Provider", () => {
  describe("PaymentsProvider interface [BO-SPEC-003.AC4]", () => {
    it("declares all required methods", () => {
      const provider: PaymentsProvider = new StripePaymentsProvider({
        secretKey: "sk_test_x",
        webhookSecret: "whsec_test",
      });
      expect(typeof provider.createConnectExpressAccount).toBe("function");
      expect(typeof provider.linkConnectStandardAccount).toBe("function");
      expect(typeof provider.createCheckoutSession).toBe("function");
      expect(typeof provider.handlePaymentWebhook).toBe("function");
      expect(typeof provider.createSubscription).toBe("function");
      expect(typeof provider.chargeSubscription).toBe("function");
    });
  });

  describe("StripePaymentsProvider [BO-SPEC-003.AC9]", () => {
    let fetchSpy: ReturnType<typeof vi.fn>;
    let provider: StripePaymentsProvider;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      provider = new StripePaymentsProvider({
        secretKey: "sk_test_abc",
        webhookSecret: "whsec_secret",
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("creates an Express connect account with the right form-encoded body", async () => {
      fetchSpy.mockResolvedValue(okJson({ id: "acct_123" }));
      const out = await provider.createConnectExpressAccount({
        email: "contractor@example.com",
        country: "US",
      });
      expect(out.accountId).toBe("acct_123");
      expect(out.accountType).toBe("express");
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.stripe.com/v1/accounts");
      expect(init.method).toBe("POST");
      const headers = init.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer sk_test_abc");
      expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
      const body = new URLSearchParams(init.body as string);
      expect(body.get("type")).toBe("express");
      expect(body.get("country")).toBe("US");
      expect(body.get("email")).toBe("contractor@example.com");
    });

    it("creates a Standard account link for an existing connect account", async () => {
      fetchSpy.mockResolvedValue(
        okJson({
          url: "https://connect.stripe.com/setup/x",
          expires_at: 1000,
        }),
      );
      const out = await provider.linkConnectStandardAccount({
        accountId: "acct_456",
        refreshUrl: "https://app.example/refresh",
        returnUrl: "https://app.example/return",
      });
      expect(out.url).toBe("https://connect.stripe.com/setup/x");
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.stripe.com/v1/account_links");
      const body = new URLSearchParams(init.body as string);
      expect(body.get("account")).toBe("acct_456");
      expect(body.get("type")).toBe("account_onboarding");
      expect(body.get("refresh_url")).toBe("https://app.example/refresh");
      expect(body.get("return_url")).toBe("https://app.example/return");
    });

    it("creates a checkout session and returns its URL", async () => {
      fetchSpy.mockResolvedValue(
        okJson({
          id: "cs_test_123",
          url: "https://checkout.stripe.com/c/cs_test_123",
        }),
      );
      const out = await provider.createCheckoutSession({
        amount: 25000,
        currency: "usd",
        productName: "Bathroom estimate deposit",
        successUrl: "https://app.example/success",
        cancelUrl: "https://app.example/cancel",
        connectedAccountId: "acct_456",
        applicationFeeAmount: 250,
      });
      expect(out.sessionId).toBe("cs_test_123");
      expect(out.url).toBe("https://checkout.stripe.com/c/cs_test_123");
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.stripe.com/v1/checkout/sessions");
      const headers = init.headers as Record<string, string>;
      expect(headers["Stripe-Account"]).toBe("acct_456");
    });

    it("verifies the Stripe-Signature header in handlePaymentWebhook", async () => {
      const payload = JSON.stringify({
        id: "evt_1",
        type: "checkout.session.completed",
        data: { object: { id: "cs_test_1" } },
      });
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = `${timestamp}.${payload}`;
      const signature = crypto
        .createHmac("sha256", "whsec_secret")
        .update(signedPayload)
        .digest("hex");
      const header = `t=${timestamp},v1=${signature}`;

      const event = await provider.handlePaymentWebhook({
        rawBody: payload,
        signatureHeader: header,
      });
      expect(event.type).toBe("checkout.session.completed");
      expect(event.id).toBe("evt_1");
    });

    it("rejects a webhook with an invalid signature", async () => {
      const payload = '{"id":"evt_1","type":"x"}';
      const timestamp = Math.floor(Date.now() / 1000);
      const header = `t=${timestamp},v1=deadbeef`;
      await expect(
        provider.handlePaymentWebhook({
          rawBody: payload,
          signatureHeader: header,
        }),
      ).rejects.toThrow(/signature/i);
    });

    it("creates a subscription against the Subscriptions endpoint", async () => {
      fetchSpy.mockResolvedValue(
        okJson({
          id: "sub_123",
          status: "active",
          current_period_end: 1700000000,
        }),
      );
      const out = await provider.createSubscription({
        customerId: "cus_123",
        priceId: "price_pro_monthly",
      });
      expect(out.subscriptionId).toBe("sub_123");
      expect(out.status).toBe("active");
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.stripe.com/v1/subscriptions");
      const body = new URLSearchParams(init.body as string);
      expect(body.get("customer")).toBe("cus_123");
      expect(body.get("items[0][price]")).toBe("price_pro_monthly");
    });

    it("charges a subscription via PaymentIntents", async () => {
      fetchSpy.mockResolvedValue(okJson({ id: "pi_123", status: "succeeded" }));
      const out = await provider.chargeSubscription({
        customerId: "cus_123",
        amount: 4900,
        currency: "usd",
        description: "April subscription",
      });
      expect(out.paymentIntentId).toBe("pi_123");
      expect(out.status).toBe("succeeded");
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.stripe.com/v1/payment_intents");
      const body = new URLSearchParams(init.body as string);
      expect(body.get("customer")).toBe("cus_123");
      expect(body.get("amount")).toBe("4900");
      expect(body.get("currency")).toBe("usd");
      expect(body.get("confirm")).toBe("true");
      expect(body.get("off_session")).toBe("true");
    });

    it("throws on a non-2xx Stripe response", async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 402,
        text: async () => '{"error":{"message":"card declined"}}',
      });
      await expect(
        provider.chargeSubscription({
          customerId: "cus_x",
          amount: 100,
          currency: "usd",
        }),
      ).rejects.toThrow(/402/);
    });
  });

  describe("Provider registry [BO-SPEC-003.AC10]", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("returns a StripePaymentsProvider when both Stripe env vars are set", () => {
      process.env.STRIPE_SECRET_KEY = "sk_test";
      process.env.STRIPE_WEBHOOK_SECRET = "whsec";
      const provider = getPaymentsProvider();
      expect(provider).toBeInstanceOf(StripePaymentsProvider);
    });

    it("throws if STRIPE_SECRET_KEY is missing", () => {
      delete process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_WEBHOOK_SECRET = "whsec";
      expect(() => getPaymentsProvider()).toThrow(/STRIPE_SECRET_KEY/);
    });

    it("throws if STRIPE_WEBHOOK_SECRET is missing", () => {
      process.env.STRIPE_SECRET_KEY = "sk_test";
      delete process.env.STRIPE_WEBHOOK_SECRET;
      expect(() => getPaymentsProvider()).toThrow(/STRIPE_WEBHOOK_SECRET/);
    });
  });
});
