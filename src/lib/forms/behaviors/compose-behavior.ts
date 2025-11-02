/**
 * Композиция behavior схем
 *
 * Предоставляет функции для переиспользования behavior схем:
 * - toBehaviorFieldPath: преобразование FieldPath во вложенный путь
 * - apply: применение схемы к полям
 * - applyWhen: условное применение схемы
 *
 * Аналог toFieldPath и applyWhen из validation API.
 */

import type { FieldPathNode, BehaviorSchemaFn } from '../types';
import { createFieldPath } from './create-field-path';
import { watchField } from './schema-behaviors';
import type { FieldPath } from './types';

// ============================================================================
// toBehaviorFieldPath - Преобразование FieldPath во вложенный путь
// ============================================================================

/**
 * Преобразовать FieldPath во вложенный путь для композиции behavior схем
 *
 * Аналог toFieldPath из validation API.
 *
 * @param fieldPath - Поле для преобразования
 * @returns Вложенный FieldPath
 *
 * @example
 * ```typescript
 * // address-behavior.ts
 * export const addressBehavior = (path: FieldPath<Address>) => {
 *   watchField(path.country, async (country, ctx) => {
 *     const regions = await fetchRegions(country);
 *     ctx.updateComponentProps(path.region, { options: regions });
 *   });
 * };
 *
 * // user-behavior.ts
 * export const userBehavior = (path: FieldPath<User>) => {
 *   // Композиция: применяем addressBehavior к вложенному полю
 *   addressBehavior(toBehaviorFieldPath(path.address));
 * };
 * ```
 */
export function toBehaviorFieldPath<TForm, TField>(
  fieldPath: FieldPathNode<TForm, TField> | undefined
): FieldPath<TField> {
  if (!fieldPath) {
    return createFieldPath<TField>();
  }

  const basePath = fieldPath.__fieldPath;
  return createNestedBehaviorFieldPath<TField>(basePath);
}

/**
 * Создать вложенный FieldPath с базовым префиксом
 * @private
 */
function createNestedBehaviorFieldPath<T>(basePath: string): FieldPath<T> {
  return new Proxy({} as FieldPath<T>, {
    get(_target, prop: string | symbol) {
      if (typeof prop === 'symbol') return undefined;

      const fullPath = basePath ? `${basePath}.${prop}` : prop;

      return {
        __fieldPath: fullPath,
        __key: prop,
      } as FieldPathNode<T, any>;
    },
  });
}

// ============================================================================
// apply - Применение behavior схемы к полям
// ============================================================================

/**
 * Применить behavior схему к вложенному полю или полям
 *
 * Поддерживает:
 * - Одно поле или массив полей
 * - Одну схему или массив схем
 * - Все комбинации (поле + схема, поле + схемы, поля + схема, поля + схемы)
 *
 * @param fields - Одно поле или массив полей
 * @param behaviors - Одна схема или массив схем
 *
 * @example
 * ```typescript
 * // Одна схема к одному полю
 * apply(path.registrationAddress, addressBehavior);
 *
 * // Одна схема к нескольким полям
 * apply([path.registrationAddress, path.residenceAddress], addressBehavior);
 *
 * // Несколько схем к одному полю
 * apply(path.properties, [propertyBehavior, arrayBehavior]);
 *
 * // Несколько схем к нескольким полям
 * apply(
 *   [path.registrationAddress, path.residenceAddress],
 *   [addressBehavior, validationBehavior]
 * );
 * ```
 */
export function apply<TForm, TField>(
  fields:
    | FieldPathNode<TForm, TField>
    | Array<FieldPathNode<TForm, TField> | undefined>
    | undefined,
  behaviors: BehaviorSchemaFn<TField> | Array<BehaviorSchemaFn<TField>>
): void {
  // Нормализуем inputs в массивы
  const fieldArray = (
    Array.isArray(fields) ? fields : [fields]
  ).filter(Boolean) as Array<FieldPathNode<TForm, TField>>;
  const behaviorArray = Array.isArray(behaviors) ? behaviors : [behaviors];

  // Применяем все схемы ко всем полям
  for (const field of fieldArray) {
    const nestedPath = toBehaviorFieldPath(field);

    for (const behavior of behaviorArray) {
      behavior(nestedPath);
    }
  }
}

// ============================================================================
// applyWhen - Условное применение behavior схемы
// ============================================================================

/**
 * Условное применение behavior схем (аналог applyWhen из validation API)
 *
 * ВАЖНО: Эта функция создаёт реактивный эффект через watchField.
 * Callback будет вызываться каждый раз при изменении conditionField,
 * если условие выполняется.
 *
 * @param conditionField - Поле для проверки условия
 * @param condition - Функция проверки условия
 * @param callback - Callback для применения behavior схем
 *
 * @example
 * ```typescript
 * // Применить addressBehavior только когда sameAsRegistration === false
 * applyWhen(
 *   path.sameAsRegistration,
 *   (value) => value === false,
 *   (path) => {
 *     apply(path.residenceAddress, addressBehavior);
 *   }
 * );
 *
 * // Или с прямым использованием path
 * applyWhen(
 *   path.hasProperty,
 *   (value) => value === true,
 *   (path) => {
 *     apply(path.properties, propertyBehavior);
 *     // Можно применить несколько схем
 *     apply([path.properties, path.items], arrayBehavior);
 *   }
 * );
 * ```
 */
export function applyWhen<TForm, TValue>(
  conditionField: FieldPathNode<TForm, TValue> | undefined,
  condition: (value: TValue) => boolean,
  callback: (path: FieldPath<TForm>) => void
): void {
  if (!conditionField) return;

  // Используем watchField для реактивного отслеживания условия
  watchField(
    conditionField,
    (value, _ctx) => {
      if (condition(value)) {
        const fieldPath = createFieldPath<TForm>();
        callback(fieldPath);
      }
    },
    { immediate: true }
  );
}
