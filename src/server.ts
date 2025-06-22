/**
 * RecapMCP Server - MCP Protocol Implementation
 * Professional server setup and tool registration for Claude Desktop integration
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { RecapArgsSchema, handleRecap } from './recap.js';

// =============================================================================
// MCP Server Configuration
// =============================================================================

export const server = new Server({
  name: "recap-mcp",
  version: "1.0.0",
}, {
  capabilities: { 
    tools: {},
    resources: {},  // Add empty resources capability
    prompts: {},    // Add empty prompts capability
  }
});

// =============================================================================
// Required MCP Handlers
// =============================================================================

// Add handler for resources/list method
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [],
  };
});

// Add handler for prompts/list method
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [],
  };
});

// =============================================================================
// Tool Registration
// =============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  try {
    console.error("RecapMCP: Generating tools list...");
    return {
      tools: [{
        name: "recap",
        description: "Generate intelligent contextual recap from DesktopCommanderMCP enhanced logs. Analyzes session patterns, workflow detection, and project context to provide meaningful productivity insights.",
        inputSchema: zodToJsonSchema(RecapArgsSchema),
      }]
    };
  } catch (error) {
    console.error("RecapMCP: Error in list_tools request handler:", error);
    throw error;
  }
});

// =============================================================================
// Tool Execution Handler
// =============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;
  
  try {
    console.error(`RecapMCP: Executing tool: ${name}`);
    
    if (name === "recap") {
      // Validate arguments using Zod schema with defaults
      const validatedArgs = RecapArgsSchema.parse(args || {});
      const result = await handleRecap(validatedArgs);
      
      console.error(`RecapMCP: Tool ${name} executed successfully`);
      
      // Return in the format expected by MCP SDK
      return {
        content: result.content,
        isError: result.isError
      };
    }
    
    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    // Handle validation and execution errors gracefully
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`RecapMCP: Error executing ${name}:`, errorMessage);
    
    return {
      content: [{
        type: "text" as const,
        text: `❌ Error executing ${name}: ${errorMessage}`
      }],
      isError: true
    };
  }
});

// =============================================================================
// Error Handling
// =============================================================================

server.onerror = (error) => {
  console.error("RecapMCP Server Error:", error);
};

// =============================================================================
// Graceful Shutdown
// =============================================================================

process.on('SIGINT', async () => {
  console.error('RecapMCP: Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('RecapMCP: Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});
