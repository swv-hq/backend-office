import type {
  ConfigureCallForwardingInput,
  GetVoicemailRecordingInput,
  GetVoicemailRecordingResult,
  InitiateOutboundCallInput,
  InitiateOutboundCallResult,
  ProvisionPhoneNumberInput,
  ProvisionPhoneNumberResult,
  SendSmsInput,
  SendSmsResult,
  TelephonyProvider,
} from "./telephony";

const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

export interface TwilioTelephonyProviderConfig {
  accountSid: string;
  authToken: string;
  twimlAppSid?: string;
  voicemailRecordingFetchSid?: string;
}

interface TwilioPhoneNumberResponse {
  sid: string;
  phone_number?: string;
}

interface TwilioMessageResponse {
  sid: string;
  status: string;
}

interface TwilioCallResponse {
  sid: string;
  status: string;
}

export class TwilioTelephonyProvider implements TelephonyProvider {
  private readonly accountSid: string;
  private readonly authHeader: string;

  constructor(config: TwilioTelephonyProviderConfig) {
    this.accountSid = config.accountSid;
    const credentials = `${config.accountSid}:${config.authToken}`;
    this.authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`;
  }

  async provisionPhoneNumber(
    input: ProvisionPhoneNumberInput,
  ): Promise<ProvisionPhoneNumberResult> {
    const params = new URLSearchParams();
    if (input.areaCode) params.set("AreaCode", input.areaCode);
    if (input.friendlyName) params.set("FriendlyName", input.friendlyName);
    const data = await this.postForm<TwilioPhoneNumberResponse>(
      `/Accounts/${this.accountSid}/IncomingPhoneNumbers.json`,
      params,
    );
    if (!data.phone_number) {
      throw new Error("Twilio response missing phone_number");
    }
    return { phoneNumber: data.phone_number, providerSid: data.sid };
  }

  async configureCallForwarding(
    input: ConfigureCallForwardingInput,
  ): Promise<void> {
    const params = new URLSearchParams();
    params.set("VoiceUrl", input.voiceUrl);
    params.set("VoiceMethod", input.voiceMethod ?? "POST");
    await this.postForm(
      `/Accounts/${this.accountSid}/IncomingPhoneNumbers/${input.providerSid}.json`,
      params,
    );
  }

  async sendSms(input: SendSmsInput): Promise<SendSmsResult> {
    const params = new URLSearchParams();
    params.set("From", input.from);
    params.set("To", input.to);
    params.set("Body", input.body);
    const data = await this.postForm<TwilioMessageResponse>(
      `/Accounts/${this.accountSid}/Messages.json`,
      params,
    );
    return { providerMessageSid: data.sid, status: data.status };
  }

  async getVoicemailRecordingUrl(
    input: GetVoicemailRecordingInput,
  ): Promise<GetVoicemailRecordingResult> {
    return {
      url: `${TWILIO_API_BASE}/Accounts/${this.accountSid}/Recordings/${input.recordingSid}.mp3`,
    };
  }

  async initiateOutboundCall(
    input: InitiateOutboundCallInput,
  ): Promise<InitiateOutboundCallResult> {
    const params = new URLSearchParams();
    params.set("From", input.from);
    params.set("To", input.to);
    params.set("Url", input.twimlUrl);
    const data = await this.postForm<TwilioCallResponse>(
      `/Accounts/${this.accountSid}/Calls.json`,
      params,
    );
    return { providerCallSid: data.sid, status: data.status };
  }

  private async postForm<T>(path: string, params: URLSearchParams): Promise<T> {
    const response = await fetch(`${TWILIO_API_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!response.ok) {
      const detail = await safeReadError(response);
      throw new Error(`Twilio API error ${response.status}: ${detail}`);
    }
    return (await response.json()) as T;
  }
}

async function safeReadError(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return response.statusText;
  }
}
