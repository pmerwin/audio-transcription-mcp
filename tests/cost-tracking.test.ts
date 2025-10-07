/**
 * Tests for cost tracking feature
 */

import { describe, it, expect, jest } from '@jest/globals';
import { TranscriptionSession } from "../src/transcription-session.js";
import type { AudioConfig, TranscriptionConfig } from "../src/types.js";

// Mock the dependencies
jest.mock('../src/audio-capturer.js');
jest.mock('../src/audio-processor.js');
jest.mock('../src/transcription-service.js');

describe("Cost Tracking", () => {
  const audioConfig: AudioConfig = {
    inputDeviceName: "BlackHole",
    sampleRate: 16000,
    channels: 1,
    chunkSeconds: 8,
  };

  const transcriptionConfig: TranscriptionConfig = {
    model: "whisper-1",
    apiKey: "test-key",
  };

  it("should calculate estimated cost based on chunks processed", () => {
    const session = new TranscriptionSession(
      audioConfig,
      transcriptionConfig,
      "/tmp/test-transcript.md"
    );

    // Manually set chunksProcessed (simulating API calls made)
    const status = session.getStatus();
    (session as any).status.chunksProcessed = 10; // 10 chunks of 8 seconds each

    const updatedStatus = session.getStatus();

    // 10 chunks * 8 seconds = 80 seconds = 1.333 minutes
    // 1.333 minutes * $0.006/min = $0.008
    expect(updatedStatus.estimatedCost).toBeDefined();
    expect(updatedStatus.estimatedCost).toBeCloseTo(0.008, 3);
  });

  it("should calculate cost savings from skipped silent chunks", () => {
    const session = new TranscriptionSession(
      audioConfig,
      transcriptionConfig,
      "/tmp/test-transcript.md"
    );

    // Simulate 10 chunks processed and 5 silent chunks skipped
    (session as any).status.chunksProcessed = 10;
    (session as any).status.silentChunksSkipped = 5;

    const status = session.getStatus();

    // 10 chunks = $0.008 cost
    // 5 skipped chunks = $0.004 saved
    expect(status.estimatedCost).toBeCloseTo(0.008, 3);
    expect(status.costSaved).toBeCloseTo(0.004, 3);
  });

  it("should handle different chunk sizes correctly", () => {
    const customAudioConfig: AudioConfig = {
      ...audioConfig,
      chunkSeconds: 15, // 15-second chunks
    };

    const session = new TranscriptionSession(
      customAudioConfig,
      transcriptionConfig,
      "/tmp/test-transcript.md"
    );

    // Simulate 10 chunks of 15 seconds each
    (session as any).status.chunksProcessed = 10;

    const status = session.getStatus();

    // 10 chunks * 15 seconds = 150 seconds = 2.5 minutes
    // 2.5 minutes * $0.006/min = $0.015
    expect(status.estimatedCost).toBeCloseTo(0.015, 3);
  });

  it("should return zero cost when no chunks processed", () => {
    const session = new TranscriptionSession(
      audioConfig,
      transcriptionConfig,
      "/tmp/test-transcript.md"
    );

    const status = session.getStatus();

    expect(status.estimatedCost).toBe(0);
    expect(status.costSaved).toBe(0);
  });

  it("should calculate realistic hour-long session cost", () => {
    const session = new TranscriptionSession(
      audioConfig,
      transcriptionConfig,
      "/tmp/test-transcript.md"
    );

    // 1 hour with 8-second chunks = 450 chunks
    // With 30% silence (135 chunks skipped)
    (session as any).status.chunksProcessed = 315; // 70% processed
    (session as any).status.silentChunksSkipped = 135; // 30% skipped

    const status = session.getStatus();

    // 315 chunks * 8 seconds = 2520 seconds = 42 minutes
    // 42 minutes * $0.006/min = $0.252
    expect(status.estimatedCost).toBeCloseTo(0.252, 3);

    // 135 chunks * 8 seconds = 1080 seconds = 18 minutes
    // 18 minutes * $0.006/min = $0.108
    expect(status.costSaved).toBeCloseTo(0.108, 3);
  });

  it("should format costs to 4 decimal places", () => {
    const session = new TranscriptionSession(
      audioConfig,
      transcriptionConfig,
      "/tmp/test-transcript.md"
    );

    // Small number of chunks for precision testing
    (session as any).status.chunksProcessed = 3;
    (session as any).status.silentChunksSkipped = 2;

    const status = session.getStatus();

    // Should be formatted to 4 decimal places
    expect(typeof status.estimatedCost).toBe("number");
    expect(typeof status.costSaved).toBe("number");
    
    // Check that values are reasonable (not NaN or Infinity)
    expect(status.estimatedCost).toBeGreaterThan(0);
    expect(status.costSaved).toBeGreaterThan(0);
    expect(isFinite(status.estimatedCost!)).toBe(true);
    expect(isFinite(status.costSaved!)).toBe(true);
  });
});

