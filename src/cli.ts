#!/usr/bin/env node
/**
 * Standalone CLI for audio transcription
 */

import dotenv from "dotenv";
import { TranscriptionSession } from "./transcription-session.js";
import { AudioConfig, TranscriptionConfig } from "./types.js";
import { timestamp, sleep } from "./utils.js";

// Load environment variables
dotenv.config();

const {
  OPENAI_API_KEY,
  MODEL = "whisper-1",
  CHUNK_SECONDS = "8",
  INPUT_DEVICE_NAME = "BlackHole",
  OUTFILE = "meeting_transcript.md",
  SAMPLE_RATE = "16000",
  CHANNELS = "1",
} = process.env;

if (!OPENAI_API_KEY) {
  console.error("Error: Missing OPENAI_API_KEY in .env file");
  console.error("Please copy env.example to .env and set your API key");
  process.exit(1);
}

// Configuration
const audioConfig: AudioConfig = {
  inputDeviceName: INPUT_DEVICE_NAME,
  sampleRate: Number(SAMPLE_RATE),
  channels: Number(CHANNELS),
  chunkSeconds: Number(CHUNK_SECONDS),
};

const transcriptionConfig: TranscriptionConfig = {
  model: MODEL,
  apiKey: OPENAI_API_KEY,
};

// Create session
const session = new TranscriptionSession(
  audioConfig,
  transcriptionConfig,
  OUTFILE
);

// Start transcription
async function main() {
  console.log("=".repeat(60));
  console.log("Audio Transcription CLI");
  console.log("=".repeat(60));
  console.log(`Output file: ${OUTFILE}`);
  console.log(`Audio device: ${INPUT_DEVICE_NAME}`);
  console.log(`Chunk size: ${CHUNK_SECONDS} seconds`);
  console.log(`Model: ${MODEL}`);
  console.log("=".repeat(60));
  console.log("\nPress Ctrl+C to stop transcription\n");

  try {
    await session.start();
  } catch (err: any) {
    console.error(`\n[${timestamp()}] Fatal error:`, err.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\nShutdown signal received...");
  await session.stop();

  const status = session.getStatus();
  console.log("\n" + "=".repeat(60));
  console.log("Session Summary");
  console.log("=".repeat(60));
  console.log(`Chunks processed: ${status.chunksProcessed}`);
  console.log(`Errors: ${status.errors}`);
  console.log(`Transcript saved to: ${session.getTranscriptPath()}`);
  console.log("=".repeat(60));

  await sleep(100);
  process.exit(0);
});

// Start the CLI
main();

