/**
 * Utility functions
 */
/**
 * Get current timestamp in ISO format without milliseconds
 */
export declare function timestamp(): string;
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Generate a unique timestamped filename for transcript isolation
 * Format: transcript_YYYY-MM-DD_HH-MM-SS-mmm.md (includes milliseconds)
 * This ensures each session gets its own file for privacy
 */
export declare function generateTimestampedFilename(): string;
/**
 * Detect if an audio buffer is silent or contains very low audio
 * Checks PCM s16le data for amplitude below threshold
 * @param pcmBuffer - PCM buffer (s16le format)
 * @param threshold - Maximum absolute amplitude to consider silent (default: 100)
 * @returns true if the buffer is considered silent
 */
export declare function isSilentAudio(pcmBuffer: Buffer, threshold?: number): boolean;
/**
 * Convert PCM buffer to WAV format
 */
export declare function pcmToWav(pcmBuf: Buffer, sampleRate: number, channels: number): Buffer;
//# sourceMappingURL=utils.d.ts.map