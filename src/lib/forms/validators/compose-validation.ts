/**
 * Композиция validation схем
 *
 * Предоставляет функции для переиспользования validation схем:
 * - apply: применение схемы к полям (новый API)
 *
 * Дополняет существующий toFieldPath и applyWhen.
 */

import type { ValidationSchemaFn } from '../types/validation-schema';
import { toFieldPath } from './field-path';

// ============================================================================
// apply - Применение validation схемы к полям
// ============================================================================

/**
 * Применить validation схему к вложенному полю или полям
 *
 * Поддерживает:
 * - Одно поле или массив полей
 * - Одну схему или массив схем
 * - Все комбинации (поле + схема, поле + схемы, поля + схема, поля + схемы)
 *
 * @param fields - Одно поле или массив полей
 * @param validationSchemas - Одна схема или массив схем
 *
 * @example
 * ```typescript
 * // Одна схема к одному полю
 * apply(path.registrationAddress, addressValidation);
 *
 * // Одна схема к нескольким полям
 * apply([path.homeAddress, path.workAddress], addressValidation);
 *
 * // Несколько схем к одному полю
 * apply(path.email, [emailValidation, uniqueEmailValidation]);
 *
 * // Несколько схем к нескольким полям
 * apply(
 *   [path.email, path.confirmEmail],
 *   [emailValidation, matchValidation]
 * );
 * ```
 */
export function apply<TForm, TField>(
  fields:
    | FieldPathNode<TForm, TField>
    | Array<FieldPathNode<TForm, TField> | undefined>
    | undefined,
  validationSchemas: ValidationSchemaFn<TField> | Array<ValidationSchemaFn<TField>>
): void {
  // Нормализуем inputs в массивы
  const fieldArray = (
    Array.isArray(fields) ? fields : [fields]
  ).filter(Boolean) as Array<FieldPathNode<TForm, TField>>;
  const schemaArray = Array.isArray(validationSchemas)
    ? validationSchemas
    : [validationSchemas];

  // Применяем все схемы ко всем полям
  for (const field of fieldArray) {
    const nestedPath = toFieldPath(field);

    for (const schema of schemaArray) {
      schema(nestedPath);
    }
  }
}
