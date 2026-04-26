import type {
  STTProvider,
  TranscribeAudioInput,
  TranscribeAudioResult,
  TranscribeStreamHandle,
  TranscribeStreamInput,
} from "./stt";

const DEEPGRAM_LISTEN_URL = "https://api.deepgram.com/v1/listen";

export interface DeepgramSTTProviderConfig {
  apiKey: string;
  model?: string;
}

interface DeepgramBatchResponse {
  metadata?: { duration?: number };
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
        confidence?: number;
        languages?: string[];
      }>;
    }>;
  };
}

export class DeepgramSTTProvider implements STTProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(config: DeepgramSTTProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "nova-2";
  }

  async transcribeAudio(
    input: TranscribeAudioInput,
  ): Promise<TranscribeAudioResult> {
    const params = new URLSearchParams({
      model: this.model,
      punctuate: "true",
      smart_format: "true",
    });
    if (input.languages && input.languages.length > 1) {
      params.set("detect_language", "true");
    } else if (input.languages?.[0]) {
      params.set("language", input.languages[0]);
    } else {
      params.set("detect_language", "true");
    }

    const url = `${DEEPGRAM_LISTEN_URL}?${params.toString()}`;
    const headers: Record<string, string> = {
      Authorization: `Token ${this.apiKey}`,
    };
    let body: BodyInit;
    if (input.url) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({ url: input.url });
    } else if (input.audioBytes) {
      headers["Content-Type"] = input.contentType ?? "application/octet-stream";
      body = input.audioBytes as unknown as BodyInit;
    } else {
      throw new Error("transcribeAudio requires either `url` or `audioBytes`");
    }

    const response = await fetch(url, { method: "POST", headers, body });
    if (!response.ok) {
      const detail = await safeReadError(response);
      throw new Error(`Deepgram API error ${response.status}: ${detail}`);
    }

    const data = (await response.json()) as DeepgramBatchResponse;
    const alt = data.results?.channels?.[0]?.alternatives?.[0];
    if (!alt) {
      throw new Error(
        "Deepgram response contained no transcription alternatives",
      );
    }
    return {
      transcript: alt.transcript ?? "",
      confidence: alt.confidence,
      language: alt.languages?.[0],
      durationSeconds: data.metadata?.duration,
    };
  }

  async transcribeStream(
    input: TranscribeStreamInput,
  ): Promise<TranscribeStreamHandle> {
    void input;
    throw new Error(
      "Deepgram streaming transcription is not implemented yet. Use transcribeAudio for batch jobs.",
    );
  }
}

async function safeReadError(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return response.statusText;
  }
}
