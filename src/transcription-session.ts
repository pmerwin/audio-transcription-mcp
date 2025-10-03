/**
 * Main transcription session orchestrator
 */

import { AudioCapturer } from "./audio-capturer.js";
import { AudioProcessor } from "./audio-processor.js";
import { TranscriptionService } from "./transcription-service.js";
import { TranscriptManager } from "./transcript-manager.js";
import {
  AudioConfig,
  TranscriptionConfig,
  TranscriptionStatus,
} from "./types.js";
import { timestamp, sleep } from "./utils.js";

export class TranscriptionSession {
  private audioCapturer: AudioCapturer;
  private audioProcessor: AudioProcessor;
  private transcriptionService: TranscriptionService;
  private transcriptManager: TranscriptManager;

  private status: TranscriptionStatus = {
    isRunning: false,
    chunksProcessed: 0,
    errors: 0,
  };

  constructor(
    audioConfig: AudioConfig,
    transcriptionConfig: TranscriptionConfig,
    outfile: string
  ) {
    this.audioCapturer = new AudioCapturer(audioConfig);
    this.audioProcessor = new AudioProcessor(audioConfig);
    this.transcriptionService = new TranscriptionService(transcriptionConfig);
    this.transcriptManager = new TranscriptManager(outfile);
  }

  /**
   * Start the transcription session
   */
  async start(): Promise<void> {
    if (this.status.isRunning) {
      throw new Error("Session is already running");
    }

    // Initialize transcript file
    this.transcriptManager.initialize();

    // Verify API key is valid
    console.log(`[${timestamp()}] Verifying OpenAI API key...`);
    const isValid = await this.transcriptionService.healthCheck();
    if (!isValid) {
      throw new Error("Invalid OpenAI API key");
    }
    console.log(`[${timestamp()}] API key verified successfully`);

    // Reset status
    this.status = {
      isRunning: true,
      startTime: new Date(),
      chunksProcessed: 0,
      errors: 0,
    };

    // Start audio capture
    await this.audioCapturer.startCapture(
      (chunk) => this.handleAudioData(chunk),
      (error) => this.handleError(error)
    );
  }

  /**
   * Handle incoming audio data
   */
  private handleAudioData(chunk: Buffer): void {
    this.audioProcessor.processChunk(chunk, async (wavBuffer) => {
      try {
        const entry = await this.transcriptionService.transcribe(wavBuffer);

        if (entry) {
          this.transcriptManager.append(entry);
          this.status.chunksProcessed++;
          this.status.lastTranscriptTime = new Date();

          // Output to console
          const line = `\n**${entry.timestamp}**  ${entry.text}\n`;
          process.stdout.write(line);
        }
      } catch (err: any) {
        this.status.errors++;
        console.error(`[${timestamp()}] Transcription error:`, err.message);
      }
    });
  }

  /**
   * Handle errors from audio capture
   */
  private handleError(error: Error): void {
    this.status.errors++;
    console.error(`[${timestamp()}] Audio capture error:`, error.message);
  }

  /**
   * Stop the transcription session
   */
  async stop(): Promise<void> {
    if (!this.status.isRunning) {
      return;
    }

    console.log(`\n[${timestamp()}] Stopping transcription session...`);
    this.audioCapturer.stop();
    this.audioProcessor.reset();
    this.status.isRunning = false;

    // Give a moment for any pending operations to complete
    await sleep(250);
  }

  /**
   * Get current session status
   */
  getStatus(): TranscriptionStatus {
    return { ...this.status };
  }

  /**
   * Get the transcript content
   */
  getTranscript(): string {
    return this.transcriptManager.getContent();
  }

  /**
   * Clear the transcript
   */
  clearTranscript(): void {
    this.transcriptManager.clear();
  }

  /**
   * Get the transcript file path
   */
  getTranscriptPath(): string {
    return this.transcriptManager.getFilePath();
  }
}

