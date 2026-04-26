export interface ProvisionPhoneNumberInput {
  areaCode?: string;
  friendlyName?: string;
}

export interface ProvisionPhoneNumberResult {
  phoneNumber: string;
  providerSid: string;
}

export interface ConfigureCallForwardingInput {
  providerSid: string;
  voiceUrl: string;
  voiceMethod?: "GET" | "POST";
}

export interface SendSmsInput {
  from: string;
  to: string;
  body: string;
}

export interface SendSmsResult {
  providerMessageSid: string;
  status: string;
}

export interface GetVoicemailRecordingInput {
  recordingSid: string;
}

export interface GetVoicemailRecordingResult {
  url: string;
}

export interface InitiateOutboundCallInput {
  from: string;
  to: string;
  twimlUrl: string;
}

export interface InitiateOutboundCallResult {
  providerCallSid: string;
  status: string;
}

export interface TelephonyProvider {
  provisionPhoneNumber(
    input: ProvisionPhoneNumberInput,
  ): Promise<ProvisionPhoneNumberResult>;
  configureCallForwarding(input: ConfigureCallForwardingInput): Promise<void>;
  sendSms(input: SendSmsInput): Promise<SendSmsResult>;
  getVoicemailRecordingUrl(
    input: GetVoicemailRecordingInput,
  ): Promise<GetVoicemailRecordingResult>;
  initiateOutboundCall(
    input: InitiateOutboundCallInput,
  ): Promise<InitiateOutboundCallResult>;
}
