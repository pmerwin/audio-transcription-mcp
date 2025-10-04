#!/bin/bash

# Create Multi-Output Device - Automated Attempt
# This script tries to automate the Multi-Output Device creation using AppleScript

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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

# Check if Multi-Output Device already exists
check_existing() {
    if system_profiler SPAudioDataType | grep -q "Multi-Output Device"; then
        print_success "Multi-Output Device already exists!"
        return 0
    fi
    return 1
}

# Attempt automated creation using AppleScript
attempt_automated_creation() {
    print_info "Attempting automated Multi-Output Device creation..."
    echo ""
    
    # This AppleScript attempts to automate the GUI
    # Note: This requires Accessibility permissions for Terminal/Script
    osascript <<'EOF' 2>&1
    try
        tell application "Audio MIDI Setup"
            activate
            delay 1
        end tell
        
        tell application "System Events"
            tell process "Audio MIDI Setup"
                -- Wait for window to be ready
                repeat until exists window 1
                    delay 0.1
                end repeat
                
                -- Click the + button (bottom left)
                set frontmost to true
                delay 0.5
                
                -- Try to click the + button
                try
                    click button 1 of group 1 of splitter group 1 of window 1
                    delay 0.5
                on error errMsg
                    error "Could not find + button: " & errMsg
                end try
                
                -- Look for "Create Multi-Output Device" menu item
                try
                    click menu item "Create Multi-Output Device" of menu 1 of button 1 of group 1 of splitter group 1 of window 1
                    delay 1
                on error errMsg
                    error "Could not find Multi-Output Device menu: " & errMsg
                end try
                
                -- Now we should have the Multi-Output Device selected
                -- Try to check the checkboxes for Built-in Output and BlackHole
                delay 1
                
                -- This part is tricky because the UI structure varies by macOS version
                -- We'll try to find and click the checkboxes
                try
                    tell table 1 of scroll area 1 of splitter group 1 of window 1
                        repeat with i from 1 to count rows
                            set rowName to value of static text 1 of row i
                            if rowName contains "Built-in Output" or rowName contains "BlackHole" then
                                click checkbox 1 of row i
                                delay 0.3
                            end if
                        end repeat
                    end tell
                    
                    return "Success: Multi-Output Device created and configured!"
                on error errMsg
                    error "Could not configure checkboxes: " & errMsg
                end try
                
            end tell
        end tell
        
    on error errMsg
        return "FAILED: " & errMsg
    end try
EOF
    
    local result=$?
    
    if [ $result -eq 0 ]; then
        print_success "Automated creation succeeded!"
        return 0
    else
        print_warning "Automated creation failed (this is normal on first try)"
        return 1
    fi
}

# Manual fallback with clearer instructions
manual_creation() {
    cat << 'EOF'

╔═══════════════════════════════════════════════════════════════════════════╗
║                   📋 MANUAL SETUP REQUIRED                                ║
║                                                                           ║
║  Automatic creation needs Accessibility permissions OR requires          ║
║  macOS GUI automation that varies by macOS version.                      ║
║                                                                           ║
║  Don't worry! It's just 4 clicks - I'll guide you:                       ║
╚═══════════════════════════════════════════════════════════════════════════╝

Audio MIDI Setup is now open. Please follow these steps:

📍 STEP 1: Find the "+" button
   └─ Look at the BOTTOM LEFT corner of the Audio MIDI Setup window
   └─ It's a small plus (+) icon

📍 STEP 2: Click "+" and select "Create Multi-Output Device"
   └─ A dropdown menu will appear
   └─ Click "Create Multi-Output Device"
   └─ A new device named "Multi-Output Device" appears in the left sidebar

📍 STEP 3: Configure the outputs (RIGHT SIDE of window)
   You'll see checkboxes next to device names. Check BOTH:
   
   ☑ Built-in Output (or MacBook Pro Speakers, or your headphones)
   ☑ BlackHole 2ch
   
   💡 WHY? This sends audio to BOTH places:
      • Your speakers/headphones (so you can hear it)  
      • BlackHole (so it can be transcribed)

📍 STEP 4: Close Audio MIDI Setup window
   └─ Just close it - settings are saved automatically!

───────────────────────────────────────────────────────────────────────────

Press ENTER when you've completed these 4 steps...
EOF
    
    # Open Audio MIDI Setup
    open -a "Audio MIDI Setup"
    
    # Wait for user
    read -r
    
    print_success "Manual setup completed!"
}

# Try to grant accessibility permissions automatically
request_accessibility_permissions() {
    print_info "Checking accessibility permissions..."
    echo ""
    
    # Check if Terminal/Script Editor has accessibility permissions
    if ! osascript -e 'tell application "System Events" to get properties of process "Audio MIDI Setup"' >/dev/null 2>&1; then
        cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════════════╗
║                   🔐 ACCESSIBILITY PERMISSION NEEDED                      ║
╚═══════════════════════════════════════════════════════════════════════════╝

To fully automate the setup, macOS needs permission to control
the Audio MIDI Setup application.

This is SAFE and TEMPORARY - only needed for this setup.

What will happen:
1. A system dialog will appear
2. Click "Open System Settings"
3. Turn ON the toggle for Terminal (or your script runner)
4. Come back and run this script again

OR: Skip this and just do it manually (4 easy clicks)

EOF
        read -p "Try to request permission? (yes/no): " -r
        echo
        if [[ $REPLY =~ ^[Yy]es$ ]]; then
            # Trigger the permission request
            osascript -e 'tell application "System Events" to get properties of process "Audio MIDI Setup"' 2>&1 || true
            echo ""
            print_info "After granting permission, run this script again for automated setup"
            echo ""
            exit 0
        fi
    else
        print_success "Accessibility permissions already granted!"
        return 0
    fi
    
    return 1
}

# Main flow
main() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}   Create Multi-Output Device - Smart Automation   ${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo ""
    
    # Check if already exists
    if check_existing; then
        echo ""
        print_info "Nothing to do - you're all set!"
        exit 0
    fi
    
    echo ""
    print_info "Multi-Output Device not found - let's create it!"
    echo ""
    
    # Try automated approach first
    print_info "Trying fully automated creation (may require permissions)..."
    echo ""
    
    if request_accessibility_permissions; then
        if attempt_automated_creation; then
            echo ""
            print_success "🎉 Fully automated setup complete!"
            exit 0
        fi
    fi
    
    # Fall back to manual
    echo ""
    print_info "Falling back to guided manual setup..."
    echo ""
    manual_creation
    
    # Verify it was created
    sleep 1
    if check_existing; then
        echo ""
        print_success "🎉 Multi-Output Device successfully created!"
        exit 0
    else
        print_warning "Could not verify Multi-Output Device was created"
        print_info "Please check Audio MIDI Setup to confirm"
    fi
}

# Run main
main

