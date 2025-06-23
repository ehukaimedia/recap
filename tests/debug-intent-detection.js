// Quick debug test to verify intent detection is being called
console.log('🧪 Testing error pattern detection...');

// Simulate the exact arguments that should trigger error detection
const testToolSequence = ['search_code', 'search_code', 'read_file'];
const testArgs = [
  { pattern: 'error', path: '/Users/ehukaimedia/Desktop/AI-Applications/Node/Recap' },
  { pattern: 'undefined', path: '/Users/ehukaimedia/Desktop/AI-Applications/Node/Recap' },
  { path: '/Users/ehukaimedia/Desktop/AI-Applications/Node/Recap/src/types.ts' }
];
const testFiles = ['Recap', 'types.ts'];
const testExecutions = [];

// Test error keywords detection
const errorKeywords = ['error', 'bug', 'fail', 'undefined', 'null', 'exception', 'crash', 'broken', 'issue', 'problem'];
console.log('Checking test args for error keywords...');

testArgs.forEach((arg, index) => {
  const argStr = JSON.stringify(arg).toLowerCase();
  console.log(`Arg ${index}: ${argStr}`);
  
  const hasErrorKeyword = errorKeywords.some(keyword => argStr.includes(keyword));
  console.log(`  Contains error keyword: ${hasErrorKeyword}`);
});

console.log('✅ Debug test complete');
