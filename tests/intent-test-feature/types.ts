// Test feature types for intent detection validation

export interface TestFeature {
  id: string;
  name: string;
  enabled: boolean;
}

export interface TestConfig {
  features: TestFeature[];
  environment: 'test' | 'development' | 'production';
}

export type TestResult = 'pass' | 'fail' | 'pending';

export interface TestContext {
  feature: TestFeature;
  config: TestConfig;
  result: TestResult;
}
