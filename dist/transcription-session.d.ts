/**
 * Main transcription session orchestrator
 */
import { AudioConfig, TranscriptionConfig, TranscriptionStatus } from "./types.js";
export declare class TranscriptionSession {
    private audioCapturer;
    private audioProcessor;
    private transcriptionService;
    private transcriptManager;
    private status;
    constructor(audioConfig: AudioConfig, transcriptionConfig: TranscriptionConfig, outfile: string);
    /**
     * Start the transcription session
     */
    start(): Promise<void>;
    /**
     * Handle incoming audio data
     */
    private handleAudioData;
    /**
     * Handle errors from audio capture
     */
    private handleError;
    /**
     * Stop the transcription session
     */
    stop(): Promise<void>;
    /**
     * Get current session status
     */
    getStatus(): TranscriptionStatus;
    /**
     * Get the transcript content
     */
    getTranscript(): string;
    /**
     * Clear the transcript
     */
    clearTranscript(): void;
    /**
     * Get the transcript file path
     */
    getTranscriptPath(): string;
}
//# sourceMappingURL=transcription-session.d.ts.map