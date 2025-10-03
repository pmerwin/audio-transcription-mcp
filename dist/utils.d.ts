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
 * Convert PCM buffer to WAV format
 */
export declare function pcmToWav(pcmBuf: Buffer, sampleRate: number, channels: number): Buffer;
//# sourceMappingURL=utils.d.ts.map