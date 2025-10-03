#!/usr/bin/env node
/**
 * MCP Server for Audio Transcription
 * Exposes tools for AI assistants to control real-time audio transcription
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { TranscriptionSession } from "./transcription-session.js";
import { readFileSync } from "fs";
import { resolve } from "path";
// Load environment variables
dotenv.config();
const { OPENAI_API_KEY, MODEL = "whisper-1", CHUNK_SECONDS = "8", INPUT_DEVICE_NAME = "BlackHole", OUTFILE = "meeting_transcript.md", SAMPLE_RATE = "16000", CHANNELS = "1", } = process.env;
if (!OPENAI_API_KEY) {
    console.error("Error: Missing OPENAI_API_KEY in environment");
    process.exit(1);
}
// Server state
let session = null;
let currentOutputFile = OUTFILE;
const audioConfig = {
    inputDeviceName: INPUT_DEVICE_NAME,
    sampleRate: Number(SAMPLE_RATE),
    channels: Number(CHANNELS),
    chunkSeconds: Number(CHUNK_SECONDS),
};
const transcriptionConfig = {
    model: MODEL,
    apiKey: OPENAI_API_KEY,
};
// Create MCP server
const server = new Server({
    name: "audio-transcription",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "start_transcription",
                description: "Start capturing and transcribing system audio in real-time using OpenAI Whisper. Audio is captured in chunks and transcribed continuously.",
                inputSchema: {
                    type: "object",
                    properties: {
                        inputDevice: {
                            type: "string",
                            description: "Audio input device name (default: BlackHole)",
                        },
                        chunkSeconds: {
                            type: "number",
                            description: "Seconds of audio per transcription chunk (default: 8)",
                        },
                        outputFile: {
                            type: "string",
                            description: "Output transcript filename (default: meeting_transcript.md)",
                        },
                    },
                },
            },
            {
                name: "stop_transcription",
                description: "Stop the current transcription session and return statistics about the session.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_status",
                description: "Get the current status of the transcription session including whether it's running, number of chunks processed, and errors.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_transcript",
                description: "Retrieve the current transcript content. Optionally get only the last N lines.",
                inputSchema: {
                    type: "object",
                    properties: {
                        lines: {
                            type: "number",
                            description: "Optional: Return only the last N lines",
                        },
                    },
                },
            },
            {
                name: "clear_transcript",
                description: "Clear the transcript file and reinitialize it with a fresh header.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "cleanup_transcript",
                description: "Delete the transcript file completely. Use this to remove the transcript file when you're done.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "start_transcription": {
                if (session && session.getStatus().isRunning) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: false,
                                    message: "Transcription session is already running",
                                    outputFile: currentOutputFile,
                                }),
                            },
                        ],
                    };
                }
                // Update config if provided
                const inputDevice = args?.inputDevice || INPUT_DEVICE_NAME;
                const chunkSeconds = args?.chunkSeconds || Number(CHUNK_SECONDS);
                const outputFile = args?.outputFile || OUTFILE;
                currentOutputFile = outputFile;
                const customAudioConfig = {
                    ...audioConfig,
                    inputDeviceName: inputDevice,
                    chunkSeconds: chunkSeconds,
                };
                session = new TranscriptionSession(customAudioConfig, transcriptionConfig, outputFile);
                await session.start();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                message: "Transcription started successfully",
                                outputFile: outputFile,
                                config: {
                                    inputDevice: inputDevice,
                                    chunkSeconds: chunkSeconds,
                                    model: MODEL,
                                },
                            }),
                        },
                    ],
                };
            }
            case "stop_transcription": {
                if (!session) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: false,
                                    message: "No active transcription session",
                                }),
                            },
                        ],
                    };
                }
                const statusBefore = session.getStatus();
                await session.stop();
                const duration = statusBefore.startTime
                    ? Math.floor((Date.now() - statusBefore.startTime.getTime()) / 1000)
                    : 0;
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                message: "Transcription stopped successfully",
                                stats: {
                                    chunksProcessed: statusBefore.chunksProcessed,
                                    duration: `${duration} seconds`,
                                    errors: statusBefore.errors,
                                },
                            }),
                        },
                    ],
                };
            }
            case "get_status": {
                if (!session) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    isRunning: false,
                                    chunksProcessed: 0,
                                    errors: 0,
                                }),
                            },
                        ],
                    };
                }
                const status = session.getStatus();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                isRunning: status.isRunning,
                                startTime: status.startTime?.toISOString(),
                                chunksProcessed: status.chunksProcessed,
                                lastTranscriptTime: status.lastTranscriptTime?.toISOString(),
                                errors: status.errors,
                                outputFile: currentOutputFile,
                            }),
                        },
                    ],
                };
            }
            case "get_transcript": {
                if (!session) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: false,
                                    message: "No active transcription session",
                                }),
                            },
                        ],
                    };
                }
                const content = session.getTranscript();
                const lines = content.split("\n");
                const requestedLines = args?.lines;
                let resultContent = content;
                if (requestedLines && requestedLines > 0) {
                    resultContent = lines.slice(-requestedLines).join("\n");
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                content: resultContent,
                                totalLines: lines.length,
                                filePath: session.getTranscriptPath(),
                            }),
                        },
                    ],
                };
            }
            case "clear_transcript": {
                if (session) {
                    session.clearTranscript();
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: true,
                                    message: "Transcript cleared successfully",
                                }),
                            },
                        ],
                    };
                }
                else {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: false,
                                    message: "No active transcription session",
                                }),
                            },
                        ],
                    };
                }
            }
            case "cleanup_transcript": {
                try {
                    // Stop session if running
                    if (session && session.getStatus().isRunning) {
                        await session.stop();
                    }
                    // Delete the transcript file
                    const { unlinkSync, existsSync } = await import("fs");
                    const { resolve } = await import("path");
                    const filePath = resolve(process.cwd(), currentOutputFile);
                    if (existsSync(filePath)) {
                        unlinkSync(filePath);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        success: true,
                                        message: "Transcript file deleted successfully",
                                        filePath: currentOutputFile,
                                    }),
                                },
                            ],
                        };
                    }
                    else {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        success: true,
                                        message: "Transcript file does not exist",
                                        filePath: currentOutputFile,
                                    }),
                                },
                            ],
                        };
                    }
                }
                catch (error) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: false,
                                    error: error.message,
                                }),
                            },
                        ],
                        isError: true,
                    };
                }
            }
            default:
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                message: `Unknown tool: ${name}`,
                            }),
                        },
                    ],
                };
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                    }),
                },
            ],
            isError: true,
        };
    }
});
// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: "transcript://current",
                mimeType: "text/markdown",
                name: "Current Transcript",
                description: "The current audio transcription in real-time",
            },
        ],
    };
});
// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    if (uri === "transcript://current") {
        try {
            const filePath = session?.getTranscriptPath() || currentOutputFile;
            const absolutePath = resolve(process.cwd(), filePath);
            const content = readFileSync(absolutePath, "utf-8");
            return {
                contents: [
                    {
                        uri,
                        mimeType: "text/markdown",
                        text: content,
                    },
                ],
            };
        }
        catch (error) {
            return {
                contents: [
                    {
                        uri,
                        mimeType: "text/plain",
                        text: `Error reading transcript: ${error.message}`,
                    },
                ],
            };
        }
    }
    throw new Error(`Unknown resource: ${uri}`);
});
// Graceful shutdown
async function cleanup() {
    if (session) {
        await session.stop();
    }
    process.exit(0);
}
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Audio Transcription MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
//# sourceMappingURL=mcp-server.js.map