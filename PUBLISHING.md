# Publishing Guide

## Publishing to GitHub

### 1. Initialize Git Repository (if not already done)

```bash
cd /Users/pmerwin/Projects/audio-transcription-mcp
git init
```

### 2. Create .gitignore

The project already has a `.gitignore`. Verify it includes:

```bash
cat .gitignore
```

Should include:
- `node_modules/`
- `.env`
- `*.log`
- `dist/` (commented out since we need it for npm install)
- `meeting_transcript.md`

### 3. Build the Project

```bash
npm run build
```

This ensures the `dist/` folder is ready for users.

### 4. Commit All Files

```bash
git add .
git commit -m "Initial release: Audio Transcription MCP Server v0.1.0

Features:
- Real-time audio transcription using OpenAI Whisper
- MCP server for Cursor/Claude Desktop integration
- Standalone CLI mode
- 6 MCP tools: start, stop, status, get_transcript, clear, cleanup
- Support for BlackHole audio capture on macOS
- Comprehensive documentation"
```

### 5. Create GitHub Repository

#### Option A: Via GitHub Web Interface

1. Go to https://github.com/new
2. Repository name: `audio-transcription-mcp`
3. Description: "MCP server for real-time audio transcription using OpenAI Whisper"
4. Public or Private (your choice)
5. **Do NOT** initialize with README (we already have one)
6. Click "Create repository"

#### Option B: Via GitHub CLI (if installed)

```bash
gh repo create audio-transcription-mcp --public --source=. --remote=origin --description="MCP server for real-time audio transcription using OpenAI Whisper"
```

### 6. Push to GitHub

If you created via web interface:

```bash
git remote add origin https://github.com/pmerwin/audio-transcription-mcp.git
git branch -M main
git push -u origin main
```

If you used GitHub CLI, it's already pushed.

### 7. Add Topics/Tags on GitHub

1. Go to your repository page
2. Click the gear icon next to "About"
3. Add topics:
   - `mcp`
   - `model-context-protocol`
   - `openai`
   - `whisper`
   - `transcription`
   - `audio`
   - `cursor`
   - `claude`
   - `real-time`
   - `speech-to-text`

### 8. Create a Release (Optional but Recommended)

```bash
# Tag the release
git tag -a v0.1.0 -m "Release v0.1.0 - Initial public release"
git push origin v0.1.0
```

Or via GitHub web interface:
1. Go to Releases
2. Click "Create a new release"
3. Tag: `v0.1.0`
4. Title: `v0.1.0 - Initial Release`
5. Description: See CHANGELOG below
6. Publish release

### 9. Update README Badges (Optional)

Add to top of README.md:

```markdown
[![npm version](https://img.shields.io/github/package-json/v/pmerwin/audio-transcription-mcp)](https://github.com/pmerwin/audio-transcription-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
```

## Testing the Installation

After publishing, test that others can install:

```bash
# In a different directory
npm install -g git+https://github.com/pmerwin/audio-transcription-mcp.git

# Verify commands are available
which audio-transcription-mcp
which audio-transcription-cli

# Test CLI
audio-transcription-cli --help
```

## Updating After Publishing

### For Bug Fixes and Features

1. Make your changes
2. Update version in `package.json`: `0.1.0` → `0.1.1`
3. Commit changes:
   ```bash
   git add .
   git commit -m "Fix: [description]"
   ```
4. Push to GitHub:
   ```bash
   git push origin main
   ```
5. Create new release tag:
   ```bash
   git tag -a v0.1.1 -m "Release v0.1.1 - Bug fixes"
   git push origin v0.1.1
   ```

Users can update with:
```bash
npm update -g audio-transcription-mcp
```

## Sample CHANGELOG.md

Create a `CHANGELOG.md` file:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-10-03

### Added
- Initial release of Audio Transcription MCP Server
- Real-time audio transcription using OpenAI Whisper
- MCP server for Cursor and Claude Desktop
- Standalone CLI mode
- 6 MCP tools:
  - start_transcription
  - stop_transcription
  - get_status
  - get_transcript
  - clear_transcript
  - cleanup_transcript
- Support for BlackHole audio capture on macOS
- Configurable chunk sizes (default: 8 seconds)
- Timestamped markdown transcripts
- Comprehensive documentation (README, INSTALL, MCP_SETUP, TESTING)

### System Requirements
- macOS (Windows/Linux support planned)
- Node.js 20+
- ffmpeg
- BlackHole audio driver
- OpenAI API key

### Documentation
- Installation guide (INSTALL.md)
- MCP setup guide (MCP_SETUP.md)
- Testing guide (TESTING.md)
- Getting started guide (GETTING_STARTED.md)
```

## Making it Discoverable

### 1. Add to MCP Registry

Once your repo is public, you can submit it to:
- Anthropic's MCP servers list
- Awesome MCP lists on GitHub

### 2. Share on Social Media

Example tweet:
```
🎤 Just released Audio Transcription MCP Server!

Real-time audio transcription for @cursor_ai using OpenAI Whisper

✅ Easy install from GitHub
✅ 6 MCP tools
✅ Works with system audio
✅ Timestamped transcripts

https://github.com/pmerwin/audio-transcription-mcp

#MCP #AI #Cursor #OpenAI
```

### 3. Add to your Profile README

Link to the project from your GitHub profile README.

## Security Notes

- **Never commit** your `.env` file
- **Never commit** API keys in configuration examples
- Users should always use their own OpenAI API keys
- Consider adding security policy: `SECURITY.md`

## Support

After publishing, monitor:
- GitHub Issues for bug reports
- GitHub Discussions for questions
- Pull requests from contributors

## License

Ensure `LICENSE` file exists:

```bash
# Create MIT license if not exists
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2025 Phil Merwin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
```

## Ready to Publish Checklist

- [ ] All code built and tested
- [ ] Documentation complete (README, INSTALL, etc.)
- [ ] `.gitignore` properly configured
- [ ] `.npmignore` created
- [ ] `package.json` updated with repository info
- [ ] LICENSE file exists
- [ ] CHANGELOG.md created
- [ ] Sensitive files excluded (.env, API keys)
- [ ] dist/ folder built and committed
- [ ] Git repository initialized
- [ ] Ready to push to GitHub

## Next Steps

After publishing:
1. Test installation from GitHub
2. Share with community
3. Monitor for issues/feedback
4. Plan future features
5. Consider adding to npm registry later

Good luck with your release! 🚀

