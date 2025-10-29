import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AEWebSocketServer } from "./websocket.js";

const server = new McpServer({
  name: "AfterEffectsServer",
  version: "1.0.0"
});

const wsServer = new AEWebSocketServer(3000);

// Helper to execute ExtendScript
async function executeInAE(jsx: string): Promise<string> {
  if (!wsServer.isConnected()) {
    throw new Error('After Effects not connected. Please ensure the AEMCP panel is open.');
  }
  
  return await wsServer.sendCommand('eval', { jsx });
}

// Tool 1: Run Script
server.tool(
  "run_script",
  "Execute ExtendScript code in After Effects",
  {
    jsx: z.string().describe("ExtendScript code to execute")
  },
  async ({ jsx }) => {
    try {
      const result = await executeInAE(jsx);
      // Convert result to string for display
      const resultText = result === undefined ? "undefined" : 
                        result === null ? "null" :
                        typeof result === "string" ? result :
                        JSON.stringify(result);
      return {
        content: [{
          type: "text",
          text: resultText
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Tool 6: Create Panel
server.tool(
  "create_panel",
  "Create a custom UI panel in After Effects",
  {
    html: z.string().describe("HTML content"),
    css: z.string().optional().describe("CSS styles"),
    js: z.string().optional().describe("JavaScript for interactions")
  },
  async ({ html, css, js }) => {
    try {
      await wsServer.sendCommand('renderCustomPanel', {
        html: html,
        css: css || "",
        js: js || ""
      });
      
      return {
        content: [{
          type: "text",
          text: "Custom panel created successfully!"
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Tool 7: Close Panel
server.tool(
  "close_panel",
  "Close the custom UI panel",
  {},
  async () => {
    try {
      await wsServer.sendCommand('closePanel');
      return {
        content: [{
          type: "text",
          text: "Custom panel closed"
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("After Effects MCP Server running...");
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});