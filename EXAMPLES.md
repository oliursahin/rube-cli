# Voice CLI Usage Examples

This document shows practical examples of using the Voice CLI MVP.

## Setup

First, make sure you have your OpenAI API key configured:

```bash
# Create .env file with your API key
echo "OPENAI_API_KEY=sk-..." > .env

# Or set environment variable
export OPENAI_API_KEY=sk-...
```

## Example 1: Interactive Mode

Start an interactive voice session:

```bash
$ bun src/cli/voice-cli.ts -i

🎤 Voice CLI - Interactive Mode
Type your voice commands (type "exit" to quit)

You: Send an email to alice@example.com with subject "Meeting Tomorrow" and message "Let's meet at 3pm"
Assistant: I'll help you send an email. Based on your request: "Send an email to alice@example.com with subject "Meeting Tomorrow" and message "Let's meet at 3pm"", I'll execute the send_email tool.

You: Create a calendar event for "Team Standup" tomorrow at 10am
Assistant: I'll help you create a calendar event. Based on your request: "Create a calendar event for "Team Standup" tomorrow at 10am", I'll execute the create_calendar_event tool.

You: exit
Goodbye!
```

## Example 2: Single Command via Pipe

Process a single voice command:

```bash
$ echo "Create a GitHub issue in anthropics/claude-code about voice support" | bun src/cli/voice-cli.ts

Processing: "Create a GitHub issue in anthropics/claude-code about voice support"
Executing tool: create_github_issue
Response: I'll help you create a GitHub issue. Based on your request: "Create a GitHub issue in anthropics/claude-code about voice support", I'll execute the create_github_issue tool.
```

## Example 3: Process Audio File

Process a voice recording (or text file):

```bash
$ bun src/cli/voice-cli.ts audio.webm

Processing audio file: audio.webm
Response: ...
Generated response audio: response_1234567890.mp3
```

## Example 4: Using with Custom Agent Host/Port

Run the agent server on a different port:

```bash
$ bun src/cli/voice-cli.ts --host=0.0.0.0 --port=5000 -i

Agent API server running on http://0.0.0.0:5000
```

## Example 5: API Usage

You can also use the Voice CLI as a library in your own code:

```typescript
import { VoiceCLI } from './index';

const cli = new VoiceCLI({
  apiKey: process.env.OPENAI_API_KEY!,
  agentUrl: 'http://localhost:3000',
  agentPort: 3000,
  agentHost: 'localhost',
  interactive: false,
});

await cli.run();
```

## Example 6: Directly Using Agent Server

Start the agent server separately:

```bash
# Terminal 1: Start agent server
import { AgentServer } from './index';

const server = new AgentServer(process.env.OPENAI_API_KEY!, 3000);
await server.start();
```

Then send requests to it:

```bash
# Terminal 2: Send requests via curl
curl -X POST http://localhost:3000/agent/run \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Send an email to test@example.com",
    "context": {},
    "tools": ["send_email"]
  }'
```

## Example 7: List Available Tools

Check what tools are available:

```bash
$ curl http://localhost:3000/agent/tools | jq .

{
  "tools": [
    {
      "name": "send_email",
      "description": "Send an email via Gmail",
      ...
    },
    {
      "name": "create_calendar_event",
      "description": "Create an event in Google Calendar",
      ...
    },
    ...
  ]
}
```

## Example 8: Voice with Different Input Modes

The CLI supports multiple input modes:

### Mode 1: Interactive (human types)
```bash
bun src/cli/voice-cli.ts -i
```

### Mode 2: Piped input (Unix pipes)
```bash
echo "Your voice command" | bun src/cli/voice-cli.ts
```

### Mode 3: File input
```bash
bun src/cli/voice-cli.ts command.txt
```

## Supported Commands

The MVP recognizes keywords in user input to trigger specific tools:

- **Email**: "email", "send", "message" → `send_email`
- **Calendar**: "calendar", "meeting", "event", "schedule" → `create_calendar_event`
- **Slack**: "slack" → `send_slack_message`
- **GitHub**: "github", "issue", "pull request" → `create_github_issue`
- **Notion**: "notion", "note", "page" → `create_notion_page`

## Next Steps

Once the Agent supports Claude with tool use:

1. The CLI will use more sophisticated natural language understanding
2. Claude will be able to handle complex, multi-step requests
3. Tool results will be fed back to Claude for follow-up reasoning
4. Rube integrations will work with real authentication

For now, the MVP uses simple keyword matching for demonstration.
