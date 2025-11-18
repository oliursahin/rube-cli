#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import RealtimeVoiceClient from '../voice/realtime-client';
import AgentServer from '../agent/agent-server';

interface CliOptions {
  apiKey: string;
  agentUrl: string;
  agentPort: number;
  agentHost: string;
  interactive: boolean;
  audioFile?: string;
}

class VoiceCLI {
  private options: CliOptions;
  private voiceClient: RealtimeVoiceClient;
  private agentServer?: AgentServer;
  private agentHttpClient: AxiosInstance;

  constructor(options: CliOptions) {
    this.options = options;
    this.voiceClient = new RealtimeVoiceClient(options.apiKey);
    this.agentHttpClient = axios.create({
      baseURL: options.agentUrl,
      timeout: 30000,
    });
  }

  /**
   * Start the agent server if not already running
   */
  async ensureAgentServer(): Promise<void> {
    // Check if agent is already running
    try {
      await this.agentHttpClient.get('/health');
      console.log('Agent server is already running');
      return;
    } catch (error) {
      // Server not running, start it
      console.log('Starting local agent server...');
      this.agentServer = new AgentServer(
        this.options.apiKey,
        this.options.agentPort,
        this.options.agentHost
      );
      await this.agentServer.start();
    }
  }

  /**
   * Process a single voice command
   */
  async processVoiceCommand(input: string): Promise<string> {
    try {
      const response = await this.agentHttpClient.post('/agent/run', {
        userInput: input,
        context: {
          source: 'voice-cli',
          timestamp: new Date().toISOString(),
        },
      });

      return response.data.response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing command: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Interactive mode - read voice commands from stdin and respond
   */
  async interactiveMode(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log('\n🎤 Voice CLI - Interactive Mode');
    console.log('Type your voice commands (type "exit" to quit)\n');

    const askQuestion = (): void => {
      rl.question('You: ', async (input) => {
        if (input.toLowerCase() === 'exit') {
          console.log('Goodbye!');
          rl.close();
          return;
        }

        if (!input.trim()) {
          askQuestion();
          return;
        }

        try {
          const response = await this.processVoiceCommand(input);
          console.log(`\nAssistant: ${response}\n`);
        } catch (error) {
          console.error('Error processing command');
        }

        askQuestion();
      });
    };

    askQuestion();
  }

  /**
   * File mode - process audio file
   */
  async fileMode(audioPath: string): Promise<void> {
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    console.log(`Processing audio file: ${audioPath}`);

    // For MVP, we'll accept text input in file mode too
    // In production, this would use actual audio processing
    const content = fs.readFileSync(audioPath, 'utf-8');
    const response = await this.processVoiceCommand(content);

    console.log(`Response: ${response}`);

    // Optionally generate response audio
    if (response) {
      const outputPath = path.join(
        path.dirname(audioPath),
        `response_${Date.now()}.mp3`
      );
      const audioData = await this.voiceClient.generateSpeech(response, outputPath);
      console.log(`Generated response audio: ${outputPath}`);
    }
  }

  /**
   * Single command mode
   */
  async singleCommandMode(input: string): Promise<void> {
    console.log(`Processing: "${input}"`);
    const response = await this.processVoiceCommand(input);
    console.log(`Response: ${response}`);
  }

  /**
   * Run the CLI
   */
  async run(): Promise<void> {
    try {
      // Start agent server
      await this.ensureAgentServer();

      // Determine mode based on options
      if (this.options.audioFile) {
        await this.fileMode(this.options.audioFile);
      } else if (this.options.interactive) {
        await this.interactiveMode();
      } else {
        // Default: read from stdin for single line
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        rl.question('Enter your command: ', async (input) => {
          rl.close();
          await this.singleCommandMode(input);
        });
      }
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.agentServer) {
      await this.agentServer.stop();
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  const apiKey =
    process.env.OPENAI_API_KEY ||
    args.find(arg => arg.startsWith('--api-key='))?.split('=')[1] ||
    '';

  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable or --api-key argument required');
    process.exit(1);
  }

  const agentPort = parseInt(
    process.env.AGENT_API_PORT ||
    args.find(arg => arg.startsWith('--port='))?.split('=')[1] ||
    '3000'
  );

  const agentHost =
    process.env.AGENT_API_HOST ||
    args.find(arg => arg.startsWith('--host='))?.split('=')[1] ||
    'localhost';

  const agentUrl = `http://${agentHost}:${agentPort}`;

  const interactive = args.includes('-i') || args.includes('--interactive');
  const audioFile = args.find(arg => arg.endsWith('.wav') || arg.endsWith('.webm') || arg.endsWith('.txt'));

  return {
    apiKey,
    agentUrl,
    agentPort,
    agentHost,
    interactive,
    audioFile,
  };
}

/**
 * Print help
 */
function printHelp(): void {
  console.log(`
Voice CLI - OpenAI Realtime + Agent + Rube Integration

Usage: voice-cli [OPTIONS] [AUDIO_FILE]

Options:
  -i, --interactive        Start in interactive mode
  --api-key=KEY           OpenAI API key (or set OPENAI_API_KEY env var)
  --host=HOST             Agent API host (default: localhost)
  --port=PORT             Agent API port (default: 3000)
  -h, --help              Show this help message

Examples:
  # Interactive mode
  voice-cli -i

  # Process audio file
  voice-cli audio.webm

  # Single command
  echo "Send an email" | voice-cli

Environment Variables:
  OPENAI_API_KEY          OpenAI API key (required)
  AGENT_API_HOST          Agent API host (default: localhost)
  AGENT_API_PORT          Agent API port (default: 3000)

For more information, see: https://docs.rube.app/
  `);
}

// Main entry point
const args = process.argv.slice(2);

if (args.includes('-h') || args.includes('--help')) {
  printHelp();
  process.exit(0);
}

const options = parseArgs();
const cli = new VoiceCLI(options);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await cli.cleanup();
  process.exit(0);
});

cli.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export default VoiceCLI;
