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

### For MCP Server (Recommended - No Installation!)

📖 **See [MCP_SETUP.md](./MCP_SETUP.md) for complete setup instructions**

**Just add to your config and restart - that's it!**

See the npx configuration at the top of this README for Cursor and Claude Desktop.

### For Standalone CLI (Local Development)

📖 **See [GETTING_STARTED.md](./GETTING_STARTED.md) for complete setup instructions**

```bash
# Install dependencies
npm install
npm run build

# Configure environment
cp env.example .env  # Then add your OpenAI API key

# Run standalone CLI
npm start
```

## Prerequisites

### macOS Audio Setup

#### 1. Install BlackHole Audio Driver

BlackHole is a virtual audio device that allows capturing system audio on macOS.

```bash
brew install blackhole-2ch
```

**Verify installation:**
```bash
# List audio devices to confirm BlackHole is installed
ffmpeg -f avfoundation -list_devices true -i ""
# You should see "BlackHole 2ch" in the audio devices list
```

#### 2. Configure Multi-Output Device

This step allows you to **hear audio while capturing it** (otherwise, all audio would be silent while transcribing).

**Step-by-step:**

1. **Open Audio MIDI Setup**
   - Location: `/Applications/Utilities/Audio MIDI Setup.app`
   - Or use Spotlight: Press `Cmd+Space`, type "Audio MIDI Setup"

2. **Create Multi-Output Device**
   - Click the **"+"** button in the bottom-left corner
   - Select **"Create Multi-Output Device"**

3. **Configure Outputs**
   - ✅ Check your **built-in speakers** (or external speakers/headphones)
   - ✅ Check **BlackHole 2ch**
   - **Important:** Order matters! Your speakers should be listed first

4. **Set Primary Device** (Optional but recommended)
   - Right-click on your speakers in the list
   - Select **"Use This Device For Sound Output"**
   - This ensures clock sync to your main audio device

5. **Rename Device** (Optional but helpful)
   - Double-click "Multi-Output Device"
   - Rename to something memorable like "Speakers + BlackHole"

#### 3. Set System Audio Output

**Option A: System Settings (macOS 13+)**
1. Open **System Settings** → **Sound**
2. Under **Output**, select your **Multi-Output Device** (or "Speakers + BlackHole")

**Option B: Menu Bar (Quick access)**
1. Hold **Option** key and click the **volume icon** in menu bar
2. Select your Multi-Output Device under "Output Device"

**Verify it's working:**
- Play some audio (YouTube, music, etc.)
- You should hear it through your speakers
- The transcription will capture it through BlackHole

#### 4. Troubleshooting BlackHole

**No audio after setup?**
- Make sure your speakers are checked in the Multi-Output Device
- Ensure speakers are listed BEFORE BlackHole in the device list
- Try setting speakers as the "primary device" (right-click → Use This Device)

**BlackHole not showing up?**
```bash
# Reinstall BlackHole
brew reinstall blackhole-2ch

# Restart Core Audio (if needed)
sudo killall coreaudiod
```

**Audio quality issues?**
- Check that sample rates match (usually 48000 Hz)
- In Audio MIDI Setup, select your Multi-Output Device
- Set Format to **48000.0 Hz, 2 ch, 24-bit**

### Software Requirements

- **Node.js 20+** (install via [nvm](https://github.com/nvm-sh/nvm))
  ```bash
  nvm install 20
  nvm use 20
  ```
- **ffmpeg** (with AVFoundation support)
  ```bash
  brew install ffmpeg
  ```
- **OpenAI API key** ([Get one here](https://platform.openai.com/api-keys))

## Installation Options

### Option 1: npx (Recommended - Zero Installation!)

**No installation needed!** Just use the configuration shown at the top of this README.

Benefits:
- ✅ No local setup required
- ✅ Always uses the latest version (with `@latest`)
- ✅ Works from any directory
- ✅ Automatic updates

### Option 2: Local Development Install

Only needed if you want to modify the code or contribute:

```bash
# Clone the repository
git clone https://github.com/pmerwin/audio-transcription-mcp.git
cd audio-transcription-mcp

# Install dependencies
npm install
npm run build

# For CLI mode, configure environment
cp env.example .env  # Then add your OpenAI API key
```

## Configuration

### For MCP Mode (Cursor/Claude Desktop)

Configuration is done via the MCP config file (see Quick Start section above). No `.env` file needed!

### For CLI Mode (Standalone)

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Required:
- `OPENAI_API_KEY`: Your OpenAI API key

Optional (with defaults):
- `INPUT_DEVICE_NAME`: Audio device (default: "BlackHole")
- `CHUNK_SECONDS`: Transcription interval (default: 8)
- `OUTFILE`: Output transcript file (default: "meeting_transcript.md")
- `OUTFILE_DIR`: Output directory (default: current directory)

## Usage

### MCP Server Mode (Recommended)

**Using npx (no installation):**

See the Quick Start configuration at the top of this README. Just:
1. Add the config to Cursor or Claude Desktop
2. Restart the application
3. Say: "Start transcribing audio"

**Using local installation:**

Only if you've cloned the repository:
```bash
npm run mcp
```

### CLI Mode (Standalone)

For local development or standalone use:

```bash
npm start
```

Press Ctrl+C to stop.

**Note:** CLI mode requires a `.env` file with your OpenAI API key (see Configuration section above).

## Implementation Status

### ✅ Complete

- [x] Project structure setup
- [x] Core audio capture module
- [x] Audio processing (PCM → WAV)
- [x] OpenAI Whisper integration
- [x] Standalone CLI implementation
- [x] MCP server interface design
- [x] MCP server implementation
- [x] Comprehensive documentation (8 guides)
- [x] **61 passing tests** with full coverage
- [x] **Tested in Cursor** - Working ✓
- [x] **Tested in Claude Desktop** - Working ✓
- [x] **Production hardening** - 0 vulnerabilities
- [x] **Published to npm** - Available via npx
- [x] **Code reviewed** - Production ready

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

