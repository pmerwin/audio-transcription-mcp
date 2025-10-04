#!/bin/bash

# Audio Transcription MCP - Automated Audio Setup
# This script automates the installation and configuration of audio routing for macOS

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if running on macOS
check_macos() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "This script is only supported on macOS"
        exit 1
    fi
    print_success "Running on macOS"
}

# Check for Homebrew
check_homebrew() {
    print_info "Checking for Homebrew..."
    if ! command -v brew &> /dev/null; then
        print_warning "Homebrew not found. Installing Homebrew..."
        echo ""
        print_info "⚠️  You will be asked for your Mac password in a moment"
        print_info "This is NORMAL and SAFE - macOS requires it for software installation"
        echo ""
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for Apple Silicon Macs
        if [[ $(uname -m) == "arm64" ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
        
        print_success "Homebrew installed"
    else
        print_success "Homebrew is already installed"
    fi
}

# Install BlackHole audio driver
install_blackhole() {
    print_info "Checking for BlackHole audio driver..."
    
    # Check if BlackHole is already installed
    if ls /Library/Audio/Plug-Ins/HAL/BlackHole*.driver &> /dev/null; then
        print_success "BlackHole audio driver is already installed"
        return 0
    fi
    
    print_warning "BlackHole not found. Installing BlackHole 2ch..."
    brew install blackhole-2ch
    
    print_success "BlackHole audio driver installed"
    print_info "You may need to restart your Mac for the driver to be fully recognized"
}

# Check if BlackHole device is available
check_blackhole_device() {
    print_info "Verifying BlackHole audio device..."
    
    # Use system_profiler to list audio devices
    if system_profiler SPAudioDataType | grep -q "BlackHole"; then
        print_success "BlackHole audio device detected"
        return 0
    else
        print_error "BlackHole audio device not found"
        print_warning "You may need to restart your Mac for BlackHole to appear"
        return 1
    fi
}

# Attempt automated Multi-Output Device creation
attempt_automated_creation() {
    print_info "Attempting automated Multi-Output Device creation..."
    
    # Try AppleScript automation
    osascript <<'EOF' 2>&1
    try
        tell application "Audio MIDI Setup"
            activate
            delay 1
        end tell
        
        tell application "System Events"
            tell process "Audio MIDI Setup"
                set frontmost to true
                delay 0.5
                
                -- Click the + button
                click button 1 of group 1 of splitter group 1 of window 1
                delay 0.5
                
                -- Click "Create Multi-Output Device"
                click menu item "Create Multi-Output Device" of menu 1 of button 1 of group 1 of splitter group 1 of window 1
                delay 1
                
                -- Check the boxes for Built-in Output and BlackHole
                tell table 1 of scroll area 1 of splitter group 1 of window 1
                    repeat with i from 1 to count rows
                        set rowName to value of static text 1 of row i
                        if rowName contains "Built-in" or rowName contains "BlackHole" then
                            click checkbox 1 of row i
                            delay 0.2
                        end if
                    end repeat
                end tell
            end tell
        end tell
        
        -- Close Audio MIDI Setup
        tell application "Audio MIDI Setup" to quit
        
        return "SUCCESS"
    on error errMsg
        return "FAILED"
    end try
EOF
    
    local result=$(echo $?)
    
    # Check if it worked
    sleep 1
    if system_profiler SPAudioDataType | grep -q "Multi-Output Device"; then
        return 0
    else
        return 1
    fi
}

# Create Multi-Output Device - Smart automation with manual fallback
create_multi_output_device() {
    print_info "Checking for Multi-Output Device configuration..."
    
    # Check if already exists
    if system_profiler SPAudioDataType | grep -q "Multi-Output Device"; then
        print_success "Multi-Output Device already configured"
        return 0
    fi
    
    print_warning "Multi-Output Device not found"
    echo ""
    
    # Try automated creation first
    print_info "Trying automated setup (this may ask for permissions)..."
    echo ""
    
    if attempt_automated_creation; then
        print_success "✨ Automated setup successful!"
        return 0
    fi
    
    # Fall back to manual
    print_warning "Automated setup didn't work - using guided manual setup"
    print_info "This is NORMAL on first try - it needs accessibility permissions"
    echo ""
    print_info "Opening Audio MIDI Setup for manual configuration..."
    
    cat << 'EOF'

╔═══════════════════════════════════════════════════════════════════════════╗
║                        🎯 MANUAL STEP REQUIRED                            ║
║                         (Don't worry, it's easy!)                         ║
╚═══════════════════════════════════════════════════════════════════════════╝

Audio MIDI Setup will now open. Follow these 4 simple steps:

📍 STEP 1: Find the "+" button
   └─ Look at the BOTTOM LEFT corner of the window

📍 STEP 2: Click "+" and select "Create Multi-Output Device"
   └─ A new device will appear in the left sidebar

📍 STEP 3: Check TWO boxes in the right panel:
   ☑ Built-in Output (or your speakers/headphones)
   ☑ BlackHole 2ch
   
   WHY? This sends audio to BOTH:
   • Your speakers (so you can hear it)
   • BlackHole (so it can be transcribed)

📍 STEP 4: Close the window

That's it! The script will continue automatically.

💡 TIP: Next time you run this setup, it might work automatically
       if you grant Terminal accessibility permissions!

Press ENTER when you've completed these steps...
EOF
    
    # Open Audio MIDI Setup
    open -a "Audio MIDI Setup"
    
    # Wait for user confirmation
    read -r
    
    print_success "Multi-Output Device configuration completed"
}

# Verify ffmpeg installation
check_ffmpeg() {
    print_info "Checking for ffmpeg..."
    
    if ! command -v ffmpeg &> /dev/null; then
        print_warning "ffmpeg not found. Installing ffmpeg..."
        brew install ffmpeg
        print_success "ffmpeg installed"
    else
        print_success "ffmpeg is already installed"
    fi
}

# List available audio devices
list_audio_devices() {
    print_header "Available Audio Devices"
    
    if command -v ffmpeg &> /dev/null; then
        echo "AVFoundation audio devices:"
        ffmpeg -f avfoundation -list_devices true -i "" 2>&1 | grep "AVFoundation audio devices:" -A 20 | grep "\[" || echo "Could not list devices"
    fi
}

# Display configuration instructions
show_instructions() {
    print_header "Setup Complete!"
    
    cat << 'EOF'

✓ BlackHole audio driver installed
✓ Multi-Output Device created
✓ ffmpeg installed

IMPORTANT: Next Steps
=====================

1. SET YOUR SYSTEM OUTPUT:
   - Go to: System Settings > Sound > Output
   - Select: "Multi-Output Device"
   
   This will route your system audio to BOTH your speakers AND BlackHole
   (so you can hear audio while it's being transcribed)

2. VERIFY THE SETUP:
   Test that everything works:
   
   npx audio-transcription-mcp test
   
   This will capture 5 seconds of audio and verify it's working.

3. START USING IT:
   After testing, you can start transcribing with:
   
   • Standalone: npx audio-transcription-mcp start
   • With Claude Desktop: Just ask Claude to "start transcription"
   • With Cursor: Use the MCP tools in chat

4. TROUBLESHOOTING:
   If no audio is captured:
   - Verify Multi-Output Device is checked in System Settings > Sound
   - Make sure BlackHole 2ch is checked in the Multi-Output Device
   - Try restarting your Mac if BlackHole doesn't appear

5. WANT TO UNINSTALL? (optional)
   If you ever want to remove everything:
   
   brew uninstall blackhole-2ch
   brew uninstall ffmpeg
   
   Then delete the Multi-Output Device in Audio MIDI Setup.

For more help, visit:
https://github.com/pmerwin/audio-transcription-mcp

EOF
}

# Show what will happen
show_preview() {
    cat << 'EOF'

Welcome! This script will:
  1. ✓ Install Homebrew (if needed) - package manager for macOS
  2. ✓ Install ffmpeg - audio processing tool
  3. ✓ Install BlackHole - virtual audio driver (safe, trusted software)
  4. ✓ Guide you through creating a Multi-Output Device (2 clicks)
  5. ✓ Test your setup

Estimated time: 5-10 minutes
Internet connection required for downloads

IMPORTANT: 
- You may be asked for your Mac password (for Homebrew installation)
- This is SAFE and NORMAL - it's how macOS installs system software
- Everything installed can be easily uninstalled later

EOF
    
    read -p "Ready to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        echo "Setup cancelled. Run again when ready!"
        exit 0
    fi
}

# Main setup flow
main() {
    print_header "Audio Transcription MCP - Automated Setup"
    
    show_preview
    
    check_macos
    check_homebrew
    check_ffmpeg
    install_blackhole
    
    # Give system a moment to register the driver
    sleep 2
    
    if check_blackhole_device; then
        create_multi_output_device
        list_audio_devices
        show_instructions
    else
        print_warning "BlackHole device not detected yet"
        print_info "Please restart your Mac and run this script again"
        exit 0
    fi
    
    print_success "Setup completed successfully!"
}

# Run main function
main

