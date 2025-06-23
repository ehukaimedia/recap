// Test file for "why" context detection
// This should trigger "planned work" intent detection

export interface TestInterface {
  testField: string;
  confidence: number;
}

export function testIntentDetection() {
  console.log('Testing new intent detection system');
  console.log('Added logging for better debugging');
  return {
    success: true,
    message: 'Intent detection working',
    timestamp: new Date().toISOString()
  };
}
