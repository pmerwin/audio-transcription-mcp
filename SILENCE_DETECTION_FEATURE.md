# Silence Detection and Auto-Pause Feature

## Overview

This feature automatically detects when no audio is being captured during a transcription session and pauses transcription after 4 consecutive silent chunks, alerting the MCP client (Cursor or Claude Desktop) about the issue.

## Implementation Details

### 1. Audio Silence Detection (`src/utils.ts`)

Added `isSilentAudio()` function that:
- Analyzes PCM audio buffers for amplitude
- Uses configurable threshold (default: 100)
- Samples every 100th value for efficiency
- Handles both positive and negative amplitudes
- Returns `true` if audio is below threshold

### 2. Enhanced Status Tracking (`src/types.ts`)

Extended `TranscriptionStatus` interface with:
- `consecutiveSilentChunks?: number` - Tracks consecutive silent chunks
- `isPaused?: boolean` - Indicates if transcription is paused
- `warning?: string` - Contains warning message when paused

### 3. Session Management (`src/transcription-session.ts`)

Enhanced `TranscriptionSession` class with:

#### Configuration
- `SILENCE_THRESHOLD = 4` - Number of consecutive silent chunks before pausing
- `SILENCE_AMPLITUDE_THRESHOLD = 100` - Amplitude threshold for silence detection

#### Audio Processing
- Checks each WAV chunk for silence before transcription
- Increments `consecutiveSilentChunks` counter for silent chunks
- Resets counter when real audio is detected
- Pauses after threshold is reached
- Sets descriptive warning message

#### New Methods
- `resume()` - Resumes transcription after pause, resets counters and warning

#### Behavior
- Skips transcription of silent chunks (saves API calls)
- Automatically pauses when silence threshold is reached
- Logs all silence events to debug log
- Resumes automatically when audio is detected (if not manually paused)

### 4. MCP Server Integration (`src/mcp-server.ts`)

#### New Tool: `resume_transcription`
- Allows manual resume after auto-pause
- Validates session state
- Returns success/error message

#### Enhanced `get_status` Response
Now includes:
```json
{
  "isRunning": true,
  "isPaused": false,
  "consecutiveSilentChunks": 0,
  "warning": "Audio capture appears to be inactive...",
  "chunksProcessed": 10,
  "errors": 0,
  "outputFile": "/path/to/transcript.md"
}
```

### 5. Comprehensive Testing (`tests/silence-detection.test.ts`)

Test coverage includes:
- Empty buffer detection
- Silent audio (all zeros)
- Low amplitude detection
- High amplitude detection
- Mixed audio (silence + loud samples)
- Custom threshold handling
- Negative amplitude handling
- Session status tracking
- Resume functionality
- Type validation

## Usage for MCP Clients (Cursor/Claude Desktop)

### Monitoring for Silence

Clients should poll `get_status` periodically to check:

```javascript
const status = await mcpClient.callTool("get_status", {});

if (status.isPaused && status.warning) {
  // Alert user about audio capture issue
  console.error(status.warning);
  // Suggest troubleshooting steps
}
```

### Resuming After Pause

Once audio input is fixed:

```javascript
const result = await mcpClient.callTool("resume_transcription", {});
// result: { success: true, message: "Transcription resumed..." }
```

## Warning Message

When paused, the warning message is:
```
Audio capture appears to be inactive. No audio detected for 4 consecutive chunks. 
Transcription paused. Please check your audio input device and routing.
```

## Benefits

1. **Cost Savings**: Skips transcription of silent chunks
2. **User Awareness**: Alerts when audio isn't being captured
3. **Automatic Recovery**: Resumes when audio is detected
4. **Debug Support**: Logs all silence events for troubleshooting
5. **Configurable**: Threshold and amplitude settings are constants that can be tuned

## Configuration

To adjust sensitivity, modify in `TranscriptionSession`:

```typescript
private readonly SILENCE_THRESHOLD = 4; // Increase for more tolerance
private readonly SILENCE_AMPLITUDE_THRESHOLD = 100; // Increase for stricter detection
```

## Debug Logging

All silence events are logged to `~/.audio-transcription-mcp-debug.log`:
- Silent chunk detections with counter
- Pause events with warning message
- Resume events
- Audio detection after silence

## Example Flow

1. User starts transcription
2. Audio device misconfigured or no audio playing
3. First silent chunk detected: `consecutiveSilentChunks = 1`
4. Second silent chunk: `consecutiveSilentChunks = 2`
5. Third silent chunk: `consecutiveSilentChunks = 3`
6. Fourth silent chunk: `consecutiveSilentChunks = 4` → **PAUSED**
7. `isPaused = true`, warning message set
8. MCP client polls status, sees warning, alerts user
9. User fixes audio routing
10. Either:
    - User calls `resume_transcription` manually, OR
    - Audio automatically resumes when detected (counter resets)

## Compatibility

- ✅ Works with Cursor MCP support
- ✅ Works with Claude Desktop
- ✅ Works with any MCP-compatible client
- ✅ Backward compatible (new fields are optional)

