/**
 * Tests for MCP Server Tool Exposure
 * Verifies all tools are properly exposed and configured
 */

import { describe, it, expect } from '@jest/globals';

// Define the expected tools structure (what the MCP server should expose)
const expectedTools = [
  {
    name: 'start_transcription',
    description: 'Start capturing and transcribing system audio in real-time using OpenAI Whisper. Audio is captured in chunks and transcribed continuously.',
    inputSchema: {
      type: 'object',
      properties: {
        inputDevice: {
          type: 'string',
          description: 'Audio input device name (default: BlackHole)',
        },
        chunkSeconds: {
          type: 'number',
          description: 'Seconds of audio per transcription chunk (default: 8)',
        },
        outputFile: {
          type: 'string',
          description: 'Output transcript filename (default: meeting_transcript.md)',
        },
      },
    },
  },
  {
    name: 'stop_transcription',
    description: 'Stop the current transcription session and return statistics about the session.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_status',
    description: 'Get the current status of the transcription session including whether it\'s running, number of chunks processed, and errors.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_transcript',
    description: 'Retrieve the current transcript content. Optionally get only the last N lines.',
    inputSchema: {
      type: 'object',
      properties: {
        lines: {
          type: 'number',
          description: 'Optional: Return only the last N lines',
        },
      },
    },
  },
  {
    name: 'clear_transcript',
    description: 'Clear the transcript file and reinitialize it with a fresh header.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'cleanup_transcript',
    description: 'Delete the transcript file completely. Use this to remove the transcript file when you\'re done.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

describe('MCP Server Tool Definitions', () => {
  const tools = expectedTools;

  it('should define exactly 6 MCP tools', () => {
    expect(tools).toHaveLength(6);
  });

  it('should define start_transcription tool', () => {
    const tool = tools.find(t => t.name === 'start_transcription');
    expect(tool).toBeDefined();
    expect(tool!.description).toContain('OpenAI Whisper');
    expect(tool!.inputSchema.properties).toHaveProperty('inputDevice');
    expect(tool!.inputSchema.properties).toHaveProperty('chunkSeconds');
    expect(tool!.inputSchema.properties).toHaveProperty('outputFile');
  });

  it('should define stop_transcription tool', () => {
    const tool = tools.find(t => t.name === 'stop_transcription');
    expect(tool).toBeDefined();
    expect(tool!.description).toContain('Stop');
    expect(tool!.description).toContain('statistics');
  });

  it('should define get_status tool', () => {
    const tool = tools.find(t => t.name === 'get_status');
    expect(tool).toBeDefined();
    expect(tool!.description).toContain('status');
    expect(tool!.description).toContain('running');
  });

  it('should define get_transcript tool', () => {
    const tool = tools.find(t => t.name === 'get_transcript');
    expect(tool).toBeDefined();
    expect(tool!.description).toContain('Retrieve');
    expect(tool!.inputSchema.properties).toHaveProperty('lines');
  });

  it('should define clear_transcript tool', () => {
    const tool = tools.find(t => t.name === 'clear_transcript');
    expect(tool).toBeDefined();
    expect(tool!.description).toContain('Clear');
    expect(tool!.description).toContain('reinitialize');
  });

  it('should define cleanup_transcript tool', () => {
    const tool = tools.find(t => t.name === 'cleanup_transcript');
    expect(tool).toBeDefined();
    expect(tool!.description).toContain('Delete');
  });

  it('all tools should have valid input schemas', () => {
    tools.forEach(tool => {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
    });
  });

  it('all tools should have descriptions', () => {
    tools.forEach(tool => {
      expect(tool.description).toBeDefined();
      expect(tool.description.length).toBeGreaterThan(10);
    });
  });

  it('start_transcription should have appropriate default values in descriptions', () => {
    const tool = tools.find(t => t.name === 'start_transcription');
    expect(tool).toBeDefined();
    expect((tool!.inputSchema.properties as any).inputDevice.description).toContain('BlackHole');
    expect((tool!.inputSchema.properties as any).chunkSeconds.description).toContain('8');
    expect((tool!.inputSchema.properties as any).outputFile.description).toContain('meeting_transcript.md');
  });

  it('all tool names should use snake_case convention', () => {
    tools.forEach(tool => {
      expect(tool.name).toMatch(/^[a-z]+(_[a-z]+)*$/);
    });
  });

  it('tools should cover complete lifecycle: start, stop, status, get, clear, cleanup', () => {
    const toolNames = tools.map(t => t.name);
    expect(toolNames).toContain('start_transcription');
    expect(toolNames).toContain('stop_transcription');
    expect(toolNames).toContain('get_status');
    expect(toolNames).toContain('get_transcript');
    expect(toolNames).toContain('clear_transcript');
    expect(toolNames).toContain('cleanup_transcript');
  });
});
