import 'dotenv/config';
import VoiceCLI from './src/cli/voice-cli';

// Export main components for use as library
export { default as RealtimeVoiceClient } from './src/voice/realtime-client';
export { default as AgentServer } from './src/agent/agent-server';
export { default as MCPClient } from './src/mcp/mcp-client';
export { VoiceCLI };

// Re-export types
export type { VoiceInput, VoiceOutput } from './src/voice/realtime-client';
export type { AgentRequest, AgentResponse } from './src/agent/agent-server';
export type { MCPTool, ToolResult } from './src/mcp/mcp-client';