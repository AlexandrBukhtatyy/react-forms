import type { ComponentType } from "react";

// ============================================================================
// Validator Types
// ============================================================================

export type ValidatorFn<T = any> = (value: T) => ValidationError | null;
export type AsyncValidatorFn<T = any> = (value: T) => Promise<ValidationError | null>;

export interface ValidationError {
  code: string;
  message: string;
  params?: Record<string, any>;
}

// ============================================================================
// Field Status
// ============================================================================

export type FieldStatus = 'valid' | 'invalid' | 'pending' | 'disabled';

// ============================================================================
// Field Configuration
// ============================================================================

export interface FieldConfig<T = any> {
  value: T;
  component: ComponentType<any>;
  validators?: ValidatorFn<T>[];
  asyncValidators?: AsyncValidatorFn<T>[];
  disabled?: boolean;
  updateOn?: 'change' | 'blur' | 'submit';
  componentProps?: Record<string, any>;
}

// ============================================================================
// Form Schema
// ============================================================================

export type FormSchema<T extends Record<string, any>> = {
  [K in keyof T]: FieldConfig<T[K]>;
};
