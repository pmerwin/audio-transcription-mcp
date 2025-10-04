# Pause and Resume Transcription Feature

## Overview

The MCP server now supports full pause and resume functionality, allowing users to have complete control over the transcription lifecycle with proper state management and validation.

## Available Commands

Users can now control transcription with these commands:

1. **`start_transcription`** - Start a new transcription session
2. **`pause_transcription`** - Pause an active transcription (manual pause)
3. **`resume_transcription`** - Resume a paused transcription
4. **`stop_transcription`** - Stop and end the transcription session
5. **`get_status`** - Check the current state of transcription

## Command Flow

```
[Not Started] → start_transcription → [Running]
                                          ↓
                                    pause_transcription
                                          ↓
                                      [Paused]
                                          ↓
                                    resume_transcription
                                          ↓
                                      [Running]
                                          ↓
                                    stop_transcription
                                          ↓
                                      [Stopped]
```

## Pause Types

The system distinguishes between two types of pauses:

### 1. Manual Pause (`pauseReason: 'manual'`)
- Triggered by user calling `pause_transcription`
- Requires manual resume via `resume_transcription`
- Audio will NOT auto-resume even if detected

### 2. Silence-Detected Pause (`pauseReason: 'silence'`)
- Automatically triggered after 4 consecutive silent chunks
- Can be resumed manually via `resume_transcription`
- Will auto-resume when audio is detected

## State Validation

The system enforces proper state transitions:

### Pause Validation
- ✅ Can pause when: `isRunning: true` and `isPaused: false`
- ❌ Cannot pause when:
  - Session is not running
  - Already paused

### Resume Validation
- ✅ Can resume when: `isRunning: true` and `isPaused: true`
- ❌ Cannot resume when:
  - Session is not running
  - Not paused

### Stop Validation
- ✅ Can stop at any time when session exists
- Works regardless of pause state

## MCP Tool Definitions

### pause_transcription

**Description:** Pause the current transcription session. Audio capture continues but transcription is paused. Use resume_transcription to continue.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {}
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Transcription paused successfully. Use resume_transcription to continue."
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "No active transcription session"
}
```
```json
{
  "success": false,
  "message": "Transcription is already paused"
}
```

### resume_transcription

**Description:** Resume transcription after it has been paused (either manually or due to silence detection).

**Input Schema:**
```json
{
  "type": "object",
  "properties": {}
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Transcription resumed successfully. Listening for audio..."
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "No active transcription session"
}
```
```json
{
  "success": false,
  "message": "Transcription is not paused"
}
```

## Enhanced Status Response

The `get_status` tool now returns additional fields:

```json
{
  "isRunning": true,
  "isPaused": false,
  "pauseReason": "manual",
  "consecutiveSilentChunks": 0,
  "warning": "Transcription manually paused by user",
  "startTime": "2025-10-04T12:00:00.000Z",
  "chunksProcessed": 42,
  "lastTranscriptTime": "2025-10-04T12:05:30.000Z",
  "errors": 0,
  "outputFile": "/path/to/transcript.md"
}
```

### Status Fields

- **`isPaused`**: `boolean` - Whether transcription is currently paused
- **`pauseReason`**: `'manual' | 'silence' | undefined` - Why transcription was paused
- **`consecutiveSilentChunks`**: `number` - Count of consecutive silent chunks (resets when audio detected)
- **`warning`**: `string | undefined` - Warning message explaining the pause

## Usage Examples

### Example 1: Manual Pause/Resume Workflow

```typescript
// Start transcription
await mcp.callTool("start_transcription", {});

// ... transcription running ...

// Pause manually
await mcp.callTool("pause_transcription", {});
// Response: { success: true, message: "Transcription paused..." }

// Check status
const status = await mcp.callTool("get_status", {});
// status.isPaused = true
// status.pauseReason = "manual"
// status.warning = "Transcription manually paused by user"

// Resume
await mcp.callTool("resume_transcription", {});
// Response: { success: true, message: "Transcription resumed..." }
```

### Example 2: Handling Silence-Detected Pause

```typescript
// Start transcription
await mcp.callTool("start_transcription", {});

// ... no audio for 4 chunks ...
// System automatically pauses

// Check status
const status = await mcp.callTool("get_status", {});
// status.isPaused = true
// status.pauseReason = "silence"
// status.consecutiveSilentChunks = 4
// status.warning = "Audio capture appears to be inactive..."

// Option 1: Fix audio and resume manually
await mcp.callTool("resume_transcription", {});

// Option 2: Audio starts playing → auto-resumes
// (No manual intervention needed)
```

### Example 3: Error Handling

```typescript
// Try to pause when not running
const result = await mcp.callTool("pause_transcription", {});
// { success: false, message: "No active transcription session" }

// Try to resume when not paused
const result = await mcp.callTool("resume_transcription", {});
// { success: false, message: "Transcription is not paused" }

// Try to pause when already paused
await mcp.callTool("pause_transcription", {});
const result = await mcp.callTool("pause_transcription", {});
// { success: false, message: "Transcription is already paused" }
```

## Implementation Details

### TranscriptionSession Methods

```typescript
class TranscriptionSession {
  // Manually pause transcription
  pause(): void {
    // Validates state and sets isPaused=true, pauseReason='manual'
  }

  // Resume transcription (manual or after silence)
  resume(): void {
    // Validates state and clears pause flags
  }
}
```

### Auto-Resume Logic

When audio is detected after a silence-pause:

```typescript
if (this.status.isPaused && this.status.pauseReason === 'silence') {
  // Auto-resume only for silence pauses
  this.status.isPaused = false;
  this.status.pauseReason = undefined;
}
```

Manual pauses do NOT auto-resume, even when audio is detected.

## State Transition Matrix

| Current State | Command | New State | Result |
|--------------|---------|-----------|--------|
| Not Started | start | Running | ✅ Success |
| Running | pause | Paused (manual) | ✅ Success |
| Paused | resume | Running | ✅ Success |
| Paused | pause | Paused | ❌ Error: Already paused |
| Running | resume | Running | ❌ Error: Not paused |
| Not Started | pause | Not Started | ❌ Error: Not running |
| Not Started | resume | Not Started | ❌ Error: Not running |
| Running/Paused | stop | Stopped | ✅ Success |

## Debug Logging

All pause/resume events are logged to `~/.audio-transcription-mcp-debug.log`:

```
[2025-10-04T12:00:00.000Z] Manually pausing transcription...
[2025-10-04T12:01:00.000Z] Resuming transcription (was paused due to: manual)...
[2025-10-04T12:05:00.000Z] Silent chunk detected (1/4)
[2025-10-04T12:05:08.000Z] Silent chunk detected (2/4)
[2025-10-04T12:05:16.000Z] Silent chunk detected (3/4)
[2025-10-04T12:05:24.000Z] Silent chunk detected (4/4)
[2025-10-04T12:05:24.000Z] ⚠️  Audio capture appears to be inactive...
[2025-10-04T12:06:00.000Z] Audio detected, resetting silent chunk counter (was 4)
[2025-10-04T12:06:00.000Z] Auto-resuming transcription after detecting audio
```

## Benefits

1. **Full User Control**: Users can pause/resume transcription at will
2. **Smart Auto-Resume**: Silence-pauses auto-resume when audio returns
3. **State Safety**: Prevents invalid state transitions with clear error messages
4. **Cost Optimization**: Pausing stops API calls to OpenAI
5. **Monitoring**: Detailed status helps users understand current state
6. **Debugging**: Comprehensive logging for troubleshooting

## Testing

Comprehensive test coverage includes:

- ✅ Manual pause when not running (error)
- ✅ Manual resume when not running (error)
- ✅ Resume when not paused (error)
- ✅ Pause when already paused (error)
- ✅ Correct pauseReason types ('manual' | 'silence')
- ✅ Status field validation
- ✅ State transition validation

See `tests/silence-detection.test.ts` for full test suite (77 tests passing).

## Compatibility

- ✅ Cursor MCP support
- ✅ Claude Desktop
- ✅ All MCP-compatible clients
- ✅ Backward compatible (new fields are optional)

