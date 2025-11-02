/**
 * Behavior Schema API - Декларативное описание реактивного поведения форм
 *
 * @module behaviors
 */

// Типы и интерфейсы
export type {
  BehaviorSchemaFn,
  FieldPath,
  FieldPathNode,
  BehaviorContext,
  BehaviorType,
  BehaviorRegistration,
  CopyFromOptions,
  EnableWhenOptions,
  ComputeFromOptions,
  WatchFieldOptions,
  RevalidateWhenOptions,
  SyncFieldsOptions,
} from './types';

// Функции для декларативного описания поведения
export {
  copyFrom,
  enableWhen,
  disableWhen,
  showWhen,
  hideWhen,
  computeFrom,
  watchField,
  revalidateWhen,
  syncFields,
} from './schema-behaviors';

// Композиция behavior схем (аналог toFieldPath из validation API)
export { apply, applyWhen, toBehaviorFieldPath } from './compose-behavior';

// Вспомогательные классы и функции
export { BehaviorRegistry } from './behavior-registry';
export { BehaviorContextImpl } from './behavior-context';
export { createFieldPath } from './create-field-path';
