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

