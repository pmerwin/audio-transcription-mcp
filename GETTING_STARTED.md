# Getting Started

## Quick Setup Guide

### 1. Prerequisites

#### Install BlackHole Audio Driver (macOS)
```bash
brew install blackhole-2ch
```

#### Configure Multi-Output Device
1. Open **Audio MIDI Setup** (Applications → Utilities)
2. Click **+** → **Create Multi-Output Device**
3. Check both your speakers AND BlackHole
4. Right-click the Multi-Output Device → "Use This Device For Sound Output"

This allows you to hear audio while capturing it for transcription.

#### Verify ffmpeg
```bash
ffmpeg -version
# If not installed:
brew install ffmpeg
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp env.example .env

# Edit .env and add your OpenAI API key
nano .env
```

Required variables:
```bash
OPENAI_API_KEY=sk-your-key-here
```

Optional variables (with defaults):
```bash
INPUT_DEVICE_NAME=BlackHole
CHUNK_SECONDS=8
OUTFILE=meeting_transcript.md
MODEL=whisper-1
SAMPLE_RATE=16000
CHANNELS=1
```

### 3. Install Dependencies

```bash
npm install
npm run build
```

## Usage

### Standalone CLI Mode

Start transcription:
```bash
npm start
```

The application will:
1. Verify your API key
2. Detect the audio device
3. Start capturing system audio
4. Transcribe in chunks
5. Save to `meeting_transcript.md` (or your configured `OUTFILE`)

Stop with `Ctrl+C`.

### Testing the Setup

1. Start the transcription:
   ```bash
   npm start
   ```

2. Play some audio (YouTube video, podcast, etc.)

3. Wait 8 seconds (default chunk size)

4. You should see transcribed text appear in the terminal and the output file

## Troubleshooting

### "Could not find AVFoundation audio device"
- Verify BlackHole is installed: `ls /Library/Audio/Plug-Ins/HAL/`
- Try listing devices: `ffmpeg -f avfoundation -list_devices true -i ""`
- Update `INPUT_DEVICE_NAME` in `.env` to match your device name

### "Invalid OpenAI API key"
- Verify your API key in `.env`
- Check that your OpenAI account has credits
- Test the key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_KEY"`

### No audio captured
- Check System Settings → Sound → Output is set to Multi-Output Device
- Verify BlackHole is selected in Multi-Output Device
- Test ffmpeg: `ffmpeg -f avfoundation -i ":1" -t 5 test.wav`

### Transcription is slow
- Reduce `CHUNK_SECONDS` for faster (but more frequent) transcriptions
- Check your internet connection
- Verify OpenAI API status

## Next Steps

- Read `IMPLEMENTATION_PLAN.md` for MCP server development plans
- Check `README.md` for architecture details
- Review the source code in `src/`

## Project Structure

```
audio-transcription-mcp/
├── src/
│   ├── types.ts                    # TypeScript interfaces
│   ├── utils.ts                    # Utility functions
│   ├── audio-capturer.ts          # Audio device and ffmpeg
│   ├── audio-processor.ts         # PCM → WAV conversion
│   ├── transcription-service.ts   # OpenAI Whisper API
│   ├── transcript-manager.ts      # File management
│   ├── transcription-session.ts   # Main orchestrator
│   └── cli.ts                     # CLI interface
├── dist/                          # Compiled JavaScript
├── package.json
├── tsconfig.json
├── env.example
└── README.md
```

## Examples

### Start with custom chunk size
```bash
CHUNK_SECONDS=5 npm start
```

### Use different output file
```bash
OUTFILE=my_meeting.md npm start
```

### Use different audio device
```bash
INPUT_DEVICE_NAME="MacBook Pro Microphone" npm start
```

## Development

Watch mode (auto-recompile on changes):
```bash
npm run dev
```

In another terminal:
```bash
npm start
```

