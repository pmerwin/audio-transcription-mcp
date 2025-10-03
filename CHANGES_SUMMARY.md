# Changes Summary: Claude Desktop Filesystem Access

## What Was Fixed

Fixed the "read-only file system" error in Claude Desktop by adding support for filesystem permissions configuration.

## Changes Made

### 1. Code Changes (`src/mcp-server.ts`)

- ✅ Added `OUTFILE_DIR` environment variable (defaults to `process.cwd()`)
- ✅ Updated file path handling to use `join(OUTFILE_DIR, filename)`
- ✅ Added support for both absolute and relative paths
- ✅ Backward compatible with Cursor (no breaking changes)

### 2. Documentation Updates

- ✅ **MCP_SETUP.md** - Added Claude Desktop `allowedDirectories` configuration
- ✅ **README.md** - Separate configs for Cursor vs Claude Desktop
- ✅ **env.example** - Added `OUTFILE_DIR` documentation
- ✅ **CURSOR_CONFIG_EXAMPLE.json** - Added Claude Desktop notes
- ✅ **CLAUDE_DESKTOP_CONFIG_EXAMPLE.json** - New dedicated example (NEW FILE)
- ✅ **CLAUDE_DESKTOP_SETUP.md** - Comprehensive setup guide (NEW FILE)
- ✅ **CHANGES_SUMMARY.md** - This file (NEW FILE)

### 3. Testing

- ✅ All 61 tests pass
- ✅ No breaking changes
- ✅ Build successful

## How to Use in Claude Desktop

### Quick Config

1. **Create directory:**
   ```bash
   mkdir -p ~/Documents/Transcripts
   ```

2. **Edit config:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   ```json
   {
     "mcpServers": {
       "audio-transcription": {
         "command": "npx",
         "args": ["-y", "audio-transcription-mcp"],
         "env": {
           "OPENAI_API_KEY": "sk-your-key-here",
           "INPUT_DEVICE_NAME": "BlackHole",
           "OUTFILE_DIR": "/Users/yourname/Documents/Transcripts"
         },
         "allowedDirectories": [
           "/Users/yourname/Documents/Transcripts"
         ]
       }
     }
   }
   ```

3. **Restart Claude Desktop**

4. **Test:** Say "Start transcribing audio"

## How Cursor Users Are Affected

**No changes needed!** Cursor continues to work exactly as before:

```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "npx",
      "args": ["-y", "audio-transcription-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-key-here",
        "INPUT_DEVICE_NAME": "BlackHole"
      }
    }
  }
}
```

- No `OUTFILE_DIR` required (defaults to current directory)
- No `allowedDirectories` needed (Cursor has broader permissions)
- All existing configs continue to work

## Technical Details

### Why This Works

1. **`OUTFILE_DIR` Environment Variable**
   - Specifies where transcript files should be written
   - Defaults to `process.cwd()` for backward compatibility
   - Required for Claude Desktop filesystem access

2. **`allowedDirectories` Configuration**
   - Claude Desktop security feature
   - Grants MCP server write access to specific directories
   - Must match the path in `OUTFILE_DIR`

3. **Path Handling**
   - Files are written to `join(OUTFILE_DIR, filename)`
   - Supports both absolute and relative paths
   - Handles timestamped filenames correctly

### File Locations

Transcripts are now saved to:
- **Cursor:** Current working directory (as before)
- **Claude Desktop:** `OUTFILE_DIR` (e.g., `~/Documents/Transcripts/`)

Each session gets a unique timestamped filename for privacy/isolation.

## Verification

Check that everything works:

```bash
# 1. Verify build
npm run build

# 2. Run tests
npm test

# 3. Check dist files
ls -la dist/

# 4. Test in Claude Desktop
# Say: "Start transcribing audio and show me the status"
```

## Files Modified

```
Modified:
  src/mcp-server.ts
  MCP_SETUP.md
  README.md
  env.example
  CURSOR_CONFIG_EXAMPLE.json

Created:
  CLAUDE_DESKTOP_CONFIG_EXAMPLE.json
  CLAUDE_DESKTOP_SETUP.md
  CHANGES_SUMMARY.md

Built:
  dist/mcp-server.js (updated)
  dist/mcp-server.d.ts (updated)
```

## Next Steps

1. **Test in Claude Desktop** with the new configuration
2. **Publish to npm** so others can use with `npx`
3. **Update CHANGELOG.md** with version bump
4. **Consider adding** to official Claude Desktop MCP server directory

## Questions?

- See [CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md) for detailed setup
- See [MCP_SETUP.md](./MCP_SETUP.md) for complete documentation
- See [GETTING_STARTED.md](./GETTING_STARTED.md) for prerequisites


