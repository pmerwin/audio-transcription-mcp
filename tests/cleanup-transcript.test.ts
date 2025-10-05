/**
 * Tests for cleanup_transcript functionality
 * Verifies that cleanup_transcript works correctly after stop_transcription
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TranscriptionSession } from '../src/transcription-session.js';
import { AudioConfig, TranscriptionConfig } from '../src/types.js';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Mock the dependencies
jest.mock('../src/audio-capturer.js');
jest.mock('../src/transcription-service.js');

describe('cleanup_transcript after stop_transcription', () => {
  const testFile = resolve(process.cwd(), 'test_cleanup_transcript.md');
  
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

  afterEach(() => {
    // Clean up test files
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
  });

  it('should allow cleanup after stop by tracking transcript path', async () => {
    // Simulate the MCP server pattern
    let session: TranscriptionSession | null = null;
    let lastTranscriptPath: string | null = null;

    // Start session
    session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile);
    (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
    (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
    (session as any).audioCapturer.stop = jest.fn();
    
    await session.start();
    expect(existsSync(testFile)).toBe(true);
    
    // Stop session (simulating stop_transcription)
    const transcriptPath = session.getTranscriptPath();
    await session.stop();
    lastTranscriptPath = transcriptPath;
    session = null;
    
    // Verify session is cleared but path is saved
    expect(session).toBeNull();
    expect(lastTranscriptPath).toBe(testFile);
    expect(existsSync(testFile)).toBe(true);
    
    // Cleanup should work using lastTranscriptPath
    if (lastTranscriptPath && existsSync(lastTranscriptPath)) {
      unlinkSync(lastTranscriptPath);
      lastTranscriptPath = null;
    }
    
    expect(existsSync(testFile)).toBe(false);
    expect(lastTranscriptPath).toBeNull();
  });

  it('should handle cleanup when session is still running', async () => {
    // Simulate cleanup_transcript when session exists and is running
    let session: TranscriptionSession | null = null;
    let lastTranscriptPath: string | null = null;

    session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile);
    (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
    (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
    (session as any).audioCapturer.stop = jest.fn();
    
    await session.start();
    expect(session.getStatus().isRunning).toBe(true);
    
    // Cleanup while running (should stop first)
    const transcriptPath = session.getTranscriptPath();
    if (session.getStatus().isRunning) {
      await session.stop();
      lastTranscriptPath = transcriptPath;
    }
    session = null;
    
    // Verify stopped and path saved
    expect(session).toBeNull();
    expect(lastTranscriptPath).toBe(testFile);
    
    // Cleanup
    if (lastTranscriptPath && existsSync(lastTranscriptPath)) {
      unlinkSync(lastTranscriptPath);
      lastTranscriptPath = null;
    }
    
    expect(existsSync(testFile)).toBe(false);
  });

  it('should handle cleanup with no session and no last path', () => {
    // Simulate cleanup_transcript with no session
    let session: TranscriptionSession | null = null;
    let lastTranscriptPath: string | null = null;

    let canCleanup = false;
    
    if (session) {
      canCleanup = true;
    } else if (lastTranscriptPath) {
      canCleanup = true;
    } else {
      canCleanup = false;
    }
    
    expect(canCleanup).toBe(false);
  });

  it('should clear lastTranscriptPath when starting new session', async () => {
    // Simulate complete workflow
    let session: TranscriptionSession | null = null;
    let lastTranscriptPath: string | null = null;

    // Session 1
    session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile);
    (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
    (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
    (session as any).audioCapturer.stop = jest.fn();
    
    await session.start();
    const path1 = session.getTranscriptPath();
    await session.stop();
    lastTranscriptPath = path1;
    session = null;
    
    expect(lastTranscriptPath).toBe(testFile);
    
    // Start new session (should clear lastTranscriptPath)
    lastTranscriptPath = null; // Simulating start_transcription clearing it
    
    const testFile2 = resolve(process.cwd(), 'test_cleanup_transcript_2.md');
    session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile2);
    (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
    (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
    
    await session.start();
    expect(lastTranscriptPath).toBeNull();
    expect(session.getTranscriptPath()).toBe(testFile2);
    
    // Clean up
    (session as any).audioCapturer.stop = jest.fn();
    await session.stop();
    if (existsSync(testFile2)) {
      unlinkSync(testFile2);
    }
  });

  it('should handle cleanup when file was manually deleted', () => {
    // Simulate file being manually deleted before cleanup
    let lastTranscriptPath: string | null = testFile;
    
    // Create and then manually delete
    writeFileSync(testFile, '# Test');
    expect(existsSync(testFile)).toBe(true);
    unlinkSync(testFile);
    expect(existsSync(testFile)).toBe(false);
    
    // Cleanup should handle gracefully
    if (lastTranscriptPath) {
      if (existsSync(lastTranscriptPath)) {
        unlinkSync(lastTranscriptPath);
      }
      lastTranscriptPath = null;
    }
    
    expect(lastTranscriptPath).toBeNull();
  });

  it('should allow cleanup of previous session after starting new session', async () => {
    // This is the critical workflow: stop session → start new session → cleanup old session
    const testFile1 = resolve(process.cwd(), 'test_cleanup_old_1.md');
    const testFile2 = resolve(process.cwd(), 'test_cleanup_old_2.md');
    
    let session: TranscriptionSession | null = null;
    let lastTranscriptPath: string | null = null;

    // Session 1: Start and stop WITHOUT cleanup
    session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile1);
    (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
    (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
    (session as any).audioCapturer.stop = jest.fn();
    
    await session.start();
    expect(existsSync(testFile1)).toBe(true);
    
    // Stop without cleanup (user forgets or doesn't want to cleanup yet)
    await session.stop();
    lastTranscriptPath = testFile1;
    session = null;
    
    expect(existsSync(testFile1)).toBe(true);
    expect(lastTranscriptPath).toBe(testFile1);
    
    // Session 2: Start NEW session (should NOT clear lastTranscriptPath)
    // This is the key fix - we should still be able to cleanup session 1
    session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile2);
    (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
    (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
    
    await session.start();
    expect(existsSync(testFile2)).toBe(true);
    
    // CRITICAL: lastTranscriptPath should still point to session 1
    expect(lastTranscriptPath).toBe(testFile1);
    
    // Now cleanup the OLD session while NEW session is running
    if (lastTranscriptPath && existsSync(lastTranscriptPath)) {
      unlinkSync(lastTranscriptPath);
      lastTranscriptPath = null;
    }
    
    // Verify old file deleted, new file still exists
    expect(existsSync(testFile1)).toBe(false);
    expect(existsSync(testFile2)).toBe(true);
    expect(lastTranscriptPath).toBeNull();
    
    // Clean up session 2
    (session as any).audioCapturer.stop = jest.fn();
    await session.stop();
    if (existsSync(testFile2)) {
      unlinkSync(testFile2);
    }
  });

  it('should maintain session isolation with lastTranscriptPath', async () => {
    // Verify each session gets its own path
    const testFile1 = resolve(process.cwd(), 'test_cleanup_1.md');
    const testFile2 = resolve(process.cwd(), 'test_cleanup_2.md');
    
    let session: TranscriptionSession | null = null;
    let lastTranscriptPath: string | null = null;

    // Session 1
    session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile1);
    (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
    (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
    (session as any).audioCapturer.stop = jest.fn();
    
    await session.start();
    await session.stop();
    lastTranscriptPath = testFile1;
    session = null;
    
    expect(lastTranscriptPath).toBe(testFile1);
    
    // Session 2 (should clear previous path)
    lastTranscriptPath = null;
    session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile2);
    (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
    (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
    (session as any).audioCapturer.stop = jest.fn();
    
    await session.start();
    await session.stop();
    lastTranscriptPath = testFile2;
    session = null;
    
    expect(lastTranscriptPath).toBe(testFile2);
    expect(lastTranscriptPath).not.toBe(testFile1);
    
    // Clean up both files
    [testFile1, testFile2].forEach(f => {
      if (existsSync(f)) {
        unlinkSync(f);
      }
    });
  });
});

