# 🎯 Quick Setup Guide

This guide will help you set up audio routing for the Audio Transcription MCP server.

## 📋 Prerequisites

- macOS (10.15 or later)
- Node.js 20+
- OpenAI API key

## ⚡ Automated Setup (Recommended)

We provide a **smart automated setup** that handles everything for you:

```bash
# Run the automated setup
npx audio-transcription-mcp setup
```

### What the Script Does Automatically

1. ✅ **Installs Homebrew** (if not present) - Package manager for macOS
2. ✅ **Installs ffmpeg** (if not present) - Audio processing tool
3. ✅ **Installs BlackHole** audio driver via Homebrew
4. ✅ **Attempts to create Multi-Output Device** automatically via AppleScript
   - If successful: ✨ **Everything is automated!** (takes ~30 seconds)
   - If it needs permissions: Falls back to guided 4-step manual setup

### Smart Automation Details

**First Time Run:**
- The script will **try to automate** Multi-Output Device creation
- If macOS accessibility permissions aren't granted, it will:
  - Show you clear 4-step instructions
  - Open Audio MIDI Setup for you
  - Wait for you to complete the setup (just 4 clicks!)
  
**Second Time Run (or if you grant permissions):**
- The script will **fully automate** Multi-Output Device creation
- Zero manual steps!
- Takes ~30 seconds total

### After Running Setup

1. **Set your system audio output:**
   
   The setup script creates the Multi-Output Device, but you need to select it:
   - Go to: **System Settings > Sound > Output**
   - Select: **"Multi-Output Device"**
   
   💡 **Why?** We can't programmatically change your system output without deep system permissions. This is a macOS security feature.

2. **Test your setup:**
   ```bash
   npx audio-transcription-mcp test
   ```
   
   This captures 5 seconds of audio and verifies everything works.

3. **Start transcribing:**
   ```bash
   npx audio-transcription-mcp start
   ```

## 🧪 Testing Your Setup

Always test after setup to verify everything works:

```bash
npx audio-transcription-mcp test
```

**What it does:**
- ✅ Lists all available audio devices
- ✅ Verifies BlackHole is detected
- ✅ Captures 5 seconds of audio and analyzes levels
- ✅ Provides troubleshooting tips if issues detected

**Example output when working correctly:**
```
✓ Found audio device: BlackHole
ℹ Audio level analysis:
  Mean volume: -23.45 dB
  Max volume:  -12.34 dB
✓ Audio capture is working correctly! 🎉

Your setup is complete and working! You can now:
  • Standalone CLI: npx audio-transcription-mcp start
  • Claude Desktop: Ask Claude to "start transcription"
  • Cursor: Use MCP tools in chat
```

**Example output if there's an issue:**
```
⚠ Audio levels are very low or silent

💡 How to fix:
  1. Go to System Settings > Sound > Output
  2. Select "Multi-Output Device"
  3. Play some audio and run this test again
```

## 🔧 What Gets Automated vs Manual

### ✅ Fully Automated (if permissions granted)
- Installing Homebrew
- Installing ffmpeg
- Installing BlackHole driver
- Creating Multi-Output Device
- Configuring the device outputs

### 🤝 Requires One Manual Step
- **Setting system output to Multi-Output Device**
  
  **Why?** macOS security prevents apps from changing your system audio output without admin privileges. This is intentional and protects your system.
  
  **How?** Just go to System Settings > Sound > Output and select "Multi-Output Device"

### 🔐 Optional: Grant Accessibility Permissions

To enable **full automation** of Multi-Output Device creation:

1. Go to **System Settings > Privacy & Security > Accessibility**
2. Add Terminal (or your script runner) to the list
3. Run the setup script again

Next time, it will create the Multi-Output Device automatically!

**Don't want to grant permissions?** No problem! The script falls back to clear 4-step manual instructions.

---

## 🔧 Manual Setup (If Automation Fails)

If the automated script doesn't work or you prefer manual setup:

### Step 1: Install Dependencies

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install BlackHole audio driver
brew install blackhole-2ch

# Install ffmpeg
brew install ffmpeg
```

### Step 2: Create Multi-Output Device

1. Open **Audio MIDI Setup** (`/Applications/Utilities/Audio MIDI Setup.app`)
2. Click the **"+"** button at the bottom left
3. Select **"Create Multi-Output Device"**
4. In the right panel, check:
   - ☑ **Built-in Output** (or your speakers/headphones)
   - ☑ **BlackHole 2ch**
5. Close Audio MIDI Setup

### Step 3: Set System Output

1. Go to **System Settings > Sound > Output**
2. Select **"Multi-Output Device"**

### Step 4: Test

```bash
npx audio-transcription-mcp test
```

## 🚨 Troubleshooting

### BlackHole not appearing after installation

**Solution:** Restart your Mac. The audio driver needs a restart to be recognized.

### Audio levels are silent during test

**Possible causes:**
- Multi-Output Device not set as system output
- No audio playing during test
- BlackHole not checked in Multi-Output Device

**Solution:**
1. Verify **System Settings > Sound > Output** is set to "Multi-Output Device"
2. Play some audio (music, video, etc.)
3. Run `npx audio-transcription-mcp test` again

### "Input/output error" when listing devices

**Solution:** This is usually a temporary ffmpeg error and can be ignored if BlackHole appears in the device list.

### Cannot hear audio after setup

**Possible cause:** Built-in Output not checked in Multi-Output Device

**Solution:**
1. Open **Audio MIDI Setup**
2. Select "Multi-Output Device"
3. Ensure both **Built-in Output** AND **BlackHole 2ch** are checked

## 📚 Understanding the Audio Routing

```
┌─────────────────┐
│  System Audio   │  (Zoom, Spotify, YouTube, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Multi-Output Device     │  (Routes to BOTH outputs)
├─────────────────────────┤
│ ☑ Built-in Output      │ → Your speakers/headphones (so you can hear)
│ ☑ BlackHole 2ch        │ → Virtual device (for capture)
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ ffmpeg captures from    │
│ BlackHole 2ch           │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ OpenAI Whisper API      │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ Real-time Transcript    │
└─────────────────────────┘
```

## 🎓 Why This Setup?

- **BlackHole**: Virtual audio device that captures system audio
- **Multi-Output Device**: Routes audio to BOTH your speakers (so you can hear) AND BlackHole (for transcription)
- **No quality loss**: Audio passes through unchanged
- **Privacy**: No audio leaves your system except to OpenAI Whisper API

## 💡 Tips

1. **Use descriptive names**: Rename your Multi-Output Device to "Transcription Output" for clarity
2. **Quick switching**: Use the menu bar sound icon to quickly switch between outputs
3. **Keyboard shortcuts**: Set up Quick Actions in System Settings for faster switching
4. **Test regularly**: Run `npx audio-transcription-mcp test` before important meetings

## 📞 Need Help?

- Check the [FAQ](./README.md#faq)
- Review [Troubleshooting](./README.md#troubleshooting)
- Open an issue on [GitHub](https://github.com/pmerwin/audio-transcription-mcp/issues)

