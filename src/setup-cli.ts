#!/usr/bin/env node
/**
 * Setup CLI for Audio Transcription MCP
 * Automates the audio routing configuration for macOS
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function printHeader(message: string) {
  console.log('');
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}${message}${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log('');
}

function printError(message: string) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function printSuccess(message: string) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function printInfo(message: string) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

async function runSetup() {
  printHeader('Audio Transcription MCP - Setup');

  // Check if running on macOS
  if (process.platform !== 'darwin') {
    printError('This setup is only supported on macOS');
    printInfo('For other platforms, please see the documentation for manual setup instructions');
    process.exit(1);
  }

  // Find the setup script
  const setupScriptPath = join(__dirname, '../setup-audio.sh');
  
  if (!existsSync(setupScriptPath)) {
    printError(`Setup script not found at: ${setupScriptPath}`);
    printInfo('Please reinstall the package or run the setup script manually');
    process.exit(1);
  }

  printInfo('Starting automated audio setup...');
  console.log('');

  // Run the shell script
  const setupProcess = spawn('bash', [setupScriptPath], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  setupProcess.on('error', (error) => {
    printError(`Failed to run setup script: ${error.message}`);
    process.exit(1);
  });

  setupProcess.on('close', (code) => {
    if (code === 0) {
      printSuccess('Setup process completed!');
    } else {
      printError(`Setup process exited with code ${code}`);
      process.exit(code || 1);
    }
  });
}

// Run setup
runSetup().catch((error) => {
  printError(`Setup failed: ${error.message}`);
  process.exit(1);
});

