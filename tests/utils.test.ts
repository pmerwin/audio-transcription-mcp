/**
 * Tests for utility functions
 */

import { describe, it, expect } from '@jest/globals';
import { generateTimestampedFilename, timestamp, sleep } from '../src/utils.js';

describe('Utility Functions', () => {
  describe('generateTimestampedFilename', () => {
    it('should generate filename with correct format', () => {
      const filename = generateTimestampedFilename();
      expect(filename).toMatch(/^transcript_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-\d{3}\.md$/);
    });

    it('should generate unique filenames for different calls', async () => {
      const filename1 = generateTimestampedFilename();
      await sleep(1000); // Wait 1 second
      const filename2 = generateTimestampedFilename();
      
      expect(filename1).not.toBe(filename2);
    });

    it('should have transcript_ prefix', () => {
      const filename = generateTimestampedFilename();
      expect(filename).toMatch(/^transcript_/);
    });

    it('should have .md extension', () => {
      const filename = generateTimestampedFilename();
      expect(filename).toMatch(/\.md$/);
    });

    it('should use correct date format (YYYY-MM-DD_HH-MM-SS-mmm)', () => {
      const filename = generateTimestampedFilename();
      const pattern = /^transcript_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})-(\d{3})\.md$/;
      const match = filename.match(pattern);
      
      expect(match).toBeTruthy();
      
      if (match) {
        const [, year, month, day, hours, minutes, seconds, milliseconds] = match;
        
        // Validate year
        expect(Number(year)).toBeGreaterThanOrEqual(2020);
        expect(Number(year)).toBeLessThanOrEqual(2100);
        
        // Validate month
        expect(Number(month)).toBeGreaterThanOrEqual(1);
        expect(Number(month)).toBeLessThanOrEqual(12);
        
        // Validate day
        expect(Number(day)).toBeGreaterThanOrEqual(1);
        expect(Number(day)).toBeLessThanOrEqual(31);
        
        // Validate hours
        expect(Number(hours)).toBeGreaterThanOrEqual(0);
        expect(Number(hours)).toBeLessThanOrEqual(23);
        
        // Validate minutes
        expect(Number(minutes)).toBeGreaterThanOrEqual(0);
        expect(Number(minutes)).toBeLessThanOrEqual(59);
        
        // Validate seconds
        expect(Number(seconds)).toBeGreaterThanOrEqual(0);
        expect(Number(seconds)).toBeLessThanOrEqual(59);
        
        // Validate milliseconds
        expect(Number(milliseconds)).toBeGreaterThanOrEqual(0);
        expect(Number(milliseconds)).toBeLessThanOrEqual(999);
      }
    });
  });

  describe('timestamp', () => {
    it('should return string in ISO-like format', () => {
      const ts = timestamp();
      expect(ts).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should not include milliseconds', () => {
      const ts = timestamp();
      expect(ts).not.toMatch(/\.\d+/);
    });
  });

  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeGreaterThanOrEqual(95); // Allow small variance
      expect(elapsed).toBeLessThan(200);
    });
  });
});

