import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import process from "node:process";

/**
 * Extended StdioServerTransport that filters out non-JSON messages.
 * This prevents JSON parsing errors from crashing the server.
 */
export class FilteredStdioServerTransport extends StdioServerTransport {
  constructor() {
    // Create a proxy for stdout that only allows valid JSON to pass through
    const originalStdoutWrite = process.stdout.write;
    process.stdout.write = function(buffer: any) {
      // Only intercept string output that doesn't look like JSON
      if (typeof buffer === 'string' && !buffer.trim().startsWith('{')) {
        return true; // Filter out non-JSON messages
      }
      return originalStdoutWrite.apply(process.stdout, arguments as any);
    };

    super();
    
    // Log initialization to stderr to avoid polluting the JSON stream
    process.stderr.write(`[recap-mcp] Initialized FilteredStdioServerTransport\n`);
  }
}
