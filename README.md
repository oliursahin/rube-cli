# Voice CLI MVP — OpenAI Realtime + Agent + Rube

A terminal-based voice interface that combines:
- **OpenAI Realtime API** for streaming speech recognition and text-to-speech
- **Local Agent API** for intelligent request processing
- **Rube MCP** for executing real-world actions (Gmail, Calendar, Slack, Notion, GitHub, etc.)

## Quick Start

### Prerequisites
- Node.js 18+ or [Bun](https://bun.sh)
- OpenAI API key with access to the Realtime API
- Account for any Rube integrations you want to use (Gmail, Slack, etc.)

### Installation

```bash
# Install dependencies
bun install

# Copy environment template and add your API key
cp .env.example .env
# Edit .env and add OPENAI_API_KEY
```

### Usage

#### Interactive Mode
Start the CLI in interactive mode to chat:
```bash
bun run src/cli/voice-cli.ts -i
```

#### Single Command
Run a single voice command:
```bash
echo "Send an email to john@example.com saying hello" | bun run src/cli/voice-cli.ts
```

#### Process Audio File
Process a voice recording or text file:
```bash
bun run src/cli/voice-cli.ts audio.webm
```

#### Command Options
```bash
bun run src/cli/voice-cli.ts --help

Options:
  -i, --interactive        Start in interactive mode
  --api-key=KEY           OpenAI API key (or set OPENAI_API_KEY env var)
  --host=HOST             Agent API host (default: localhost)
  --port=PORT             Agent API port (default: 3000)
  -h, --help              Show this help message
```

## Architecture

### Components

#### 1. Voice Integration (`src/voice/realtime-client.ts`)
- Speech-to-text using OpenAI Whisper
- Text-to-speech using OpenAI TTS
- Streaming audio input/output handling
- Future: Real-time bidirectional streaming via Realtime API

#### 2. Agent API Server (`src/agent/agent-server.ts`)
- REST API server on localhost:3000
- `/agent/run` endpoint for processing user requests
- Claude integration for intelligent reasoning
- Tool use capability for real-world actions
- `/agent/tools` endpoint to list available integrations
- `/health` endpoint for server status

#### 3. MCP Client (`src/mcp/mcp-client.ts`)
- Model Context Protocol client for Rube integration
- Available tools:
  - `send_email` - Gmail integration
  - `create_calendar_event` - Google Calendar
  - `send_slack_message` - Slack messaging
  - `create_github_issue` - GitHub integration
  - `create_notion_page` - Notion database entries
- Tool execution via Rube servers

#### 4. CLI Entry Point (`src/cli/voice-cli.ts`)
- Command-line interface for voice interaction
- Multiple input modes: interactive, single command, audio file
- Automatic agent server startup
- Graceful shutdown handling

## Project Structure

```
rube/
├── src/
│   ├── voice/
│   │   └── realtime-client.ts       # OpenAI Realtime API integration
│   ├── agent/
│   │   └── agent-server.ts          # Agent API server with Claude
│   ├── mcp/
│   │   └── mcp-client.ts            # MCP protocol client for Rube
│   └── cli/
│       └── voice-cli.ts             # CLI entry point
├── index.ts                          # Main export file
├── package.json                      # Dependencies and scripts
├── .env.example                      # Environment template
└── README.md                         # This file
```

## Development

### Build TypeScript
```bash
bun run build
```

### Run with TypeScript directly
```bash
bun run src/cli/voice-cli.ts -i
```

### Development mode with hot reload
```bash
bun run dev:interactive
```

## Environment Variables

```
OPENAI_API_KEY          # Your OpenAI API key (required)
AGENT_API_HOST          # Agent server host (default: localhost)
AGENT_API_PORT          # Agent server port (default: 3000)
```

## API Reference

### Agent Endpoint: `POST /agent/run`

Request:
```json
{
  "userInput": "Send an email to john@example.com",
  "context": {
    "userId": "user123",
    "customData": "value"
  },
  "tools": ["send_email"]
}
```

Response:
```json
{
  "response": "I'll send that email for you now.",
  "context": {
    "timestamp": "2024-11-18T15:30:00Z"
  },
  "toolsUsed": ["send_email"]
}
```

### Tools Endpoint: `GET /agent/tools`

Returns list of available tools with descriptions and input schemas.

## Rube Integration

This project is designed to integrate with **Rube** for executing real-world actions.

Resources:
- [Rube GitHub](https://github.com/ComposioHQ/Rube)
- [Rube Documentation](https://docs.rube.app/)
- [MCP Protocol Spec](https://modelcontextprotocol.io/)
- [Composio Integrations](https://composio.dev/)

### Next Steps for Rube Integration

1. **Connect to Rube MCP Server**: Update `MCPClient.connectToRube()` to establish actual protocol connection
2. **Tool Discovery**: Implement dynamic tool discovery from Rube server
3. **Authentication**: Add OAuth/API key handling for each integration
4. **Error Handling**: Implement robust error handling for failed tool executions
5. **Rate Limiting**: Add rate limit management for API calls

## Example Workflows

### Send Email
```bash
$ bun run src/cli/voice-cli.ts -i
You: Send an email to alice@company.com with subject "Meeting Tomorrow" and message "Hi Alice, let's meet at 3pm"
Assistant: I'll send that email for you now. Email sent to alice@company.com with subject "Meeting Tomorrow"
```

### Create Calendar Event
```bash
You: Create a meeting called "Sprint Planning" tomorrow at 10am for 2 hours
Assistant: I'll create that calendar event for you. Calendar event "Sprint Planning" created for 2024-11-19T10:00:00Z
```

### GitHub Issue
```bash
You: Create a GitHub issue in the repo anthropics/claude-code with title "Add voice support" and body "We should add voice command support to Claude Code"
Assistant: I'll create that GitHub issue for you. GitHub issue created: Add voice support
```

## Limitations & TODOs

- [ ] Real-time bidirectional streaming via OpenAI Realtime API (currently uses Whisper + TTS)
- [ ] Actual Rube MCP server connection (currently mocked)
- [ ] Audio input from system microphone (currently file/text based)
- [ ] Persistent conversation context
- [ ] Tool call result handling in Claude prompts
- [ ] Authentication for external services
- [ ] Error recovery and retry logic
- [ ] Comprehensive logging and monitoring

## Contributing

Feel free to open issues and pull requests to improve the Voice CLI.

## License

MIT
