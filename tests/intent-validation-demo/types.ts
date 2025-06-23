// Intent validation demo - Type definitions
// This demonstrates planned development pattern for intent detection

export interface ValidationConfig {
  enabled: boolean;
  thresholds: {
    minimum: number;
    maximum: number;
  };
  modes: 'strict' | 'permissive' | 'balanced';
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  mode: ValidationConfig['modes'];
  errors: string[];
}

export type ValidationStatus = 'pending' | 'completed' | 'failed';

export interface ValidationContext {
  config: ValidationConfig;
  result?: ValidationResult;
  status: ValidationStatus;
  timestamp: Date;
}
