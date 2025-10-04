/**
 * Tests for silence detection and auto-pause functionality
 */

import { isSilentAudio } from "../src/utils.js";
import { TranscriptionSession } from "../src/transcription-session.js";
import { AudioConfig, TranscriptionConfig } from "../src/types.js";
import * as fs from "fs";
import * as path from "path";

describe("Silence Detection", () => {
  describe("isSilentAudio", () => {
    it("should detect empty buffer as silent", () => {
      const emptyBuffer = Buffer.alloc(0);
      expect(isSilentAudio(emptyBuffer)).toBe(true);
    });

    it("should detect very small buffer as silent", () => {
      const smallBuffer = Buffer.alloc(1);
      expect(isSilentAudio(smallBuffer)).toBe(true);
    });

    it("should detect silent audio (all zeros)", () => {
      // Create a PCM buffer with all zeros (silence)
      const silentBuffer = Buffer.alloc(16000 * 2); // 1 second of silence at 16kHz
      expect(isSilentAudio(silentBuffer)).toBe(true);
    });

    it("should detect silent audio (low amplitude)", () => {
      // Create a PCM buffer with very low amplitude
      const lowAmpBuffer = Buffer.alloc(16000 * 2);
      for (let i = 0; i < lowAmpBuffer.length; i += 2) {
        lowAmpBuffer.writeInt16LE(50, i); // Amplitude of 50 (below default threshold of 100)
      }
      expect(isSilentAudio(lowAmpBuffer)).toBe(true);
    });

    it("should detect non-silent audio (high amplitude)", () => {
      // Create a PCM buffer with significant amplitude
      const audioBuffer = Buffer.alloc(16000 * 2);
      for (let i = 0; i < audioBuffer.length; i += 2) {
        audioBuffer.writeInt16LE(1000, i); // Amplitude of 1000 (above threshold)
      }
      expect(isSilentAudio(audioBuffer)).toBe(false);
    });

    it("should detect non-silent audio even with mostly silence", () => {
      // Create mostly silent buffer with one loud sample
      const mixedBuffer = Buffer.alloc(16000 * 2);
      mixedBuffer.writeInt16LE(5000, 1000); // One loud sample
      expect(isSilentAudio(mixedBuffer)).toBe(false);
    });

    it("should respect custom threshold", () => {
      const buffer = Buffer.alloc(1000);
      for (let i = 0; i < buffer.length; i += 2) {
        buffer.writeInt16LE(150, i);
      }
      
      // Should be silent with high threshold
      expect(isSilentAudio(buffer, 200)).toBe(true);
      
      // Should not be silent with low threshold
      expect(isSilentAudio(buffer, 100)).toBe(false);
    });

    it("should handle negative amplitudes correctly", () => {
      const buffer = Buffer.alloc(1000);
      for (let i = 0; i < buffer.length; i += 2) {
        buffer.writeInt16LE(-500, i); // Negative amplitude
      }
      expect(isSilentAudio(buffer, 100)).toBe(false);
    });
  });

  describe("TranscriptionSession silence tracking", () => {
    let session: TranscriptionSession;
    let tempOutputFile: string;

    beforeEach(() => {
      // Create temporary output file
      tempOutputFile = path.join(
        "/tmp",
        `test-transcript-${Date.now()}.md`
      );

      const audioConfig: AudioConfig = {
        inputDeviceName: "TestDevice",
        sampleRate: 16000,
        channels: 1,
        chunkSeconds: 8,
      };

      const transcriptionConfig: TranscriptionConfig = {
        model: "whisper-1",
        apiKey: process.env.OPENAI_API_KEY || "test-key",
      };

      session = new TranscriptionSession(
        audioConfig,
        transcriptionConfig,
        tempOutputFile
      );
    });

    afterEach(async () => {
      // Clean up
      if (session) {
        await session.stop();
      }
      if (fs.existsSync(tempOutputFile)) {
        fs.unlinkSync(tempOutputFile);
      }
    });

    it("should initialize with zero silent chunks", () => {
      const status = session.getStatus();
      expect(status.consecutiveSilentChunks).toBe(0);
      expect(status.isPaused).toBe(false);
      expect(status.warning).toBeUndefined();
      expect(status.pauseReason).toBeUndefined();
    });

    it("should track consecutive silent chunks", () => {
      // Note: This test verifies the status structure
      // Full integration testing would require mocking audio capture
      const status = session.getStatus();
      expect(status).toHaveProperty("consecutiveSilentChunks");
      expect(status).toHaveProperty("isPaused");
      // pauseReason is optional and only present when paused
      expect(status.pauseReason).toBeUndefined();
      // Warning is optional and only present when there's an issue
      expect(status.warning).toBeUndefined();
    });

    it("should include new fields in status", () => {
      const status = session.getStatus();
      
      expect(status).toHaveProperty("isRunning");
      expect(status).toHaveProperty("chunksProcessed");
      expect(status).toHaveProperty("errors");
      expect(status).toHaveProperty("consecutiveSilentChunks");
      expect(status).toHaveProperty("isPaused");
      expect(status.consecutiveSilentChunks).toBe(0);
      expect(status.isPaused).toBe(false);
      // pauseReason is optional and should be undefined when not paused
      expect(status.pauseReason).toBeUndefined();
    });
  });

  describe("Manual pause and resume functionality", () => {
    let session: TranscriptionSession;
    let tempOutputFile: string;

    beforeEach(() => {
      tempOutputFile = path.join("/tmp", `test-transcript-${Date.now()}.md`);

      const audioConfig: AudioConfig = {
        inputDeviceName: "TestDevice",
        sampleRate: 16000,
        channels: 1,
        chunkSeconds: 8,
      };

      const transcriptionConfig: TranscriptionConfig = {
        model: "whisper-1",
        apiKey: "test-key",
      };

      session = new TranscriptionSession(
        audioConfig,
        transcriptionConfig,
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

    it("should throw error when pausing before starting", () => {
      expect(() => session.pause()).toThrow("Cannot pause: transcription is not running");
    });

    it("should throw error when resuming before starting", () => {
      expect(() => session.resume()).toThrow("Cannot resume: transcription is not running");
    });

    it("should throw error when resuming when not running", () => {
      // Session is not running, so this will throw the "not running" error
      expect(() => session.resume()).toThrow("Cannot resume: transcription is not running");
    });

    it("should set correct state when manually paused", () => {
      // Manually set running state to test pause logic
      (session as any).status.isRunning = true;
      
      session.pause();
      const status = session.getStatus();
      
      expect(status.isPaused).toBe(true);
      expect(status.pauseReason).toBe('manual');
      expect(status.warning).toBe('Transcription manually paused by user');
    });

    it("should clear pause state when resumed", () => {
      // Manually set paused state to test resume logic
      (session as any).status = {
        isRunning: true,
        isPaused: true,
        pauseReason: 'manual' as const,
        warning: 'Transcription manually paused by user',
        consecutiveSilentChunks: 0,
        chunksProcessed: 5,
        errors: 0,
      };
      
      session.resume();
      const status = session.getStatus();
      
      expect(status.isPaused).toBe(false);
      expect(status.pauseReason).toBeUndefined();
      expect(status.warning).toBeUndefined();
    });

    it("should throw when pausing already paused session", () => {
      // Manually set paused state
      (session as any).status = {
        isRunning: true,
        isPaused: true,
        pauseReason: 'manual' as const,
        warning: 'Transcription manually paused by user',
        consecutiveSilentChunks: 0,
        chunksProcessed: 5,
        errors: 0,
      };
      
      expect(() => session.pause()).toThrow("Transcription is already paused");
    });

    it("should throw when resuming non-paused session", () => {
      // Manually set running but not paused state
      (session as any).status = {
        isRunning: true,
        isPaused: false,
        consecutiveSilentChunks: 0,
        chunksProcessed: 5,
        errors: 0,
      };
      
      expect(() => session.resume()).toThrow("Transcription is not paused");
    });
  });

  describe("State transition validation", () => {
    it("should have correct pause reason types", () => {
      const audioConfig: AudioConfig = {
        inputDeviceName: "TestDevice",
        sampleRate: 16000,
        channels: 1,
        chunkSeconds: 8,
      };

      const transcriptionConfig: TranscriptionConfig = {
        model: "whisper-1",
        apiKey: "test-key",
      };

      const session = new TranscriptionSession(
        audioConfig,
        transcriptionConfig,
        "/tmp/test.md"
      );

      const status = session.getStatus();
      
      // pauseReason should be undefined when not paused
      expect(status.pauseReason).toBeUndefined();
      
      // If pauseReason exists, it should be either 'manual' or 'silence'
      if (status.pauseReason !== undefined) {
        expect(['manual', 'silence']).toContain(status.pauseReason);
      }
    });
  });

  describe("Integration with TranscriptionStatus", () => {
    it("should have correct types for new status fields", () => {
      const audioConfig: AudioConfig = {
        inputDeviceName: "TestDevice",
        sampleRate: 16000,
        channels: 1,
        chunkSeconds: 8,
      };

      const transcriptionConfig: TranscriptionConfig = {
        model: "whisper-1",
        apiKey: "test-key",
      };

      const session = new TranscriptionSession(
        audioConfig,
        transcriptionConfig,
        "/tmp/test.md"
      );

      const status = session.getStatus();
      
      // Type checks
      expect(typeof status.isRunning).toBe("boolean");
      expect(typeof status.chunksProcessed).toBe("number");
      expect(typeof status.errors).toBe("number");
      expect(typeof status.consecutiveSilentChunks).toBe("number");
      expect(typeof status.isPaused).toBe("boolean");
      
      // Optional fields
      if (status.warning !== undefined) {
        expect(typeof status.warning).toBe("string");
      }
    });
  });
});

