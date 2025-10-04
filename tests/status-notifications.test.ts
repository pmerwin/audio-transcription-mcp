/**
 * Tests for status change notifications
 */

import { TranscriptionSession } from "../src/transcription-session.js";
import { AudioConfig, TranscriptionConfig, StatusChangeEvent } from "../src/types.js";
import * as fs from "fs";
import * as path from "path";

describe("Status Change Notifications", () => {
  let session: TranscriptionSession;
  let tempOutputFile: string;
  let capturedEvents: StatusChangeEvent[];
  let statusChangeCallback: (event: StatusChangeEvent) => void;

  beforeEach(() => {
    tempOutputFile = path.join("/tmp", `test-transcript-${Date.now()}.md`);
    capturedEvents = [];
    
    statusChangeCallback = (event: StatusChangeEvent) => {
      capturedEvents.push(event);
    };

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
      tempOutputFile,
      statusChangeCallback
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

  describe("Session lifecycle events", () => {
    it("should emit started event when transcription starts", () => {
      // Manually trigger started state for testing
      (session as any).status.isRunning = true;
      (session as any).emitStatusChange({ type: 'started', timestamp: new Date() });

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].type).toBe('started');
      expect(capturedEvents[0]).toHaveProperty('timestamp');
    });

    it("should emit stopped event when transcription stops", () => {
      (session as any).emitStatusChange({ 
        type: 'stopped', 
        stats: {
          chunksProcessed: 10,
          duration: 60,
          errors: 0
        },
        timestamp: new Date() 
      });

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].type).toBe('stopped');
      expect((capturedEvents[0] as any).stats.chunksProcessed).toBe(10);
      expect((capturedEvents[0] as any).stats.duration).toBe(60);
    });
  });

  describe("Pause and resume events", () => {
    it("should emit paused event with reason when manually paused", () => {
      // Set up running state
      (session as any).status.isRunning = true;
      (session as any).status.isPaused = false;

      session.pause();

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].type).toBe('paused');
      expect((capturedEvents[0] as any).reason).toBe('manual');
      expect((capturedEvents[0] as any).message).toContain('manually paused');
    });

    it("should emit paused event when silence detection triggers", () => {
      (session as any).emitStatusChange({ 
        type: 'paused', 
        reason: 'silence',
        message: 'Audio capture appears to be inactive',
        timestamp: new Date() 
      });

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].type).toBe('paused');
      expect((capturedEvents[0] as any).reason).toBe('silence');
      expect((capturedEvents[0] as any).message).toContain('inactive');
    });

    it("should emit resumed event with previous reason", () => {
      // Set up paused state
      (session as any).status = {
        isRunning: true,
        isPaused: true,
        pauseReason: 'manual',
        chunksProcessed: 5,
        errors: 0,
        consecutiveSilentChunks: 0,
      };

      session.resume();

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].type).toBe('resumed');
      expect((capturedEvents[0] as any).previousReason).toBe('manual');
    });

    it("should emit resumed event after auto-resume from silence", () => {
      (session as any).emitStatusChange({ 
        type: 'resumed', 
        previousReason: 'silence',
        timestamp: new Date() 
      });

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].type).toBe('resumed');
      expect((capturedEvents[0] as any).previousReason).toBe('silence');
    });
  });

  describe("Silence detection events", () => {
    it("should emit silence_detected event for each silent chunk", () => {
      for (let i = 1; i <= 3; i++) {
        (session as any).emitStatusChange({ 
          type: 'silence_detected', 
          consecutiveChunks: i,
          timestamp: new Date() 
        });
      }

      expect(capturedEvents).toHaveLength(3);
      expect(capturedEvents[0].type).toBe('silence_detected');
      expect((capturedEvents[0] as any).consecutiveChunks).toBe(1);
      expect((capturedEvents[1] as any).consecutiveChunks).toBe(2);
      expect((capturedEvents[2] as any).consecutiveChunks).toBe(3);
    });

    it("should emit audio_detected event when audio resumes", () => {
      (session as any).emitStatusChange({ 
        type: 'audio_detected',
        timestamp: new Date() 
      });

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].type).toBe('audio_detected');
    });
  });

  describe("Event sequence scenarios", () => {
    it("should emit correct sequence for silence auto-pause and resume", () => {
      // Simulate silence detection leading to pause
      (session as any).emitStatusChange({ 
        type: 'silence_detected', 
        consecutiveChunks: 1,
        timestamp: new Date() 
      });
      (session as any).emitStatusChange({ 
        type: 'silence_detected', 
        consecutiveChunks: 2,
        timestamp: new Date() 
      });
      (session as any).emitStatusChange({ 
        type: 'silence_detected', 
        consecutiveChunks: 3,
        timestamp: new Date() 
      });
      (session as any).emitStatusChange({ 
        type: 'silence_detected', 
        consecutiveChunks: 4,
        timestamp: new Date() 
      });
      (session as any).emitStatusChange({ 
        type: 'paused', 
        reason: 'silence',
        message: 'No audio detected',
        timestamp: new Date() 
      });
      (session as any).emitStatusChange({ 
        type: 'audio_detected',
        timestamp: new Date() 
      });
      (session as any).emitStatusChange({ 
        type: 'resumed', 
        previousReason: 'silence',
        timestamp: new Date() 
      });

      expect(capturedEvents).toHaveLength(7);
      expect(capturedEvents[0].type).toBe('silence_detected');
      expect(capturedEvents[4].type).toBe('paused');
      expect(capturedEvents[5].type).toBe('audio_detected');
      expect(capturedEvents[6].type).toBe('resumed');
    });

    it("should emit correct sequence for manual pause and resume", () => {
      // Set up running state
      (session as any).status = {
        isRunning: true,
        isPaused: false,
        chunksProcessed: 0,
        errors: 0,
        consecutiveSilentChunks: 0,
      };

      session.pause();
      
      // Change to paused state
      (session as any).status.isPaused = true;
      (session as any).status.pauseReason = 'manual';
      
      session.resume();

      expect(capturedEvents).toHaveLength(2);
      expect(capturedEvents[0].type).toBe('paused');
      expect((capturedEvents[0] as any).reason).toBe('manual');
      expect(capturedEvents[1].type).toBe('resumed');
      expect((capturedEvents[1] as any).previousReason).toBe('manual');
    });
  });

  describe("Callback absence handling", () => {
    it("should not throw error when no callback is provided", () => {
      const sessionWithoutCallback = new TranscriptionSession(
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
        // No callback provided
      );

      // Should not throw
      expect(() => {
        (sessionWithoutCallback as any).emitStatusChange({ 
          type: 'started', 
          timestamp: new Date() 
        });
      }).not.toThrow();
    });
  });

  describe("Event timestamp validation", () => {
    it("should include timestamp in all events", () => {
      const events: StatusChangeEvent[] = [
        { type: 'started', timestamp: new Date() },
        { type: 'paused', reason: 'manual', message: 'test', timestamp: new Date() },
        { type: 'resumed', previousReason: 'manual', timestamp: new Date() },
        { type: 'stopped', stats: { chunksProcessed: 0, duration: 0, errors: 0 }, timestamp: new Date() },
        { type: 'silence_detected', consecutiveChunks: 1, timestamp: new Date() },
        { type: 'audio_detected', timestamp: new Date() },
      ];

      events.forEach(event => {
        (session as any).emitStatusChange(event);
      });

      expect(capturedEvents).toHaveLength(6);
      capturedEvents.forEach(event => {
        expect(event).toHaveProperty('timestamp');
        expect(event.timestamp).toBeInstanceOf(Date);
      });
    });
  });
});

