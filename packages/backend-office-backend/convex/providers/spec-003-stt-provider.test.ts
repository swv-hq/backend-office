import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { STTProvider } from "./stt";
import { DeepgramSTTProvider } from "./deepgram";
import { getSTTProvider } from "./index";

const fakeBatchResponse = (transcript: string, language = "en") => ({
  ok: true,
  status: 200,
  json: async () => ({
    metadata: { duration: 12.5 },
    results: {
      channels: [
        {
          alternatives: [
            {
              transcript,
              confidence: 0.96,
              languages: [language],
            },
          ],
        },
      ],
    },
  }),
});

describe("BO-SPEC-003: STT Provider", () => {
  describe("STTProvider interface [BO-SPEC-003.AC2]", () => {
    it("declares transcribeAudio (batch) and transcribeStream methods", () => {
      const provider: STTProvider = new DeepgramSTTProvider({
        apiKey: "dg-test",
      });
      expect(typeof provider.transcribeAudio).toBe("function");
      expect(typeof provider.transcribeStream).toBe("function");
    });
  });

  describe("DeepgramSTTProvider [BO-SPEC-003.AC7]", () => {
    let fetchSpy: ReturnType<typeof vi.fn>;
    let provider: DeepgramSTTProvider;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      provider = new DeepgramSTTProvider({ apiKey: "dg-test-key" });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("calls Deepgram listen API with the configured key when given a URL", async () => {
      fetchSpy.mockResolvedValue(
        fakeBatchResponse("Hello, this is a voicemail."),
      );
      const out = await provider.transcribeAudio({
        url: "https://example.com/voicemail.mp3",
        languages: ["en", "es"],
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toMatch(/^https:\/\/api\.deepgram\.com\/v1\/listen\?/);
      expect(url).toContain("detect_language=true");
      expect(init.method).toBe("POST");
      const headers = init.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Token dg-test-key");
      expect(headers["Content-Type"]).toBe("application/json");
      const body = JSON.parse(init.body as string);
      expect(body.url).toBe("https://example.com/voicemail.mp3");
      expect(out.transcript).toBe("Hello, this is a voicemail.");
      expect(out.confidence).toBeCloseTo(0.96);
      expect(out.language).toBe("en");
      expect(out.durationSeconds).toBeCloseTo(12.5);
    });

    it("posts raw audio bytes when given an audioBytes payload", async () => {
      fetchSpy.mockResolvedValue(fakeBatchResponse("raw audio works"));
      const audio = new Uint8Array([1, 2, 3, 4]);
      await provider.transcribeAudio({
        audioBytes: audio,
        contentType: "audio/wav",
      });
      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBe("audio/wav");
      expect(init.body).toBe(audio);
    });

    it("throws on a non-2xx response", async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => "forbidden",
      });
      await expect(
        provider.transcribeAudio({ url: "https://example.com/x.mp3" }),
      ).rejects.toThrow(/403/);
    });

    it("transcribeStream surfaces a not-implemented error until streaming is wired", async () => {
      // Streaming is part of the interface contract for future use; the batch-first
      // implementation throws explicitly so callers cannot silently get nothing.
      await expect(
        provider.transcribeStream({
          onTranscript: () => undefined,
        }),
      ).rejects.toThrow(/not implemented/i);
    });
  });

  describe("Provider registry [BO-SPEC-003.AC10]", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("returns a DeepgramSTTProvider when DEEPGRAM_API_KEY is set", () => {
      process.env.DEEPGRAM_API_KEY = "dg-test";
      const provider = getSTTProvider();
      expect(provider).toBeInstanceOf(DeepgramSTTProvider);
    });

    it("throws if DEEPGRAM_API_KEY is missing", () => {
      delete process.env.DEEPGRAM_API_KEY;
      expect(() => getSTTProvider()).toThrow(/DEEPGRAM_API_KEY/);
    });
  });
});
