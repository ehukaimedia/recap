#!/usr/bin/env node
/**
 * RecapMCP - Entry Point
 * Professional MCP server for intelligent DesktopCommanderMCP activity analysis
 * 
 * @author ehukaimedia
 * @version 1.0.0
 * @license MIT
 */

import { FilteredStdioServerTransport } from './custom-stdio.js';
import { server } from './server.js';

// =============================================================================
// Application Metadata
// =============================================================================

const APP_NAME = 'RecapMCP';
const APP_VERSION = '1.0.0';

// =============================================================================
// Server Initialization
// =============================================================================

async function runServer(): Promise<void> {
  try {
    console.error(`${APP_NAME}: Loading server...`);

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // If this is a JSON parsing error, log it to stderr but don't crash
      if (errorMessage.includes('JSON') && errorMessage.includes('Unexpected token')) {
        process.stderr.write(`[${APP_NAME}] JSON parsing error: ${errorMessage}\n`);
        return; // Don't exit on JSON parsing errors
      }

      process.stderr.write(`[${APP_NAME}] Uncaught exception: ${errorMessage}\n`);
      process.exit(1);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', async (reason) => {
      const errorMessage = reason instanceof Error ? reason.message : String(reason);

      // If this is a JSON parsing error, log it to stderr but don't crash
      if (errorMessage.includes('JSON') && errorMessage.includes('Unexpected token')) {
        process.stderr.write(`[${APP_NAME}] JSON parsing rejection: ${errorMessage}\n`);
        return; // Don't exit on JSON parsing errors
      }

      process.stderr.write(`[${APP_NAME}] Unhandled rejection: ${errorMessage}\n`);
      process.exit(1);
    });

    console.error(`${APP_NAME}: Creating transport...`);
    
    // Create filtered stdio transport for Claude Desktop communication
    const transport = new FilteredStdioServerTransport();
    
    console.error(`${APP_NAME}: Connecting server...`);
    
    // Connect server to transport
    await server.connect(transport);
    
    console.error(`${APP_NAME}: Server connected successfully`);
    
    // Keep the process alive
    process.stdin.resume();
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${APP_NAME}: FATAL ERROR: ${errorMessage}`);
    console.error(error instanceof Error && error.stack ? error.stack : 'No stack trace available');
    process.stderr.write(JSON.stringify({
      type: 'error',
      timestamp: new Date().toISOString(),
      message: `Failed to start server: ${errorMessage}`
    }) + '\n');
    process.exit(1);
  }
}

// =============================================================================
// Graceful Shutdown
// =============================================================================

let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.error(`${APP_NAME}: Received ${signal}, shutting down gracefully...`);
  
  try {
    // Give any pending operations a chance to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    console.error(`${APP_NAME}: Server shutdown complete`);
    process.exit(0);
  } catch (error) {
    console.error(`${APP_NAME}: Error during graceful shutdown:`, error);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// =============================================================================
// Application Entry Point
// =============================================================================

// Check if this module is being run directly
const isMainModule = process.argv[1] && process.argv[1].endsWith('index.js');

if (isMainModule) {
  runServer().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${APP_NAME}: RUNTIME ERROR: ${errorMessage}`);
    console.error(error instanceof Error && error.stack ? error.stack : 'No stack trace available');
    process.stderr.write(JSON.stringify({
      type: 'error',
      timestamp: new Date().toISOString(),
      message: `Fatal error running server: ${errorMessage}`
    }) + '\n');
    process.exit(1);
  });
}

// =============================================================================
// Exports for testing
// =============================================================================

export { server, runServer };
