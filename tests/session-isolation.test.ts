/**
 * Tests for Session Isolation and Privacy
 * Verifies that each transcription session is completely isolated
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TranscriptionSession } from '../src/transcription-session.js';
import { TranscriptManager } from '../src/transcript-manager.js';
import { AudioConfig, TranscriptionConfig } from '../src/types.js';
import { generateTimestampedFilename } from '../src/utils.js';
import { unlinkSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

describe('Session Isolation and Privacy', () => {
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

  const testFiles: string[] = [];

  afterEach(() => {
    // Clean up all test transcript files
    testFiles.forEach(file => {
      const filePath = resolve(process.cwd(), file);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    });
    testFiles.length = 0;
  });

  describe('Unique Filename Generation', () => {
    it('should generate unique timestamped filenames', async () => {
      const filename1 = generateTimestampedFilename();
      await new Promise(resolve => setTimeout(resolve, 2)); // Ensure different milliseconds
      const filename2 = generateTimestampedFilename();
      
      // With milliseconds, they should always be different when called with delay
      expect(filename1).toMatch(/^transcript_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-\d{3}\.md$/);
      expect(filename2).toMatch(/^transcript_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-\d{3}\.md$/);
      expect(filename1).not.toBe(filename2);
    });

    it('should create separate files for each session', () => {
      const file1 = generateTimestampedFilename();
      const file2 = generateTimestampedFilename();
      
      testFiles.push(file1, file2);
      
      const manager1 = new TranscriptManager(file1);
      const manager2 = new TranscriptManager(file2);
      
      manager1.initialize();
      manager2.initialize();
      
      expect(existsSync(file1)).toBe(true);
      expect(existsSync(file2)).toBe(true);
    });
  });

  describe('Session Transcript Isolation', () => {
    it('should keep transcripts completely separate between sessions', () => {
      // Use explicit different filenames to ensure isolation
      const file1 = 'test_session_isolation_1.md';
      const file2 = 'test_session_isolation_2.md';
      
      testFiles.push(file1, file2);
      
      // Create first session and add content
      const manager1 = new TranscriptManager(file1);
      manager1.initialize();
      manager1.append({ timestamp: '2025-10-03 10:00:00', text: 'Session 1 content' });
      
      // Create second session and add different content
      const manager2 = new TranscriptManager(file2);
      manager2.initialize();
      manager2.append({ timestamp: '2025-10-03 11:00:00', text: 'Session 2 content' });
      
      // Verify isolation
      const content1 = manager1.getContent();
      const content2 = manager2.getContent();
      
      expect(content1).toContain('Session 1 content');
      expect(content1).not.toContain('Session 2 content');
      
      expect(content2).toContain('Session 2 content');
      expect(content2).not.toContain('Session 1 content');
    });

    it('should not share state between session objects', () => {
      const file1 = 'test_session_state_1.md';
      const file2 = 'test_session_state_2.md';
      
      testFiles.push(file1, file2);
      
      const session1 = new TranscriptionSession(audioConfig, transcriptionConfig, file1);
      const session2 = new TranscriptionSession(audioConfig, transcriptionConfig, file2);
      
      expect(session1.getTranscriptPath()).toBe(file1);
      expect(session2.getTranscriptPath()).toBe(file2);
      expect(session1.getTranscriptPath()).not.toBe(session2.getTranscriptPath());
    });

    it('should maintain separate status for each session', () => {
      const file1 = 'test_session_status_1.md';
      const file2 = 'test_session_status_2.md';
      
      testFiles.push(file1, file2);
      
      const session1 = new TranscriptionSession(audioConfig, transcriptionConfig, file1);
      const session2 = new TranscriptionSession(audioConfig, transcriptionConfig, file2);
      
      const status1 = session1.getStatus();
      const status2 = session2.getStatus();
      
      // Both should start with clean state
      expect(status1.isRunning).toBe(false);
      expect(status1.chunksProcessed).toBe(0);
      expect(status2.isRunning).toBe(false);
      expect(status2.chunksProcessed).toBe(0);
      
      // But they should be separate objects
      expect(status1).not.toBe(status2);
    });
  });

  describe('Privacy Guarantees', () => {
    it('should not allow cross-contamination of transcript data', () => {
      const file1 = 'test_privacy_1.md';
      const file2 = 'test_privacy_2.md';
      
      testFiles.push(file1, file2);
      
      const manager1 = new TranscriptManager(file1);
      const manager2 = new TranscriptManager(file2);
      
      manager1.initialize();
      manager2.initialize();
      
      // Add sensitive content to session 1
      manager1.append({ timestamp: '2025-10-03 10:00:00', text: 'Private: Confidential meeting notes' });
      
      // Session 2 should never see session 1's data
      const session2Content = manager2.getContent();
      expect(session2Content).not.toContain('Private');
      expect(session2Content).not.toContain('Confidential');
    });

    it('should ensure each session writes to its own unique file', () => {
      const sessions = [
        'test_multi_session_0.md',
        'test_multi_session_1.md',
        'test_multi_session_2.md',
      ];
      
      testFiles.push(...sessions);
      
      // Create managers for each session
      const managers = sessions.map(file => {
        const mgr = new TranscriptManager(file);
        mgr.initialize();
        return mgr;
      });
      
      // Add unique content to each
      managers.forEach((mgr, idx) => {
        mgr.append({ 
          timestamp: `2025-10-03 10:0${idx}:00`, 
          text: `Unique session ${idx} data` 
        });
      });
      
      // Verify each file has only its own data
      managers.forEach((mgr, idx) => {
        const content = mgr.getContent();
        expect(content).toContain(`Unique session ${idx} data`);
        
        // Verify it doesn't contain other sessions' data
        managers.forEach((_, otherIdx) => {
          if (otherIdx !== idx) {
            expect(content).not.toContain(`Unique session ${otherIdx} data`);
          }
        });
      });
    });
  });

  describe('Session Cleanup', () => {
    it('should only delete the specific session transcript on cleanup', () => {
      const file1 = 'test_cleanup_1.md';
      const file2 = 'test_cleanup_2.md';
      
      testFiles.push(file1, file2);
      
      const manager1 = new TranscriptManager(file1);
      const manager2 = new TranscriptManager(file2);
      
      manager1.initialize();
      manager2.initialize();
      
      manager1.append({ timestamp: '2025-10-03 10:00:00', text: 'Session 1' });
      manager2.append({ timestamp: '2025-10-03 11:00:00', text: 'Session 2' });
      
      // Delete only session 1
      manager1.delete();
      
      expect(existsSync(file1)).toBe(false);
      expect(existsSync(file2)).toBe(true);
      
      // Session 2 should still have its data
      const content2 = manager2.getContent();
      expect(content2).toContain('Session 2');
    });
  });
});

