# MCP Server Setup Guide

## Overview

This audio transcription tool can be used as a **Model Context Protocol (MCP) Server** in Cursor or Claude Desktop, allowing AI assistants to control real-time audio transcription.

## Prerequisites

Before setting up the MCP server, ensure you have completed the basic setup from [GETTING_STARTED.md](./GETTING_STARTED.md):

- ✅ Node.js 20+ installed via nvm
- ✅ ffmpeg installed
- ✅ BlackHole audio driver installed
- ✅ Multi-Output Device configured
- ✅ OpenAI API key available
- ✅ Project built (`npm run build`)

## Configuration

### 1. Cursor Configuration

Add the MCP server to your Cursor settings:

**Location:** `~/.cursor/config.json` or via Cursor Settings → MCP Servers

#### Option A: Using npx (Recommended - No Installation Required!)

```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "npx",
      "args": [
        "-y",
        "audio-transcription-mcp"
      ],
      "env": {
        "OPENAI_API_KEY": "sk-your-key-here",
        "INPUT_DEVICE_NAME": "BlackHole",
        "CHUNK_SECONDS": "8",
        "MODEL": "whisper-1"
      }
    }
  }
}
```

**Benefits of npx:**
- ✅ No need to clone the repository
- ✅ No need to specify full file paths
- ✅ Automatically uses the latest published version
- ✅ Works from any directory

#### Option B: Using Local Installation (For Development)

If you've cloned the repository for development:

```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "node",
      "args": [
        "/Users/pmerwin/Projects/audio-transcription-mcp/dist/mcp-server.js"
      ],
      "env": {
        "OPENAI_API_KEY": "sk-your-key-here",
        "INPUT_DEVICE_NAME": "BlackHole",
        "CHUNK_SECONDS": "8",
        "MODEL": "whisper-1"
      }
    }
  }
}
```

**Important:** Replace `/Users/pmerwin/Projects/audio-transcription-mcp` with your actual project path.

### 2. Claude Desktop Configuration

**IMPORTANT:** Claude Desktop requires explicit filesystem access permissions to write transcript files.

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json`

#### Option A: Using npx (Recommended)

```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "npx",
      "args": [
        "-y",
        "audio-transcription-mcp"
      ],
      "env": {
        "OPENAI_API_KEY": "sk-your-key-here",
        "INPUT_DEVICE_NAME": "BlackHole",
        "CHUNK_SECONDS": "8",
        "MODEL": "whisper-1",
        "OUTFILE_DIR": "/Users/yourname/Documents/Transcripts"
      },
      "alwaysAllow": ["write_file", "read_file"],
      "allowedDirectories": [
        "/Users/yourname/Documents/Transcripts"
      ]
    }
  }
}
```

**CRITICAL:** 
- Replace `/Users/yourname/Documents/Transcripts` with your actual desired output directory
- Create this directory first: `mkdir -p ~/Documents/Transcripts`
- The `allowedDirectories` gives the MCP server write access to this location
- Without this, you'll get "read-only file system" errors in Claude Desktop

#### Option B: Using Local Installation

```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "node",
      "args": [
        "/Users/pmerwin/Projects/audio-transcription-mcp/dist/mcp-server.js"
      ],
      "env": {
        "OPENAI_API_KEY": "sk-your-key-here",
        "INPUT_DEVICE_NAME": "BlackHole",
        "CHUNK_SECONDS": "8",
        "MODEL": "whisper-1",
        "OUTFILE_DIR": "/Users/yourname/Documents/Transcripts"
      },
      "alwaysAllow": ["write_file", "read_file"],
      "allowedDirectories": [
        "/Users/yourname/Documents/Transcripts"
      ]
    }
  }
}
```

**After Configuration:**
1. Create the output directory: `mkdir -p ~/Documents/Transcripts` (or your chosen path)
2. Save the config file
3. Restart Claude Desktop completely
4. The audio-transcription MCP server should now be available with write access

### 3. Environment Variables

You can configure the server using these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | *(required)* | Your OpenAI API key |
| `INPUT_DEVICE_NAME` | `BlackHole` | Audio input device name |
| `CHUNK_SECONDS` | `8` | Seconds of audio per transcription chunk |
| `MODEL` | `whisper-1` | OpenAI Whisper model to use |
| `OUTFILE` | `meeting_transcript.md` | Default output transcript file |
| `OUTFILE_DIR` | `process.cwd()` | Output directory for transcripts (required for Claude Desktop) |
| `SAMPLE_RATE` | `16000` | Audio sample rate in Hz |
| `CHANNELS` | `1` | Number of audio channels (mono) |

**Claude Desktop Users:** You MUST set `OUTFILE_DIR` to a directory included in `allowedDirectories` to avoid filesystem permission errors.

### 4. Restart Your Application

After adding the configuration:
1. Save the config file
2. Restart Cursor or Claude Desktop completely
3. The audio-transcription MCP server should now be available

## Available Tools

Once configured, you can ask Cursor's AI assistant to use these tools:

### 1. `start_transcription`

Start capturing and transcribing system audio.

**Parameters:**
- `inputDevice` (optional): Audio device name
- `chunkSeconds` (optional): Seconds per chunk
- `outputFile` (optional): Output filename

**Example prompts:**
- "Start transcribing audio"
- "Start transcription and save to my_meeting.md"
- "Begin transcribing with 10-second chunks"

### 2. `stop_transcription`

Stop the current transcription session.

**Example prompts:**
- "Stop transcribing"
- "End the transcription session"

### 3. `get_status`

Get the current status of the transcription session.

**Example prompts:**
- "What's the transcription status?"
- "Is transcription running?"
- "How many chunks have been processed?"

### 4. `get_transcript`

Retrieve the current transcript content.

**Parameters:**
- `lines` (optional): Get only the last N lines

**Example prompts:**
- "Show me the transcript"
- "Get the last 10 lines of the transcript"
- "What has been transcribed so far?"

### 5. `clear_transcript`

Clear the transcript file and reinitialize with a fresh header.

**Example prompts:**
- "Clear the transcript"
- "Reset the transcription file"

### 6. `cleanup_transcript`

Delete the transcript file completely. Use this when you're done and want to remove the file.

**Example prompts:**
- "Cleanup the transcript"
- "Delete the transcript file"
- "Remove the transcript"

## Available Resources

### `transcript://current`

Read the current transcript as a markdown resource.

**Example prompts:**
- "Read the current transcript"
- "Show me what's in the transcript file"

## Usage Examples

### Basic Workflow

```
You: Start transcribing audio
AI: [Uses start_transcription tool]
     ✓ Transcription started successfully

[Play audio/video on your computer]

You: What's the status?
AI: [Uses get_status tool]
     Transcription is running
     - 15 chunks processed
     - 0 errors
     - Output: meeting_transcript.md

You: Show me the last 5 transcript entries
AI: [Uses get_transcript tool with lines=10]
     [Shows recent transcriptions with timestamps]

You: Stop transcribing
AI: [Uses stop_transcription tool]
     ✓ Transcription stopped
     - Duration: 120 seconds
     - Chunks processed: 15
```

### Advanced Usage

```
You: Start transcription with 5-second chunks and save to interview.md
AI: [Uses start_transcription tool with custom parameters]
     ✓ Started with:
     - Chunk size: 5 seconds
     - Output: interview.md
     - Device: BlackHole

You: Get the full transcript
AI: [Uses get_transcript tool]
     [Shows complete transcript]

You: Clear the transcript and start fresh
AI: [Uses clear_transcript, then start_transcription]
     ✓ Transcript cleared
     ✓ New session started

You: I'm done, cleanup the transcript
AI: [Uses cleanup_transcript]
     ✓ Transcription stopped
     ✓ Transcript file deleted successfully
```

## Troubleshooting

### Claude Desktop: "Read-only file system" Error

This is the most common error with Claude Desktop. To fix:

1. **Add `OUTFILE_DIR` environment variable** pointing to a writable directory
2. **Add `allowedDirectories` to your config** with the same directory
3. **Create the directory**: `mkdir -p ~/Documents/Transcripts` (or your chosen path)
4. **Restart Claude Desktop completely**

Example working configuration:
```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "npx",
      "args": ["-y", "audio-transcription-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "OUTFILE_DIR": "/Users/yourname/Documents/Transcripts"
      },
      "allowedDirectories": [
        "/Users/yourname/Documents/Transcripts"
      ]
    }
  }
}
```

### MCP Server Not Appearing in Cursor

1. **Check config file syntax**: Ensure valid JSON
2. **Verify file path**: Use absolute path to `dist/mcp-server.js`
3. **Check Node version**: Must be Node 20+
4. **Restart Cursor**: Completely quit and relaunch
5. **Check Cursor logs**: Look for MCP server errors

**Note:** Cursor does NOT require `allowedDirectories` - it has broader filesystem access by default.

### "No active transcription session" Error

- The server maintains state across tool calls
- If you see this error, start a new session with `start_transcription`

### Audio Not Being Captured

1. Verify BlackHole is installed: `ls /Library/Audio/Plug-Ins/HAL/`
2. Check Multi-Output Device is selected in System Settings → Sound
3. Verify `INPUT_DEVICE_NAME` matches your device name
4. Test standalone mode first: `npm start`

### API Key Issues

1. Ensure `OPENAI_API_KEY` is set in the MCP config
2. Verify the key is valid: `curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_KEY"`
3. Check your OpenAI account has credits

### Transcription Quality Issues

1. **Increase chunk size**: Use longer chunks (10-15 seconds) for better context
2. **Check audio levels**: Ensure audio is being captured clearly
3. **Test with clear speech**: Try with a podcast or clear video first
4. **Check sample rate**: Default 16000 Hz is good for speech

## Testing the MCP Server

### Manual Test

You can test the MCP server directly:

```bash
# Start the server
node dist/mcp-server.js

# It will wait for MCP protocol messages on stdin
# Press Ctrl+C to exit
```

### Test in Cursor

1. Open Cursor
2. Start a new chat
3. Try: "Use the audio-transcription server to start transcribing"
4. Cursor should detect and use the MCP tools

## Performance Considerations

### Memory Usage
- Each chunk is processed in memory
- Typical usage: ~50-100 MB per active session
- Long sessions may accumulate larger transcript files

### API Costs
- OpenAI Whisper API: $0.006 per minute of audio
- 1 hour of transcription ≈ $0.36
- Monitor usage in OpenAI dashboard

### Chunk Size Recommendations
- **Real-time monitoring**: 5-8 seconds (more frequent updates)
- **Meetings/podcasts**: 8-12 seconds (balanced)
- **Long-form content**: 15-20 seconds (better context, fewer API calls)

## Security Notes

- **API Key**: Never commit your `.env` file or expose your OpenAI API key
- **File Paths**: The server validates file paths to prevent directory traversal
- **Device Names**: Device names are sanitized before use
- **Local Only**: MCP server runs locally, no remote access

## Advanced Configuration

### Multiple Audio Devices

If you want to use different audio devices:

```json
{
  "mcpServers": {
    "audio-transcription-mic": {
      "command": "node",
      "args": ["/path/to/dist/mcp-server.js"],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "INPUT_DEVICE_NAME": "MacBook Pro Microphone",
        "OUTFILE": "mic_transcript.md"
      }
    },
    "audio-transcription-system": {
      "command": "node",
      "args": ["/path/to/dist/mcp-server.js"],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "INPUT_DEVICE_NAME": "BlackHole",
        "OUTFILE": "system_audio_transcript.md"
      }
    }
  }
}
```

### Custom Output Directory

```json
{
  "env": {
    "OUTFILE": "/Users/yourname/Documents/Transcripts/meeting.md"
  }
}
```

## Next Steps

- Try the standalone CLI first: `npm start`
- Test with clear audio (podcast, YouTube video)
- Experiment with different chunk sizes
- Review the transcripts for accuracy
- Integrate into your workflow!

## Support

For issues or questions:
1. Check [GETTING_STARTED.md](./GETTING_STARTED.md) for basic setup
2. Review [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for technical details
3. Check the logs in Cursor's developer tools
4. Ensure all prerequisites are met

## Future Enhancements

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for planned features:
- Multi-language support
- Speaker diarization
- Real-time streaming updates
- Multiple output formats
- And more!

