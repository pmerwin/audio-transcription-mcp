/**
 * Tests for Inactivity Auto-Pause Feature
 * Verifies that sessions auto-pause after 30 minutes of no user interaction
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TranscriptionSession } from '../src/transcription-session.js';
import { AudioConfig, TranscriptionConfig } from '../src/types.js';
import { unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';

// Mock the dependencies
jest.mock('../src/audio-capturer.js');
jest.mock('../src/transcription-service.js');

describe('Inactivity Auto-Pause Feature', () => {
  const testFile = resolve(process.cwd(), 'test_inactivity_transcript.md');
  
  const audioConfig: AudioConfig = {
    inputDeviceName: 'BlackHole',
    sampleRate: 16000,
    channels: 1,
    chunkSeconds: 8,
  };

  const transcriptionConfig: TranscriptionConfig = {
    model: 'whisper-1',
    apiKey: 'test-api-key',
  };

  let session: TranscriptionSession;

  beforeEach(() => {
    // Clean up before each test
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
    
    session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile);
  });

  afterEach(() => {
    // Clean up after each test
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
  });

  describe('lastInteractionTime tracking', () => {
    it('should initialize lastInteractionTime when session starts', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      const status = session.getStatus();
      expect(status.lastInteractionTime).toBeDefined();
      // Should be within last second
      const timeDiff = Date.now() - status.lastInteractionTime!.getTime();
      expect(timeDiff).toBeGreaterThanOrEqual(0);
      expect(timeDiff).toBeLessThan(1000);
    });

    it('should update lastInteractionTime when getStatus is called', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      const initialTime = session.getStatus().lastInteractionTime!;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Call getStatus again
      const status = session.getStatus();
      
      expect(status.lastInteractionTime!.getTime()).toBeGreaterThan(initialTime.getTime());
    });

    it('should update lastInteractionTime when pause is called', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      const initialTime = session.getStatus().lastInteractionTime!;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Pause
      session.pause();
      
      const status = session.getStatus();
      expect(status.lastInteractionTime!.getTime()).toBeGreaterThan(initialTime.getTime());
    });

    it('should update lastInteractionTime when resume is called', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      session.pause();
      
      const timeAfterPause = session.getStatus().lastInteractionTime!;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Resume
      session.resume();
      
      const status = session.getStatus();
      expect(status.lastInteractionTime!.getTime()).toBeGreaterThan(timeAfterPause.getTime());
    });

    it('should update lastInteractionTime when getTranscript is called', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      const initialTime = session.getStatus().lastInteractionTime!;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get transcript
      session.getTranscript();
      
      const status = session.getStatus();
      expect(status.lastInteractionTime!.getTime()).toBeGreaterThan(initialTime.getTime());
    });

    it('should update lastInteractionTime when clearTranscript is called', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      const initialTime = session.getStatus().lastInteractionTime!;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear transcript
      session.clearTranscript();
      
      const status = session.getStatus();
      expect(status.lastInteractionTime!.getTime()).toBeGreaterThan(initialTime.getTime());
    });
  });

  describe('inactivity auto-pause logic', () => {
    it('should auto-pause after 30 minutes of no interaction', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      // Simulate 31 minutes of inactivity by manually setting lastInteractionTime
      const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
      (session as any).status.lastInteractionTime = thirtyOneMinutesAgo;
      
      // Directly call the check method
      (session as any).checkLongSessionWarnings();
      
      const status = session.getStatus();
      expect(status.isPaused).toBe(true);
      expect(status.pauseReason).toBe('manual');
      expect(status.warning).toContain('INACTIVITY AUTO-PAUSE');
      expect(status.warning).toContain('minutes');
    });

    it('should NOT auto-pause if user is actively checking status', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      // Simulate checking status every 5 minutes for 40 minutes
      for (let i = 0; i < 8; i++) {
        // Advance time by 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        (session as any).status.lastInteractionTime = fiveMinutesAgo;
        
        // User checks status (resets timer)
        session.getStatus();
      }
      
      const status = session.getStatus();
      expect(status.isPaused).toBe(false);
      expect(status.isRunning).toBe(true);
    });

    it('should write inactivity notice to transcript when auto-pausing', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      (session as any).transcriptionService.transcribe = (jest.fn() as any).mockResolvedValue({
        timestamp: '2025-10-04 12:00:00',
        text: 'Test'
      });
      
      await session.start();
      
      // Set inactivity
      const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
      (session as any).status.lastInteractionTime = thirtyOneMinutesAgo;
      
      // Trigger check
      (session as any).checkLongSessionWarnings();
      
      const transcript = session.getTranscript();
      expect(transcript).toContain('TRANSCRIPTION AUTO-PAUSED');
      expect(transcript).toContain('No user interaction detected');
      expect(transcript).toContain('minutes'); // Should mention duration
      expect(transcript).toContain('API cost');
    });

    it('should reset inactivity check when user resumes after auto-pause', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      (session as any).transcriptionService.transcribe = (jest.fn() as any).mockResolvedValue({
        timestamp: '2025-10-04 12:00:00',
        text: 'Test'
      });
      
      await session.start();
      
      // Trigger inactivity auto-pause
      const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
      (session as any).status.lastInteractionTime = thirtyOneMinutesAgo;
      (session as any).checkLongSessionWarnings();
      
      expect(session.getStatus().isPaused).toBe(true);
      
      // User resumes
      session.resume();
      
      const status = session.getStatus();
      expect(status.isPaused).toBe(false);
      expect(status.lastInteractionTime).toBeDefined();
      
      // Verify timer was reset - should be very recent
      const secondsSinceInteraction = Math.floor((Date.now() - status.lastInteractionTime!.getTime()) / 1000);
      expect(secondsSinceInteraction).toBeLessThan(5);
    });

    it('should not trigger inactivity pause if already paused', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      // Manually pause
      session.pause();
      
      // Set interaction time way back
      const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000);
      (session as any).status.lastInteractionTime = fortyMinutesAgo;
      
      // Try to trigger inactivity check
      (session as any).checkLongSessionWarnings();
      
      const status = session.getStatus();
      expect(status.isPaused).toBe(true);
      expect(status.pauseReason).toBe('manual');
      expect(status.warning).not.toContain('INACTIVITY');
    });
  });

  describe('interaction timer behavior with multiple calls', () => {
    it('should reset timer on each get_status call', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      const times: Date[] = [];
      
      // Call getStatus 5 times with delays
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        const status = session.getStatus();
        times.push(status.lastInteractionTime!);
      }
      
      // Each time should be later than the previous
      for (let i = 1; i < times.length; i++) {
        expect(times[i].getTime()).toBeGreaterThan(times[i-1].getTime());
      }
    });

    it('should not auto-pause if user checks status every 20 minutes for 2 hours', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      // Simulate checking every 20 minutes for 2 hours (6 checks)
      for (let i = 0; i < 6; i++) {
        // Set last interaction to 20 minutes ago
        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
        (session as any).status.lastInteractionTime = twentyMinutesAgo;
        
        // User checks status (resets timer)
        const status = session.getStatus();
        
        // Verify still running
        expect(status.isPaused).toBe(false);
        expect(status.isRunning).toBe(true);
      }
      
      const finalStatus = session.getStatus();
      expect(finalStatus.isPaused).toBe(false);
    });
  });

  describe('critical bug fixes', () => {
    it('should reset inactivityPauseTriggered flag when resumed', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      // First auto-pause
      const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
      (session as any).status.lastInteractionTime = thirtyOneMinutesAgo;
      (session as any).checkLongSessionWarnings();
      
      expect(session.getStatus().isPaused).toBe(true);
      expect((session as any).inactivityPauseTriggered).toBe(true);
      
      // Resume
      session.resume();
      
      // Verify flag was reset
      expect((session as any).inactivityPauseTriggered).toBe(false);
      
      // Simulate another 31 minutes of inactivity
      const anotherThirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
      (session as any).status.lastInteractionTime = anotherThirtyOneMinutesAgo;
      
      // Should be able to auto-pause again
      (session as any).checkLongSessionWarnings();
      
      expect(session.getStatus().isPaused).toBe(true);
      expect(session.getStatus().warning).toContain('INACTIVITY AUTO-PAUSE');
    });

    it('should trigger inactivity check regardless of transcription success', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      // Test 1: Successful transcription triggers check
      const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
      (session as any).status.lastInteractionTime = thirtyOneMinutesAgo;
      (session as any).transcriptionService.transcribe = (jest.fn() as any).mockResolvedValue({
        timestamp: '2025-10-04 12:00:00',
        text: 'Test'
      });
      
      // Direct call simulating successful transcription path
      (session as any).checkLongSessionWarnings();
      
      expect(session.getStatus().isPaused).toBe(true);
      expect(session.getStatus().warning).toContain('INACTIVITY AUTO-PAUSE');
      
      // Resume for second test
      session.resume();
      
      // Test 2: Failed transcription (null result) also triggers check
      const anotherThirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
      (session as any).status.lastInteractionTime = anotherThirtyOneMinutesAgo;
      (session as any).transcriptionService.transcribe = (jest.fn() as any).mockResolvedValue(null);
      
      // Direct call simulating failed transcription path
      (session as any).checkLongSessionWarnings();
      
      expect(session.getStatus().isPaused).toBe(true);
      expect(session.getStatus().warning).toContain('INACTIVITY AUTO-PAUSE');
    });

    it('should calculate cost based on actual chunks processed, not elapsed time', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      (session as any).transcriptionService.transcribe = (jest.fn() as any).mockResolvedValue({
        timestamp: '2025-10-04 12:00:00',
        text: 'Test'
      });
      
      await session.start();
      
      // Set specific chunk count
      (session as any).status.chunksProcessed = 10; // 10 chunks = 80 seconds = $0.008
      
      // Set long elapsed time
      const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);
      (session as any).status.startTime = sixtyMinutesAgo;
      
      // Set inactivity to trigger auto-pause
      const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
      (session as any).status.lastInteractionTime = thirtyOneMinutesAgo;
      
      // Trigger check
      (session as any).checkLongSessionWarnings();
      
      const transcript = session.getTranscript();
      // Cost should be based on 10 chunks, not 60 minutes
      expect(transcript).toContain('$0.008');
      expect(transcript).toContain('10 chunks processed');
    });
  });

  describe('edge cases', () => {
    it('should handle session that is stopped before inactivity timeout', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      (session as any).audioCapturer.stop = jest.fn();
      
      await session.start();
      
      // Simulate some time passing
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      (session as any).status.lastInteractionTime = fiveMinutesAgo;
      
      // Stop the session
      await session.stop();
      
      const status = session.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.isPaused).toBe(false); // Stopped, not paused
    });

    it('should not update lastInteractionTime when session is not running', () => {
      const statusBefore = session.getStatus();
      
      // Wait a bit
      const now = new Date();
      
      const statusAfter = session.getStatus();
      
      // lastInteractionTime should not be set since session never started
      expect(statusAfter.lastInteractionTime).toBeUndefined();
    });

    it('should include API cost estimate in inactivity pause message', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      (session as any).transcriptionService.transcribe = (jest.fn() as any).mockResolvedValue({
        timestamp: '2025-10-04 12:00:00',
        text: 'Test'
      });
      
      await session.start();
      
      // Mock 35 minutes total elapsed time
      const thirtyFiveMinutesAgo = new Date(Date.now() - 35 * 60 * 1000);
      (session as any).status.startTime = thirtyFiveMinutesAgo;
      
      // Mock 31 minutes since last interaction
      const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
      (session as any).status.lastInteractionTime = thirtyOneMinutesAgo;
      
      // Trigger check
      (session as any).checkLongSessionWarnings();
      
      const transcript = session.getTranscript();
      expect(transcript).toContain('API cost');
      expect(transcript).toContain('$0.'); // Should show cost estimate
    });
  });

  describe('integration with existing pause/resume', () => {
    it('should not trigger inactivity check when already paused by silence', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      // Manually pause to simulate silence pause
      session.pause();
      
      // Set inactivity way back
      const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
      (session as any).status.lastInteractionTime = thirtyOneMinutesAgo;
      
      // Try to trigger inactivity check (should do nothing since already paused)
      (session as any).checkLongSessionWarnings();
      
      const status = session.getStatus();
      expect(status.isPaused).toBe(true);
      expect(status.pauseReason).toBe('manual');
      // Warning should be from manual pause, not inactivity
      expect(status.warning).toBe('Transcription manually paused by user');
    });

    it('should preserve manual pause and not trigger inactivity pause', async () => {
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      // User manually pauses
      session.pause();
      
      // Simulate 31 minutes passing while paused
      const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
      (session as any).status.lastInteractionTime = thirtyOneMinutesAgo;
      
      // Try to trigger inactivity check (should not do anything since already paused)
      (session as any).checkLongSessionWarnings();
      
      const status = session.getStatus();
      expect(status.isPaused).toBe(true);
      expect(status.pauseReason).toBe('manual');
      expect(status.warning).toBe('Transcription manually paused by user');
    });
  });
});

