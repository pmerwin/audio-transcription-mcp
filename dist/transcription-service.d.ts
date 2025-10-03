/**
 * Transcription service using OpenAI Whisper API
 */
import { TranscriptionConfig, TranscriptEntry } from "./types.js";
export declare class TranscriptionService {
    private client;
    private config;
    constructor(config: TranscriptionConfig);
    /**
     * Transcribe an audio buffer (WAV format)
     */
    transcribe(wavBuffer: Buffer): Promise<TranscriptEntry | null>;
    /**
     * Health check - verify API key is valid
     */
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=transcription-service.d.ts.map