import { TestFeature, TestConfig, TestContext, TestResult } from './types.js';

export class FeatureManager {
  private config: TestConfig;

  constructor(config: TestConfig) {
    this.config = config;
  }

  public isFeatureEnabled(featureId: string): boolean {
    const feature = this.config.features.find(f => f.id === featureId);
    return feature?.enabled ?? false;
  }

  public runTest(featureId: string): TestContext {
    const feature = this.config.features.find(f => f.id === featureId);
    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }

    const result: TestResult = feature.enabled ? 'pass' : 'fail';
    
    return {
      feature,
      config: this.config,
      result
    };
  }
}
