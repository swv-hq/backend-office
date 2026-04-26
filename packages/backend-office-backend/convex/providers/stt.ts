export interface TranscribeAudioInput {
  url?: string;
  audioBytes?: Uint8Array;
  contentType?: string;
  languages?: string[];
}

export interface TranscribeAudioResult {
  transcript: string;
  confidence?: number;
  language?: string;
  durationSeconds?: number;
}

export interface TranscribeStreamInput {
  languages?: string[];
  onTranscript: (chunk: { text: string; isFinal: boolean }) => void;
}

export interface TranscribeStreamHandle {
  send(audioChunk: Uint8Array): Promise<void>;
  close(): Promise<void>;
}

export interface STTProvider {
  transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioResult>;
  transcribeStream(
    input: TranscribeStreamInput,
  ): Promise<TranscribeStreamHandle>;
}
