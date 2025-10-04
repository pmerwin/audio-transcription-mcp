/**
 * Main transcription session orchestrator
 */
import { AudioCapturer } from "./audio-capturer.js";
import { AudioProcessor } from "./audio-processor.js";
import { TranscriptionService } from "./transcription-service.js";
import { TranscriptManager } from "./transcript-manager.js";
import { sleep, isSilentAudio } from "./utils.js";
import { appendFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
// Debug logging to file (console interferes with MCP JSON-RPC protocol!)
const DEBUG_LOG = join(homedir(), '.audio-transcription-mcp-debug.log');
function debugLog(message) {
    const ts = new Date().toISOString();
    try {
        appendFileSync(DEBUG_LOG, `[${ts}] ${message}\n`);
    }
    catch (e) {
        // Silently fail if can't write debug log
    }
}
export class TranscriptionSession {
    audioCapturer;
    audioProcessor;
    transcriptionService;
    transcriptManager;
    status = {
        isRunning: false,
        chunksProcessed: 0,
        errors: 0,
        consecutiveSilentChunks: 0,
        isPaused: false,
    };
    // Configuration for silence detection
    SILENCE_THRESHOLD = 4; // Number of consecutive silent chunks before pausing
    SILENCE_AMPLITUDE_THRESHOLD = 100; // Amplitude threshold for silence detection
    constructor(audioConfig, transcriptionConfig, outfile) {
        this.audioCapturer = new AudioCapturer(audioConfig);
        this.audioProcessor = new AudioProcessor(audioConfig);
        this.transcriptionService = new TranscriptionService(transcriptionConfig);
        this.transcriptManager = new TranscriptManager(outfile);
    }
    /**
     * Start the transcription session
     */
    async start() {
        if (this.status.isRunning) {
            throw new Error("Session is already running");
        }
        // Initialize transcript file (each session has unique timestamped filename for privacy)
        this.transcriptManager.initialize();
        // Verify API key is valid
        debugLog(`Verifying OpenAI API key...`);
        const isValid = await this.transcriptionService.healthCheck();
        if (!isValid) {
            throw new Error("Invalid OpenAI API key");
        }
        debugLog(`API key verified successfully`);
        // Reset status
        this.status = {
            isRunning: true,
            startTime: new Date(),
            chunksProcessed: 0,
            errors: 0,
            consecutiveSilentChunks: 0,
            isPaused: false,
            warning: undefined,
        };
        // Start audio capture
        await this.audioCapturer.startCapture((chunk) => this.handleAudioData(chunk), (error) => this.handleError(error));
    }
    /**
     * Handle incoming audio data
     */
    handleAudioData(chunk) {
        this.audioProcessor.processChunk(chunk, async (wavBuffer) => {
            // Skip processing if paused due to silence
            if (this.status.isPaused) {
                return;
            }
            try {
                // Check if the chunk is silent before transcribing
                // WAV has 44-byte header, so skip it to get PCM data
                const pcmData = wavBuffer.subarray(44);
                const isSilent = isSilentAudio(pcmData, this.SILENCE_AMPLITUDE_THRESHOLD);
                if (isSilent) {
                    this.status.consecutiveSilentChunks = (this.status.consecutiveSilentChunks || 0) + 1;
                    debugLog(`Silent chunk detected (${this.status.consecutiveSilentChunks}/${this.SILENCE_THRESHOLD})`);
                    // Check if we've hit the silence threshold
                    if (this.status.consecutiveSilentChunks >= this.SILENCE_THRESHOLD) {
                        this.status.isPaused = true;
                        this.status.pauseReason = 'silence';
                        this.status.warning = `Audio capture appears to be inactive. No audio detected for ${this.SILENCE_THRESHOLD} consecutive chunks. Transcription paused. Please check your audio input device and routing.`;
                        debugLog(`⚠️  ${this.status.warning}`);
                    }
                    return; // Skip transcription for silent chunks
                }
                // Reset silent chunk counter if we get real audio
                if ((this.status.consecutiveSilentChunks ?? 0) > 0) {
                    debugLog(`Audio detected, resetting silent chunk counter (was ${this.status.consecutiveSilentChunks})`);
                    this.status.consecutiveSilentChunks = 0;
                    // Auto-resume if paused due to silence (not manual pause)
                    if (this.status.isPaused && this.status.pauseReason === 'silence') {
                        debugLog(`Auto-resuming transcription after detecting audio`);
                        this.status.isPaused = false;
                        this.status.pauseReason = undefined;
                    }
                    this.status.warning = undefined;
                }
                const entry = await this.transcriptionService.transcribe(wavBuffer);
                if (entry) {
                    this.transcriptManager.append(entry);
                    this.status.chunksProcessed++;
                    this.status.lastTranscriptTime = new Date();
                    // Log to debug file (stdout corrupts MCP protocol)
                    debugLog(`Transcribed: ${entry.text}`);
                }
            }
            catch (err) {
                this.status.errors++;
                debugLog(`Transcription error: ${err.message}`);
            }
        });
    }
    /**
     * Handle errors from audio capture
     */
    handleError(error) {
        this.status.errors++;
        debugLog(`Audio capture error: ${error.message}`);
    }
    /**
     * Manually pause transcription
     */
    pause() {
        if (!this.status.isRunning) {
            throw new Error("Cannot pause: transcription is not running");
        }
        if (this.status.isPaused) {
            throw new Error("Transcription is already paused");
        }
        debugLog(`Manually pausing transcription...`);
        this.status.isPaused = true;
        this.status.pauseReason = 'manual';
        this.status.warning = 'Transcription manually paused by user';
    }
    /**
     * Resume transcription after being paused (manual or automatic)
     */
    resume() {
        if (!this.status.isRunning) {
            throw new Error("Cannot resume: transcription is not running");
        }
        if (!this.status.isPaused) {
            throw new Error("Transcription is not paused");
        }
        const previousReason = this.status.pauseReason;
        debugLog(`Resuming transcription (was paused due to: ${previousReason})...`);
        this.status.isPaused = false;
        this.status.pauseReason = undefined;
        this.status.consecutiveSilentChunks = 0;
        this.status.warning = undefined;
    }
    /**
     * Stop the transcription session
     */
    async stop() {
        if (!this.status.isRunning) {
            return;
        }
        debugLog(`Stopping transcription session...`);
        this.audioCapturer.stop();
        this.audioProcessor.reset();
        this.status.isRunning = false;
        // Give a moment for any pending operations to complete
        await sleep(250);
    }
    /**
     * Get current session status
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * Get the transcript content
     */
    getTranscript() {
        return this.transcriptManager.getContent();
    }
    /**
     * Clear the transcript
     */
    clearTranscript() {
        this.transcriptManager.clear();
    }
    /**
     * Get the transcript file path
     */
    getTranscriptPath() {
        return this.transcriptManager.getFilePath();
    }
}
//# sourceMappingURL=transcription-session.js.map