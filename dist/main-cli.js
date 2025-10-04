#!/usr/bin/env node
/**
 * Main CLI entry point - routes to different commands
 */
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const command = process.argv[2];
// Route to appropriate CLI based on command
switch (command) {
    case 'setup':
        // Run setup wizard
        const setupPath = join(__dirname, 'setup-cli.js');
        spawn('node', [setupPath], { stdio: 'inherit' });
        break;
    case 'test':
        // Run audio test
        const testPath = join(__dirname, 'test-audio-cli.js');
        spawn('node', [testPath], { stdio: 'inherit' });
        break;
    case 'start':
        // Run standalone CLI
        const cliPath = join(__dirname, 'cli.js');
        spawn('node', [cliPath], { stdio: 'inherit' });
        break;
    default:
        // No command or unknown command - run MCP server (default behavior)
        if (command && command !== 'mcp') {
            console.error(`Unknown command: ${command}`);
            console.error('');
            console.error('Available commands:');
            console.error('  npx audio-transcription-mcp setup  - Run automated setup wizard');
            console.error('  npx audio-transcription-mcp test   - Test audio capture');
            console.error('  npx audio-transcription-mcp start  - Start standalone CLI');
            console.error('  npx audio-transcription-mcp        - Run MCP server (default)');
            process.exit(1);
        }
        // Run MCP server (default)
        const mcpPath = join(__dirname, 'mcp-server.js');
        spawn('node', [mcpPath], { stdio: 'inherit' });
        break;
}
//# sourceMappingURL=main-cli.js.map