# Audio Transcription MCP Server

Real-time audio transcription using OpenAI Whisper, available as both a standalone CLI tool and an MCP server for Cursor and Claude Desktop.

## 🚀 Quick Start with npx (Recommended!)

No installation required! Just add to your Cursor or Claude Desktop config:

**Cursor:** `~/.cursor/config.json`

```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "npx",
      "args": ["-y", "audio-transcription-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-key-here",
        "INPUT_DEVICE_NAME": "BlackHole"
      }
    }
  }
}
```

**Claude Desktop:** `~/Library/Application Support/Claude/claude_desktop_config.json`

⚠️ **Claude Desktop requires filesystem access** - add `OUTFILE_DIR` and `allowedDirectories`:

```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "npx",
      "args": ["-y", "audio-transcription-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-key-here",
        "INPUT_DEVICE_NAME": "BlackHole",
        "OUTFILE_DIR": "/Users/yourname/Documents/Transcripts"
      },
      "allowedDirectories": [
        "/Users/yourname/Documents/Transcripts"
      ]
    }
  }
}
```

**Before using:**
1. Create the directory: `mkdir -p ~/Documents/Transcripts` (or your chosen path)
2. Replace `yourname` with your actual username
3. Restart Cursor/Claude Desktop

Then ask:
> "Start transcribing audio"

**Prerequisites:** You still need [BlackHole audio driver](https://existential.audio/blackhole/) and an OpenAI API key. See [full setup guide](./GETTING_STARTED.md).

## Overview

This application captures system audio (on macOS via AVFoundation/BlackHole) and transcribes it in real-time using OpenAI's Whisper API. Transcripts are timestamped and saved to markdown files with **complete session isolation** for privacy.

**Key Features:**
- ✅ **Zero installation** - Use with `npx` 
- ✅ Real-time system audio capture
- ✅ Automatic transcription with OpenAI Whisper
- ✅ Timestamped markdown transcripts with unique filenames
- ✅ **Complete session isolation** - Each session gets its own file
- ✅ Works as MCP server in Cursor/Claude Desktop
- ✅ Standalone CLI mode
- ✅ Configurable chunk sizes and audio devices
- ✅ **61 passing tests** with full endpoint coverage

## Architecture

### Core Components

1. **Audio Capture** (`AudioCapturer`)
   - Uses `ffmpeg` with AVFoundation to capture system audio
   - Finds audio device by name
   - Streams raw PCM audio data
   - Handles chunking based on configurable time intervals

2. **Audio Processing** (`AudioProcessor`)
   - Converts raw PCM to WAV format
   - Manages buffering and chunking
   - Prepares audio data for API submission

3. **Transcription Service** (`TranscriptionService`)
   - Interfaces with OpenAI Whisper API
   - Handles API errors and retries
   - Returns timestamped transcripts

4. **File Manager** (`TranscriptFileManager`)
   - Manages transcript output file
   - Appends timestamped entries
   - Ensures proper file formatting

### Deployment Modes

#### 1. Standalone CLI
```bash
npm start
```
Simple command-line interface for direct usage.

#### 2. MCP Server
```bash
npm run mcp
```

MCP tools provided:
- `start_transcription`: Start capturing and transcribing audio
- `stop_transcription`: Stop the transcription session
- `get_status`: Get current transcription status
- `get_transcript`: Retrieve the current transcript content
- `clear_transcript`: Clear the transcript file and reinitialize
- `cleanup_transcript`: Delete the transcript file completely

MCP resources provided:
- `transcript://current`: Live access to the current transcript

## Quick Start

### For MCP Server (Cursor/Claude Desktop)

📖 **See [MCP_SETUP.md](./MCP_SETUP.md) for complete setup instructions**

1. Complete prerequisites below
2. Build the project: `npm install && npm run build`
3. Add to Cursor config (`~/.cursor/config.json`):
   ```json
   {
     "mcpServers": {
       "audio-transcription": {
         "command": "node",
         "args": ["/Users/pmerwin/Projects/audio-transcription-mcp/dist/mcp-server.js"],
         "env": {
           "OPENAI_API_KEY": "your-key-here"
         }
       }
     }
   }
   ```
4. Restart Cursor
5. Ask the AI: "Start transcribing audio"

### For Standalone CLI

📖 **See [GETTING_STARTED.md](./GETTING_STARTED.md) for complete setup instructions**

```bash
source ~/.nvm/nvm.sh && nvm use 20
npm install && npm run build
cp env.example .env  # Then add your OpenAI API key
npm start
```

## Prerequisites

### macOS Audio Setup

1. **Install BlackHole** (virtual audio device)
   ```bash
   brew install blackhole-2ch
   ```

2. **Configure Multi-Output Device** (in Audio MIDI Setup)
   - Open "Audio MIDI Setup" app
   - Click "+" → "Create Multi-Output Device"
   - Check both your speakers and BlackHole
   - This allows you to hear audio while capturing it

3. **Set System Audio Output** to the Multi-Output Device

### Software Requirements

- Node.js 20+
- ffmpeg: `brew install ffmpeg`
- OpenAI API key

## Installation

### Quick Install

```bash
# Clone the repository to a permanent location
git clone https://github.com/pmerwin/audio-transcription-mcp.git ~/audio-transcription-mcp
cd ~/audio-transcription-mcp
npm install
```

### Configure Cursor/Claude Desktop

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "bash",
      "args": [
        "-c",
        "cd ~/audio-transcription-mcp && node dist/mcp-server.js"
      ],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here",
        "INPUT_DEVICE_NAME": "BlackHole"
      }
    }
  }
}
```

**Replace `your-openai-api-key-here` with your actual OpenAI API key.**

### Restart Cursor

Quit Cursor completely (Cmd+Q) and relaunch to load the MCP server.

**For detailed setup including prerequisites (Black Hole audio driver, etc.), see [INSTALL.md](./INSTALL.md)**

## Configuration

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Key settings:
- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `INPUT_DEVICE_NAME`: Audio device name (default: "BlackHole")
- `CHUNK_SECONDS`: Transcription interval (default: 8)
- `OUTFILE`: Output transcript file (default: "meeting_transcript.md")

## Usage

### CLI Mode
```bash
npm start
```

Press Ctrl+C to stop.

### MCP Server Mode

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "node",
      "args": ["/path/to/audio-transcription-mcp/dist/mcp-server.js"],
      "env": {
        "OPENAI_API_KEY": "your-key-here"
      }
    }
  }
}
```

## Implementation Status

- [x] Project structure setup
- [x] Core audio capture module
- [x] Audio processing (PCM → WAV)
- [x] OpenAI Whisper integration
- [x] Standalone CLI implementation
- [x] MCP server interface design
- [x] MCP server implementation
- [x] Documentation (README, GETTING_STARTED, MCP_SETUP)
- [ ] Testing with Cursor
- [ ] Production hardening

## Technical Notes

### Audio Pipeline
```
System Audio → AVFoundation → ffmpeg → PCM stream → WAV chunks → Whisper API → Transcript
```

### Error Handling
- Device detection fallback
- API retry logic
- Graceful shutdown on SIGINT
- Buffer overflow protection

## Future Enhancements

- Support for other platforms (Windows, Linux)
- Multiple language support
- Speaker diarization
- Real-time streaming to MCP clients
- Configurable output formats (JSON, plain text)
- Audio quality settings

