/**
 * Audio processing - chunking and WAV conversion
 */
import { AudioConfig } from "./types.js";
export declare class AudioProcessor {
    private buffer;
    private config;
    private targetBytes;
    constructor(config: AudioConfig);
    /**
     * Process incoming PCM data and yield complete WAV chunks
     */
    processChunk(chunk: Buffer, onChunkReady: (wav: Buffer) => void): void;
    /**
     * Reset the internal buffer
     */
    reset(): void;
    /**
     * Get current buffer size (for debugging/monitoring)
     */
    getBufferSize(): number;
}
//# sourceMappingURL=audio-processor.d.ts.map