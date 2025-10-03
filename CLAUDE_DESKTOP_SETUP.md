# Claude Desktop Setup Guide

## Problem

Claude Desktop has stricter filesystem security than Cursor. By default, MCP servers cannot write files to arbitrary locations, which causes "read-only file system" errors when trying to save transcripts.

## Solution

We've added support for `OUTFILE_DIR` environment variable and `allowedDirectories` configuration to grant Claude Desktop explicit filesystem write access.

## Quick Setup

### Step 1: Create Output Directory

```bash
mkdir -p ~/Documents/Transcripts
```

### Step 2: Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "npx",
      "args": ["-y", "audio-transcription-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-api-key-here",
        "INPUT_DEVICE_NAME": "BlackHole",
        "CHUNK_SECONDS": "8",
        "MODEL": "whisper-1",
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
- Replace `yourname` with your actual macOS username
- Replace `sk-your-openai-api-key-here` with your actual OpenAI API key
- The path in `OUTFILE_DIR` must match the path in `allowedDirectories`

### Step 3: Restart Claude Desktop

Completely quit (Cmd+Q) and relaunch Claude Desktop.

### Step 4: Test It

In Claude Desktop, say:
> "Start transcribing audio"

The transcript will be saved to your configured directory with a timestamped filename.

## What Changed

### Code Changes

1. **Added `OUTFILE_DIR` environment variable** (`src/mcp-server.ts`)
   - Defaults to `process.cwd()` for backward compatibility with Cursor
   - Allows specifying a custom output directory for transcripts

2. **Updated file path handling** 
   - Transcripts are now saved to `join(OUTFILE_DIR, filename)` 
   - Supports both absolute and relative paths
   - Works seamlessly in both Cursor and Claude Desktop

### Documentation Updates

1. **MCP_SETUP.md** - Added Claude Desktop filesystem requirements
2. **README.md** - Added separate configs for Cursor vs Claude Desktop
3. **env.example** - Added OUTFILE_DIR with documentation
4. **CURSOR_CONFIG_EXAMPLE.json** - Added Claude Desktop config notes
5. **CLAUDE_DESKTOP_CONFIG_EXAMPLE.json** - New dedicated example file

## Why This Approach

### ✅ Preserves Cursor Functionality
- Cursor doesn't need `allowedDirectories` and continues to work as before
- Default behavior unchanged (writes to current working directory)

### ✅ Enables Claude Desktop
- Explicit `allowedDirectories` grants necessary filesystem access
- `OUTFILE_DIR` ensures files are written to permitted locations

### ✅ Clean Implementation
- Single environment variable addition
- No breaking changes to existing behavior
- All 61 tests still pass

## Troubleshooting

### Error: "Read-only file system"

**Cause:** `allowedDirectories` not configured or doesn't match `OUTFILE_DIR`

**Fix:**
1. Ensure both `OUTFILE_DIR` and `allowedDirectories` use the same path
2. Ensure the directory exists: `mkdir -p ~/Documents/Transcripts`
3. Use absolute paths (starting with `/`)
4. Restart Claude Desktop completely

### Error: "ENOENT: no such file or directory"

**Cause:** Output directory doesn't exist

**Fix:**
```bash
mkdir -p ~/Documents/Transcripts
# Or whatever path you specified in OUTFILE_DIR
```

### Transcripts saved to wrong location

**Cause:** `OUTFILE_DIR` not set, using default current working directory

**Fix:** Add `OUTFILE_DIR` to your `env` configuration as shown above

## Verification

After setup, verify it works:

1. Start Claude Desktop
2. Say: "Start transcribing audio and show me the status"
3. Check the status output for `outputFile` path
4. It should show your configured directory
5. Verify the file exists: `ls -la ~/Documents/Transcripts/`

## Security Note

The `allowedDirectories` configuration is a security feature. Only grant access to directories where you want transcripts saved. Don't use system directories like `/System/` or `/usr/`.

## Support

For issues:
1. Check this guide
2. See [MCP_SETUP.md](./MCP_SETUP.md) for detailed documentation
3. Verify all prerequisites from [GETTING_STARTED.md](./GETTING_STARTED.md)
4. Ensure you're using the latest version: `npx -y audio-transcription-mcp@latest`


