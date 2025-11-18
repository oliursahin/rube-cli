import type { Request, Response, Express } from 'express';
import express from 'express';
import { OpenAI } from 'openai';
import { MCPClient } from '../mcp/mcp-client';

export interface AgentRequest {
  userInput: string;
  context?: Record<string, unknown>;
  tools?: string[];
}

export interface AgentResponse {
  response: string;
  context?: Record<string, unknown>;
  toolsUsed?: string[];
}

export class AgentServer {
  private app: Express;
  private openai: OpenAI;
  private mcpClient: MCPClient;
  private port: number;
  private host: string;

  constructor(apiKey: string, port: number = 3000, host: string = 'localhost') {
    this.app = express();
    this.openai = new OpenAI({ apiKey });
    this.mcpClient = new MCPClient();
    this.port = port;
    this.host = host;

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    /**
     * Main agent endpoint for processing user input
     * POST /agent/run
     */
    this.app.post('/agent/run', async (req: Request, res: Response) => {
      try {
        const { userInput, context = {}, tools = [] } = req.body as AgentRequest;

        if (!userInput) {
          res.status(400).json({ error: 'userInput is required' });
          return;
        }

        const response = await this.processUserInput(userInput, context, tools);
        res.json(response);
      } catch (error) {
        console.error('Agent error:', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    });

    /**
     * Health check endpoint
     */
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    /**
     * List available tools/integrations
     */
    this.app.get('/agent/tools', (req: Request, res: Response) => {
      const availableTools = this.mcpClient.getAvailableTools();
      res.json({ tools: availableTools });
    });
  }

  /**
   * Process user input through the agent
   * 1. Create system prompt with available tools
   * 2. Send to Claude for reasoning
   * 3. Execute any required tool calls via MCP
   * 4. Return response to user
   */
  private async processUserInput(
    userInput: string,
    context: Record<string, unknown>,
    requestedTools: string[]
  ): Promise<AgentResponse> {
    // Get available MCP tools
    const availableTools = this.mcpClient.getAvailableTools();
    const toolsToUse = requestedTools.length > 0
      ? availableTools.filter(t => requestedTools.includes(t.name))
      : availableTools;

    // Create system prompt with tool descriptions
    const systemPrompt = this.createSystemPrompt(toolsToUse, context);

    // Create messages for Claude
    const messages = [
      {
        role: 'user' as const,
        content: userInput,
      },
    ];

    // For MVP, use a simple text completion approach
    // In production, this would use Claude with proper tool use
    let finalResponse = `Processing request: "${userInput}"`;
    const toolsUsed: string[] = [];

    // Simple heuristic tool detection
    if (userInput.toLowerCase().includes('email')) {
      toolsUsed.push('send_email');
      finalResponse = `I'll help you send an email. Based on your request: "${userInput}", I'll execute the send_email tool.`;
    } else if (userInput.toLowerCase().includes('calendar') || userInput.toLowerCase().includes('meeting')) {
      toolsUsed.push('create_calendar_event');
      finalResponse = `I'll help you create a calendar event. Based on your request: "${userInput}", I'll execute the create_calendar_event tool.`;
    } else if (userInput.toLowerCase().includes('slack')) {
      toolsUsed.push('send_slack_message');
      finalResponse = `I'll help you send a Slack message. Based on your request: "${userInput}", I'll execute the send_slack_message tool.`;
    } else if (userInput.toLowerCase().includes('github')) {
      toolsUsed.push('create_github_issue');
      finalResponse = `I'll help you create a GitHub issue. Based on your request: "${userInput}", I'll execute the create_github_issue tool.`;
    } else if (userInput.toLowerCase().includes('notion')) {
      toolsUsed.push('create_notion_page');
      finalResponse = `I'll help you create a Notion page. Based on your request: "${userInput}", I'll execute the create_notion_page tool.`;
    } else {
      finalResponse = `I understood your request: "${userInput}". How can I help you with that?`;
    }

    // Execute tools if any were identified
    for (const toolName of toolsUsed) {
      const toolResult = await this.mcpClient.executeTool(toolName, { request: userInput });
      console.log(`Executed tool ${toolName}:`, toolResult);
    }

    return {
      response: finalResponse || 'No response generated',
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      },
      toolsUsed,
    };
  }

  private createSystemPrompt(
    tools: Array<{ name: string; description: string }>,
    context: Record<string, unknown>
  ): string {
    let prompt = `You are a helpful voice assistant that can perform various actions.

Context:
${JSON.stringify(context, null, 2)}

Available Tools:
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Instructions:
1. Listen carefully to what the user is asking
2. Use the available tools to help complete their request
3. Provide clear, concise responses
4. Always confirm actions before executing them if they have side effects
`;
    return prompt;
  }

  /**
   * Start the agent server
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, this.host, () => {
        console.log(`Agent API server running on http://${this.host}:${this.port}`);
        console.log(`Health check: http://${this.host}:${this.port}/health`);
        console.log(`Available tools: http://${this.host}:${this.port}/agent/tools`);
        console.log(`Agent endpoint: POST http://${this.host}:${this.port}/agent/run`);
        resolve();
      });
    });
  }

  /**
   * Stop the agent server
   */
  async stop(): Promise<void> {
    // Implementation for graceful shutdown
  }
}

export default AgentServer;
