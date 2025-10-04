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
    statusChangeCallback;
    status = {
        isRunning: false,
        chunksProcessed: 0,
        errors: 0,
        consecutiveSilentChunks: 0,
        silentChunksSkipped: 0,
        isPaused: false,
    };
    // Configuration for silence detection
    SILENCE_THRESHOLD = 4; // Number of consecutive silent chunks before pausing
    SILENCE_AMPLITUDE_THRESHOLD = 500; // Amplitude threshold for silence detection (increased to avoid Whisper hallucinations on ambient noise)
    // Configuration for inactivity-based auto-pause
    INACTIVITY_AUTO_PAUSE_MINUTES = 30; // Auto-pause after 30 minutes of NO user interaction
    inactivityPauseTriggered = false;
    constructor(audioConfig, transcriptionConfig, outfile, statusChangeCallback, version) {
        this.audioCapturer = new AudioCapturer(audioConfig);
        this.audioProcessor = new AudioProcessor(audioConfig);
        this.transcriptionService = new TranscriptionService(transcriptionConfig);
        this.transcriptManager = new TranscriptManager(outfile, version);
        this.statusChangeCallback = statusChangeCallback;
    }
    /**
     * Emit a status change event
     */
    emitStatusChange(event) {
        if (this.statusChangeCallback) {
            this.statusChangeCallback(event);
        }
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
            lastInteractionTime: new Date(), // Initialize interaction time
            chunksProcessed: 0,
            errors: 0,
            consecutiveSilentChunks: 0,
            silentChunksSkipped: 0,
            isPaused: false,
            warning: undefined,
        };
        // Start audio capture
        await this.audioCapturer.startCapture((chunk) => this.handleAudioData(chunk), (error) => this.handleError(error));
        // Emit started event
        this.emitStatusChange({ type: 'started', timestamp: new Date() });
    }
    /**
     * Handle incoming audio data
     */
    handleAudioData(chunk) {
        this.audioProcessor.processChunk(chunk, async (wavBuffer) => {
            try {
                // ALWAYS check audio first - even when paused (needed for auto-resume detection)
                // WAV has 44-byte header, so skip it to get PCM data
                const pcmData = wavBuffer.subarray(44);
                const isSilent = isSilentAudio(pcmData, this.SILENCE_AMPLITUDE_THRESHOLD);
                // Check if we're paused and should auto-resume
                if (this.status.isPaused) {
                    // If paused due to manual action, stay paused regardless of audio
                    if (this.status.pauseReason === 'manual') {
                        debugLog(`⏸️ Manual pause active - skipping chunk (use resume_transcription to continue)`);
                        return;
                    }
                    // If paused due to silence, check if audio has returned
                    if (this.status.pauseReason === 'silence') {
                        if (!isSilent) {
                            // Audio detected! Auto-resume
                            debugLog(`🎵 Audio detected while paused - AUTO-RESUMING transcription`);
                            this.status.isPaused = false;
                            this.status.pauseReason = undefined;
                            this.status.consecutiveSilentChunks = 0;
                            this.status.warning = undefined;
                            // Write to transcript file
                            this.transcriptManager.appendSystemMessage(`✅ TRANSCRIPTION AUTO-RESUMED: Audio detected after silence. Transcription continuing...`);
                            // Emit resumed event
                            this.emitStatusChange({
                                type: 'resumed',
                                previousReason: 'silence',
                                timestamp: new Date()
                            });
                            // Fall through to process this audio chunk
                        }
                        else {
                            // Still silent, stay paused
                            debugLog(`🔇 Still silent while paused - waiting for audio...`);
                            return;
                        }
                    }
                }
                if (isSilent) {
                    // CRITICAL: Increment silent chunks skipped counter (cost savings!)
                    this.status.silentChunksSkipped = (this.status.silentChunksSkipped || 0) + 1;
                    this.status.consecutiveSilentChunks = (this.status.consecutiveSilentChunks || 0) + 1;
                    // Calculate cost savings (OpenAI Whisper: $0.006 per minute)
                    const chunkDuration = this.audioProcessor.getBufferSize() /
                        (this.status.chunksProcessed > 0 ? this.status.chunksProcessed : 1);
                    const costPerChunk = (chunkDuration / 60) * 0.006;
                    const totalSavings = (this.status.silentChunksSkipped * costPerChunk).toFixed(4);
                    debugLog(`💰 Silent chunk #${this.status.silentChunksSkipped} SKIPPED (${this.status.consecutiveSilentChunks}/${this.SILENCE_THRESHOLD}) - NOT sent to OpenAI - Total savings: $${totalSavings}`);
                    // Emit silence detected event
                    this.emitStatusChange({
                        type: 'silence_detected',
                        consecutiveChunks: this.status.consecutiveSilentChunks,
                        timestamp: new Date()
                    });
                    // Check if we've hit the silence threshold
                    if (this.status.consecutiveSilentChunks >= this.SILENCE_THRESHOLD && !this.status.isPaused) {
                        this.status.isPaused = true;
                        this.status.pauseReason = 'silence';
                        this.status.warning = `Audio capture appears to be inactive. No audio detected for ${this.SILENCE_THRESHOLD} consecutive chunks. Transcription paused. Please check your audio input device and routing.`;
                        debugLog(`⚠️  ${this.status.warning}`);
                        // IMPORTANT: Write to transcript file so user sees why there's a gap
                        this.transcriptManager.appendSystemMessage(`⚠️ TRANSCRIPTION AUTO-PAUSED: No audio detected for ${this.SILENCE_THRESHOLD} consecutive chunks (${this.SILENCE_THRESHOLD * 8} seconds). ` +
                            `Please check your audio input device and routing. Transcription will auto-resume when audio is detected.`);
                        // Emit paused event
                        this.emitStatusChange({
                            type: 'paused',
                            reason: 'silence',
                            message: this.status.warning,
                            timestamp: new Date()
                        });
                    }
                    // GUARD: Early return - NEVER send silent chunks to OpenAI Whisper API
                    return;
                }
                // Reset silent chunk counter if we get real audio
                if ((this.status.consecutiveSilentChunks ?? 0) > 0) {
                    debugLog(`Audio detected, resetting silent chunk counter (was ${this.status.consecutiveSilentChunks})`);
                    this.status.consecutiveSilentChunks = 0;
                    // Emit audio detected event
                    this.emitStatusChange({ type: 'audio_detected', timestamp: new Date() });
                    this.status.warning = undefined;
                }
                // ✅ ONLY REAL AUDIO REACHES THIS POINT
                // Silent chunks are filtered out above and NEVER sent to OpenAI
                // This saves API costs and improves transcript quality
                debugLog(`🎤 Sending audio chunk to OpenAI Whisper API for transcription...`);
                const entry = await this.transcriptionService.transcribe(wavBuffer);
                if (entry) {
                    this.transcriptManager.append(entry);
                    this.status.chunksProcessed++;
                    this.status.lastTranscriptTime = new Date();
                    // Log to debug file (stdout corrupts MCP protocol)
                    debugLog(`✅ Transcribed: ${entry.text}`);
                }
                // ALWAYS check for inactivity, even if transcription failed
                // This ensures the safety mechanism works even during API issues
                this.checkLongSessionWarnings();
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
        // Update interaction time - user is interacting
        this.status.lastInteractionTime = new Date();
        debugLog(`Manually pausing transcription...`);
        this.status.isPaused = true;
        this.status.pauseReason = 'manual';
        this.status.warning = 'Transcription manually paused by user';
        // Write to transcript file
        this.transcriptManager.appendSystemMessage(`⏸️ TRANSCRIPTION PAUSED: User manually paused transcription. Use resume_transcription to continue.`);
        // Emit paused event
        this.emitStatusChange({
            type: 'paused',
            reason: 'manual',
            message: this.status.warning,
            timestamp: new Date()
        });
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
        // Update interaction time - user is interacting
        this.status.lastInteractionTime = new Date();
        // CRITICAL: Reset inactivity flag so auto-pause can trigger again if needed
        this.inactivityPauseTriggered = false;
        const previousReason = this.status.pauseReason;
        debugLog(`Resuming transcription (was paused due to: ${previousReason})...`);
        this.status.isPaused = false;
        this.status.pauseReason = undefined;
        this.status.consecutiveSilentChunks = 0;
        this.status.warning = undefined;
        // Write to transcript file
        this.transcriptManager.appendSystemMessage(`▶️ TRANSCRIPTION RESUMED: User manually resumed transcription after ${previousReason} pause.`);
        // Emit resumed event
        this.emitStatusChange({
            type: 'resumed',
            previousReason: previousReason,
            timestamp: new Date()
        });
    }
    /**
     * Stop the transcription session
     */
    async stop() {
        if (!this.status.isRunning) {
            return;
        }
        const duration = this.status.startTime
            ? Math.floor((Date.now() - this.status.startTime.getTime()) / 1000)
            : 0;
        debugLog(`Stopping transcription session...`);
        this.audioCapturer.stop();
        this.audioProcessor.reset();
        this.status.isRunning = false;
        // Emit stopped event
        this.emitStatusChange({
            type: 'stopped',
            stats: {
                chunksProcessed: this.status.chunksProcessed,
                duration: duration,
                errors: this.status.errors
            },
            timestamp: new Date()
        });
        // Give a moment for any pending operations to complete
        await sleep(250);
    }
    /**
     * Get current session status
     * Also updates lastInteractionTime to track user activity
     */
    getStatus() {
        // Update last interaction time - user is actively monitoring
        if (this.status.isRunning) {
            this.status.lastInteractionTime = new Date();
        }
        return { ...this.status };
    }
    /**
     * Get the transcript content
     * Also updates lastInteractionTime to track user activity
     */
    getTranscript() {
        // Update last interaction time - user is actively monitoring
        if (this.status.isRunning) {
            this.status.lastInteractionTime = new Date();
        }
        return this.transcriptManager.getContent();
    }
    /**
     * Clear the transcript
     * Also updates lastInteractionTime to track user activity
     */
    clearTranscript() {
        // Update last interaction time - user is interacting
        if (this.status.isRunning) {
            this.status.lastInteractionTime = new Date();
        }
        this.transcriptManager.clear();
    }
    /**
     * Get the transcript file path
     */
    getTranscriptPath() {
        return this.transcriptManager.getFilePath();
    }
    /**
     * Check for user inactivity and auto-pause as safety mechanism
     * Prevents accidental 24-hour recordings when user forgets they're recording
     *
     * Logic: If user hasn't interacted (get_status, pause, resume, etc.) for 30 minutes,
     * auto-pause the session and force them to explicitly acknowledge and resume.
     */
    checkLongSessionWarnings() {
        if (!this.status.lastInteractionTime || this.status.isPaused)
            return;
        const minutesSinceLastInteraction = Math.floor((Date.now() - this.status.lastInteractionTime.getTime()) / 60000);
        // AUTO-PAUSE after 30 minutes of NO user interaction
        if (minutesSinceLastInteraction >= this.INACTIVITY_AUTO_PAUSE_MINUTES && !this.inactivityPauseTriggered) {
            this.inactivityPauseTriggered = true;
            // Auto-pause the session
            this.status.isPaused = true;
            this.status.pauseReason = 'manual'; // Requires explicit resume
            const totalElapsedMinutes = this.status.startTime
                ? Math.floor((Date.now() - this.status.startTime.getTime()) / 60000)
                : 0;
            const warningMessage = `⏰ INACTIVITY AUTO-PAUSE: No user interaction for ${minutesSinceLastInteraction} minutes. ` +
                `Auto-paused as a safety mechanism to prevent forgotten recordings and excessive API costs. ` +
                `Total session time: ${totalElapsedMinutes} minutes. ` +
                `To continue recording, call resume_transcription. Otherwise, call stop_transcription.`;
            this.status.warning = warningMessage;
            debugLog(`⏰ ${warningMessage}`);
            // IMPORTANT: Write to transcript so user sees why it paused
            this.transcriptManager.appendSystemMessage(`⏰ TRANSCRIPTION AUTO-PAUSED: No user interaction detected for ${minutesSinceLastInteraction} minutes. ` +
                `Auto-paused as a safety mechanism to prevent forgotten recordings. ` +
                `Total recording time: ${totalElapsedMinutes} minutes. ` +
                `This is NORMAL and SAFE. If you want to continue recording, use resume_transcription. ` +
                `If you're done, use stop_transcription to end the session. ` +
                `Estimated API cost so far: ~$${(this.status.chunksProcessed * 8 / 60 * 0.006).toFixed(3)} (${this.status.chunksProcessed} chunks processed)`);
            // Emit paused event
            this.emitStatusChange({
                type: 'paused',
                reason: 'manual',
                message: warningMessage,
                timestamp: new Date()
            });
            debugLog(`⏸️  Session auto-paused after ${minutesSinceLastInteraction} minutes of inactivity (total runtime: ${totalElapsedMinutes} min)`);
        }
    }
}
//# sourceMappingURL=transcription-session.js.map