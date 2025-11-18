# Voice CLI Quick Start Guide

Get up and running with the Voice CLI MVP in 5 minutes.

## 1. Prerequisites

- **Node.js** 18+ OR **Bun** (recommended)
- **OpenAI API Key** (with access to GPT-4 and/or Realtime API)

## 2. Installation

```bash
# Clone or navigate to the project
cd rube

# Install dependencies
bun install  # or: npm install

# Create .env file with your API key
cp .env.example .env
# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-your-key-here
```

## 3. Run Interactive Mode

```bash
bun src/cli/voice-cli.ts -i
```

Then type commands like:
- "Send an email to john@example.com"
- "Create a calendar event for tomorrow at 10am"
- "Send a Slack message to #general"
- "Create a GitHub issue about feature request"
- "Add a note to Notion"

Type `exit` to quit.

## 4. Single Command

Process a single command without interactive mode:

```bash
echo "Send an email to test@example.com saying hello" | bun src/cli/voice-cli.ts
```

## 5. Check Available Tools

```bash
# Start the server in one terminal
bun src/cli/voice-cli.ts -i

# In another terminal, check available tools
curl http://localhost:3000/agent/tools | jq
```

## 6. Next Steps

- **Read Full Docs**: See `README.md` for comprehensive documentation
- **View Examples**: Check `EXAMPLES.md` for more usage patterns
- **Connect Rube**: Update `src/mcp/mcp-client.ts` to connect to actual Rube MCP server
- **Use Claude**: Integrate Claude with tool use for smarter requests
- **Add Real Audio**: Implement microphone input or connect to OpenAI Realtime API

## Troubleshooting

### "Cannot find module openai"
```bash
bun install
```

### "OPENAI_API_KEY not found"
```bash
export OPENAI_API_KEY=sk-your-key
# or add to .env file
```

### "Agent already running"
The CLI will try to reuse an existing agent server on port 3000. To start fresh:
```bash
# Kill any existing process
pkill -f "voice-cli"
```

### "Permission denied"
Make sure the script is executable:
```bash
chmod +x src/cli/voice-cli.ts
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Voice CLI (Terminal Interface)                     │
│  - Interactive mode                                 │
│  - Pipe input (echo/stdin)                         │
│  - File input                                       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Agent API Server (Port 3000)                       │
│  - /agent/run (process user input)                 │
│  - /agent/tools (list available tools)             │
│  - /health (server status)                         │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                              ▼
┌────────────────────────┐   ┌─────────────────────────┐
│  Voice Client           │   │  MCP Client (Rube)      │
│  - Speech-to-text       │   │  - Email (Gmail)        │
│  - Text-to-speech       │   │  - Calendar             │
│  - Audio I/O            │   │  - Slack                │
│  (OpenAI Whisper + TTS) │   │  - GitHub               │
└────────────────────────┘   │  - Notion               │
                             └─────────────────────────┘
```

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (defaults shown)
AGENT_API_HOST=localhost
AGENT_API_PORT=3000
```

## Commands Reference

```bash
# Show help
bun src/cli/voice-cli.ts -h

# Interactive mode
bun src/cli/voice-cli.ts -i

# Single command
echo "Your command" | bun src/cli/voice-cli.ts

# Process file
bun src/cli/voice-cli.ts file.txt

# Custom agent host/port
bun src/cli/voice-cli.ts --host=0.0.0.0 --port=5000 -i

# Build TypeScript
bun run build

# Run compiled version
node dist/src/cli/voice-cli.js
```

## Example Session

```bash
$ bun src/cli/voice-cli.ts -i

🎤 Voice CLI - Interactive Mode
Type your voice commands (type "exit" to quit)

You: Send an email to alice@company.com about the meeting
Assistant: I'll help you send an email. Based on your request: "Send an email to alice@company.com about the meeting", I'll execute the send_email tool.

You: Create a calendar event for next week
Assistant: I'll help you create a calendar event. Based on your request: "Create a calendar event for next week", I'll execute the create_calendar_event tool.

You: exit
Goodbye!
```

## What's Next?

The MVP provides a solid foundation for:

1. **Real-time voice**: Connect to OpenAI Realtime API for bidirectional audio streaming
2. **Smarter agent**: Integrate Claude with function calling for complex requests
3. **Rube integration**: Connect to actual Rube MCP server for real integrations
4. **Persistence**: Add conversation history and user context
5. **Production**: Deploy as a service with proper auth and monitoring

See `README.md` for detailed architecture and development guide.
