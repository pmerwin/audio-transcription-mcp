/**
 * Transcript file management
 */

import fs from "fs";
import { TranscriptEntry } from "./types.js";

export class TranscriptManager {
  private outfile: string;

  constructor(outfile: string) {
    this.outfile = outfile;
  }

  /**
   * Initialize the transcript file with a header if it doesn't exist
   */
  initialize(): void {
    if (!fs.existsSync(this.outfile)) {
      fs.writeFileSync(this.outfile, "# Meeting Transcript\n\n", "utf8");
    }
  }

  /**
   * Append a transcript entry to the file
   */
  append(entry: TranscriptEntry): void {
    const line = `\n**${entry.timestamp}**  ${entry.text}\n`;
    fs.appendFileSync(this.outfile, line, "utf8");
  }

  /**
   * Get the full transcript content
   */
  getContent(): string {
    if (!fs.existsSync(this.outfile)) {
      return "";
    }
    return fs.readFileSync(this.outfile, "utf8");
  }

  /**
   * Clear the transcript file
   */
  clear(): void {
    if (fs.existsSync(this.outfile)) {
      fs.unlinkSync(this.outfile);
    }
    this.initialize();
  }

  /**
   * Delete the transcript file completely (no reinitialization)
   */
  delete(): void {
    if (fs.existsSync(this.outfile)) {
      fs.unlinkSync(this.outfile);
    }
  }

  /**
   * Get file path
   */
  getFilePath(): string {
    return this.outfile;
  }
}

