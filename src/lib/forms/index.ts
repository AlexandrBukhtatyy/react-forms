// ============================================================================
// Types
// ============================================================================

export type {
  ValidatorFn,
  AsyncValidatorFn,
  ValidationError,
  FieldStatus,
  FieldConfig,
  FormSchema
} from './types';

// Variant 5 types
export type {
  DeepFormSchema,
  DeepControls,
  GroupControlProxy,
  ArrayControlProxy,
  ArrayConfig,
} from './types';

// ============================================================================
// Core - New Architecture (рекомендуется)
// ============================================================================

export { FormNode } from './core/nodes/form-node';
export { FieldNode } from './core/nodes/field-node';
export { GroupNode } from './core/nodes/group-node';
export { ArrayNode } from './core/nodes/array-node';
export type { SetValueOptions } from './core/nodes/form-node';

// ============================================================================
// Components
// ============================================================================

export { FormField } from './components/form-field';
export { Form } from './components/form';

// ============================================================================
// Validators
// ============================================================================

export { Validators } from './validators/built-in';

// ============================================================================
// Resources
// ============================================================================

export {
  staticResource,
  preloadResource,
  partialResource,
  Resources
} from './core/resources';

export type {
  ResourceItem,
  ResourceResult,
  ResourceConfig,
  ResourceLoadParams
} from './core/resources';
