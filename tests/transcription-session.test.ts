/**
 * Tests for TranscriptionSession
 * Verifies session management and transcript bleeding fix
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TranscriptionSession } from '../src/transcription-session.js';
import { TranscriptManager } from '../src/transcript-manager.js';
import { AudioConfig, TranscriptionConfig } from '../src/types.js';
import { unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';

// Mock the dependencies
jest.mock('../src/audio-capturer.js');
jest.mock('../src/audio-processor.js');
jest.mock('../src/transcription-service.js');

describe('TranscriptionSession', () => {
  const testFile = resolve(process.cwd(), 'test_session_transcript.md');
  
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
  });

  afterEach(() => {
    // Clean up after each test
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
  });

  describe('session initialization', () => {
    it('should create a session with initial status', () => {
      session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile);
      const status = session.getStatus();
      
      expect(status.isRunning).toBe(false);
      expect(status.chunksProcessed).toBe(0);
      expect(status.errors).toBe(0);
    });

    it('should set the correct transcript file path', () => {
      session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile);
      expect(session.getTranscriptPath()).toBe(testFile);
    });
  });

  describe('transcript isolation with unique filenames', () => {
    it('should initialize a fresh transcript for new session', () => {
      session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile);
      
      // Mock the transcription service health check
      const mockHealthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).transcriptionService.healthCheck = mockHealthCheck;
      
      // Mock the audio capturer
      const mockStartCapture = (jest.fn() as any).mockResolvedValue(undefined);
      (session as any).audioCapturer.startCapture = mockStartCapture;
      
      // Start the session
      return session.start().then(() => {
        // Check that transcript is fresh
        const content = session.getTranscript();
        expect(content).toBe('# Meeting Transcript\n\n');
        expect(session.getTranscriptPath()).toBe(testFile);
      });
    });

    it('should maintain separate transcripts for different file paths', async () => {
      const file1 = resolve(process.cwd(), 'test_session1.md');
      const file2 = resolve(process.cwd(), 'test_session2.md');
      
      try {
        // Mock functions
        const mockHealthCheck = (jest.fn() as any).mockResolvedValue(true);
        const mockStartCapture = (jest.fn() as any).mockResolvedValue(undefined);
        const mockStop = jest.fn() as any;
        
        // First session with file1
        const session1 = new TranscriptionSession(audioConfig, transcriptionConfig, file1);
        (session1 as any).transcriptionService.healthCheck = mockHealthCheck;
        (session1 as any).audioCapturer.startCapture = mockStartCapture;
        (session1 as any).audioCapturer.stop = mockStop;
        
        await session1.start();
        
        // Second session with file2
        const session2 = new TranscriptionSession(audioConfig, transcriptionConfig, file2);
        (session2 as any).transcriptionService.healthCheck = mockHealthCheck;
        (session2 as any).audioCapturer.startCapture = mockStartCapture;
        (session2 as any).audioCapturer.stop = mockStop;
        
        await session2.start();
        
        // Verify they have different file paths
        expect(session1.getTranscriptPath()).toBe(file1);
        expect(session2.getTranscriptPath()).toBe(file2);
        expect(session1.getTranscriptPath()).not.toBe(session2.getTranscriptPath());
        
        await session1.stop();
        await session2.stop();
      } finally {
        // Cleanup
        if (existsSync(file1)) unlinkSync(file1);
        if (existsSync(file2)) unlinkSync(file2);
      }
    });
  });

  describe('clearTranscript', () => {
    it('should clear transcript content', () => {
      session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile);
      
      // Add content
      const manager = new TranscriptManager(testFile);
      manager.initialize();
      manager.append({ timestamp: '2025-10-03 10:00:00', text: 'Test content' });
      
      // Clear
      session.clearTranscript();
      
      // Verify cleared
      const content = session.getTranscript();
      expect(content).not.toContain('Test content');
      expect(content).toBe('# Meeting Transcript\n\n');
    });
  });

  describe('getStatus', () => {
    it('should return current status', () => {
      session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile);
      const status = session.getStatus();
      
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('chunksProcessed');
      expect(status).toHaveProperty('errors');
    });

    it('should prevent running session twice', async () => {
      session = new TranscriptionSession(audioConfig, transcriptionConfig, testFile);
      
      // Mock functions
      const mockHealthCheck = (jest.fn() as any).mockResolvedValue(true);
      const mockStartCapture = (jest.fn() as any).mockResolvedValue(undefined);
      (session as any).transcriptionService.healthCheck = mockHealthCheck;
      (session as any).audioCapturer.startCapture = mockStartCapture;
      
      await session.start();
      
      // Try to start again
      await expect(session.start()).rejects.toThrow('Session is already running');
    });
  });
});

