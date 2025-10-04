/**
 * Utility functions
 */
/**
 * Get current timestamp in ISO format without milliseconds
 */
export function timestamp() {
    const d = new Date();
    return d.toISOString().replace("T", " ").split(".")[0];
}
/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Generate a unique timestamped filename for transcript isolation
 * Format: transcript_YYYY-MM-DD_HH-MM-SS-mmm.md (includes milliseconds)
 * This ensures each session gets its own file for privacy
 */
export function generateTimestampedFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    return `transcript_${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${milliseconds}.md`;
}
/**
 * Detect if an audio buffer is silent or contains very low audio
 * Checks PCM s16le data for amplitude below threshold
 * @param pcmBuffer - PCM buffer (s16le format)
 * @param threshold - Maximum absolute amplitude to consider silent (default: 100)
 * @returns true if the buffer is considered silent
 */
export function isSilentAudio(pcmBuffer, threshold = 100) {
    // Check if buffer is too small or empty
    if (!pcmBuffer || pcmBuffer.length < 2) {
        return true;
    }
    // Sample every 100th value for efficiency (s16le = 2 bytes per sample)
    const sampleInterval = 100;
    let maxAmplitude = 0;
    for (let i = 0; i < pcmBuffer.length - 1; i += sampleInterval * 2) {
        // Read signed 16-bit little-endian sample
        const sample = pcmBuffer.readInt16LE(i);
        const amplitude = Math.abs(sample);
        if (amplitude > maxAmplitude) {
            maxAmplitude = amplitude;
        }
        // Early exit if we find significant audio
        if (maxAmplitude > threshold) {
            return false;
        }
    }
    return maxAmplitude <= threshold;
}
/**
 * Convert PCM buffer to WAV format
 */
export function pcmToWav(pcmBuf, sampleRate, channels) {
    const byteRate = sampleRate * channels * 2;
    const blockAlign = channels * 2;
    const dataSize = pcmBuf.length;
    const headerSize = 44;
    const fileSize = headerSize - 8 + dataSize;
    const buf = Buffer.alloc(headerSize + dataSize);
    // RIFF header
    buf.write("RIFF", 0);
    buf.writeUInt32LE(fileSize, 4);
    buf.write("WAVE", 8);
    // fmt subchunk
    buf.write("fmt ", 12);
    buf.writeUInt32LE(16, 16); // Subchunk1Size for PCM
    buf.writeUInt16LE(1, 20); // PCM format
    buf.writeUInt16LE(channels, 22);
    buf.writeUInt32LE(sampleRate, 24);
    buf.writeUInt32LE(byteRate, 28);
    buf.writeUInt16LE(blockAlign, 32);
    buf.writeUInt16LE(16, 34); // bits per sample
    // data subchunk
    buf.write("data", 36);
    buf.writeUInt32LE(dataSize, 40);
    pcmBuf.copy(buf, 44);
    return buf;
}
//# sourceMappingURL=utils.js.map