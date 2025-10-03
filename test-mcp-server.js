// Test if the MCP server can write to the transcript directory
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const OUTFILE_DIR = process.env.OUTFILE_DIR || process.cwd();
const testFile = join(OUTFILE_DIR, 'test_transcript.md');

console.log('=== MCP Server Debug Info ===');
console.log('OUTFILE_DIR:', OUTFILE_DIR);
console.log('Test file path:', testFile);
console.log('Current working directory:', process.cwd());
console.log('Environment variables:');
console.log('  OUTFILE_DIR:', process.env.OUTFILE_DIR);
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Not set');

console.log('\n=== Testing file write ===');
try {
  writeFileSync(testFile, '# Test Transcript\n\nThis is a test.\n');
  console.log('✓ Successfully wrote file:', testFile);
  
  if (existsSync(testFile)) {
    console.log('✓ File exists and is readable');
    const content = readFileSync(testFile, 'utf-8');
    console.log('✓ File content:', content.substring(0, 50));
  }
} catch (error) {
  console.error('✗ Error writing file:', error.message);
  console.error('Error code:', error.code);
  console.error('Error stack:', error.stack);
}
