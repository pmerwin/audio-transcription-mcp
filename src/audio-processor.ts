/**
 * Audio processing - chunking and WAV conversion
 */

import { AudioConfig } from "./types.js";
import { pcmToWav } from "./utils.js";

export class AudioProcessor {
  private buffer: Buffer = Buffer.alloc(0);
  private config: AudioConfig;
  private targetBytes: number;

  constructor(config: AudioConfig) {
    this.config = config;

    // Calculate target bytes per chunk
    const bytesPerSample = 2; // s16le = 2 bytes per sample
    const bytesPerSecond =
      config.sampleRate * config.channels * bytesPerSample;
    this.targetBytes = bytesPerSecond * config.chunkSeconds;
  }

  /**
   * Process incoming PCM data and yield complete WAV chunks
   */
  processChunk(chunk: Buffer, onChunkReady: (wav: Buffer) => void): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    // Process all complete chunks in the buffer
    while (this.buffer.length >= this.targetBytes) {
      const slice = this.buffer.subarray(0, this.targetBytes);
      this.buffer = this.buffer.subarray(this.targetBytes);

      // Convert PCM to WAV
      const wav = pcmToWav(slice, this.config.sampleRate, this.config.channels);
      onChunkReady(wav);
    }
  }

  /**
   * Reset the internal buffer
   */
  reset(): void {
    this.buffer = Buffer.alloc(0);
  }

  /**
   * Get current buffer size (for debugging/monitoring)
   */
  getBufferSize(): number {
    return this.buffer.length;
  }
}

