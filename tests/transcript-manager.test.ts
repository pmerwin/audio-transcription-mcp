/**
 * Tests for TranscriptManager
 * Verifies file management and transcript operations
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TranscriptManager } from '../src/transcript-manager.js';
import { unlinkSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

describe('TranscriptManager', () => {
  const testFile = resolve(process.cwd(), 'test_transcript.md');
  let manager: TranscriptManager;

  beforeEach(() => {
    // Clean up before each test
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
    manager = new TranscriptManager(testFile);
  });

  afterEach(() => {
    // Clean up after each test
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
  });

  describe('initialize', () => {
    it('should create a new file with header if it does not exist', () => {
      manager.initialize();
      expect(existsSync(testFile)).toBe(true);
      const content = readFileSync(testFile, 'utf8');
      expect(content).toContain('# Meeting Transcript');
      expect(content).toContain('_Started:');
    });

    it('should not overwrite existing file when called', () => {
      manager.initialize();
      manager.append({ timestamp: '2025-10-03 10:00:00', text: 'Test entry' });
      
      const contentBefore = readFileSync(testFile, 'utf8');
      manager.initialize();
      const contentAfter = readFileSync(testFile, 'utf8');
      
      expect(contentAfter).toBe(contentBefore);
    });
  });

  describe('append', () => {
    it('should append entries to the file', () => {
      manager.initialize();
      manager.append({ timestamp: '2025-10-03 10:00:00', text: 'First entry' });
      
      const content = readFileSync(testFile, 'utf8');
      expect(content).toContain('First entry');
      expect(content).toContain('2025-10-03 10:00:00');
    });

    it('should format entries with markdown bold timestamps', () => {
      manager.initialize();
      manager.append({ timestamp: '2025-10-03 10:00:00', text: 'Test' });
      
      const content = readFileSync(testFile, 'utf8');
      expect(content).toContain('**2025-10-03 10:00:00**');
    });

    it('should append multiple entries in order', () => {
      manager.initialize();
      manager.append({ timestamp: '2025-10-03 10:00:00', text: 'First' });
      manager.append({ timestamp: '2025-10-03 10:00:01', text: 'Second' });
      manager.append({ timestamp: '2025-10-03 10:00:02', text: 'Third' });
      
      const content = readFileSync(testFile, 'utf8');
      const firstIndex = content.indexOf('First');
      const secondIndex = content.indexOf('Second');
      const thirdIndex = content.indexOf('Third');
      
      expect(firstIndex).toBeLessThan(secondIndex);
      expect(secondIndex).toBeLessThan(thirdIndex);
    });
  });

  describe('getContent', () => {
    it('should return empty string if file does not exist', () => {
      const content = manager.getContent();
      expect(content).toBe('');
    });

    it('should return full file content', () => {
      manager.initialize();
      manager.append({ timestamp: '2025-10-03 10:00:00', text: 'Test content' });
      
      const content = manager.getContent();
      expect(content).toContain('# Meeting Transcript');
      expect(content).toContain('Test content');
    });
  });

  describe('clear', () => {
    it('should delete existing file and create new one with header', () => {
      manager.initialize();
      manager.append({ timestamp: '2025-10-03 10:00:00', text: 'Old content' });
      
      manager.clear();
      
      const content = readFileSync(testFile, 'utf8');
      expect(content).toContain('# Meeting Transcript');
      expect(content).toContain('_Started:');
      expect(content).not.toContain('Old content');
    });

    it('should create file with header if it did not exist', () => {
      manager.clear();
      
      expect(existsSync(testFile)).toBe(true);
      const content = readFileSync(testFile, 'utf8');
      expect(content).toContain('# Meeting Transcript');
      expect(content).toContain('_Started:');
    });

    it('should prevent transcript bleeding across sessions', () => {
      // Simulate first session
      manager.initialize();
      manager.append({ timestamp: '2025-10-03 10:00:00', text: 'Session 1 content' });
      
      // Simulate starting a new session
      manager.clear();
      
      // Verify old content is gone
      const content = manager.getContent();
      expect(content).not.toContain('Session 1 content');
      expect(content).toContain('# Meeting Transcript');
      expect(content).toContain('_Started:');
      
      // Add new session content
      manager.append({ timestamp: '2025-10-03 11:00:00', text: 'Session 2 content' });
      
      const finalContent = manager.getContent();
      expect(finalContent).toContain('Session 2 content');
      expect(finalContent).not.toContain('Session 1 content');
    });
  });

  describe('delete', () => {
    it('should delete the file without recreating it', () => {
      manager.initialize();
      manager.delete();
      
      expect(existsSync(testFile)).toBe(false);
    });

    it('should not throw error if file does not exist', () => {
      expect(() => manager.delete()).not.toThrow();
    });
  });

  describe('getFilePath', () => {
    it('should return the correct file path', () => {
      expect(manager.getFilePath()).toBe(testFile);
    });
  });
});

