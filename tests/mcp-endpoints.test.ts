/**
 * Integration tests for MCP Server Endpoint Handlers
 * Tests the actual tool execution logic
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { unlinkSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';
import type { AudioConfig, TranscriptionConfig } from '../src/types.js';

// Mock the audio and transcription services
jest.mock('../src/audio-capturer.js');
jest.mock('../src/audio-processor.js');
jest.mock('../src/transcription-service.js');

describe('MCP Endpoint Handlers', () => {
  let server: Server;
  const testFiles: string[] = [];

  beforeEach(() => {
    // Clear any previous test state
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.INPUT_DEVICE_NAME = 'BlackHole';
    
    // Import fresh module for each test
    jest.resetModules();
  });

  afterEach(() => {
    // Clean up test transcript files
    const files = readdirSync(process.cwd());
    files.forEach(file => {
      if (file.startsWith('transcript_') && file.endsWith('.md')) {
        const filePath = resolve(process.cwd(), file);
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      }
    });
    
    testFiles.forEach(file => {
      const filePath = resolve(process.cwd(), file);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    });
    testFiles.length = 0;
  });

  describe('start_transcription endpoint', () => {
    it('should start a new transcription session with unique filename', async () => {
      // We can't easily test the actual MCP server without running it,
      // but we can verify the logic by checking file creation
      const { generateTimestampedFilename } = await import('../src/utils.js');
      const { TranscriptionSession } = await import('../src/transcription-session.js');
      const { TranscriptManager } = await import('../src/transcript-manager.js');
      
      const filename = generateTimestampedFilename();
      testFiles.push(filename);
      
      const manager = new TranscriptManager(filename);
      manager.initialize();
      
      expect(existsSync(filename)).toBe(true);
      const content = manager.getContent();
      expect(content).toBe('# Meeting Transcript\n\n');
    });

    it('should create unique transcript files for multiple start calls', async () => {
      const { generateTimestampedFilename } = await import('../src/utils.js');
      const { TranscriptManager } = await import('../src/transcript-manager.js');
      
      // Simulate starting multiple sessions
      const file1 = generateTimestampedFilename();
      await new Promise(resolve => setTimeout(resolve, 2)); // Ensure different milliseconds
      const file2 = generateTimestampedFilename();
      await new Promise(resolve => setTimeout(resolve, 2));
      const file3 = generateTimestampedFilename();
      
      testFiles.push(file1, file2, file3);
      
      const manager1 = new TranscriptManager(file1);
      const manager2 = new TranscriptManager(file2);
      const manager3 = new TranscriptManager(file3);
      
      manager1.initialize();
      manager2.initialize();
      manager3.initialize();
      
      // All files should exist
      expect(existsSync(file1)).toBe(true);
      expect(existsSync(file2)).toBe(true);
      expect(existsSync(file3)).toBe(true);
      
      // All should have different names
      expect(file1).not.toBe(file2);
      expect(file2).not.toBe(file3);
      expect(file1).not.toBe(file3);
    });

    it('should reject starting a second session when one is already running', async () => {
      // This tests the business logic that prevents concurrent sessions
      const { TranscriptionSession } = await import('../src/transcription-session.js');
      
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
      
      const file = 'test_concurrent_session.md';
      testFiles.push(file);
      
      const session = new TranscriptionSession(audioConfig, transcriptionConfig, file);
      
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      
      await session.start();
      
      // Try to start again - should throw
      await expect(session.start()).rejects.toThrow('Session is already running');
    });
  });

  describe('get_status endpoint', () => {
    it('should return correct status for new session', async () => {
      const { TranscriptionSession } = await import('../src/transcription-session.js');
      
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
      
      const file = 'test_status.md';
      testFiles.push(file);
      
      const session = new TranscriptionSession(audioConfig, transcriptionConfig, file);
      const status = session.getStatus();
      
      expect(status.isRunning).toBe(false);
      expect(status.chunksProcessed).toBe(0);
      expect(status.errors).toBe(0);
    });

    it('should return file path in status', async () => {
      const { TranscriptionSession } = await import('../src/transcription-session.js');
      
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
      
      const file = 'test_status_path.md';
      testFiles.push(file);
      
      const session = new TranscriptionSession(audioConfig, transcriptionConfig, file);
      
      expect(session.getTranscriptPath()).toBe(file);
    });
  });

  describe('get_transcript endpoint', () => {
    it('should retrieve transcript content', async () => {
      const { TranscriptManager } = await import('../src/transcript-manager.js');
      
      const file = 'test_get_transcript.md';
      testFiles.push(file);
      
      const manager = new TranscriptManager(file);
      manager.initialize();
      manager.append({ timestamp: '2025-10-03 10:00:00', text: 'Test content' });
      
      const content = manager.getContent();
      expect(content).toContain('Test content');
      expect(content).toContain('2025-10-03 10:00:00');
    });

    it('should retrieve only the active session transcript', async () => {
      const { TranscriptManager } = await import('../src/transcript-manager.js');
      
      const file1 = 'test_transcript_1.md';
      const file2 = 'test_transcript_2.md';
      testFiles.push(file1, file2);
      
      const manager1 = new TranscriptManager(file1);
      const manager2 = new TranscriptManager(file2);
      
      manager1.initialize();
      manager2.initialize();
      
      manager1.append({ timestamp: '2025-10-03 10:00:00', text: 'Session 1 data' });
      manager2.append({ timestamp: '2025-10-03 11:00:00', text: 'Session 2 data' });
      
      const content1 = manager1.getContent();
      const content2 = manager2.getContent();
      
      expect(content1).toContain('Session 1 data');
      expect(content1).not.toContain('Session 2 data');
      
      expect(content2).toContain('Session 2 data');
      expect(content2).not.toContain('Session 1 data');
    });
  });

  describe('clear_transcript endpoint', () => {
    it('should clear transcript content', async () => {
      const { TranscriptManager } = await import('../src/transcript-manager.js');
      
      const file = 'test_clear.md';
      testFiles.push(file);
      
      const manager = new TranscriptManager(file);
      manager.initialize();
      manager.append({ timestamp: '2025-10-03 10:00:00', text: 'Old content' });
      
      let content = manager.getContent();
      expect(content).toContain('Old content');
      
      manager.clear();
      
      content = manager.getContent();
      expect(content).not.toContain('Old content');
      expect(content).toBe('# Meeting Transcript\n\n');
    });

    it('should maintain file path after clear', async () => {
      const { TranscriptManager } = await import('../src/transcript-manager.js');
      
      const file = 'test_clear_path.md';
      testFiles.push(file);
      
      const manager = new TranscriptManager(file);
      manager.initialize();
      manager.clear();
      
      expect(manager.getFilePath()).toBe(file);
      expect(existsSync(file)).toBe(true);
    });
  });

  describe('cleanup_transcript endpoint', () => {
    it('should delete transcript file', async () => {
      const { TranscriptManager } = await import('../src/transcript-manager.js');
      
      const file = 'test_cleanup.md';
      testFiles.push(file);
      
      const manager = new TranscriptManager(file);
      manager.initialize();
      manager.append({ timestamp: '2025-10-03 10:00:00', text: 'Test content' });
      
      expect(existsSync(file)).toBe(true);
      
      manager.delete();
      
      expect(existsSync(file)).toBe(false);
    });

    it('should only delete the specific session file', async () => {
      const { TranscriptManager } = await import('../src/transcript-manager.js');
      
      const file1 = 'test_cleanup_specific_1.md';
      const file2 = 'test_cleanup_specific_2.md';
      testFiles.push(file1, file2);
      
      const manager1 = new TranscriptManager(file1);
      const manager2 = new TranscriptManager(file2);
      
      manager1.initialize();
      manager2.initialize();
      
      manager1.append({ timestamp: '2025-10-03 10:00:00', text: 'File 1' });
      manager2.append({ timestamp: '2025-10-03 11:00:00', text: 'File 2' });
      
      // Delete only file 1
      manager1.delete();
      
      expect(existsSync(file1)).toBe(false);
      expect(existsSync(file2)).toBe(true);
      
      const content2 = manager2.getContent();
      expect(content2).toContain('File 2');
    });
  });

  describe('stop_transcription endpoint', () => {
    it('should stop running session', async () => {
      const { TranscriptionSession } = await import('../src/transcription-session.js');
      
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
      
      const file = 'test_stop.md';
      testFiles.push(file);
      
      const session = new TranscriptionSession(audioConfig, transcriptionConfig, file);
      
      // Mock dependencies
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      (session as any).audioCapturer.stop = jest.fn() as any;
      
      await session.start();
      expect(session.getStatus().isRunning).toBe(true);
      
      await session.stop();
      expect(session.getStatus().isRunning).toBe(false);
    });
  });

  describe('Session Lifecycle Integration', () => {
    it('should handle complete session lifecycle', async () => {
      const { TranscriptionSession } = await import('../src/transcription-session.js');
      const { TranscriptManager } = await import('../src/transcript-manager.js');
      
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
      
      const file = 'test_lifecycle.md';
      testFiles.push(file);
      
      // 1. Start session
      const session = new TranscriptionSession(audioConfig, transcriptionConfig, file);
      (session as any).transcriptionService.healthCheck = (jest.fn() as any).mockResolvedValue(true);
      (session as any).audioCapturer.startCapture = (jest.fn() as any).mockResolvedValue(undefined);
      (session as any).audioCapturer.stop = jest.fn() as any;
      
      await session.start();
      expect(session.getStatus().isRunning).toBe(true);
      expect(existsSync(file)).toBe(true);
      
      // 2. Get status
      const status = session.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.chunksProcessed).toBe(0);
      
      // 3. Add content (simulate transcription)
      const manager = new TranscriptManager(file);
      manager.append({ timestamp: '2025-10-03 10:00:00', text: 'Test transcription' });
      
      // 4. Get transcript
      const content = session.getTranscript();
      expect(content).toContain('Test transcription');
      
      // 5. Stop session
      await session.stop();
      expect(session.getStatus().isRunning).toBe(false);
      
      // 6. Cleanup
      manager.delete();
      expect(existsSync(file)).toBe(false);
    });
  });
});

