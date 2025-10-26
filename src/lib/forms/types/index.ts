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
// Field Configuration (re-exported from deep-schema)
// ============================================================================

// Import and re-export FieldConfig from deep-schema for single source of truth
export type { FieldConfig } from './deep-schema';

// Import for use in FormSchema
import type { FieldConfig } from './deep-schema';

// ============================================================================
// Re-exports from validation-schema
// ============================================================================

export type {
  ValidationContext,
  TreeValidationContext,
  ContextualValidatorFn,
  ContextualAsyncValidatorFn,
  TreeValidatorFn,
  ConditionFn,
  FieldPath,
  FieldPathNode,
  ValidateOptions,
  ValidateAsyncOptions,
  ValidateTreeOptions,
  ValidationSchemaFn,
  ValidatorRegistration,
} from './validation-schema';

// ============================================================================
// Re-exports from deep-schema (Variant 5)
// ============================================================================

export type {
  DeepFormSchema,
  DeepControls,
  GroupControlProxy,
  ArrayControlProxy,
  ArrayConfig,
} from './deep-schema';

// ============================================================================
// Re-exports from group-node-proxy (Typed Proxy Access)
// ============================================================================

export type {
  FormNodeControls,
  GroupNodeWithControls,
  ArrayNodeWithControls,
} from './group-node-proxy';
