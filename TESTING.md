# Testing the MCP Server

## Pre-Test Checklist

Before testing the MCP server in Cursor, ensure:

- [x] ✅ BlackHole installed and Multi-Output Device configured
- [x] ✅ OpenAI API key available in `.env` file
- [x] ✅ Node 20 is active (`source ~/.nvm/nvm.sh && nvm use 20`)
- [x] ✅ Project built (`npm run build`)
- [x] ✅ Standalone CLI works (`npm start`)

## Quick MCP Server Test

### 1. Test Server Startup

```bash
# Set environment and run the MCP server
source ~/.nvm/nvm.sh && nvm use 20
node dist/mcp-server.js
```

Expected output:
```
Audio Transcription MCP Server running on stdio
```

The server will wait for MCP protocol messages on stdin. Press `Ctrl+C` to exit.

✅ If you see this message, the server is working!

### 2. Configure Cursor

Add to `~/.cursor/config.json`:

```json
{
  "mcpServers": {
    "audio-transcription": {
      "command": "node",
      "args": [
        "/Users/pmerwin/Projects/audio-transcription-mcp/dist/mcp-server.js"
      ],
      "env": {
        "OPENAI_API_KEY": "YOUR_KEY_HERE"
      }
    }
  }
}
```

**Important:** Replace:
- The path with your actual project path
- `YOUR_KEY_HERE` with your OpenAI API key

### 3. Restart Cursor

1. Quit Cursor completely (Cmd+Q)
2. Relaunch Cursor
3. Open a new chat

### 4. Test MCP Tools in Cursor

Try these prompts in order:

#### Test 1: List Available Tools
```
What MCP servers are available?
```

You should see "audio-transcription" listed.

#### Test 2: Get Status (Before Starting)
```
Check the audio transcription status
```

Expected response:
```json
{
  "isRunning": false,
  "chunksProcessed": 0,
  "errors": 0
}
```

#### Test 3: Start Transcription
```
Start transcribing audio
```

Expected response:
```json
{
  "success": true,
  "message": "Transcription started successfully",
  "outputFile": "meeting_transcript.md",
  "config": {
    "inputDevice": "BlackHole",
    "chunkSeconds": 8,
    "model": "whisper-1"
  }
}
```

#### Test 4: Play Audio
1. Open a YouTube video or play a podcast
2. Make sure your system audio is going through the Multi-Output Device
3. Wait 8-10 seconds

#### Test 5: Check Status (While Running)
```
What's the transcription status?
```

Expected response should show:
- `isRunning: true`
- `chunksProcessed: > 0`
- Timestamps for start and last transcript

#### Test 6: Get Transcript
```
Show me the last 5 transcript entries
```

You should see timestamped transcription results.

#### Test 7: Stop Transcription
```
Stop transcribing
```

Expected response:
```json
{
  "success": true,
  "message": "Transcription stopped successfully",
  "stats": {
    "chunksProcessed": 15,
    "duration": "120 seconds",
    "errors": 0
  }
}
```

## Advanced Tests

### Test Custom Parameters

```
Start transcription with 5-second chunks and save to test.md
```

The AI should call `start_transcription` with:
```json
{
  "chunkSeconds": 5,
  "outputFile": "test.md"
}
```

### Test Resource Access

```
Read the transcript://current resource
```

The AI should be able to read the transcript file content.

### Test Clear Transcript

```
Clear the transcript and start fresh
```

The AI should:
1. Call `clear_transcript`
2. Call `start_transcription`

## Troubleshooting

### Server Not Showing Up

**Check Cursor Logs:**
1. Open Cursor
2. View → Developer Tools
3. Check Console for MCP-related errors

**Common Issues:**
- ❌ Wrong Node version: Use Node 20+
- ❌ Invalid JSON in config: Validate with a JSON linter
- ❌ Wrong file path: Use absolute path
- ❌ Missing API key: Check env configuration

### "No active transcription session"

This is normal if:
- You haven't started a session yet
- The session was stopped
- The server restarted

**Solution:** Start a new session with `start_transcription`

### Audio Not Being Captured

**Checklist:**
1. Is Multi-Output Device selected in System Settings?
2. Is BlackHole in the Multi-Output Device?
3. Is audio actually playing?
4. Does standalone mode work? (`npm start`)

**Test Standalone First:**
```bash
source ~/.nvm/nvm.sh && nvm use 20
npm start
# Play audio and see if it transcribes
```

If standalone works but MCP doesn't, it's a configuration issue.

### Transcriptions Show Only "you"

This means:
- Audio is very quiet or just ambient noise
- Try playing clearer audio (podcast, YouTube video)
- Check your volume levels
- Increase chunk size for better context

### API Errors

**"Invalid OpenAI API key":**
- Verify key is correct in Cursor config
- Test key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_KEY"`

**Rate limiting:**
- You're processing too much audio too quickly
- Increase chunk size to reduce API calls
- Check your OpenAI quota

## Success Criteria

Your MCP server is working correctly if:

- ✅ Server starts without errors
- ✅ Cursor detects the MCP server
- ✅ All tools are callable from Cursor
- ✅ Transcription starts and captures audio
- ✅ Transcript file is created and updated
- ✅ Status and statistics are accurate
- ✅ Server stops gracefully

## Performance Benchmarks

**Expected Performance:**
- Memory usage: 50-100 MB per session
- CPU usage: Minimal (ffmpeg does the work)
- API latency: 1-3 seconds per chunk
- Accuracy: 90-95% for clear speech

**Cost per Hour:**
- OpenAI Whisper: ~$0.36/hour
- With 8-second chunks: ~450 API calls/hour
- Average cost per chunk: ~$0.0008

## Next Steps After Testing

1. ✅ Verify all tools work
2. ✅ Test with real meetings/podcasts
3. ✅ Experiment with different chunk sizes
4. ✅ Integrate into your workflow
5. 📝 Report any issues or bugs
6. 💡 Suggest improvements

## Support

If you encounter issues:
1. Check this testing guide
2. Review [MCP_SETUP.md](./MCP_SETUP.md)
3. Check [GETTING_STARTED.md](./GETTING_STARTED.md)
4. Verify all prerequisites are met
5. Test standalone mode first

## Feedback

Please note:
- What works well
- What could be improved
- Feature requests
- Bug reports
- Performance observations

Happy transcribing! 🎤

