/**
 * Audio capture using ffmpeg and AVFoundation (macOS)
 */

import { spawn, ChildProcess } from "child_process";
import { AudioConfig, AudioDevice } from "./types.js";
import { timestamp } from "./utils.js";
import { appendFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// Debug logging to file (console interferes with MCP JSON-RPC protocol!)
const DEBUG_LOG = join(homedir(), '.audio-transcription-mcp-debug.log');
function debugLog(message: string) {
  const ts = new Date().toISOString();
  try {
    appendFileSync(DEBUG_LOG, `[${ts}] ${message}\n`);
  } catch (e) {
    // Silently fail if can't write debug log
  }
}

export class AudioCapturer {
  private ffmpegProcess: ChildProcess | null = null;
  private config: AudioConfig;

  constructor(config: AudioConfig) {
    this.config = config;
  }

  /**
   * Find AVFoundation audio device index by name
   */
  async findAudioDeviceIndex(nameSubstr: string): Promise<string | null> {
    return new Promise((resolve) => {
      const proc = spawn("ffmpeg", [
        "-f",
        "avfoundation",
        "-list_devices",
        "true",
        "-i",
        "",
      ]);

      let stderr = "";
      proc.stderr.on("data", (d) => (stderr += d.toString()));

      proc.on("close", () => {
        const lines = stderr.split("\n");
        const matches: AudioDevice[] = [];
        let inAudio = false;

        for (const line of lines) {
          if (line.toLowerCase().includes("avfoundation audio devices")) {
            inAudio = true;
            continue;
          }
          if (line.toLowerCase().includes("avfoundation video devices")) {
            inAudio = false;
          }
          if (!inAudio) continue;

          const m = line.match(/\[(\d+)\]\s+(.*)$/);
          if (m) {
            matches.push({ index: m[1], name: m[2].trim() });
          }
        }

        // Prefer exact-ish match, else substring
        const exact = matches.find((x) =>
          x.name.toLowerCase().includes(nameSubstr.toLowerCase())
        );
        if (exact) return resolve(exact.index);

        // fallback to the first audio device
        resolve(matches.length ? matches[0].index : null);
      });
    });
  }

  /**
   * Start capturing audio and return a readable stream
   */
  async startCapture(
    onData: (chunk: Buffer) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const idx = await this.findAudioDeviceIndex(this.config.inputDeviceName);

    if (idx === null) {
      throw new Error(
        `Could not find AVFoundation audio device matching "${this.config.inputDeviceName}"`
      );
    }

    debugLog(`Using AVFoundation audio index: ${idx}`);

    const args = [
      "-hide_banner",
      "-loglevel",
      "warning",
      "-f",
      "avfoundation",
      "-i",
      `:${idx}`,
      "-ac",
      this.config.channels.toString(),
      "-ar",
      this.config.sampleRate.toString(),
      "-f",
      "s16le", // raw PCM to stdout
      "pipe:1",
    ];

    this.ffmpegProcess = spawn("ffmpeg", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    this.ffmpegProcess.stderr?.on("data", (d) => process.stderr.write(d));
    this.ffmpegProcess.stdout?.on("data", onData);

    this.ffmpegProcess.on("error", (err) => {
      onError(new Error(`ffmpeg process error: ${err.message}`));
    });

    this.ffmpegProcess.on("close", (code) => {
      debugLog(`ffmpeg exited with code ${code}`);
    });

    debugLog(`ffmpeg started. Capturing system audio…`);
  }

  /**
   * Stop capturing audio
   */
  stop(): void {
    if (this.ffmpegProcess) {
      // Request graceful shutdown
      this.ffmpegProcess.kill("SIGTERM");
      
      // Force kill if not terminated after 2 seconds
      const forceKillTimer = setTimeout(() => {
        if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
          debugLog("⚠️ ffmpeg did not terminate gracefully, force killing...");
          this.ffmpegProcess.kill("SIGKILL");
        }
      }, 2000);
      
      // Clear timeout if process exits naturally
      this.ffmpegProcess.once("exit", () => {
        clearTimeout(forceKillTimer);
      });
      
      this.ffmpegProcess = null;
    }
  }

  /**
   * Check if capture is running
   */
  isRunning(): boolean {
    return this.ffmpegProcess !== null && !this.ffmpegProcess.killed;
  }
}

