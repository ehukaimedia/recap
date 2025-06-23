import { ValidationConfig, ValidationResult, ValidationContext, ValidationStatus } from './types.js';

export class IntentValidationDemo {
  private config: ValidationConfig;

  constructor(config: ValidationConfig) {
    this.config = config;
  }

  public validate(data: any): ValidationResult {
    const errors: string[] = [];
    let score = 0;

    // Validation logic based on configuration
    if (!this.config.enabled) {
      return {
        isValid: false,
        score: 0,
        mode: this.config.modes,
        errors: ['Validation is disabled']
      };
    }

    // Score calculation based on thresholds
    if (data && typeof data === 'object') {
      score = Object.keys(data).length * 10;
      
      if (score < this.config.thresholds.minimum) {
        errors.push(`Score ${score} below minimum ${this.config.thresholds.minimum}`);
      }
      
      if (score > this.config.thresholds.maximum) {
        errors.push(`Score ${score} above maximum ${this.config.thresholds.maximum}`);
      }
    } else {
      errors.push('Invalid data type provided');
    }

    return {
      isValid: errors.length === 0,
      score,
      mode: this.config.modes,
      errors
    };
  }

  public createContext(data: any): ValidationContext {
    const result = this.validate(data);
    const status: ValidationStatus = result.isValid ? 'completed' : 'failed';

    return {
      config: this.config,
      result,
      status,
      timestamp: new Date()
    };
  }
}
