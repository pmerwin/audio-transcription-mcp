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
    chunksProcessed: number;
    lastTranscriptTime?: Date;
    errors: number;
    consecutiveSilentChunks?: number;
    warning?: string;
    isPaused?: boolean;
    pauseReason?: PauseReason;
}
//# sourceMappingURL=types.d.ts.map