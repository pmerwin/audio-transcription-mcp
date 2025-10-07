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
    private chunkSeconds;
    private status;
    private readonly SILENCE_THRESHOLD;
    private readonly SILENCE_AMPLITUDE_THRESHOLD;
    private readonly INACTIVITY_AUTO_PAUSE_MINUTES;
    private inactivityPauseTriggered;
    private readonly WHISPER_COST_PER_MINUTE;
    constructor(audioConfig: AudioConfig, transcriptionConfig: TranscriptionConfig, outfile: string, statusChangeCallback?: StatusChangeCallback, version?: string);
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
     * Also updates lastInteractionTime to track user activity
     */
    getStatus(): TranscriptionStatus;
    /**
     * Get the transcript content
     * Also updates lastInteractionTime to track user activity
     */
    getTranscript(): string;
    /**
     * Clear the transcript
     * Also updates lastInteractionTime to track user activity
     */
    clearTranscript(): void;
    /**
     * Get the transcript file path
     */
    getTranscriptPath(): string;
    /**
     * Check for user inactivity and auto-pause as safety mechanism
     * Prevents accidental 24-hour recordings when user forgets they're recording
     *
     * Logic: If user hasn't interacted (get_status, pause, resume, etc.) for 30 minutes,
     * auto-pause the session and force them to explicitly acknowledge and resume.
     */
    private checkLongSessionWarnings;
}
//# sourceMappingURL=transcription-session.d.ts.map