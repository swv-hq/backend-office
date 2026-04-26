import type { AddressInput, EstimateLineItem, TradeType } from "./types";

export interface EstimateContext {
  trade?: TradeType;
  zipCode?: string;
}

export interface EstimateDraft {
  title: string;
  lineItems: EstimateLineItem[];
  total: number;
  notes?: string;
}

export interface CustomerReplyAnalysis {
  intent: "accept" | "reject" | "question" | "schedule" | "other";
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
}

export interface ParsedContact {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: AddressInput;
  notes?: string;
}

export interface AIProvider {
  summarizeText(text: string): Promise<string>;
  generateEstimateFromTranscript(
    transcript: string,
    context?: EstimateContext,
  ): Promise<EstimateDraft>;
  adjustEstimateFromVoice(
    current: EstimateDraft,
    voiceInstruction: string,
  ): Promise<EstimateDraft>;
  analyzeCustomerReply(reply: string): Promise<CustomerReplyAnalysis>;
  parseContactFromVoice(voiceInput: string): Promise<ParsedContact>;
}
