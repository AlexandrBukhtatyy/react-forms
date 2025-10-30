// ============================================================================
// Types
// ============================================================================

export type {
  ValidatorFn,
  AsyncValidatorFn,
  ValidationError,
  FieldStatus,
  FieldConfig,
} from './types';

// Variant 5 types
export type {
  DeepFormSchema,
  DeepControls,
  GroupControlProxy,
  ArrayControlProxy,
  ArrayConfig,
} from './types';

// Typed Proxy Access (решение проблемы типизации)
export type {
  FormNodeControls,
  GroupNodeWithControls,
  ArrayNodeWithControls,
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

export { FormField } from './components/core/form-field';
export { Form } from './components/core/form';

// ============================================================================
// Validators
// ============================================================================
export { validateForm } from './validators/validate-form';

// ============================================================================
// Hooks
// ============================================================================

export { useStepForm } from './components/other/form-navigation/hooks';
export type { StepFormConfig, UseStepFormResult } from './components/other/form-navigation/hooks';

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
