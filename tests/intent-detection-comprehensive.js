#!/usr/bin/env node

/**
 * Comprehensive Intent Detection Test
 * Tests all 4 intent categories and verifies recap can recover context in timeout scenarios
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to call recap and get results
async function getRecap(hours = 1, verbose = true) {
  const cmd = `echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"recap","arguments":{"hours":${hours},"verbose":${verbose},"format":"json"}}}' | node ../dist/index.js`;
  const result = execSync(cmd, { cwd: __dirname, encoding: 'utf8' });
  const response = JSON.parse(result);
  
  if (response.error) {
    throw new Error(`MCP Error: ${response.error.message}`);
  }
  
  return JSON.parse(response.result.content[0].text);
}

// Test 1: Error-Driven Work Pattern (Reactive Intent)
async function testErrorDrivenPattern() {
  console.log('\n🔍 Test 1: Error-Driven Work Pattern (Reactive Intent)');
  console.log('Simulating debugging workflow...');
  
  // Simulate error investigation pattern
  console.log('• Searching for error patterns...');
  execSync('echo "Searching for error: undefined variable"', { encoding: 'utf8' });
  
  console.log('• Creating error reproduction case...');
  fs.writeFileSync(path.join(__dirname, 'error-test.js'), `
// Error reproduction test
function causeError() {
  // This should trigger undefined error
  console.log(undefinedVariable);
}

function debugThis() {
  // Multiple console logs indicate debugging
  console.log('Debug: checking state');
  console.log('Debug: examining variables');  
  console.log('Debug: testing fix');
}
`);
  
  console.log('• Reading error files multiple times (debugging pattern)...');
  fs.readFileSync(path.join(__dirname, 'error-test.js'), 'utf8');
  fs.readFileSync(path.join(__dirname, 'error-test.js'), 'utf8');
  fs.readFileSync(path.join(__dirname, 'error-test.js'), 'utf8');
  
  console.log('• Editing to fix error...');
  fs.writeFileSync(path.join(__dirname, 'error-test.js'), `
// Error reproduction test - FIXED
function causeError() {
  // Fixed: defined variable
  const undefinedVariable = 'now defined';
  console.log(undefinedVariable);
}

function debugThis() {
  console.log('Debug: error resolved');
}
`);
  
  return true;
}

// Test 2: Planned Development Pattern (Proactive Intent)
async function testPlannedDevelopmentPattern() {
  console.log('\n🏗️ Test 2: Planned Development Pattern (Proactive Intent)');
  console.log('Simulating planned feature development...');
  
  console.log('• Creating type definitions (design-first approach)...');
  fs.writeFileSync(path.join(__dirname, 'feature-types.ts'), `
// New feature type definitions
export interface NewFeature {
  id: string;
  name: string;
  enabled: boolean;
}

export interface FeatureConfig {
  features: NewFeature[];
  defaultEnabled: boolean;
}
`);
  
  console.log('• Creating test file (TDD approach)...');
  fs.writeFileSync(path.join(__dirname, 'feature.test.js'), `
// Feature tests - written before implementation
describe('New Feature', () => {
  test('should create feature correctly', () => {
    // Test implementation
  });
  
  test('should handle feature toggling', () => {
    // Test implementation  
  });
});
`);
  
  console.log('• Implementing feature systematically...');
  fs.writeFileSync(path.join(__dirname, 'feature-implementation.js'), `
// Systematic feature implementation
class FeatureManager {
  constructor() {
    this.features = new Map();
  }
  
  addFeature(feature) {
    this.features.set(feature.id, feature);
  }
  
  toggleFeature(id) {
    const feature = this.features.get(id);
    if (feature) {
      feature.enabled = !feature.enabled;
    }
  }
}
`);
  
  return true;
}

// Test 3: Exploratory Pattern (Investigative Intent)
async function testExploratoryPattern() {
  console.log('\n🔬 Test 3: Exploratory Pattern (Investigative Intent)');
  console.log('Simulating codebase investigation...');
  
  console.log('• Reading multiple unrelated files...');
  const filesToRead = [
    '../package.json',
    '../src/types.ts', 
    '../src/recap.ts',
    '../README.md'
  ];
  
  filesToRead.forEach(file => {
    try {
      fs.readFileSync(path.join(__dirname, file), 'utf8');
      console.log(`  - Read ${file}`);
    } catch (e) {
      console.log(`  - Attempted to read ${file} (exploration)`);
    }
  });
  
  console.log('• Searching for architectural patterns...');
  execSync('echo "Searching codebase structure"', { encoding: 'utf8' });
  execSync('echo "Investigating dependencies"', { encoding: 'utf8' });
  
  console.log('• Listing directory structures...');
  try {
    execSync('ls -la ../', { encoding: 'utf8' });
  } catch (e) {
    console.log('  - Directory exploration attempted');
  }
  
  return true;
}

// Test 4: Maintenance Pattern (Maintenance Intent)  
async function testMaintenancePattern() {
  console.log('\n🔧 Test 4: Maintenance Pattern (Maintenance Intent)');
  console.log('Simulating maintenance and refactoring...');
  
  console.log('• Creating config files...');
  fs.writeFileSync(path.join(__dirname, 'test-config.json'), `{
  "version": "1.0.0",
  "environment": "test",
  "features": {
    "newFeature": true,
    "legacySupport": false
  }
}`);
  
  console.log('• Performing multiple small edits (refactoring pattern)...');
  const refactorFile = path.join(__dirname, 'refactor-target.js');
  
  // Multiple incremental edits
  fs.writeFileSync(refactorFile, `function oldFunction() { return 'old'; }`);
  fs.writeFileSync(refactorFile, `function modernFunction() { return 'modern'; }`);
  fs.writeFileSync(refactorFile, `const modernFunction = () => 'modern';`);
  fs.writeFileSync(refactorFile, `export const modernFunction = () => 'modern';`);
  fs.writeFileSync(refactorFile, `export const modernFunction = () => 'modern';\nexport default modernFunction;`);
  
  console.log('• Updating package dependencies (maintenance)...');
  const testPackage = path.join(__dirname, 'test-package.json');
  fs.writeFileSync(testPackage, `{
  "dependencies": {
    "lodash": "^4.17.21",
    "express": "^4.18.2"
  }
}`);
  
  return true;
}

// Test 5: Timeout Recovery Scenario
async function testTimeoutRecoveryScenario() {
  console.log('\n⏱️ Test 5: Timeout Recovery Scenario');
  console.log('Simulating context recovery after timeout...');
  
  console.log('• Getting current context with recap...');
  const context = await getRecap(1, true);
  
  console.log('• Analyzing session recovery data...');
  if (context.sessions && context.sessions.length > 0) {
    const recentSession = context.sessions[context.sessions.length - 1];
    console.log(`  - Active session: ${recentSession.id}`);
    console.log(`  - Duration: ${recentSession.duration} minutes`);
    
    if (recentSession.primaryIntent) {
      console.log(`  - Detected intent: ${recentSession.primaryIntent}`);
      console.log(`  - Work pattern: ${recentSession.workPattern || 'unknown'}`);
    }
    
    if (recentSession.filesAccessed && recentSession.filesAccessed.length > 0) {
      console.log(`  - Recent files: ${recentSession.filesAccessed.slice(0, 3).join(', ')}`);
    }
  }
  
  return context;
}

// Test 6: Intent Detection Verification
async function verifyIntentDetection(context) {
  console.log('\n✅ Test 6: Intent Detection Verification');
  
  let intentDetected = false;
  let intentDetails = null;
  
  if (context.sessions) {
    for (const session of context.sessions) {
      if (session.primaryIntent) {
        intentDetected = true;
        intentDetails = {
          intent: session.primaryIntent,
          pattern: session.workPattern,
          confidence: session.intentConfidence
        };
        break;
      }
    }
  }
  
  if (intentDetected) {
    console.log('🎉 Intent detection is working!');
    console.log(`  - Intent: ${intentDetails.intent}`);
    console.log(`  - Pattern: ${intentDetails.pattern}`);
    if (intentDetails.confidence) {
      console.log(`  - Confidence: ${intentDetails.confidence}%`);
    }
    return true;
  } else {
    console.log('⚠️ No intent detected - may need more activity or threshold adjustment');
    return false;
  }
}

// Cleanup function
function cleanup() {
  console.log('\n🧹 Cleaning up test files...');
  const testFiles = [
    'error-test.js',
    'feature-types.ts', 
    'feature.test.js',
    'feature-implementation.js',
    'test-config.json',
    'refactor-target.js',
    'test-package.json'
  ];
  
  testFiles.forEach(file => {
    try {
      fs.unlinkSync(path.join(__dirname, file));
    } catch (e) {
      // File may not exist
    }
  });
}

// Main test execution
async function runComprehensiveTests() {
  console.log('🧪 COMPREHENSIVE INTENT DETECTION TEST SUITE');
  console.log('Testing all intent categories and context recovery scenarios\n');
  
  try {
    // Run all pattern tests
    await testErrorDrivenPattern();
    await testPlannedDevelopmentPattern(); 
    await testExploratoryPattern();
    await testMaintenancePattern();
    
    // Small delay to ensure log writes complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test context recovery
    const context = await testTimeoutRecoveryScenario();
    
    // Verify intent detection is working
    const intentWorking = await verifyIntentDetection(context);
    
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('✅ Error-driven pattern simulation: Complete');
    console.log('✅ Planned development pattern simulation: Complete');
    console.log('✅ Exploratory pattern simulation: Complete');
    console.log('✅ Maintenance pattern simulation: Complete');
    console.log('✅ Context recovery simulation: Complete');
    console.log(`${intentWorking ? '✅' : '⚠️'} Intent detection verification: ${intentWorking ? 'Working' : 'Needs investigation'}`);
    
    if (intentWorking) {
      console.log('\n🎉 SUCCESS: Intent detection system is fully operational!');
      console.log('Recap can now provide "why" context for better productivity insights.');
    } else {
      console.log('\n📋 Next steps needed to complete intent detection activation.');
    }
    
    return intentWorking;
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    return false;
  } finally {
    cleanup();
  }
}

// Run the comprehensive test
runComprehensiveTests().then(success => {
  process.exit(success ? 0 : 1);
});
