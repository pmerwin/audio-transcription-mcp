/**
 * Main transcription session orchestrator
 */
import { AudioCapturer } from "./audio-capturer.js";
import { AudioProcessor } from "./audio-processor.js";
import { TranscriptionService } from "./transcription-service.js";
import { TranscriptManager } from "./transcript-manager.js";
import { sleep } from "./utils.js";
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
    };
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
        };
        // Start audio capture
        await this.audioCapturer.startCapture((chunk) => this.handleAudioData(chunk), (error) => this.handleError(error));
    }
    /**
     * Handle incoming audio data
     */
    handleAudioData(chunk) {
        this.audioProcessor.processChunk(chunk, async (wavBuffer) => {
            try {
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