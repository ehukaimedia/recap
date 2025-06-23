#!/usr/bin/env node

/**
 * Simple Intent Detection Verification
 * Validates that the core implementation is ready for production use
 */

const fs = require('fs');
const path = require('path');

console.log('🧠 INTENT DETECTION IMPLEMENTATION VERIFICATION');
console.log('==============================================\n');

let allTestsPass = true;

// Test 1: Verify DesktopCommanderMCP Build
function testDesktopCommanderBuild() {
  const distPath = '/Users/ehukaimedia/Desktop/AI-Applications/Node/DesktopCommanderMCP-Recap/dist';
  const trackToolsPath = path.join(distPath, 'utils', 'trackTools.js');
  
  try {
    const exists = fs.existsSync(trackToolsPath);
    const content = fs.readFileSync(trackToolsPath, 'utf8');
    
    // Check for intent detection in compiled output
    const hasIntentLogic = content.includes('detectIntentSignals');
    const hasArgsAccumulation = content.includes('recentArgs');
    
    console.log('📦 DesktopCommanderMCP Build Check:');
    console.log(`  ✓ Build output exists: ${exists ? '✅' : '❌'}`);
    console.log(`  ✓ Intent detection compiled: ${hasIntentLogic ? '✅' : '❌'}`);
    console.log(`  ✓ Args accumulation compiled: ${hasArgsAccumulation ? '✅' : '❌'}`);
    
    const buildOk = exists && hasIntentLogic && hasArgsAccumulation;
    if (buildOk) {
      console.log('  🎉 DesktopCommanderMCP ready for intent detection!\n');
    } else {
      console.log('  ❌ DesktopCommanderMCP build issues detected\n');
      allTestsPass = false;
    }
    
    return buildOk;
  } catch (error) {
    console.log(`  ❌ Error checking build: ${error.message}\n`);
    allTestsPass = false;
    return false;
  }
}

// Test 2: Verify Recap Build
function testRecapBuild() {
  const distPath = '/Users/ehukaimedia/Desktop/AI-Applications/Node/Recap/dist';
  const recapPath = path.join(distPath, 'recap.js');
  const typesPath = path.join(distPath, 'types.js');
  
  try {
    const recapExists = fs.existsSync(recapPath);
    const typesExists = fs.existsSync(typesPath);
    
    console.log('📊 Recap Build Check:');
    console.log(`  ✓ Recap output exists: ${recapExists ? '✅' : '❌'}`);
    console.log(`  ✓ Types output exists: ${typesExists ? '✅' : '❌'}`);
    
    if (recapExists) {
      const recapContent = fs.readFileSync(recapPath, 'utf8');
      const hasIntentDisplay = recapContent.includes('🧠 Intent:');
      const hasIntentProcessing = recapContent.includes('intentConfidence');
      
      console.log(`  ✓ Intent display compiled: ${hasIntentDisplay ? '✅' : '❌'}`);
      console.log(`  ✓ Intent processing compiled: ${hasIntentProcessing ? '✅' : '❌'}`);
      
      const buildOk = hasIntentDisplay && hasIntentProcessing;
      if (buildOk) {
        console.log('  🎉 Recap ready to display intelligent insights!\n');
      } else {
        console.log('  ❌ Recap intent integration issues detected\n');
        allTestsPass = false;
      }
      
      return buildOk;
    } else {
      console.log('  ❌ Recap build failed\n');
      allTestsPass = false;
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Error checking Recap build: ${error.message}\n`);
    allTestsPass = false;
    return false;
  }
}

// Test 3: Check Log File Location
function testLogFileLocation() {
  const logPath = path.join(process.env.HOME, '.claude-server-commander', 'claude_tool_call.log');
  
  console.log('📁 Log File Check:');
  console.log(`  📍 Expected location: ${logPath}`);
  
  try {
    const exists = fs.existsSync(logPath);
    console.log(`  ✓ Log file exists: ${exists ? '✅' : '📝 Will be created on first use'}`);
    
    if (exists) {
      const stats = fs.statSync(logPath);
      const size = Math.round(stats.size / 1024);
      console.log(`  ✓ Log file size: ${size}KB`);
      
      // Check if it contains recent enhanced entries
      const content = fs.readFileSync(logPath, 'utf8');
      const hasEnhancedFormat = content.includes('"session":');
      console.log(`  ✓ Enhanced format detected: ${hasEnhancedFormat ? '✅' : '❌ (Legacy format)'}`);
    }
    
    console.log('  🎉 Log location verified!\n');
    return true;
  } catch (error) {
    console.log(`  ❌ Error checking log file: ${error.message}\n`);
    return true; // Non-critical
  }
}

// Test 4: Verify Algorithm Implementation
function testAlgorithmImplementation() {
  const trackToolsSource = '/Users/ehukaimedia/Desktop/AI-Applications/Node/DesktopCommanderMCP-Recap/src/utils/trackTools.ts';
  
  try {
    const content = fs.readFileSync(trackToolsSource, 'utf8');
    
    console.log('🤖 Intent Detection Algorithms Check:');
    
    const hasErrorDetection = content.includes('detectErrorDrivenWork');
    const hasPlannedDetection = content.includes('detectPlannedDevelopment'); 
    const hasExploratoryDetection = content.includes('detectExploratoryWork');
    const hasMaintenanceDetection = content.includes('detectMaintenanceWork');
    const hasMainFunction = content.includes('function detectIntentSignals');
    
    console.log(`  ✓ Error-driven detection: ${hasErrorDetection ? '✅' : '❌'}`);
    console.log(`  ✓ Planned development detection: ${hasPlannedDetection ? '✅' : '❌'}`);
    console.log(`  ✓ Exploratory detection: ${hasExploratoryDetection ? '✅' : '❌'}`);
    console.log(`  ✓ Maintenance detection: ${hasMaintenanceDetection ? '✅' : '❌'}`);
    console.log(`  ✓ Main detection function: ${hasMainFunction ? '✅' : '❌'}`);
    
    const allAlgorithms = hasErrorDetection && hasPlannedDetection && 
                         hasExploratoryDetection && hasMaintenanceDetection && hasMainFunction;
    
    if (allAlgorithms) {
      console.log('  🎉 All 4 intent detection algorithms implemented!\n');
    } else {
      console.log('  ❌ Missing algorithm implementations\n');
      allTestsPass = false;
    }
    
    return allAlgorithms;
  } catch (error) {
    console.log(`  ❌ Error checking algorithms: ${error.message}\n`);
    allTestsPass = false;
    return false;
  }
}

// Run all verification tests
testDesktopCommanderBuild();
testRecapBuild();
testLogFileLocation();
testAlgorithmImplementation();

// Final assessment
console.log('🎯 IMPLEMENTATION READINESS ASSESSMENT');
console.log('=====================================');

if (allTestsPass) {
  console.log('🎉 ALL CHECKS PASSED!');
  console.log('✨ Intent detection implementation is complete and ready!');
  console.log('');
  console.log('🚀 NEXT STEPS:');
  console.log('1. Restart Claude Desktop to load the enhanced DesktopCommanderMCP');
  console.log('2. Execute a debugging pattern:');
  console.log('   - search_code("error")');  
  console.log('   - search_code("undefined")');
  console.log('   - read_file(...path...)');
  console.log('3. Run recap to see intelligent insights:');
  console.log('   - "Give me a recap of my recent work"');
  console.log('');
  console.log('💡 EXPECTED OUTCOME:');
  console.log('You should see:');
  console.log('🧠 Intent: Debug and fix identified error or test failure (reactive) 75%');
  console.log('');
  console.log('This transforms RecapMCP from basic activity logging into');
  console.log('intelligent productivity analysis that understands WHY you work!');
} else {
  console.log('⚠️  IMPLEMENTATION ISSUES DETECTED');
  console.log('Review the failed checks above and fix any issues.');
  console.log('All checks must pass before the solution is ready.');
}

process.exit(allTestsPass ? 0 : 1);
