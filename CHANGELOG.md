# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-03

### Added

#### Core Features
- Real-time audio transcription using OpenAI Whisper API
- Standalone CLI mode for direct usage
- MCP server for Cursor and Claude Desktop integration
- Support for BlackHole audio capture on macOS
- Configurable audio chunk sizes (default: 8 seconds)
- Timestamped markdown transcripts
- Automatic API key validation on startup

#### MCP Tools
- `start_transcription` - Start capturing and transcribing system audio
- `stop_transcription` - Stop transcription and return session statistics
- `get_status` - Get current transcription status and chunk count
- `get_transcript` - Retrieve transcript content (with optional line limit)
- `clear_transcript` - Clear transcript and reinitialize with header
- `cleanup_transcript` - Delete transcript file completely

#### MCP Resources
- `transcript://current` - Read-only access to current transcript file

#### Architecture
- Modular TypeScript design with clear separation of concerns
- `AudioCapturer` - Handles ffmpeg and AVFoundation integration
- `AudioProcessor` - Converts PCM to WAV format
- `TranscriptionService` - Interfaces with OpenAI Whisper API
- `TranscriptManager` - Manages markdown file I/O
- `TranscriptionSession` - Orchestrates all components

#### Documentation
- Comprehensive README with quick start guide
- Detailed installation guide (INSTALL.md)
- MCP server setup guide (MCP_SETUP.md)
- Testing procedures (TESTING.md)
- Getting started guide (GETTING_STARTED.md)
- Publishing guide for contributors (PUBLISHING.md)

#### Configuration
- Environment-based configuration via `.env`
- Support for custom audio devices
- Configurable OpenAI model selection
- Adjustable sample rates and channels
- Custom output file paths

### System Requirements
- macOS (Windows/Linux support planned)
- Node.js 20 or higher
- ffmpeg with AVFoundation support
- BlackHole audio driver (or similar virtual audio device)
- OpenAI API key with Whisper access

### Technical Details
- TypeScript 5.7.2
- Model Context Protocol SDK 1.19.1
- OpenAI SDK 4.77.0
- ES Modules architecture
- Stdio-based MCP transport

### Known Limitations
- macOS only (cross-platform support planned)
- Requires BlackHole for system audio capture
- 8-second minimum chunk size recommended
- English language optimized (multi-language support planned)

### Cost Information
- OpenAI Whisper API: $0.006 per minute of audio
- Approximately $0.36 per hour of transcription
- No subscription fees

## [0.2.0] - 2025-10-03

### Added
- 🎉 **NPM Package Support** - Now available on npm! Use with `npx audio-transcription-mcp`
- **Complete Session Isolation** - Each transcript session gets a unique timestamped filename (format: `transcript_YYYY-MM-DD_HH-MM-SS-mmm.md`)
- **Session Management** - All MCP endpoints now respect session uniqueness (start, stop, status, get, clear, cleanup)
- **Privacy Guarantees** - Zero chance of transcript bleeding between sessions
- **Comprehensive Test Suite** - 61 passing tests covering all MCP endpoints and session isolation
- Added `generateTimestampedFilename()` utility function with millisecond precision
- Added `prepublishOnly` script to ensure build and tests run before publishing
- New test files: `mcp-endpoints.test.ts`, `session-isolation.test.ts`, `utils.test.ts`

### Changed
- **Breaking Change**: Default transcript filename is now auto-generated with timestamp instead of fixed `meeting_transcript.md`
- Updated MCP server to use session-based file tracking instead of global state
- Improved `cleanup_transcript` endpoint to require active session and clear session reference after deletion
- Updated documentation with npx usage instructions (MCP_SETUP.md, README.md)

### Fixed
- Fixed transcript bleeding between sessions - now each session is completely isolated
- Fixed concurrent session prevention logic
- All MCP endpoints now correctly reference the active session's transcript file

## [0.1.1] - 2025-10-03

### Fixed
- Fixed transcript bleeding issue where new transcription sessions would append to previous transcripts instead of starting fresh
- Now always clears and reinitializes transcript file when starting a new session

## [0.3.0] - 2025-10-03

### Added
- 🎉 **Claude Desktop Filesystem Support** - Added `OUTFILE_DIR` environment variable to specify output directory for transcripts
- **File System Permissions** - Support for Claude Desktop's `allowedDirectories` security model
- **Documentation** - New `CLAUDE_DESKTOP_SETUP.md` with step-by-step setup guide
- **Example Configs** - Added `CLAUDE_DESKTOP_CONFIG_EXAMPLE.json` with working configuration
- **Enhanced Documentation** - Updated all guides (MCP_SETUP.md, README.md, env.example) with Claude Desktop requirements

### Changed
- File path handling now uses `join(OUTFILE_DIR, filename)` for better control over output location
- Updated resource reading to support both absolute and relative paths
- Improved error messages for filesystem permission issues

### Fixed
- **Claude Desktop "read-only file system" error** - Fixed by adding proper filesystem access configuration
- File path resolution now works correctly in both Cursor and Claude Desktop environments

### Technical Details
- Default `OUTFILE_DIR` is `process.cwd()` for backward compatibility with Cursor
- All 61 tests continue to pass
- Zero breaking changes - existing Cursor configurations work unchanged
- Clean separation between Cursor (broader permissions) and Claude Desktop (explicit permissions)

## [0.3.1] - 2025-10-03

### Added
- **Debug Logging** - Added comprehensive debug output to help troubleshoot Claude Desktop issues
  - Version number logged on startup
  - Current working directory
  - OUTFILE_DIR value
  - Output file paths when starting transcription
- All debug info sent to stderr to not interfere with MCP protocol

### Purpose
- This is a debug release to help identify Claude Desktop caching and filesystem issues
- Helps verify which version is actually running
- Helps diagnose OUTFILE_DIR configuration problems

## [0.3.2] - 2025-10-03

### Fixed
- **CRITICAL FIX:** Debug logging now writes to file (`~/.audio-transcription-mcp-debug.log`) instead of stderr
- Previous version's console.error() was corrupting MCP JSON-RPC protocol messages
- Claude Desktop can now properly communicate with the server

### Changed
- Debug output moved from stderr to `~/.audio-transcription-mcp-debug.log`
- MCP protocol communication no longer interrupted by debug messages

## [0.3.3] - 2025-10-03

### Fixed
- **CRITICAL:** Fixed "File is not defined" error by using `toFile` from openai SDK instead of browser File API
- **CRITICAL:** Removed ALL console.log/console.error calls that were corrupting MCP JSON-RPC protocol
- All logging now goes to `~/.audio-transcription-mcp-debug.log` instead of stdout/stderr
- Fixed transcription-session.ts, audio-capturer.ts console outputs

### Changed
- Transcription service now properly uses OpenAI SDK's toFile helper for Node.js compatibility
- All runtime logging redirected to debug log file to prevent MCP protocol corruption

### Technical Details
- The MCP protocol uses stdio (stdin/stdout) for JSON-RPC communication
- ANY output to stdout or stderr corrupts the protocol messages
- All console statements now use debugLog() function writing to ~/.audio-transcription-mcp-debug.log

## [0.3.4] - 2025-10-03

### Fixed
- **CRITICAL:** Removed `process.stdout.write()` that was writing transcript text to stdout
- This was the final source of JSON corruption in MCP protocol
- Transcript output with markdown formatting (e.g., `**2025-10-03**`) was corrupting JSON-RPC messages
- Transcripts are still saved to file, but no longer output to stdout in MCP mode

### Changed
- Transcript text now logged to debug file instead of stdout
- MCP protocol should now work without any JSON parsing errors

## [0.3.5] - 2025-10-03

### Added
- Debug log now automatically clears on server startup for fresh session logs
- Easier debugging with clean log file each time MCP server starts

### Changed
- Version number updated to 0.3.4 in debug output (was hardcoded to 0.3.1)

## [0.4.1] - 2025-10-04

### Added
- 🎯 **Status Change Notifications** - Real-time event system for MCP clients
  - Emits events for: started, stopped, paused, resumed, silence_detected, audio_detected
  - All events logged to debug file with emoji markers for easy tracking
  - Callback-based system allows MCP clients to be notified immediately of status changes
  
- 💰 **OpenAI Cost Guard & Tracking** - Explicit protection against sending silence to API
  - New `silentChunksSkipped` status field tracks chunks NOT sent to OpenAI
  - Debug logging shows cost savings in real-time ($0.006 per minute avoided)
  - Double-guard system ensures 100% that silent audio never reaches Whisper API
  - Explicit documentation and tests verify API protection

- 📊 **Enhanced Status Reporting**
  - Added `silentChunksSkipped` field to track cost savings
  - Improved debug logging with emoji markers (🎤 🔇 🎵 ⏸️ ▶️ ⏹️ 💰)
  - Better visibility into what audio is/isn't being sent to OpenAI

### Changed
- **Breaking**: `TranscriptionSession` constructor now accepts optional `StatusChangeCallback`
- Enhanced debug logging for all state transitions
- More explicit comments around OpenAI API guard logic

### Tests
- Added 15 new comprehensive tests (93 → 108 total tests)
- New test file: `status-notifications.test.ts` (12 tests)
- New test file: `openai-guard.test.ts` (15 tests)
- Tests verify silent audio NEVER reaches OpenAI API
- Tests verify all status change events are emitted correctly

### Fixed
- 🐛 **CRITICAL BUG FIX**: System messages now written to transcript file
  - Auto-pause notifications now appear in transcript (explains gaps like the 37-second one)
  - Auto-resume notifications now appear in transcript
  - Manual pause/resume notifications now appear in transcript
  - Transcript file is now self-documenting for all state changes

### Documentation
- Added inline documentation for double-guard system
- Explicit comments marking where API calls occur
- Cost savings calculations documented in code

## [0.4.0] - 2025-10-04

### Added
- 🎉 **Pause/Resume Functionality** - Full control over transcription lifecycle
  - New `pause_transcription` MCP tool to pause active transcription
  - Enhanced `resume_transcription` MCP tool (works for both manual and auto-pause)
  - Supports workflow: start → pause → resume → stop
  - Audio capture continues during pause but transcription stops (saves API costs)
  
- 🔇 **Automatic Silence Detection** - Smart audio monitoring
  - Detects when no audio is being captured (4 consecutive silent chunks)
  - Automatically pauses transcription when silence is detected
  - Auto-resumes when audio is detected (for silence pauses only)
  - Manual pauses require explicit resume command
  - Configurable silence threshold (default: amplitude < 100)
  
- **Enhanced Status Reporting** - More detailed session information
  - New `isPaused` field indicates pause state
  - New `pauseReason` field ('manual' | 'silence') explains why paused
  - New `consecutiveSilentChunks` field tracks silence detection
  - Enhanced `warning` messages for better user feedback
  
- **Comprehensive Testing** - 81 tests passing (up from 77)
  - 13 new tests for silence detection
  - 4 new tests for pause/resume state transitions
  - Full coverage of pause reason types
  - State validation tests

### Changed
- **Breaking**: Status response now includes additional optional fields
- Improved error handling with consistent helper functions
- Better null safety - removed non-null assertion operators
- Enhanced debug logging for pause/resume and silence events

### Fixed
- Fixed non-null assertion operator to use safe null coalescing
- Fixed misleading test descriptions
- Improved test accuracy and coverage

### Technical Details
- Pause types: manual (user-initiated) vs silence (auto-detected)
- Silence threshold: 4 consecutive chunks with amplitude < 100
- Auto-resume only for silence pauses (manual pauses require explicit resume)
- Consistent MCP response format with helper functions
- Enhanced TypeScript type safety

### Documentation
- Added `PAUSE_RESUME_FEATURE.md` with comprehensive usage guide
- Added `SILENCE_DETECTION_FEATURE.md` with technical details
- State transition matrix and example workflows
- Debug logging documentation

## [Unreleased]

### Planned Features
- Windows support (WASAPI)
- Linux support (ALSA/PulseAudio)
- Multi-language transcription
- Speaker diarization
- Real-time streaming updates
- Multiple output formats (JSON, plain text, SRT)
- Custom Whisper prompts
- Webhook notifications
- Cloud storage integration (S3, Google Drive)
- Transcript search functionality
- Audio quality presets
- Automatic language detection

[0.1.0]: https://github.com/pmerwin/audio-transcription-mcp/releases/tag/v0.1.0

