# Audio Transcription MCP Server

Real-time audio transcription using OpenAI Whisper. Capture and transcribe system audio (meetings, videos, music) automatically with AI assistance through Cursor or Claude Desktop.

## ✨ Features

- 🎤 **Real-time transcription** - Captures and transcribes audio as it plays
- 🔄 **Zero installation** - Use with `npx`, no global install needed
- 🤖 **AI-powered** - Uses OpenAI's Whisper API for accurate transcription
- 📝 **Timestamped transcripts** - Every entry is timestamped in markdown format
- 🔒 **Session isolation** - Each session gets its own unique transcript file
- ⚡ **Smart silence detection** - Automatically pauses when no audio detected
- 🎯 **Automated setup** - One command sets up audio routing
- 🧪 **Built-in testing** - Verify your setup before starting

## 🚀 Quick Start (5 Minutes)

### Step 1: Run Automated Setup

The setup script installs everything you need and guides you through configuration:

```bash
npx audio-transcription-mcp setup
```

**What this does:**
- ✅ Installs Homebrew (if needed)
- ✅ Installs ffmpeg for audio processing
- ✅ Installs BlackHole virtual audio driver
- ✅ Guides you through creating a Multi-Output Device (or does it automatically!)
- ✅ Takes 5 minutes, mostly automated

**First time?** The script will walk you through everything with clear instructions. Don't worry if it asks for your Mac password - that's normal for installing software!

### Step 2: Test Your Setup

Verify everything works before using it:

```bash
npx audio-transcription-mcp test
```

This captures 5 seconds of audio and shows you if it's working correctly.

### Step 3: Configure Your AI Assistant

Add to your **Cursor** or **Claude Desktop** config:

<details>
<summary><b>Cursor Configuration</b> (click to expand)</summary>

Edit `~/.cursor/config.json`:

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

Then restart Cursor and ask:
> "Start transcribing audio"

</details>

<details>
<summary><b>Claude Desktop Configuration</b> (click to expand)</summary>

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

**Important:** 
1. Create the directory: `mkdir -p ~/Documents/Transcripts`
2. Replace `yourname` with your actual username
3. Restart Claude Desktop

Then ask:
> "Start transcribing audio"

</details>

### Step 4: Set System Output

Go to **System Settings > Sound > Output** and select **"Multi-Output Device"**

This routes audio to both your speakers (so you can hear) and BlackHole (for transcription).

### Step 5: Start Transcribing!

In Cursor or Claude Desktop, just ask:
> "Start transcribing audio"

Your AI assistant will start capturing and transcribing audio in real-time!

---

## 📖 What You Need

- **macOS 10.15+** (Catalina or later)
- **OpenAI API key** - [Get one here](https://platform.openai.com/api-keys) (pay-as-you-go, ~$0.006/minute)
- **5 minutes** for setup

## 🎯 Use Cases

- **Meeting transcription** - Zoom, Google Meet, Teams calls
- **Content creation** - Transcribe videos, podcasts, or music
- **Accessibility** - Real-time captions for any audio
- **Note-taking** - Automatic transcripts of lectures or presentations
- **Research** - Transcribe interviews or focus groups

## 🔧 Troubleshooting

### Audio Not Being Captured

**Problem:** Test shows silent or very low audio levels

**Solution:**
1. Check **System Settings > Sound > Output** is set to "Multi-Output Device"
2. Open **Audio MIDI Setup** and verify both outputs are checked:
   - ☑ Built-in Output  
   - ☑ BlackHole 2ch
3. Play some audio and run `npx audio-transcription-mcp test` again

### BlackHole Not Showing Up

**Problem:** BlackHole doesn't appear in device list

**Solution:**
Restart your Mac. Audio drivers require a restart to be recognized by the system.

### Setup Script Fails

**Problem:** Automated setup doesn't work

**Solution:**
The script will fall back to manual mode with clear instructions. This is normal on first run if accessibility permissions aren't granted. Just follow the 4-step guide shown.

### Want to Start Over?

If you need to remove everything and start fresh:

```bash
# Uninstall BlackHole and ffmpeg
brew uninstall blackhole-2ch ffmpeg

# Delete Multi-Output Device
# 1. Open Audio MIDI Setup
# 2. Select "Multi-Output Device" in left sidebar
# 3. Press Delete key

# Then run setup again
npx audio-transcription-mcp setup
```

### Need More Help?

- 📖 [Detailed Setup Guide](./SETUP_GUIDE.md)
- 🐛 [Report an Issue](https://github.com/pmerwin/audio-transcription-mcp/issues)
- 💬 [Discussions](https://github.com/pmerwin/audio-transcription-mcp/discussions)

---

## 📚 Additional Documentation

## 🛠️ Advanced Usage

### Standalone CLI Mode

You can use this as a standalone CLI without MCP:

```bash
# Start transcription (saves to meeting_transcript.md)
npx audio-transcription-mcp start

# Press Ctrl+C to stop
```

Configure via `.env` file:
```bash
OPENAI_API_KEY=sk-your-key-here
INPUT_DEVICE_NAME=BlackHole
CHUNK_SECONDS=8
OUTFILE=meeting_transcript.md
```

### MCP Server Tools

When used with Cursor or Claude Desktop, these tools are available:

- `start_transcription` - Start capturing and transcribing audio
- `pause_transcription` - Pause transcription temporarily  
- `resume_transcription` - Resume after pause
- `stop_transcription` - Stop and get session stats
- `get_status` - Check if transcription is running
- `get_transcript` - Retrieve current transcript content
- `clear_transcript` - Clear and start fresh
- `cleanup_transcript` - Delete transcript file

### Configuration Options

Environment variables you can customize:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | (required) | Your OpenAI API key |
| `INPUT_DEVICE_NAME` | `BlackHole` | Audio input device name |
| `CHUNK_SECONDS` | `8` | Seconds of audio per chunk |
| `MODEL` | `whisper-1` | OpenAI Whisper model |
| `OUTFILE_DIR` | `process.cwd()` | Output directory for transcripts |
| `SAMPLE_RATE` | `16000` | Audio sample rate (Hz) |
| `CHANNELS` | `1` | Number of audio channels |

## 🏗️ How It Works

1. **Audio Routing**: Multi-Output Device sends system audio to both your speakers and BlackHole
2. **Capture**: ffmpeg captures audio from BlackHole in 8-second chunks
3. **Processing**: Audio is converted to WAV format suitable for Whisper API
4. **Transcription**: Each chunk is sent to OpenAI Whisper for transcription
5. **Output**: Timestamped text is appended to a markdown file in real-time
6. **Silence Detection**: Automatically pauses after 32 seconds of silence to save API costs

## 🧪 Development & Testing

For contributors and developers:

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

## 📄 License & Contributing

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Resources

- 📖 [Getting Started Guide](./GETTING_STARTED.md)
- 🧪 [Testing Documentation](./TESTING.md)
- 📋 [MCP Setup Guide](./MCP_SETUP.md)
- 🔧 [Installation Guide](./INSTALL.md)

---

Made with ❤️ for transcribing meetings, content, and conversations.

**Star ⭐ this repo if you find it useful!**
