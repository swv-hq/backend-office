import type {
  AIProvider,
  CustomerReplyAnalysis,
  EstimateContext,
  EstimateDraft,
  ParsedContact,
} from "./ai";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MAX_TOKENS = 2048;

export interface ClaudeAIProviderConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
}

interface AnthropicMessageResponse {
  content: Array<{ type: string; text?: string }>;
}

export class ClaudeAIProvider implements AIProvider {
  readonly model: string;
  private readonly apiKey: string;
  private readonly maxTokens: number;

  constructor(config: ClaudeAIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  async summarizeText(text: string): Promise<string> {
    const prompt =
      "Summarize the following text in 2-3 sentences for a busy contractor. " +
      "Focus on the customer's request, urgency, and any contact details.\n\n" +
      text;
    return this.completeText(prompt);
  }

  async generateEstimateFromTranscript(
    transcript: string,
    context?: EstimateContext,
  ): Promise<EstimateDraft> {
    const ctx = context
      ? `Trade: ${context.trade ?? "unknown"}. Zip: ${context.zipCode ?? "unknown"}.\n`
      : "";
    const prompt =
      `${ctx}Generate a job estimate from this transcript. Respond with JSON only ` +
      `matching: { title: string, lineItems: [{ description, quantity, unit, unitPrice, total, type }], total: number, notes?: string }. ` +
      `Prices are in cents.\n\nTranscript:\n${transcript}`;
    return this.completeJSON<EstimateDraft>(prompt);
  }

  async adjustEstimateFromVoice(
    current: EstimateDraft,
    voiceInstruction: string,
  ): Promise<EstimateDraft> {
    const prompt =
      `Apply this voice instruction to the existing estimate and return the updated estimate as JSON only, ` +
      `same shape: { title, lineItems[], total, notes? }. Prices in cents.\n\n` +
      `Current estimate:\n${JSON.stringify(current)}\n\n` +
      `Instruction: ${voiceInstruction}`;
    return this.completeJSON<EstimateDraft>(prompt);
  }

  async analyzeCustomerReply(reply: string): Promise<CustomerReplyAnalysis> {
    const prompt =
      `Analyze this customer reply to a contractor's estimate. Respond with JSON only: ` +
      `{ intent: "accept"|"reject"|"question"|"schedule"|"other", sentiment: "positive"|"neutral"|"negative", summary: string }.\n\n` +
      `Reply: ${reply}`;
    return this.completeJSON<CustomerReplyAnalysis>(prompt);
  }

  async parseContactFromVoice(voiceInput: string): Promise<ParsedContact> {
    const prompt =
      `Extract contact details from this voice input. Respond with JSON only: ` +
      `{ firstName?, lastName?, phone? (E.164), email?, address?: { street, unit?, city, state, zip }, notes? }. ` +
      `Omit unknown fields.\n\nInput: ${voiceInput}`;
    return this.completeJSON<ParsedContact>(prompt);
  }

  private async completeText(prompt: string): Promise<string> {
    const data = await this.callAnthropic(prompt);
    return extractText(data).trim();
  }

  private async completeJSON<T>(prompt: string): Promise<T> {
    const data = await this.callAnthropic(prompt);
    const text = extractText(data).trim();
    try {
      return JSON.parse(text) as T;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error(
          `Claude response was not valid JSON: ${text.slice(0, 200)}`,
        );
      }
      return JSON.parse(match[0]) as T;
    }
  }

  private async callAnthropic(
    prompt: string,
  ): Promise<AnthropicMessageResponse> {
    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) {
      const detail = await safeReadError(response);
      throw new Error(`Anthropic API error ${response.status}: ${detail}`);
    }
    return (await response.json()) as AnthropicMessageResponse;
  }
}

function extractText(data: AnthropicMessageResponse): string {
  const block = data.content?.find((b) => b.type === "text");
  if (!block?.text) {
    throw new Error("Anthropic response contained no text content");
  }
  return block.text;
}

async function safeReadError(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return response.statusText;
  }
}
