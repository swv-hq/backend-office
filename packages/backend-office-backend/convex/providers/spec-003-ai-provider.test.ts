import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AIProvider } from "./ai";
import { ClaudeAIProvider } from "./claude";
import { getAIProvider } from "./index";

const fakeAnthropicResponse = (text: string) => ({
  ok: true,
  status: 200,
  json: async () => ({
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-opus-4-7",
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    usage: { input_tokens: 1, output_tokens: 1 },
  }),
});

describe("BO-SPEC-003: AI Provider", () => {
  describe("AIProvider interface [BO-SPEC-003.AC1]", () => {
    it("declares all five required methods on the interface contract", () => {
      // The contract is enforced structurally by TypeScript: assigning a value of
      // type ClaudeAIProvider to AIProvider only compiles if every method exists
      // with a compatible signature. This test fails to compile if any method is
      // missing or wrong-shaped.
      const provider: AIProvider = new ClaudeAIProvider({
        apiKey: "sk-test",
        model: "claude-opus-4-7",
      });
      expect(typeof provider.summarizeText).toBe("function");
      expect(typeof provider.generateEstimateFromTranscript).toBe("function");
      expect(typeof provider.adjustEstimateFromVoice).toBe("function");
      expect(typeof provider.analyzeCustomerReply).toBe("function");
      expect(typeof provider.parseContactFromVoice).toBe("function");
    });
  });

  describe("ClaudeAIProvider [BO-SPEC-003.AC6]", () => {
    let fetchSpy: ReturnType<typeof vi.fn>;
    let provider: ClaudeAIProvider;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      provider = new ClaudeAIProvider({
        apiKey: "sk-test-key",
        model: "claude-opus-4-7",
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("calls the Anthropic Messages API with the configured key and model", async () => {
      fetchSpy.mockResolvedValue(fakeAnthropicResponse("A short summary."));
      await provider.summarizeText("A long voicemail transcript.");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.anthropic.com/v1/messages");
      expect(init.method).toBe("POST");
      const headers = init.headers as Record<string, string>;
      expect(headers["x-api-key"]).toBe("sk-test-key");
      expect(headers["anthropic-version"]).toBe("2023-06-01");
      expect(headers["content-type"]).toBe("application/json");
      const body = JSON.parse(init.body as string);
      expect(body.model).toBe("claude-opus-4-7");
      expect(body.messages).toHaveLength(1);
      expect(body.messages[0].role).toBe("user");
    });

    it("returns the summary text from summarizeText", async () => {
      fetchSpy.mockResolvedValue(
        fakeAnthropicResponse("Customer needs a leak fixed."),
      );
      const out = await provider.summarizeText("transcript");
      expect(out).toBe("Customer needs a leak fixed.");
    });

    it("parses an estimate JSON response from generateEstimateFromTranscript", async () => {
      const estimateJson = JSON.stringify({
        title: "Bathroom faucet replacement",
        lineItems: [
          {
            description: "Moen kitchen faucet",
            quantity: 1,
            unit: "ea",
            unitPrice: 18000,
            total: 18000,
            type: "material",
          },
          {
            description: "Labor",
            quantity: 2,
            unit: "hr",
            unitPrice: 12500,
            total: 25000,
            type: "labor",
          },
        ],
        total: 43000,
      });
      fetchSpy.mockResolvedValue(fakeAnthropicResponse(estimateJson));
      const out = await provider.generateEstimateFromTranscript(
        "Need to replace a kitchen faucet, 2 hours of labor.",
        { trade: "plumber", zipCode: "94110" },
      );
      expect(out.title).toBe("Bathroom faucet replacement");
      expect(out.lineItems).toHaveLength(2);
      expect(out.total).toBe(43000);
    });

    it("parses an adjusted estimate from adjustEstimateFromVoice", async () => {
      const adjusted = JSON.stringify({
        title: "Updated estimate",
        lineItems: [
          {
            description: "Premium faucet upgrade",
            quantity: 1,
            unit: "ea",
            unitPrice: 25000,
            total: 25000,
            type: "material",
          },
        ],
        total: 25000,
      });
      fetchSpy.mockResolvedValue(fakeAnthropicResponse(adjusted));
      const out = await provider.adjustEstimateFromVoice(
        { title: "Original", lineItems: [], total: 0 },
        "Swap to the premium faucet, $250.",
      );
      expect(out.total).toBe(25000);
    });

    it("returns an analysis of a customer reply", async () => {
      const analysis = JSON.stringify({
        intent: "accept",
        sentiment: "positive",
        summary: "Customer accepted the estimate.",
      });
      fetchSpy.mockResolvedValue(fakeAnthropicResponse(analysis));
      const out = await provider.analyzeCustomerReply(
        "Sounds great, let's do it.",
      );
      expect(out.intent).toBe("accept");
      expect(out.sentiment).toBe("positive");
    });

    it("returns parsed contact details from parseContactFromVoice", async () => {
      const contact = JSON.stringify({
        firstName: "Jane",
        lastName: "Doe",
        phone: "+15551234567",
        email: "jane@example.com",
        address: {
          street: "123 Main St",
          city: "San Francisco",
          state: "CA",
          zip: "94110",
        },
      });
      fetchSpy.mockResolvedValue(fakeAnthropicResponse(contact));
      const out = await provider.parseContactFromVoice(
        "Add Jane Doe at 123 Main, SF, 94110, phone 555 123 4567, email jane at example dot com.",
      );
      expect(out.firstName).toBe("Jane");
      expect(out.phone).toBe("+15551234567");
      expect(out.address?.zip).toBe("94110");
    });

    it("throws a useful error when the API responds non-2xx", async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "invalid api key" } }),
        text: async () => '{"error":{"message":"invalid api key"}}',
      });
      await expect(provider.summarizeText("hi")).rejects.toThrow(/401/);
    });
  });

  describe("Provider registry [BO-SPEC-003.AC10]", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("returns a ClaudeAIProvider when ANTHROPIC_API_KEY is set", () => {
      process.env.ANTHROPIC_API_KEY = "sk-test";
      const provider = getAIProvider();
      expect(provider).toBeInstanceOf(ClaudeAIProvider);
    });

    it("throws if ANTHROPIC_API_KEY is missing", () => {
      delete process.env.ANTHROPIC_API_KEY;
      expect(() => getAIProvider()).toThrow(/ANTHROPIC_API_KEY/);
    });

    it("uses ANTHROPIC_MODEL env var when provided", () => {
      process.env.ANTHROPIC_API_KEY = "sk-test";
      process.env.ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
      const provider = getAIProvider() as ClaudeAIProvider;
      expect(provider.model).toBe("claude-haiku-4-5-20251001");
    });
  });
});
