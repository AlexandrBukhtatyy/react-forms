/**
 * Валидаторы для массивов
 *
 * Предоставляет специализированные функции для валидации ArrayNode:
 * - notEmpty: проверка что массив не пустой
 * - validateItems: применение validation schema к каждому элементу
 */

import { ValidationRegistry } from './validation-registry';
import { extractPath } from './field-path';
import { minLength } from './schema-validators';
import type {
  ValidateOptions,
  ValidationSchemaFn,
} from '../types/validation-schema';
import type { FieldPathNode } from '../types';

// ============================================================================
// Helper: получить текущий активный реестр
// ============================================================================

/**
 * Helper: получить текущий активный реестр или выбросить ошибку
 *
 * Используется внутри array-validators для доступа к контекстному реестру
 *
 * @returns Текущий активный ValidationRegistry
 * @throws Error если нет активного контекста (только в DEV режиме)
 */
function getCurrentRegistry(): ValidationRegistry {
  const registry = ValidationRegistry.getCurrent();
  if (!registry) {
    if (import.meta.env.DEV) {
      throw new Error(
        'No active ValidationRegistry context. Make sure to call beginRegistration() before using array validation functions.'
      );
    }
    // В production возвращаем заглушку
    return {
      registerArrayItemValidation: () => {},
    } as any;
  }
  return registry;
}

// ============================================================================
// notEmpty - Проверка что массив не пустой
// ============================================================================

/**
 * Проверить что массив содержит хотя бы один элемент
 *
 * Это удобный алиас для `minLength(field, 1)`, оптимизированный для массивов.
 *
 * @param fieldPath - Поле-массив для валидации
 * @param options - Опции валидации (message, params и т.д.)
 *
 * @example
 * ```typescript
 * // Простая проверка
 * notEmpty(path.properties, { message: 'Добавьте хотя бы один объект имущества' });
 *
 * // С дополнительными параметрами
 * notEmpty(path.coBorrowers, {
 *   message: 'Требуется хотя бы один созаемщик',
 *   params: { minItems: 1 }
 * });
 * ```
 */
export function notEmpty<TForm = any, TItem = any>(
  fieldPath: FieldPathNode<TForm, TItem[] | undefined> | undefined,
  options?: ValidateOptions
): void {
  if (!fieldPath) return;

  // Используем minLength как базовую реализацию
  minLength(
    fieldPath as any,
    1,
    {
      message: options?.message || 'Массив не должен быть пустым',
      params: { minLength: 1, ...options?.params },
      trigger: options?.trigger,
    }
  );
}

// ============================================================================
// validateItems - Валидация элементов массива
// ============================================================================

/**
 * Применить validation schema к каждому элементу массива
 *
 * Регистрирует схему валидации, которая будет автоматически применяться
 * к каждому элементу ArrayNode (как существующим, так и новым).
 *
 * @param fieldPath - Поле-массив для валидации элементов
 * @param itemSchemaFn - Validation schema для одного элемента
 *
 * @example
 * ```typescript
 * import { propertyValidation } from './property-validation';
 *
 * // В additionalValidation
 * applyWhen(path.hasProperty, (value) => value === true, (path) => {
 *   // Проверка что массив не пустой
 *   notEmpty(path.properties, { message: 'Добавьте хотя бы один объект имущества' });
 *
 *   // Валидация каждого элемента
 *   validateItems(path.properties, propertyValidation);
 * });
 * ```
 */
export function validateItems<TForm = any, TItem = any>(
  fieldPath: FieldPathNode<TForm, TItem[] | undefined> | undefined,
  itemSchemaFn: ValidationSchemaFn<TItem>
): void {
  if (!fieldPath) return;

  const path = extractPath(fieldPath);

  // Регистрируем схему валидации для элементов массива
  // ✅ Используем текущий активный реестр из context stack
  getCurrentRegistry().registerArrayItemValidation(path, itemSchemaFn);
}
