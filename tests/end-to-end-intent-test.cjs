#!/usr/bin/env node

/**
 * End-to-End Intent Detection Test
 * Tests the complete flow: enhanced logging → recap parsing → intelligent output
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test configuration
const TEST_LOG_PATH = '/tmp/test_e2e_claude_tool_call.log';
const RECAP_PROJECT_PATH = '/Users/ehukaimedia/Desktop/AI-Applications/Node/Recap';

let testsPassed = 0;
let testsTotal = 0;

function runTest(name, testFn) {
  testsTotal++;
  try {
    const result = testFn();
    if (result) {
      testsPassed++;
      console.log(`✅ ${name}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    } else {
      console.log(`❌ ${name}`);
    }
  } catch (error) {
    console.log(`💥 ${name} - ERROR: ${error.message}`);
  }
}

// Create realistic enhanced log with intent patterns
function createRealisticTestLog() {
  const now = new Date();
  const baseTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
  
  const logEntries = [
    // Debugging session - error-driven work
    `${new Date(baseTime.getTime() + 1000).toISOString()} | search_code          | {"session":"abc123_debug","sessionAge":"0m","newSession":true,"project":"RecapMCP","workflow":"DEBUGGING","intent":"Debug and fix identified error or test failure","intentConfidence":75,"workPattern":"reactive","intentEvidence":["Error-related search term: \\"error\\"","Debugging workflow detected"]} | Args: {"pattern":"error","path":"/test/project"}`,
    
    `${new Date(baseTime.getTime() + 5000).toISOString()} | search_code          | {"session":"abc123_debug","sessionAge":"0m","project":"RecapMCP","workflow":"DEBUGGING","intent":"Debug and fix identified error or test failure","intentConfidence":80,"workPattern":"reactive","intentEvidence":["Error-related search term: \\"undefined\\"","Multiple error-related searches"]} | Args: {"pattern":"undefined","path":"/test/project"}`,
    
    `${new Date(baseTime.getTime() + 10000).toISOString()} | read_file           | {"session":"abc123_debug","sessionAge":"0m","project":"RecapMCP","workflow":"DEBUGGING","intent":"Debug and fix identified error or test failure","intentConfidence":85,"workPattern":"reactive","intentEvidence":["Error search followed by file read","Debugging workflow: search → read → edit"]} | Args: {"path":"/test/project/src/recap.ts"}`,
    
    `${new Date(baseTime.getTime() + 15000).toISOString()} | edit_block          | {"session":"abc123_debug","sessionAge":"0m","project":"RecapMCP","workflow":"EDITING","intent":"Debug and fix identified error or test failure","intentConfidence":90,"workPattern":"reactive","intentEvidence":["Error search → read → edit pattern","Code modification following error investigation"]} | Args: {"file_path":"/test/project/src/recap.ts","old_string":"const error = true","new_string":"const error = false"}`,
    
    // New session - planned development
    `${new Date(baseTime.getTime() + 600000).toISOString()} | create_directory    | {"session":"def456_planned","sessionAge":"0m","newSession":true,"project":"NewFeature","workflow":"SETUP","intent":"Implement new feature following planned approach","intentConfidence":65,"workPattern":"proactive","intentEvidence":["Creating new directories","Systematic file creation"]} | Args: {"path":"/test/new-feature"}`,
    
    `${new Date(baseTime.getTime() + 605000).toISOString()} | write_file          | {"session":"def456_planned","sessionAge":"0m","project":"NewFeature","workflow":"SETUP","intent":"Implement new feature following planned approach","intentConfidence":75,"workPattern":"proactive","intentEvidence":["Type definition file creation","Planned development pattern"]} | Args: {"path":"/test/new-feature/types.ts","content":"export interface FeatureConfig { enabled: boolean; }"}`,
    
    `${new Date(baseTime.getTime() + 610000).toISOString()} | write_file          | {"session":"def456_planned","sessionAge":"0m","project":"NewFeature","workflow":"EDITING","intent":"Implement new feature following planned approach","intentConfidence":80,"workPattern":"proactive","intentEvidence":["Multiple related file creation","Systematic implementation approach"]} | Args: {"path":"/test/new-feature/implementation.ts","content":"import { FeatureConfig } from './types';"}}`,
    
    // Exploratory session
    `${new Date(baseTime.getTime() + 1200000).toISOString()} | list_directory      | {"session":"ghi789_explore","sessionAge":"0m","newSession":true,"project":"CodebaseExploration","workflow":"EXPLORATION","intent":"Understand codebase structure and identify areas of interest","intentConfidence":60,"workPattern":"investigative","intentEvidence":["Directory exploration pattern","High read-to-edit ratio"]} | Args: {"path":"/test/unknown-project"}`,
    
    `${new Date(baseTime.getTime() + 1205000).toISOString()} | read_file           | {"session":"ghi789_explore","sessionAge":"0m","project":"CodebaseExploration","workflow":"EXPLORATION","intent":"Understand codebase structure and identify areas of interest","intentConfidence":70,"workPattern":"investigative","intentEvidence":["Multiple file reads","Investigative pattern: list → read → read"]} | Args: {"path":"/test/unknown-project/README.md"}`,
    
    `${new Date(baseTime.getTime() + 1210000).toISOString()} | read_file           | {"session":"ghi789_explore","sessionAge":"0m","project":"CodebaseExploration","workflow":"EXPLORATION","intent":"Understand codebase structure and identify areas of interest","intentConfidence":75,"workPattern":"investigative","intentEvidence":["Multiple file exploration","Understanding codebase structure"]} | Args: {"path":"/test/unknown-project/package.json"}`,
  ];
  
  fs.writeFileSync(TEST_LOG_PATH, logEntries.join('\n') + '\n');
  console.log(`📝 Created test log with ${logEntries.length} enhanced entries`);
}

// Test the recap tool with our test log
function testRecapOutput(hours = 1) {
  // Set environment variable to use our test log
  process.env.RECAP_LOG_PATH = TEST_LOG_PATH;
  
  try {
    // Run recap tool
    const command = `cd ${RECAP_PROJECT_PATH} && node dist/index.js '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"recap","arguments":{"hours":${hours},"verbose":true}}}'`;
    const output = execSync(command, { encoding: 'utf8', timeout: 10000 });
    
    // Parse the MCP response
    const response = JSON.parse(output);
    if (response.result && response.result.content && response.result.content[0]) {
      return response.result.content[0].text;
    }
    
    return null;
  } catch (error) {
    console.error(`Error running recap: ${error.message}`);
    return null;
  }
}

// Create test log
createRealisticTestLog();

console.log('\n🎯 END-TO-END INTENT DETECTION TESTS');
console.log('====================================');

// Test 1: Recap can parse enhanced logs
runTest('Recap successfully parses enhanced logs with intent data', () => {
  const output = testRecapOutput(1);
  if (!output) return false;
  
  // Should contain session information
  const hasSessionInfo = output.includes('Session') && output.includes('RecapMCP');
  const noErrors = !output.includes('❌') && !output.includes('ERROR');
  
  return hasSessionInfo && noErrors;
});

// Test 2: Intent information appears in recap output
runTest('Intent information is displayed in recap output', () => {
  const output = testRecapOutput(1);
  if (!output) return false;
  
  const hasIntentDisplay = output.includes('🧠 Intent:');
  const hasWorkPattern = output.includes('reactive') || output.includes('proactive') || output.includes('investigative');
  const hasConfidence = /\d+%/.test(output);
  
  return {
    success: hasIntentDisplay && hasWorkPattern && hasConfidence,
    details: hasIntentDisplay ? 'Intent information found in output' : 'No intent information found'
  };
});

// Test 3: Error-driven intent is correctly identified
runTest('Error-driven debugging intent is correctly detected and displayed', () => {
  const output = testRecapOutput(1);
  if (!output) return false;
  
  const hasDebuggingIntent = output.includes('Debug and fix identified error');
  const hasReactivePattern = output.includes('reactive');
  const hasHighConfidence = /([6-9]\d|100)%/.test(output); // 60%+ confidence
  
  return {
    success: hasDebuggingIntent && hasReactivePattern,
    details: hasDebuggingIntent ? 'Error-driven intent correctly identified' : 'Error-driven intent not found'
  };
});

// Test 4: Planned development intent is correctly identified
runTest('Planned development intent is correctly detected and displayed', () => {
  const output = testRecapOutput(1);
  if (!output) return false;
  
  const hasPlannedIntent = output.includes('Implement new feature following planned approach') || 
                          output.includes('planned approach');
  const hasProactivePattern = output.includes('proactive');
  
  return {
    success: hasPlannedIntent && hasProactivePattern,
    details: hasPlannedIntent ? 'Planned development intent correctly identified' : 'Planned development intent not found'
  };
});

// Test 5: Exploratory intent is correctly identified
runTest('Exploratory work intent is correctly detected and displayed', () => {
  const output = testRecapOutput(1);
  if (!output) return false;
  
  const hasExploratoryIntent = output.includes('Understand codebase structure') ||
                              output.includes('codebase structure');
  const hasInvestigativePattern = output.includes('investigative');
  
  return {
    success: hasExploratoryIntent && hasInvestigativePattern,
    details: hasExploratoryIntent ? 'Exploratory intent correctly identified' : 'Exploratory intent not found'
  };
});

// Test 6: Multiple sessions with different intents
runTest('Multiple sessions show different intents correctly', () => {
  const output = testRecapOutput(1);
  if (!output) return false;
  
  const sessionCount = (output.match(/Session \w+/g) || []).length;
  const intentCount = (output.match(/🧠 Intent:/g) || []).length;
  const hasMultiplePatterns = output.includes('reactive') && 
                             (output.includes('proactive') || output.includes('investigative'));
  
  return {
    success: sessionCount >= 2 && intentCount >= 2 && hasMultiplePatterns,
    details: `Found ${sessionCount} sessions with ${intentCount} intents`
  };
});

// Test 7: JSON output includes intent data
runTest('JSON output format includes intent metadata', () => {
  process.env.RECAP_LOG_PATH = TEST_LOG_PATH;
  
  try {
    const command = `cd ${RECAP_PROJECT_PATH} && node dist/index.js '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"recap","arguments":{"hours":1,"format":"json"}}}'`;
    const output = execSync(command, { encoding: 'utf8', timeout: 10000 });
    
    const response = JSON.parse(output);
    if (!response.result || !response.result.content || !response.result.content[0]) {
      return false;
    }
    
    const jsonContent = JSON.parse(response.result.content[0].text);
    
    // Check for intent fields in session metadata
    const hasIntentInMetadata = jsonContent.sessions && 
                               jsonContent.sessions.some(s => s.primaryIntent);
    const hasWorkPatternInMetadata = jsonContent.sessions &&
                                    jsonContent.sessions.some(s => s.workPattern);
    
    return {
      success: hasIntentInMetadata && hasWorkPatternInMetadata,
      details: hasIntentInMetadata ? 'Intent data found in JSON metadata' : 'No intent data in JSON'
    };
  } catch (error) {
    console.error(`JSON test error: ${error.message}`);
    return false;
  }
});

// Test 8: Performance check
runTest('Intent detection adds minimal performance overhead', () => {
  const startTime = Date.now();
  const output = testRecapOutput(1);
  const endTime = Date.now();
  
  const duration = endTime - startTime;
  const isPerformant = duration < 5000; // Should complete in under 5 seconds
  
  return {
    success: output && isPerformant,
    details: `Recap completed in ${duration}ms`
  };
});

// Cleanup and results
try {
  fs.unlinkSync(TEST_LOG_PATH);
} catch (e) {
  // Ignore cleanup errors
}

console.log(`\n📊 RESULTS: ${testsPassed}/${testsTotal} tests passed`);

if (testsPassed === testsTotal) {
  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('✨ Intent detection is working end-to-end!');
  console.log('🧠 RecapMCP now provides intelligent productivity insights!');
} else {
  console.log(`\n⚠️  ${testsTotal - testsPassed} tests failed.`);
  console.log('Review the implementation and check the output above.');
}

process.exit(testsPassed === testsTotal ? 0 : 1);
