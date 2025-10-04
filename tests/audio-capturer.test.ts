/**
 * Tests for AudioCapturer
 * Verifies ffmpeg process management and cleanup
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AudioCapturer } from '../src/audio-capturer.js';
import { AudioConfig } from '../src/types.js';
import { ChildProcess } from 'child_process';

// Mock child_process
jest.mock('child_process');

describe('AudioCapturer', () => {
  const audioConfig: AudioConfig = {
    inputDeviceName: 'BlackHole',
    sampleRate: 16000,
    channels: 1,
    chunkSeconds: 8,
  };

  let capturer: AudioCapturer;
  let mockProcess: Partial<ChildProcess>;

  beforeEach(() => {
    capturer = new AudioCapturer(audioConfig);
    
    // Create a mock ffmpeg process
    mockProcess = {
      kill: jest.fn().mockReturnValue(true) as any,
      killed: false,
      once: jest.fn().mockReturnThis() as any,
      stderr: {
        on: jest.fn(),
      } as any,
      stdout: {
        on: jest.fn(),
      } as any,
      on: jest.fn().mockReturnThis() as any,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('process cleanup', () => {
    it('should gracefully terminate ffmpeg with SIGTERM', () => {
      // Inject mock process
      (capturer as any).ffmpegProcess = mockProcess;

      capturer.stop();

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should set up force-kill timeout when stopping', () => {
      jest.useFakeTimers();
      
      // Inject mock process
      (capturer as any).ffmpegProcess = mockProcess;

      capturer.stop();

      // Verify SIGTERM was called first
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(mockProcess.kill).toHaveBeenCalledTimes(1);

      // Mock process not exiting (staying alive)
      (mockProcess as any).killed = false;
      (capturer as any).ffmpegProcess = mockProcess; // Process still exists

      // Fast-forward 2 seconds
      jest.advanceTimersByTime(2000);

      // Should now force kill with SIGKILL
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');
      expect(mockProcess.kill).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should not force-kill if process exits naturally', () => {
      jest.useFakeTimers();
      
      // Inject mock process
      (capturer as any).ffmpegProcess = mockProcess;
      
      // Track the exit handler
      let exitHandler: (() => void) | undefined;
      (mockProcess.once as any).mockImplementation((event: string, handler: () => void) => {
        if (event === 'exit') {
          exitHandler = handler;
        }
        return mockProcess;
      });

      capturer.stop();

      // Verify SIGTERM was called
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(mockProcess.kill).toHaveBeenCalledTimes(1);

      // Simulate process exiting naturally after 1 second
      jest.advanceTimersByTime(1000);
      if (exitHandler) {
        exitHandler();
      }

      // Fast-forward past the 2-second timeout
      jest.advanceTimersByTime(2000);

      // Should NOT call SIGKILL because exit handler cleared the timeout
      expect(mockProcess.kill).toHaveBeenCalledTimes(1); // Only SIGTERM
      expect(mockProcess.kill).not.toHaveBeenCalledWith('SIGKILL');

      jest.useRealTimers();
    });

    it('should handle stop when no process is running', () => {
      // No process set
      expect(() => capturer.stop()).not.toThrow();
    });

    it('should set ffmpegProcess to null after stop', () => {
      // Inject mock process
      (capturer as any).ffmpegProcess = mockProcess;

      capturer.stop();

      expect((capturer as any).ffmpegProcess).toBeNull();
    });
  });

  describe('isRunning', () => {
    it('should return false when no process exists', () => {
      expect(capturer.isRunning()).toBe(false);
    });

    it('should return true when process is running', () => {
      (capturer as any).ffmpegProcess = mockProcess;
      (mockProcess as any).killed = false;

      expect(capturer.isRunning()).toBe(true);
    });

    it('should return false when process is killed', () => {
      (capturer as any).ffmpegProcess = mockProcess;
      (mockProcess as any).killed = true;

      expect(capturer.isRunning()).toBe(false);
    });
  });
});

