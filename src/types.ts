/**
 * Core types for the audio transcription system
 */

export interface AudioConfig {
  inputDeviceName: string;
  sampleRate: number;
  channels: number;
  chunkSeconds: number;
}

export interface TranscriptionConfig {
  model: string;
  apiKey: string;
}

export interface TranscriptEntry {
  timestamp: string;
  text: string;
}

export interface AudioDevice {
  index: string;
  name: string;
}

export type PauseReason = 'manual' | 'silence';

export interface TranscriptionStatus {
  isRunning: boolean;
  startTime?: Date;
  lastInteractionTime?: Date; // Last time user interacted (get_status, pause, resume, etc.)
  chunksProcessed: number;
  lastTranscriptTime?: Date;
  errors: number;
  consecutiveSilentChunks?: number;
  silentChunksSkipped?: number; // Total silent chunks NOT sent to OpenAI
  warning?: string;
  isPaused?: boolean;
  pauseReason?: PauseReason;
}

export type StatusChangeEvent = 
  | { type: 'started'; timestamp: Date }
  | { type: 'paused'; reason: PauseReason; message: string; timestamp: Date }
  | { type: 'resumed'; previousReason: PauseReason; timestamp: Date }
  | { type: 'stopped'; stats: { chunksProcessed: number; duration: number; errors: number }; timestamp: Date }
  | { type: 'silence_detected'; consecutiveChunks: number; timestamp: Date }
  | { type: 'audio_detected'; timestamp: Date }
  | { type: 'warning'; message: string; elapsedMinutes: number; timestamp: Date };

export type StatusChangeCallback = (event: StatusChangeEvent) => void;

