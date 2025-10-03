# Implementation Plan: Audio Transcription MCP Server

## Project Overview

Transform a standalone audio transcription tool into a Model Context Protocol (MCP) server that enables AI assistants to control real-time audio transcription.

## Current Status

✅ **Completed:**
- Project structure setup
- Core modular architecture
- Audio capture (AVFoundation/ffmpeg)
- Audio processing (PCM → WAV conversion)
- OpenAI Whisper integration
- Transcript file management
- Standalone CLI interface

⏳ **In Progress:**
- MCP server design and implementation

## Architecture Review

### Core Components (Completed)

```
┌─────────────────────────────────────────────────────┐
│                TranscriptionSession                 │
│              (Main Orchestrator)                    │
└──────────┬──────────────┬──────────────┬───────────┘
           │              │              │
    ┌──────▼─────┐ ┌─────▼──────┐ ┌─────▼─────────┐
    │   Audio    │ │   Audio    │ │Transcription  │
    │  Capturer  │ │ Processor  │ │   Service     │
    └──────┬─────┘ └─────┬──────┘ └─────┬─────────┘
           │              │              │
    ┌──────▼──────────────▼──────────────▼─────────┐
    │         TranscriptManager                     │
    │         (File I/O)                            │
    └───────────────────────────────────────────────┘
```

### Module Responsibilities

1. **`types.ts`**: TypeScript interfaces and type definitions
2. **`utils.ts`**: Timestamp formatting, sleep, PCM→WAV conversion
3. **`audio-capturer.ts`**: Device detection, ffmpeg process management
4. **`audio-processor.ts`**: Buffering and chunking PCM streams
5. **`transcription-service.ts`**: OpenAI Whisper API integration
6. **`transcript-manager.ts`**: Markdown file management
7. **`transcription-session.ts`**: Orchestrates all components
8. **`cli.ts`**: Standalone CLI interface

## MCP Server Design

### Tools to Implement

The MCP server will expose the following tools:

#### 1. `start_transcription`
**Purpose**: Start capturing and transcribing audio

**Parameters:**
```typescript
{
  inputDevice?: string;      // Optional: audio device name
  chunkSeconds?: number;     // Optional: seconds per chunk
  outputFile?: string;       // Optional: transcript filename
}
```

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  outputFile: string;
}
```

**Implementation Notes:**
- Check if session is already running
- Validate device exists
- Start TranscriptionSession
- Return success/error status

#### 2. `stop_transcription`
**Purpose**: Stop the current transcription session

**Parameters:** None

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  stats: {
    chunksProcessed: number;
    duration: string;
    errors: number;
  }
}
```

**Implementation Notes:**
- Graceful shutdown
- Return session statistics
- Ensure cleanup

#### 3. `get_status`
**Purpose**: Get current transcription status

**Parameters:** None

**Returns:**
```typescript
{
  isRunning: boolean;
  startTime?: string;
  chunksProcessed: number;
  lastTranscript?: string;
  errors: number;
  outputFile?: string;
}
```

#### 4. `get_transcript`
**Purpose**: Retrieve current transcript content

**Parameters:**
```typescript
{
  lines?: number;  // Optional: last N lines
}
```

**Returns:**
```typescript
{
  content: string;
  totalLines: number;
  filePath: string;
}
```

#### 5. `clear_transcript`
**Purpose**: Clear the transcript file

**Parameters:** None

**Returns:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Implementation Notes:**
- Stop session if running
- Clear file
- Reinitialize header

### Resources to Implement

#### 1. `transcript://current`
**Purpose**: Live access to the current transcript file

**MIME Type**: `text/markdown`

**Content**: The full transcript as markdown

**Use Case**: Allow AI assistants to read transcripts in real-time

### State Management

The MCP server needs to maintain:

```typescript
interface ServerState {
  session: TranscriptionSession | null;
  config: {
    audioConfig: AudioConfig;
    transcriptionConfig: TranscriptionConfig;
    outputFile: string;
  };
}
```

### Error Handling

1. **Device Not Found**: Graceful fallback with helpful message
2. **API Key Invalid**: Early validation with clear error
3. **Session Already Running**: Prevent duplicate sessions
4. **ffmpeg Missing**: Check for ffmpeg availability

## Implementation Steps

### Phase 1: Basic MCP Server (Next)
- [ ] Install MCP SDK dependencies
- [ ] Create `mcp-server.ts` skeleton
- [ ] Implement server initialization
- [ ] Add `start_transcription` tool
- [ ] Add `stop_transcription` tool
- [ ] Add `get_status` tool
- [ ] Test basic functionality

### Phase 2: Advanced Features
- [ ] Add `get_transcript` tool
- [ ] Add `clear_transcript` tool
- [ ] Implement `transcript://current` resource
- [ ] Add streaming updates (if MCP supports)
- [ ] Enhanced error handling

### Phase 3: Testing & Documentation
- [ ] Create test scenarios
- [ ] Document MCP client configuration
- [ ] Add usage examples
- [ ] Create demo video/screenshots

## Technical Considerations

### 1. **Long-Running Process**
- MCP server must keep ffmpeg alive
- Handle server restart scenarios
- Graceful cleanup on exit

### 2. **Concurrent Sessions**
- Design decision: Single session or multiple?
- Recommendation: Single session (simpler, sufficient)

### 3. **Resource Management**
- Monitor memory usage (audio buffers)
- Implement buffer size limits
- Handle disk space issues

### 4. **Security**
- Validate file paths (no directory traversal)
- Sanitize device names
- Rate limit API calls

### 5. **Performance**
- Async processing to avoid blocking
- Queue transcription requests if needed
- Monitor API quota

## Configuration Options

### Environment Variables
```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (with defaults)
MODEL=whisper-1
CHUNK_SECONDS=8
INPUT_DEVICE_NAME=BlackHole
OUTFILE=meeting_transcript.md
SAMPLE_RATE=16000
CHANNELS=1
```

### MCP Client Configuration
```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "node",
      "args": [
        "/path/to/audio-transcription-mcp/dist/mcp-server.js"
      ],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "INPUT_DEVICE_NAME": "BlackHole",
        "CHUNK_SECONDS": "8"
      }
    }
  }
}
```

## Testing Plan

### Manual Testing
1. Start MCP server in Claude Desktop
2. Use tools to start/stop transcription
3. Verify transcript file creation
4. Test resource access
5. Test error scenarios

### Automated Testing (Future)
- Unit tests for each component
- Integration tests for MCP tools
- Mock OpenAI API responses
- Mock ffmpeg output

## Success Criteria

- ✅ MCP server starts successfully
- ✅ All tools callable and functional
- ✅ Resources accessible
- ✅ Transcripts accurate and timestamped
- ✅ Graceful error handling
- ✅ Clean shutdown
- ✅ Documentation complete

## Future Enhancements

1. **Multi-language Support**: Specify language parameter
2. **Speaker Diarization**: Identify different speakers
3. **Custom Prompts**: Pass prompts to Whisper
4. **Real-time Streaming**: Stream partial transcripts
5. **Multiple Output Formats**: JSON, plain text, SRT
6. **Cross-platform**: Windows (WASAPI), Linux (ALSA/PulseAudio)
7. **Audio Quality Settings**: Bitrate, sample rate options
8. **Webhook Notifications**: Notify on transcript updates
9. **Cloud Storage**: Upload to S3, Google Drive
10. **Transcript Search**: Search within transcripts

## Dependencies

### Runtime
- `openai`: ^4.77.0
- `dotenv`: ^16.4.7
- `@modelcontextprotocol/sdk`: (to be added)

### Development
- `@types/node`: ^22.10.2
- `typescript`: ^5.7.2

### System
- Node.js 20+
- ffmpeg (with AVFoundation support on macOS)
- BlackHole or similar virtual audio device

## References

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [FFmpeg AVFoundation](https://ffmpeg.org/ffmpeg-devices.html#avfoundation)
- [BlackHole Audio Driver](https://github.com/ExistentialAudio/BlackHole)

