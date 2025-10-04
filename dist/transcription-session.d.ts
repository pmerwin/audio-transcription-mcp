/**
 * Main transcription session orchestrator
 */
import { AudioConfig, TranscriptionConfig, TranscriptionStatus, StatusChangeCallback } from "./types.js";
export declare class TranscriptionSession {
    private audioCapturer;
    private audioProcessor;
    private transcriptionService;
    private transcriptManager;
    private statusChangeCallback?;
    private status;
    private readonly SILENCE_THRESHOLD;
    private readonly SILENCE_AMPLITUDE_THRESHOLD;
    constructor(audioConfig: AudioConfig, transcriptionConfig: TranscriptionConfig, outfile: string, statusChangeCallback?: StatusChangeCallback);
    /**
     * Emit a status change event
     */
    private emitStatusChange;
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
     * Manually pause transcription
     */
    pause(): void;
    /**
     * Resume transcription after being paused (manual or automatic)
     */
    resume(): void;
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