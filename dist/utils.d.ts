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
 * Convert PCM buffer to WAV format
 */
export declare function pcmToWav(pcmBuf: Buffer, sampleRate: number, channels: number): Buffer;
//# sourceMappingURL=utils.d.ts.map