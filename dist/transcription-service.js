/**
 * Transcription service using OpenAI Whisper API
 */
import { OpenAI, toFile } from "openai";
import { timestamp } from "./utils.js";
export class TranscriptionService {
    client;
    config;
    constructor(config) {
        this.config = config;
        this.client = new OpenAI({ apiKey: config.apiKey });
    }
    /**
     * Transcribe an audio buffer (WAV format)
     */
    async transcribe(wavBuffer) {
        try {
            const file = await toFile(wavBuffer, "chunk.wav", { type: "audio/wav" });
            const response = await this.client.audio.transcriptions.create({
                model: this.config.model,
                file: file,
            });
            const text = (response.text || "").trim();
            if (text) {
                return {
                    timestamp: timestamp(),
                    text: text,
                };
            }
            return null;
        }
        catch (err) {
            throw new Error(`Transcription API error: ${err?.message || JSON.stringify(err)}`);
        }
    }
    /**
     * Health check - verify API key is valid
     */
    async healthCheck() {
        try {
            // Simple way to check: list models (lightweight call)
            await this.client.models.list();
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=transcription-service.js.map