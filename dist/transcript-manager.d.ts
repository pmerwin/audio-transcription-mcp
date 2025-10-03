/**
 * Transcript file management
 */
import { TranscriptEntry } from "./types.js";
export declare class TranscriptManager {
    private outfile;
    constructor(outfile: string);
    /**
     * Initialize the transcript file with a header if it doesn't exist
     */
    initialize(): void;
    /**
     * Append a transcript entry to the file
     */
    append(entry: TranscriptEntry): void;
    /**
     * Get the full transcript content
     */
    getContent(): string;
    /**
     * Clear the transcript file
     */
    clear(): void;
    /**
     * Delete the transcript file completely (no reinitialization)
     */
    delete(): void;
    /**
     * Get file path
     */
    getFilePath(): string;
}
//# sourceMappingURL=transcript-manager.d.ts.map