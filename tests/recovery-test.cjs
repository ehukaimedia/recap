/**
 * Recovery Mode Test
 * Validates recovery functionality for interrupted sessions
 */

const { detectInterruptedSession, generateRecoveryContext } = require('../dist/recovery.js');

// Mock session data
const mockInterruptedSession = {
  id: 'test_session_123',
  startTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
  endTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  duration: 10,
  primaryProject: 'TestProject',
  workflowPatterns: ['EDITING', 'DEBUGGING'],
  filesAccessed: ['/src/test.js', '/src/config.js'],
  toolCalls: [
    {
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      toolName: 'read_file',
      contextInfo: {
        session: 'test_session_123',
        files: ['/src/test.js']
      },
      arguments: { path: '/src/test.js' }
    },
    {
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      toolName: 'edit_block',
      contextInfo: {
        session: 'test_session_123',
        files: ['/src/test.js']
      },
      arguments: { 
        file_path: '/src/test.js',
        old_string: 'console.log("old")',
        new_string: 'console.log("new")'
      }
    },
    {
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      toolName: 'search_code',
      contextInfo: {
        session: 'test_session_123'
      },
      arguments: { 
        pattern: 'undefined',
        path: '/src'
      }
    }
  ]
};

const mockOldSession = {
  ...mockInterruptedSession,
  id: 'old_session',
  endTime: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
};

console.log('Testing Recovery Mode Detection...\n');

// Test 1: Detect interrupted session
console.log('Test 1: Detecting interrupted session');
const interrupted = detectInterruptedSession([mockOldSession, mockInterruptedSession]);
if (interrupted && interrupted.id === 'test_session_123') {
  console.log('✅ Correctly detected interrupted session');
} else {
  console.log('❌ Failed to detect interrupted session');
}

// Test 2: Should not detect old session
console.log('\nTest 2: Should not detect old session');
const notInterrupted = detectInterruptedSession([mockOldSession]);
if (!notInterrupted) {
  console.log('✅ Correctly ignored old session');
} else {
  console.log('❌ Incorrectly detected old session as interrupted');
}

// Test 3: Generate recovery context
console.log('\nTest 3: Generating recovery context');
try {
  const context = generateRecoveryContext(
    mockInterruptedSession,
    mockInterruptedSession.toolCalls
  );
  
  console.log('Recovery Context Generated:');
  console.log('- Session ID:', context.sessionId);
  console.log('- Last Tool:', context.lastToolUsed);
  console.log('- Last File:', context.lastFile);
  console.log('- Pending Operations:', context.pendingOperations.length);
  console.log('- Uncommitted Changes:', context.uncommittedChanges.length);
  console.log('- Suggested Actions:', context.suggestedActions.length);
  
  if (context.pendingOperations.length > 0) {
    console.log('\nPending Operations Detected:');
    context.pendingOperations.forEach(op => {
      console.log(`  - ${op.type}: ${op.description}`);
    });
  }
  
  if (context.suggestedActions.length > 0) {
    console.log('\nSuggested Actions:');
    context.suggestedActions.forEach((action, i) => {
      console.log(`  ${i + 1}. ${action}`);
    });
  }
  
  console.log('\n✅ Recovery context generation successful');
} catch (error) {
  console.log('❌ Failed to generate recovery context:', error.message);
}

console.log('\n🎉 Recovery mode tests completed!');
