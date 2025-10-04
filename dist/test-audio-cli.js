#!/usr/bin/env node
/**
 * Test Audio CLI for Audio Transcription MCP
 * Tests audio capture to verify setup is working
 */
import { spawn } from 'child_process';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
const { INPUT_DEVICE_NAME = "BlackHole", SAMPLE_RATE = "16000", CHANNELS = "1", } = process.env;
// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};
function printHeader(message) {
    console.log('');
    console.log(`${colors.blue}========================================${colors.reset}`);
    console.log(`${colors.blue}${message}${colors.reset}`);
    console.log(`${colors.blue}========================================${colors.reset}`);
    console.log('');
}
function printError(message) {
    console.log(`${colors.red}✗${colors.reset} ${message}`);
}
function printSuccess(message) {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
}
function printInfo(message) {
    console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}
function printWarning(message) {
    console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}
async function testAudioCapture() {
    printHeader('Audio Transcription MCP - Audio Test');
    printInfo('Testing audio capture setup...');
    printInfo(`Looking for audio device: ${INPUT_DEVICE_NAME}`);
    console.log('');
    // List audio devices first
    printInfo('Detecting available audio devices...');
    const listDevices = spawn('ffmpeg', [
        '-f', 'avfoundation',
        '-list_devices', 'true',
        '-i', ''
    ]);
    let deviceOutput = '';
    let deviceFound = false;
    listDevices.stderr.on('data', (data) => {
        const output = data.toString();
        deviceOutput += output;
        // Check if our target device is in the output
        if (output.toLowerCase().includes(INPUT_DEVICE_NAME.toLowerCase())) {
            deviceFound = true;
        }
    });
    listDevices.on('close', () => {
        console.log('Available audio devices:');
        console.log('─────────────────────────────────────────');
        // Extract and display audio devices
        const audioSection = deviceOutput.split('AVFoundation audio devices:')[1];
        if (audioSection) {
            const devices = audioSection.split('AVFoundation video devices:')[0];
            console.log(devices.trim());
        }
        console.log('─────────────────────────────────────────');
        console.log('');
        if (!deviceFound) {
            printWarning(`Target device "${INPUT_DEVICE_NAME}" not found in the list`);
            printInfo('');
            printInfo('💡 How to fix:');
            printInfo('');
            printInfo('  1. If you haven\'t run setup yet:');
            printInfo('     npx audio-transcription-mcp setup');
            printInfo('');
            printInfo('  2. If you just installed BlackHole:');
            printInfo('     Restart your Mac (required for audio drivers)');
            printInfo('');
            printInfo('  3. If you already set up:');
            printInfo('     Check your .env file has: INPUT_DEVICE_NAME="BlackHole"');
            console.log('');
            process.exit(1);
        }
        else {
            printSuccess(`Found audio device: ${INPUT_DEVICE_NAME}`);
            console.log('');
            testAudioLevels();
        }
    });
}
function testAudioLevels() {
    printInfo('Testing audio capture for 5 seconds...');
    printInfo('Please play some audio (music, video, etc.) to test');
    console.log('');
    // Capture 5 seconds of audio and analyze levels
    const captureTest = spawn('ffmpeg', [
        '-f', 'avfoundation',
        '-i', `:${INPUT_DEVICE_NAME}`,
        '-ac', CHANNELS,
        '-ar', SAMPLE_RATE,
        '-t', '5',
        '-af', 'volumedetect',
        '-f', 'null',
        '-'
    ]);
    let audioData = '';
    let errorOccurred = false;
    captureTest.stderr.on('data', (data) => {
        const output = data.toString();
        audioData += output;
        // Show progress
        if (output.includes('time=')) {
            const timeMatch = output.match(/time=(\d{2}:\d{2}:\d{2})/);
            if (timeMatch) {
                process.stdout.write(`\rCapturing: ${timeMatch[1]}`);
            }
        }
    });
    captureTest.on('error', (error) => {
        printError(`Failed to capture audio: ${error.message}`);
        errorOccurred = true;
    });
    captureTest.on('close', (code) => {
        console.log(''); // New line after progress
        console.log('');
        if (errorOccurred || code !== 0) {
            printError('Audio capture test failed');
            printInfo('Troubleshooting:');
            printInfo('  • Ensure BlackHole is installed');
            printInfo('  • Check that Multi-Output Device is configured');
            printInfo('  • Verify System Sound output is set to Multi-Output Device');
            process.exit(1);
        }
        // Parse audio levels
        const meanVolumeMatch = audioData.match(/mean_volume:\s*([-\d.]+)\s*dB/);
        const maxVolumeMatch = audioData.match(/max_volume:\s*([-\d.]+)\s*dB/);
        if (meanVolumeMatch && maxVolumeMatch) {
            const meanVolume = parseFloat(meanVolumeMatch[1]);
            const maxVolume = parseFloat(maxVolumeMatch[1]);
            printInfo('Audio level analysis:');
            console.log(`  Mean volume: ${meanVolume.toFixed(2)} dB`);
            console.log(`  Max volume:  ${maxVolume.toFixed(2)} dB`);
            console.log('');
            if (meanVolume < -50 || maxVolume < -50) {
                printWarning('Audio levels are very low or silent');
                printInfo('Possible issues:');
                printInfo('  • No audio is playing');
                printInfo('  • Multi-Output Device not set as system output');
                printInfo('  • BlackHole not included in Multi-Output Device');
                console.log('');
                printInfo('To fix:');
                printInfo('  1. Go to System Settings > Sound > Output');
                printInfo('  2. Select "Multi-Output Device"');
                printInfo('  3. Play some audio and run this test again');
            }
            else {
                printSuccess('Audio capture is working correctly! 🎉');
                console.log('');
                printInfo('Your setup is complete and working! You can now:');
                printInfo('  • Standalone CLI: npx audio-transcription-mcp start');
                printInfo('  • Claude Desktop: Ask Claude to "start transcription"');
                printInfo('  • Cursor: Use MCP tools in chat');
                console.log('');
            }
        }
        else {
            printSuccess('Audio capture test completed');
            printInfo('Unable to determine audio levels, but capture appears to be working');
        }
    });
}
// Run test
testAudioCapture().catch((error) => {
    printError(`Test failed: ${error.message}`);
    process.exit(1);
});
//# sourceMappingURL=test-audio-cli.js.map