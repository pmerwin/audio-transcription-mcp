# Publishing Guide

## Publishing to GitHub

### 1. Initialize Git Repository (if not already done)

```bash
cd /path/to/audio-transcription-mcp
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

# Test CLI
audio-transcription-mcp --help
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

## Publishing to NPM

Publishing to NPM makes installation easier for users - they can simply run `npm install -g audio-transcription-mcp` instead of cloning from GitHub.

### 1. Prepare package.json

Ensure your `package.json` is properly configured for NPM:

```json
{
  "name": "audio-transcription-mcp",
  "version": "0.1.0",
  "description": "MCP server for real-time audio transcription using OpenAI Whisper",
  "main": "dist/mcp-server.js",
  "bin": {
    "audio-transcription-mcp": "dist/main-cli.js"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "openai",
    "whisper",
    "transcription",
    "audio",
    "cursor",
    "claude",
    "speech-to-text"
  ],
  "author": "Phil Merwin",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/pmerwin/audio-transcription-mcp.git"
  },
  "bugs": {
    "url": "https://github.com/pmerwin/audio-transcription-mcp/issues"
  },
  "homepage": "https://github.com/pmerwin/audio-transcription-mcp#readme"
}
```

### 2. Create .npmignore

Create a `.npmignore` file to exclude files from the NPM package:

> ⚠️ **Warning**: The command below will overwrite any existing `.npmignore` file. If you already have one, back it up first or manually add these entries instead.

```bash
cat > .npmignore << 'EOF'
# Source files (we publish dist/)
src/
tests/
*.test.ts
*.test.js

# Development files
.git/
.github/
.vscode/
*.log
*.md.backup
npm-debug.log*

# Coverage reports
coverage/
.nyc_output/

# Documentation (keep README.md)
IMPLEMENTATION_PLAN.md
AUTOMATION_RESEARCH_SUMMARY.md
AUTOMATED_SETUP_SUMMARY.md
CHANGES_SUMMARY.md
CODE_REVIEW.md
COMMUNITY_READY.md
SESSION_ISOLATION_ANALYSIS.md
SESSION_ISOLATION_FIXES.md
TRANSCRIPT_GAP_FIX.md
PAUSE_RESUME_FEATURE.md
SILENCE_DETECTION_FEATURE.md
PUBLISHING.md

# Example files
env.example
*.example.json

# Build configs
tsconfig.json
jest.config.js
build-bundle.js

# Personal transcripts
meeting_transcript.md
transcript_*.md

# Environment
.env
.env.local
EOF
```

**Important**: Keep `dist/`, `README.md`, `LICENSE`, `INSTALL.md`, `MCP_SETUP.md`, and `GETTING_STARTED.md` - these should be published.

### 3. Create NPM Account (if you don't have one)

1. Go to https://www.npmjs.com/signup
2. Create an account with username, email, and password
3. Verify your email address

### 4. Login to NPM via CLI

```bash
npm login
```

Enter your:
- Username
- Password
- Email
- One-time password (if 2FA is enabled)

Verify you're logged in:
```bash
npm whoami
```

### 5. Build the Project

```bash
npm run build
```

Ensure `dist/` folder is up-to-date and contains all compiled files.

### 6. Verify Package Before Publishing

Check what files will be included:

```bash
npm pack --dry-run
```

This shows you exactly what will be published without actually publishing.

### 7. Test the Package Locally

Create a test installation from the packed tarball (this respects `.npmignore` and simulates the real publish):

```bash
# In your project directory, create a tarball
cd /path/to/audio-transcription-mcp
npm pack

# This creates audio-transcription-mcp-0.1.0.tgz (or similar)
# Now test install it in another directory
mkdir /tmp/test-npm-install
cd /tmp/test-npm-install
npm init -y
npm install /path/to/audio-transcription-mcp/audio-transcription-mcp-*.tgz

# Test the CLI commands
npx audio-transcription-mcp --help
```

### 8. Publish to NPM

#### First Time Publishing

```bash
# Make sure you're in the project directory
cd /path/to/audio-transcription-mcp

# Publish
npm publish
```

If you want to publish a scoped package (e.g., `@pmerwin/audio-transcription-mcp`):

```bash
# Update package.json name to "@pmerwin/audio-transcription-mcp"
npm publish --access public
```

**Note**: Scoped packages are private by default, so you need `--access public` to make them public.

#### Verify Publication

1. Go to https://www.npmjs.com/package/audio-transcription-mcp
2. Verify package details, README, and version

### 9. Test Installation from NPM

In a clean environment:

```bash
# Global installation
npm install -g audio-transcription-mcp

# Verify commands
which audio-transcription-mcp
audio-transcription-mcp --help

# Test MCP server
audio-transcription-mcp
```

### 10. Publish Updates

When you have bug fixes or new features:

#### For Patch Releases (0.1.0 → 0.1.1)

```bash
# Update version
npm version patch

# This automatically:
# - Updates package.json
# - Creates a git commit
# - Creates a git tag

# Push to GitHub
git push origin main --tags

# Publish to NPM
npm publish
```

#### For Minor Releases (0.1.0 → 0.2.0)

```bash
npm version minor
git push origin main --tags
npm publish
```

#### For Major Releases (0.1.0 → 1.0.0)

```bash
npm version major
git push origin main --tags
npm publish
```

### 11. Deprecate or Unpublish (if needed)

#### Deprecate a Version

```bash
npm deprecate audio-transcription-mcp@0.1.0 "Please upgrade to 0.2.0"
```

#### Unpublish (within 72 hours of publishing)

```bash
npm unpublish audio-transcription-mcp@0.1.0
```

**Warning**: Unpublishing is permanent and discouraged. Use deprecation instead.

### NPM vs GitHub Installation

After publishing to NPM, users have two installation options:

**From NPM (Recommended)**:
```bash
npm install -g audio-transcription-mcp
```

**From GitHub**:
```bash
npm install -g git+https://github.com/pmerwin/audio-transcription-mcp.git
```

Update your README to show both methods.

### NPM Publishing Checklist

- [ ] `package.json` has correct metadata (name, version, description, keywords, author, license, repository)
- [ ] `.npmignore` created to exclude unnecessary files
- [ ] NPM account created and verified
- [ ] Logged in via `npm login`
- [ ] Project built successfully (`npm run build`)
- [ ] Package tested locally with `npm pack --dry-run`
- [ ] Test installation works (`npm install` from tarball)
- [ ] All tests passing (`npm test`)
- [ ] README.md is comprehensive
- [ ] LICENSE file exists
- [ ] CHANGELOG.md updated
- [ ] Ready to run `npm publish`

### Common NPM Publishing Issues

**Issue**: Package name already taken
**Solution**: Choose a different name or use a scoped package (`@username/package-name`)

**Issue**: "You must verify your email"
**Solution**: Check your email and verify your NPM account

**Issue**: "You do not have permission to publish"
**Solution**: Check you're logged in with `npm whoami` and have the right permissions

**Issue**: Wrong files published
**Solution**: Use `.npmignore` and verify with `npm pack --dry-run`

### NPM Package Stats

After publishing, you can monitor your package:
- **Downloads**: https://www.npmjs.com/package/audio-transcription-mcp
- **npm trends**: https://npmtrends.com/audio-transcription-mcp
- **Package Phobia** (size): https://packagephobia.com/result?p=audio-transcription-mcp

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

