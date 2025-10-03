# Installation Guide

## Quick Install from GitHub

### Prerequisites

- **Node.js 20+** (via nvm recommended)
- **ffmpeg**: `brew install ffmpeg`
- **BlackHole Audio Driver**: `brew install blackhole-2ch`
- **OpenAI API Key**

### Install via npm from GitHub

**Recommended Method:**

```bash
# Install globally
npm install -g git+https://github.com/pmerwin/audio-transcription-mcp.git

# Verify installation
npm list -g audio-transcription-mcp
```

This will:
- Clone the repository
- Install all dependencies
- Link the dist/ folder with compiled code
- Make commands available globally

**Note:** The package comes pre-built (dist/ is included), so no build step is needed.

### Configure Environment

Create a `.env` file in your project or home directory:

```bash
# Create .env file
cat > ~/.audio-transcription-mcp.env << EOF
OPENAI_API_KEY=your-openai-api-key-here
INPUT_DEVICE_NAME=BlackHole
CHUNK_SECONDS=8
MODEL=whisper-1
OUTFILE=meeting_transcript.md
SAMPLE_RATE=16000
CHANNELS=1
EOF
```

### Configure BlackHole Audio

1. Open **Audio MIDI Setup** (Applications → Utilities)
2. Click **+** → **Create Multi-Output Device**
3. Check both your speakers **and** BlackHole 2ch
4. Set **Primary device** to your speakers
5. Right-click Multi-Output Device → **"Use This Device For Sound Output"**

### Configure Cursor

**Method 1: Using Global Install Path (After npm install -g)**

Find your Node.js global modules path:
```bash
npm config get prefix
```

Then add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "bash",
      "args": [
        "-c",
        "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && nvm use 20 && node $(npm config get prefix)/lib/node_modules/audio-transcription-mcp/dist/mcp-server.js"
      ],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here",
        "INPUT_DEVICE_NAME": "BlackHole",
        "CHUNK_SECONDS": "8",
        "MODEL": "whisper-1"
      }
    }
  }
}
```

**Method 2: Clone and Use Directly (Most Reliable)**

```bash
# Clone the repository
git clone https://github.com/pmerwin/audio-transcription-mcp.git ~/audio-transcription-mcp
cd ~/audio-transcription-mcp
npm install
```

Then use in `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "bash",
      "args": [
        "-c",
        "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && nvm use 20 && node $HOME/audio-transcription-mcp/dist/mcp-server.js"
      ],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here",
        "INPUT_DEVICE_NAME": "BlackHole"
      }
    }
  }
}
```

**Important:** Replace `your-openai-api-key-here` with your actual OpenAI API key.

### Restart Cursor

1. Quit Cursor completely (Cmd+Q)
2. Relaunch Cursor
3. Test with: "Start transcribing audio"

## Alternative: Install from Source

### Clone the Repository

```bash
git clone https://github.com/pmerwin/audio-transcription-mcp.git
cd audio-transcription-mcp
```

### Install Dependencies

```bash
# Use Node 20
nvm use 20

# Install dependencies
npm install

# Build the project
npm run build
```

### Create Environment File

```bash
cp env.example .env
# Edit .env and add your OpenAI API key
nano .env
```

### Configure Cursor (Source Install)

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "bash",
      "args": [
        "-c",
        "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && nvm use 20 && node /path/to/audio-transcription-mcp/dist/mcp-server.js"
      ],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here",
        "INPUT_DEVICE_NAME": "BlackHole"
      }
    }
  }
}
```

**Note:** Replace `/path/to/audio-transcription-mcp` with your actual path.

## Usage

### Standalone CLI

```bash
# If installed globally
audio-transcription-cli

# If installed from source
npm start
```

### MCP Server in Cursor

After configuring and restarting Cursor:

```
Start transcribing audio
What's the transcription status?
Show me the transcript
Stop transcribing
Cleanup the transcript
```

## Available Tools

- **start_transcription** - Start capturing and transcribing audio
- **stop_transcription** - Stop the transcription session
- **get_status** - Get current transcription status
- **get_transcript** - Retrieve transcript content
- **clear_transcript** - Clear and reinitialize transcript
- **cleanup_transcript** - Delete transcript file completely

## Troubleshooting

### Global Install Issues

If `audio-transcription-mcp` command is not found:

```bash
# Check npm global bin path
npm config get prefix

# Add to PATH (add to ~/.zshrc or ~/.bash_profile)
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Node Version Issues

Always use Node 20:

```bash
nvm install 20
nvm use 20
```

### API Key Issues

Verify your API key works:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Audio Not Captured

1. Verify BlackHole is installed: `ls /Library/Audio/Plug-Ins/HAL/`
2. Check Multi-Output Device is selected in System Settings → Sound
3. Test with standalone CLI first: `npm start`

## Updating

### Update Global Install

```bash
npm update -g audio-transcription-mcp
```

### Update Source Install

```bash
cd audio-transcription-mcp
git pull
npm install
npm run build
```

## Uninstalling

### Remove Global Install

```bash
npm uninstall -g audio-transcription-mcp
```

### Remove Source Install

```bash
rm -rf /path/to/audio-transcription-mcp
```

### Remove Cursor Configuration

Remove the `audio-transcription` entry from `~/.cursor/mcp.json`

## Support

- **Issues**: https://github.com/pmerwin/audio-transcription-mcp/issues
- **Documentation**: See README.md
- **Setup Guide**: See MCP_SETUP.md

## System Requirements

- **OS**: macOS (Windows/Linux support planned)
- **Node**: 20+
- **Memory**: 100MB+ available
- **Disk**: 50MB+ for installation

## Cost Information

- **OpenAI Whisper API**: $0.006 per minute of audio
- **1 hour transcription**: ~$0.36
- **No subscription fees**

## License

MIT - See LICENSE file for details

