/**
 * Tests for system messages in transcript file
 * This fixes the bug where 37-second gap had no explanation in the transcript
 */

import { TranscriptManager } from "../src/transcript-manager.js";
import { TranscriptionSession } from "../src/transcription-session.js";
import { AudioConfig, TranscriptionConfig } from "../src/types.js";
import * as fs from "fs";
import * as path from "path";

describe("Transcript System Messages", () => {
  describe("TranscriptManager system message functionality", () => {
    let transcriptManager: TranscriptManager;
    let tempFile: string;

    beforeEach(() => {
      tempFile = path.join("/tmp", `test-system-msg-${Date.now()}.md`);
      transcriptManager = new TranscriptManager(tempFile);
      transcriptManager.initialize();
    });

    afterEach(() => {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    });

    it("should write system message to transcript file", () => {
      transcriptManager.appendSystemMessage("Test system message");
      
      const content = transcriptManager.getContent();
      expect(content).toContain("[SYSTEM]");
      expect(content).toContain("Test system message");
    });

    it("should format system messages with timestamp", () => {
      transcriptManager.appendSystemMessage("Test message");
      
      const content = transcriptManager.getContent();
      // Should have format: **YYYY-MM-DD HH:MM:SS** _[SYSTEM]_ message
      expect(content).toMatch(/\*\*\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\*\*/);
    });

    it("should separate system messages with horizontal rules", () => {
      transcriptManager.appendSystemMessage("Test message");
      
      const content = transcriptManager.getContent();
      expect(content).toContain("---");
      // Should have two horizontal rules (before and after)
      const hrCount = (content.match(/---/g) || []).length;
      expect(hrCount).toBeGreaterThanOrEqual(2);
    });

    it("should distinguish system messages from regular transcript entries", () => {
      // Add a regular entry
      transcriptManager.append({
        timestamp: "2025-10-04 13:00:00",
        text: "Regular transcribed text"
      });
      
      // Add a system message
      transcriptManager.appendSystemMessage("System notification");
      
      const content = transcriptManager.getContent();
      expect(content).toContain("Regular transcribed text");
      expect(content).toContain("[SYSTEM]");
      expect(content).toContain("System notification");
    });
  });

  describe("Auto-pause notifications in transcript", () => {
    let session: TranscriptionSession;
    let tempOutputFile: string;

    beforeEach(() => {
      tempOutputFile = path.join("/tmp", `test-transcript-${Date.now()}.md`);

      session = new TranscriptionSession(
        {
          inputDeviceName: "TestDevice",
          sampleRate: 16000,
          channels: 1,
          chunkSeconds: 8,
        },
        {
          model: "whisper-1",
          apiKey: "test-key",
        },
        tempOutputFile
      );
    });

    afterEach(async () => {
      if (session) {
        await session.stop();
      }
      if (fs.existsSync(tempOutputFile)) {
        fs.unlinkSync(tempOutputFile);
      }
    });

    it("should write auto-pause message to transcript when silence detected", () => {
      // Initialize the transcript
      (session as any).transcriptManager.initialize();
      
      // Simulate auto-pause trigger
      (session as any).transcriptManager.appendSystemMessage(
        `⚠️ TRANSCRIPTION AUTO-PAUSED: No audio detected for 4 consecutive chunks (32 seconds). ` +
        `Please check your audio input device and routing. Transcription will auto-resume when audio is detected.`
      );
      
      const content = (session as any).transcriptManager.getContent();
      
      expect(content).toContain("AUTO-PAUSED");
      expect(content).toContain("No audio detected");
      expect(content).toContain("32 seconds");
      expect(content).toContain("[SYSTEM]");
    });

    it("should write auto-resume message to transcript when audio detected", () => {
      (session as any).transcriptManager.initialize();
      
      // Simulate auto-resume
      (session as any).transcriptManager.appendSystemMessage(
        `✅ TRANSCRIPTION AUTO-RESUMED: Audio detected after silence. Transcription continuing...`
      );
      
      const content = (session as any).transcriptManager.getContent();
      
      expect(content).toContain("AUTO-RESUMED");
      expect(content).toContain("Audio detected");
      expect(content).toContain("[SYSTEM]");
    });

    it("should write manual pause message to transcript", () => {
      (session as any).transcriptManager.initialize();
      
      (session as any).transcriptManager.appendSystemMessage(
        `⏸️ TRANSCRIPTION PAUSED: User manually paused transcription. Use resume_transcription to continue.`
      );
      
      const content = (session as any).transcriptManager.getContent();
      
      expect(content).toContain("PAUSED");
      expect(content).toContain("manually paused");
      expect(content).toContain("[SYSTEM]");
    });

    it("should write manual resume message to transcript", () => {
      (session as any).transcriptManager.initialize();
      
      (session as any).transcriptManager.appendSystemMessage(
        `▶️ TRANSCRIPTION RESUMED: User manually resumed transcription after manual pause.`
      );
      
      const content = (session as any).transcriptManager.getContent();
      
      expect(content).toContain("RESUMED");
      expect(content).toContain("manually resumed");
      expect(content).toContain("[SYSTEM]");
    });
  });

  describe("Transcript gap documentation", () => {
    let transcriptManager: TranscriptManager;
    let tempFile: string;

    beforeEach(() => {
      tempFile = path.join("/tmp", `test-gap-doc-${Date.now()}.md`);
      transcriptManager = new TranscriptManager(tempFile);
      transcriptManager.initialize();
    });

    afterEach(() => {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    });

    it("should document a transcript gap scenario", () => {
      // Simulate a real scenario like the 37-second gap
      transcriptManager.append({
        timestamp: "2025-10-04 13:47:33",
        text: "Last audio before silence"
      });
      
      // Auto-pause should have written this
      transcriptManager.appendSystemMessage(
        `⚠️ TRANSCRIPTION AUTO-PAUSED: No audio detected for 4 consecutive chunks (32 seconds). ` +
        `Please check your audio input device and routing. Transcription will auto-resume when audio is detected.`
      );
      
      // Auto-resume should have written this
      transcriptManager.appendSystemMessage(
        `✅ TRANSCRIPTION AUTO-RESUMED: Audio detected after silence. Transcription continuing...`
      );
      
      transcriptManager.append({
        timestamp: "2025-10-04 13:48:10",
        text: "First audio after silence"
      });
      
      const content = transcriptManager.getContent();
      
      // Verify the gap is documented
      expect(content).toContain("Last audio before silence");
      expect(content).toContain("AUTO-PAUSED");
      expect(content).toContain("AUTO-RESUMED");
      expect(content).toContain("First audio after silence");
      
      // The system messages explain the gap!
      expect(content).toContain("No audio detected");
      expect(content).toContain("Audio detected after silence");
    });

    it("should make gaps self-explanatory in the transcript file", () => {
      transcriptManager.append({
        timestamp: "2025-10-04 13:00:00",
        text: "Some transcribed text"
      });
      
      // 37-second gap with auto-pause
      transcriptManager.appendSystemMessage(
        `⚠️ TRANSCRIPTION AUTO-PAUSED: No audio detected for 4 consecutive chunks (32 seconds).`
      );
      
      transcriptManager.append({
        timestamp: "2025-10-04 13:00:37",
        text: "More transcribed text"
      });
      
      const content = transcriptManager.getContent();
      
      // Anyone reading the transcript will see why there was a gap
      const lines = content.split("\n");
      const pauseLineIdx = lines.findIndex(l => l.includes("AUTO-PAUSED"));
      
      expect(pauseLineIdx).toBeGreaterThan(-1);
      // System message should be between the two transcript entries
      expect(content).toMatch(/Some transcribed text[\s\S]*AUTO-PAUSED[\s\S]*More transcribed text/);
    });
  });

  describe("Integration with pause/resume methods", () => {
    let session: TranscriptionSession;
    let tempOutputFile: string;

    beforeEach(() => {
      tempOutputFile = path.join("/tmp", `test-transcript-${Date.now()}.md`);

      session = new TranscriptionSession(
        {
          inputDeviceName: "TestDevice",
          sampleRate: 16000,
          channels: 1,
          chunkSeconds: 8,
        },
        {
          model: "whisper-1",
          apiKey: "test-key",
        },
        tempOutputFile
      );
    });

    afterEach(async () => {
      if (session) {
        await session.stop();
      }
      if (fs.existsSync(tempOutputFile)) {
        fs.unlinkSync(tempOutputFile);
      }
    });

    it("should write to transcript when manually pausing", () => {
      // Initialize transcript
      (session as any).transcriptManager.initialize();
      
      // Set up state to allow pause
      (session as any).status.isRunning = true;
      (session as any).status.isPaused = false;
      
      // Call pause which should write to transcript
      session.pause();
      
      const content = (session as any).transcriptManager.getContent();
      expect(content).toContain("PAUSED");
      expect(content).toContain("[SYSTEM]");
    });

    it("should write to transcript when manually resuming", () => {
      (session as any).transcriptManager.initialize();
      
      // Set up paused state
      (session as any).status = {
        isRunning: true,
        isPaused: true,
        pauseReason: 'manual',
        chunksProcessed: 0,
        errors: 0,
        consecutiveSilentChunks: 0,
      };
      
      // Call resume which should write to transcript
      session.resume();
      
      const content = (session as any).transcriptManager.getContent();
      expect(content).toContain("RESUMED");
      expect(content).toContain("[SYSTEM]");
    });
  });
});

