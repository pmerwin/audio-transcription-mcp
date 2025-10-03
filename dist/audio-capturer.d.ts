/**
 * Audio capture using ffmpeg and AVFoundation (macOS)
 */
import { AudioConfig } from "./types.js";
export declare class AudioCapturer {
    private ffmpegProcess;
    private config;
    constructor(config: AudioConfig);
    /**
     * Find AVFoundation audio device index by name
     */
    findAudioDeviceIndex(nameSubstr: string): Promise<string | null>;
    /**
     * Start capturing audio and return a readable stream
     */
    startCapture(onData: (chunk: Buffer) => void, onError: (error: Error) => void): Promise<void>;
    /**
     * Stop capturing audio
     */
    stop(): void;
    /**
     * Check if capture is running
     */
    isRunning(): boolean;
}
//# sourceMappingURL=audio-capturer.d.ts.map