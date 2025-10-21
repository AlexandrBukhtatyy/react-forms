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
// Core
// ============================================================================

export { FieldController } from './core/field-controller';
export { FormStore } from './core/form-store';

// Variant 5 core
export { DeepFormStore } from './core/deep-form-store';
export { GroupProxy } from './core/group-proxy';
export { ArrayProxy } from './core/array-proxy';

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
