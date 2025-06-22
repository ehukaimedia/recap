#!/usr/bin/env node

/**
 * Test Current State Analysis Functionality
 * Verifies that the recap tool provides forward-looking context
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCurrentStateAnalysis() {
  console.log('🧪 Testing Current State Analysis Functionality\n');
  
  try {
    // Test 1: Check if recap tool responds
    console.log('1. Testing basic recap functionality...');
    const basicTest = execSync('echo \'{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"recap","arguments":{"hours":1,"format":"json"}}}\' | node ../dist/index.js', 
      { cwd: __dirname, encoding: 'utf8' });
    
    const response = JSON.parse(basicTest);
    
    if (response.error) {
      throw new Error(`MCP Error: ${response.error.message}`);
    }
    
    const result = JSON.parse(response.result.content[0].text);
    console.log('✅ Basic recap functionality working');
    
    // Test 2: Verify current state is included
    console.log('2. Testing current state inclusion...');
    if (!result.currentState) {
      throw new Error('Current state not found in response');
    }
    console.log('✅ Current state analysis included');
    
    // Test 3: Check required current state fields
    console.log('3. Testing current state completeness...');
    const requiredFields = [
      'currentProject',
      'recentFiles', 
      'activeSessionId',
      'activeSessionDuration',
      'recentActivity'
    ];
    
    for (const field of requiredFields) {
      if (!(field in result.currentState)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    console.log('✅ All required current state fields present');
    
    // Test 4: Verify context quality
    console.log('4. Testing context quality...');
    
    if (result.currentState.recentActivity === 'No recent activity') {
      console.log('⚠️  No recent activity detected - this is expected for new sessions');
    } else {
      console.log('✅ Recent activity context available');
    }
    
    if (result.currentState.recentFiles.length > 0) {
      console.log('✅ Recent files tracking working');
    } else {
      console.log('⚠️  No recent files - this is expected for new sessions');
    }
    
    // Test 5: Text format test
    console.log('5. Testing text format output...');
    const textTest = execSync('echo \'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"recap","arguments":{"hours":1,"format":"text"}}}\' | node ../dist/index.js', 
      { cwd: __dirname, encoding: 'utf8' });
    
    const textResponse = JSON.parse(textTest);
    const textContent = textResponse.result.content[0].text;
    
    if (!textContent.includes('🔍 CURRENT STATE')) {
      throw new Error('Current state section not found in text output');
    }
    console.log('✅ Current state section present in text output');
    
    console.log('\n🎉 All tests passed! Current state analysis is working correctly.');
    
    // Summary of what this resolves
    console.log('\n📋 Issues Resolved:');
    console.log('• ✅ Forward-looking context: Now shows current working directory');
    console.log('• ✅ Project orientation: Identifies current project and session');
    console.log('• ✅ Recent activity tracking: Shows what was worked on recently');
    console.log('• ✅ File context: Lists recently accessed files');
    console.log('• ✅ Session awareness: Tracks active session and duration');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testCurrentStateAnalysis().then(success => {
  process.exit(success ? 0 : 1);
});
