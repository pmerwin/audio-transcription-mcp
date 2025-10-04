#!/usr/bin/env node
/**
 * MCP Server for Audio Transcription
 * Exposes tools for AI assistants to control real-time audio transcription
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { TranscriptionSession } from "./transcription-session.js";
import { AudioConfig, TranscriptionConfig } from "./types.js";
import { generateTimestampedFilename } from "./utils.js";
import { readFileSync, appendFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, join, dirname } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

// Get package version dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
const VERSION = packageJson.version;

// Load environment variables
dotenv.config();

const {
  OPENAI_API_KEY,
  MODEL = "whisper-1",
  CHUNK_SECONDS = "8",
  INPUT_DEVICE_NAME = "BlackHole",
  OUTFILE = "meeting_transcript.md",
  OUTFILE_DIR = process.cwd(), // Default to current working directory
  SAMPLE_RATE = "16000",
  CHANNELS = "1",
} = process.env;

// Debug logging to file (console.error interferes with MCP JSON-RPC protocol!)
const DEBUG_LOG = join(homedir(), '.audio-transcription-mcp-debug.log');

// Clear debug log on startup for fresh session
try {
  writeFileSync(DEBUG_LOG, '');
} catch (e) {
  // Silently fail if can't clear debug log
}

function debugLog(message: string) {
  const timestamp = new Date().toISOString();
  try {
    appendFileSync(DEBUG_LOG, `[${timestamp}] ${message}\n`);
  } catch (e) {
    // Silently fail if can't write debug log
  }
}

debugLog("=== Audio Transcription MCP Server Debug ===");
debugLog(`Version: ${VERSION}`);
debugLog(`Current working directory: ${process.cwd()}`);
debugLog(`OUTFILE_DIR: ${OUTFILE_DIR}`);
debugLog(`OPENAI_API_KEY: ${OPENAI_API_KEY ? "✓ Set" : "✗ Not set"}`);
debugLog("==========================================");

// Helper function for consistent error responses
function createErrorResponse(message: string, isError: boolean = false) {
  const response = {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          success: false,
          message: message,
        }),
      },
    ],
  };
  
  if (isError) {
    return { ...response, isError: true };
  }
  
  return response;
}

// Helper function for consistent success responses
function createSuccessResponse(data: any) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          success: true,
          ...data,
        }),
      },
    ],
  };
}

if (!OPENAI_API_KEY) {
  console.error("Error: Missing OPENAI_API_KEY in environment");
  process.exit(1);
}

// Server state - maintains active session with its unique transcript
let session: TranscriptionSession | null = null;

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

// Create MCP server
const server = new Server(
  {
    name: "audio-transcription",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "start_transcription",
        description:
          "Start capturing and transcribing system audio in real-time using OpenAI Whisper. Audio is captured in chunks and transcribed continuously. " +
          "IMPORTANT: After starting, periodically check get_status (every 30-60 seconds) to monitor for silence detection or audio routing issues. " +
          "The system will auto-pause after 32 seconds of silence and notify you in the transcript.",
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
              description: "Output transcript filename (default: auto-generated timestamped filename for privacy/isolation)",
            },
          },
        },
      },
      {
        name: "pause_transcription",
        description:
          "Pause the current transcription session. Audio capture continues but transcription is paused. Use resume_transcription to continue.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "resume_transcription",
        description:
          "Resume transcription after it has been paused (either manually or due to silence detection).",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "stop_transcription",
        description:
          "Stop the current transcription session completely and return statistics. This ends the session and stops audio capture.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_status",
        description:
          "Get the current status of the transcription session including whether it's running, number of chunks processed, and errors. " +
          "CRITICAL: Check this regularly (every 30-60 seconds) during active transcription to catch audio routing issues, silence detection, or paused states. " +
          "Returns isPaused, pauseReason, and warning fields if issues are detected.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_transcript",
        description:
          "Retrieve the current transcript content. Optionally get only the last N lines.",
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
        description:
          "Clear the transcript file and reinitialize it with a fresh header.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "cleanup_transcript",
        description:
          "Delete the transcript file completely. Use this to remove the transcript file when you're done.",
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
                  outputFile: session.getTranscriptPath(),
                }),
              },
            ],
          };
        }

        // Update config if provided
        const inputDevice = (args?.inputDevice as string) || INPUT_DEVICE_NAME;
        const chunkSeconds = (args?.chunkSeconds as number) || Number(CHUNK_SECONDS);
        
        // IMPORTANT: Use timestamped filename by default for privacy/isolation
        // Each session gets its own unique file to prevent transcript bleeding
        const filename = (args?.outputFile as string) || generateTimestampedFilename();
        
        // Combine OUTFILE_DIR with the filename to get full path
        // This allows Claude Desktop to have write access via allowedDirectories
        const outputFile = join(OUTFILE_DIR, filename);
        
        // Debug logging
        debugLog(`Starting transcription:`);
        debugLog(`  filename: ${filename}`);
        debugLog(`  OUTFILE_DIR: ${OUTFILE_DIR}`);
        debugLog(`  outputFile: ${outputFile}`);

        const customAudioConfig: AudioConfig = {
          ...audioConfig,
          inputDeviceName: inputDevice,
          chunkSeconds: chunkSeconds,
        };

        // Create session with status change callback for notifications
        session = new TranscriptionSession(
          customAudioConfig,
          transcriptionConfig,
          outputFile,
          (event) => {
            // Log all status changes prominently
            const timestamp = new Date().toISOString();
            switch (event.type) {
              case 'started':
                debugLog(`🎤 TRANSCRIPTION STARTED at ${timestamp}`);
                break;
              case 'paused':
                debugLog(`⏸️  TRANSCRIPTION PAUSED (${event.reason}): ${event.message} at ${timestamp}`);
                break;
              case 'resumed':
                debugLog(`▶️  TRANSCRIPTION RESUMED (was ${event.previousReason}) at ${timestamp}`);
                break;
              case 'stopped':
                debugLog(`⏹️  TRANSCRIPTION STOPPED at ${timestamp} - Chunks: ${event.stats.chunksProcessed}, Duration: ${event.stats.duration}s, Errors: ${event.stats.errors}`);
                break;
              case 'silence_detected':
                debugLog(`🔇 SILENCE DETECTED (${event.consecutiveChunks}/4 chunks) at ${timestamp}`);
                break;
              case 'audio_detected':
                debugLog(`🎵 AUDIO DETECTED at ${timestamp}`);
                break;
            }
          },
          VERSION
        );

        await session.start();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Transcription started successfully. IMPORTANT: Periodically check get_status (every 30-60 seconds) to monitor for audio routing issues or silence detection. The system will auto-pause after 32 seconds of silence.",
                outputFile: outputFile,
                config: {
                  inputDevice: inputDevice,
                  chunkSeconds: chunkSeconds,
                  model: MODEL,
                },
                monitoring: {
                  recommendation: "Call get_status every 30-60 seconds to catch audio issues early",
                  autoPauseTrigger: "32 seconds of silence",
                  autoResumeEnabled: true,
                  warningLocation: "Check transcript://current resource for warning banner if paused",
                },
              }),
            },
          ],
        };
      }

      case "pause_transcription": {
        if (!session) {
          return createErrorResponse("No active transcription session");
        }

        try {
          session.pause();
          return createSuccessResponse({
            message: "Transcription paused successfully. Use resume_transcription to continue.",
          });
        } catch (error: any) {
          return createErrorResponse(error.message);
        }
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
                  consecutiveSilentChunks: 0,
                  isPaused: false,
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
                consecutiveSilentChunks: status.consecutiveSilentChunks,
                silentChunksSkipped: status.silentChunksSkipped,
                isPaused: status.isPaused,
                pauseReason: status.pauseReason,
                warning: status.warning,
                outputFile: session.getTranscriptPath(),
              }),
            },
          ],
        };
      }

      case "resume_transcription": {
        if (!session) {
          return createErrorResponse("No active transcription session");
        }

        try {
          session.resume();
          return createSuccessResponse({
            message: "Transcription resumed successfully. Listening for audio...",
          });
        } catch (error: any) {
          return createErrorResponse(error.message);
        }
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
        const requestedLines = args?.lines as number | undefined;

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
        } else {
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

          // Get the transcript path from the active session
          const transcriptPath = session.getTranscriptPath();
          
          // Stop session if running
          if (session.getStatus().isRunning) {
            await session.stop();
          }
          
          // Delete the transcript file associated with this session
          const { unlinkSync, existsSync } = await import("fs");
          const { resolve } = await import("path");
          // Use absolute path if transcriptPath is already absolute, otherwise resolve relative to OUTFILE_DIR
          const filePath = transcriptPath.startsWith('/') ? transcriptPath : resolve(OUTFILE_DIR, transcriptPath);
          
          if (existsSync(filePath)) {
            unlinkSync(filePath);
            // Clear the session reference after cleanup
            session = null;
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    message: "Transcript file deleted successfully",
                    filePath: transcriptPath,
                  }),
                },
              ],
            };
          } else {
            // Clear the session reference even if file doesn't exist
            session = null;
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    message: "Transcript file does not exist",
                    filePath: transcriptPath,
                  }),
                },
              ],
            };
          }
        } catch (error: any) {
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
  } catch (error: any) {
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
        description: "The current audio transcription in real-time. " +
          "IMPORTANT: If transcription is paused, a warning banner will appear at the top. " +
          "Check this resource periodically to monitor transcription health and catch issues early.",
      },
    ],
  };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "transcript://current") {
    try {
      if (!session) {
        return {
          contents: [
            {
              uri,
              mimeType: "text/plain",
              text: "No active transcription session",
            },
          ],
        };
      }
      
      const filePath = session.getTranscriptPath();
      // Use absolute path if filePath is already absolute, otherwise resolve relative to OUTFILE_DIR
      const absolutePath = filePath.startsWith('/') ? filePath : resolve(OUTFILE_DIR, filePath);
      let content = readFileSync(absolutePath, "utf-8");
      
      // Add warning banner if transcription is paused
      const status = session.getStatus();
      if (status.isPaused) {
        const warningBanner = 
          `\n\n⚠️ ⚠️ ⚠️ TRANSCRIPTION STATUS ALERT ⚠️ ⚠️ ⚠️\n\n` +
          `**Status**: PAUSED\n` +
          `**Reason**: ${status.pauseReason || 'unknown'}\n` +
          `**Message**: ${status.warning || 'Transcription is paused'}\n` +
          `**Action**: ${status.pauseReason === 'manual' ? 'Call resume_transcription to continue' : 'Will auto-resume when audio is detected'}\n\n` +
          `⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️\n\n` +
          `---\n\n`;
        
        content = warningBanner + content;
      }

      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    } catch (error: any) {
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

