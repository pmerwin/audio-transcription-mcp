/**
 * Transcript file management
 */
import fs from "fs";
export class TranscriptManager {
    outfile;
    constructor(outfile) {
        this.outfile = outfile;
    }
    /**
     * Initialize the transcript file with a header if it doesn't exist
     */
    initialize() {
        if (!fs.existsSync(this.outfile)) {
            fs.writeFileSync(this.outfile, "# Meeting Transcript\n\n", "utf8");
        }
    }
    /**
     * Append a transcript entry to the file
     */
    append(entry) {
        const line = `\n**${entry.timestamp}**  ${entry.text}\n`;
        fs.appendFileSync(this.outfile, line, "utf8");
    }
    /**
     * Get the full transcript content
     */
    getContent() {
        if (!fs.existsSync(this.outfile)) {
            return "";
        }
        return fs.readFileSync(this.outfile, "utf8");
    }
    /**
     * Clear the transcript file
     */
    clear() {
        if (fs.existsSync(this.outfile)) {
            fs.unlinkSync(this.outfile);
        }
        this.initialize();
    }
    /**
     * Delete the transcript file completely (no reinitialization)
     */
    delete() {
        if (fs.existsSync(this.outfile)) {
            fs.unlinkSync(this.outfile);
        }
    }
    /**
     * Get file path
     */
    getFilePath() {
        return this.outfile;
    }
}
//# sourceMappingURL=transcript-manager.js.map