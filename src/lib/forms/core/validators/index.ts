// ============================================================================
// Validation Schema API
// ============================================================================

// Функции валидации
export {
  validate,
  validateAsync,
  validateTree,
  applyWhen,
  // Переиспользуемые валидаторы
  required,
  min,
  max,
  minLength,
  maxLength,
  email,
  pattern,
} from './schema-validators';

// Валидаторы для массивов
export { notEmpty, validateItems } from './array-validators';

// Композиция validation схем (аналог apply из behaviors API)
export { apply } from './compose-validation';

// Утилиты для FieldPath
export { createFieldPath, extractPath, extractKey, toFieldPath } from './field-path';

// Утилита для валидации формы по схеме
export { validateForm } from './validate-form';

// ValidationRegistryClass (для внутреннего использования)
// Примечание: ValidationRegistry (глобальный singleton) был удален в пользу
// локальных экземпляров ValidationRegistryClass в каждом GroupNode
export { ValidationRegistryClass } from './validation-registry';

// Контексты валидации
export { ValidationContextImpl, TreeValidationContextImpl } from './validation-context';
