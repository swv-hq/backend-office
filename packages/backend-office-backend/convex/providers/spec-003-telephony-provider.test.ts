import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { TelephonyProvider } from "./telephony";
import { TwilioTelephonyProvider } from "./twilio";
import { getTelephonyProvider } from "./index";

const okJson = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body,
});

describe("BO-SPEC-003: Telephony Provider", () => {
  describe("TelephonyProvider interface [BO-SPEC-003.AC3]", () => {
    it("declares all required methods", () => {
      const provider: TelephonyProvider = new TwilioTelephonyProvider({
        accountSid: "AC_test",
        authToken: "tok",
        twimlAppSid: "AP_test",
        voicemailRecordingFetchSid: undefined,
      });
      expect(typeof provider.provisionPhoneNumber).toBe("function");
      expect(typeof provider.configureCallForwarding).toBe("function");
      expect(typeof provider.sendSms).toBe("function");
      expect(typeof provider.getVoicemailRecordingUrl).toBe("function");
      expect(typeof provider.initiateOutboundCall).toBe("function");
    });
  });

  describe("TwilioTelephonyProvider [BO-SPEC-003.AC8]", () => {
    let fetchSpy: ReturnType<typeof vi.fn>;
    let provider: TwilioTelephonyProvider;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      provider = new TwilioTelephonyProvider({
        accountSid: "AC123",
        authToken: "secret-token",
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("provisions a phone number against the IncomingPhoneNumbers endpoint", async () => {
      fetchSpy.mockResolvedValue(
        okJson({ sid: "PN_abc", phone_number: "+15555550100" }),
      );
      const out = await provider.provisionPhoneNumber({
        areaCode: "555",
        friendlyName: "Acme Plumbing",
      });
      expect(out.phoneNumber).toBe("+15555550100");
      expect(out.providerSid).toBe("PN_abc");
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        "https://api.twilio.com/2010-04-01/Accounts/AC123/IncomingPhoneNumbers.json",
      );
      expect(init.method).toBe("POST");
      const headers = init.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe(
        `Basic ${Buffer.from("AC123:secret-token").toString("base64")}`,
      );
      expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
      const body = new URLSearchParams(init.body as string);
      expect(body.get("AreaCode")).toBe("555");
      expect(body.get("FriendlyName")).toBe("Acme Plumbing");
    });

    it("configures call forwarding by updating the phone number's voice URL", async () => {
      fetchSpy.mockResolvedValue(okJson({ sid: "PN_abc" }));
      await provider.configureCallForwarding({
        providerSid: "PN_abc",
        voiceUrl: "https://example.com/forward.xml",
        voiceMethod: "POST",
      });
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        "https://api.twilio.com/2010-04-01/Accounts/AC123/IncomingPhoneNumbers/PN_abc.json",
      );
      expect(init.method).toBe("POST");
      const body = new URLSearchParams(init.body as string);
      expect(body.get("VoiceUrl")).toBe("https://example.com/forward.xml");
      expect(body.get("VoiceMethod")).toBe("POST");
    });

    it("sends an SMS via the Messages endpoint", async () => {
      fetchSpy.mockResolvedValue(okJson({ sid: "SM_abc", status: "queued" }));
      const out = await provider.sendSms({
        from: "+15555550100",
        to: "+15555550199",
        body: "Sorry I missed your call.",
      });
      expect(out.providerMessageSid).toBe("SM_abc");
      expect(out.status).toBe("queued");
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        "https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json",
      );
      const body = new URLSearchParams(init.body as string);
      expect(body.get("From")).toBe("+15555550100");
      expect(body.get("To")).toBe("+15555550199");
      expect(body.get("Body")).toBe("Sorry I missed your call.");
    });

    it("returns the playable URL for a voicemail recording", async () => {
      fetchSpy.mockResolvedValue(
        okJson({
          sid: "RE_abc",
          uri: "/2010-04-01/Accounts/AC123/Recordings/RE_abc.json",
        }),
      );
      const out = await provider.getVoicemailRecordingUrl({
        recordingSid: "RE_abc",
      });
      expect(out.url).toBe(
        "https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE_abc.mp3",
      );
    });

    it("initiates an outbound call via the Calls endpoint", async () => {
      fetchSpy.mockResolvedValue(okJson({ sid: "CA_abc", status: "queued" }));
      const out = await provider.initiateOutboundCall({
        from: "+15555550100",
        to: "+15555550199",
        twimlUrl: "https://example.com/twiml.xml",
      });
      expect(out.providerCallSid).toBe("CA_abc");
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        "https://api.twilio.com/2010-04-01/Accounts/AC123/Calls.json",
      );
      const body = new URLSearchParams(init.body as string);
      expect(body.get("From")).toBe("+15555550100");
      expect(body.get("To")).toBe("+15555550199");
      expect(body.get("Url")).toBe("https://example.com/twiml.xml");
    });

    it("throws on a non-2xx Twilio response", async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => '{"code":21211,"message":"Invalid To"}',
      });
      await expect(
        provider.sendSms({ from: "+1", to: "x", body: "hi" }),
      ).rejects.toThrow(/400/);
    });
  });

  describe("Provider registry [BO-SPEC-003.AC10]", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("returns a TwilioTelephonyProvider when both Twilio env vars are set", () => {
      process.env.TWILIO_ACCOUNT_SID = "AC_x";
      process.env.TWILIO_AUTH_TOKEN = "tok";
      const provider = getTelephonyProvider();
      expect(provider).toBeInstanceOf(TwilioTelephonyProvider);
    });

    it("throws if TWILIO_ACCOUNT_SID is missing", () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      process.env.TWILIO_AUTH_TOKEN = "tok";
      expect(() => getTelephonyProvider()).toThrow(/TWILIO_ACCOUNT_SID/);
    });

    it("throws if TWILIO_AUTH_TOKEN is missing", () => {
      process.env.TWILIO_ACCOUNT_SID = "AC_x";
      delete process.env.TWILIO_AUTH_TOKEN;
      expect(() => getTelephonyProvider()).toThrow(/TWILIO_AUTH_TOKEN/);
    });
  });
});
