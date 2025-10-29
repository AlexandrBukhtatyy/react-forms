/**
 * validateForm - утилита для валидации формы в соответствии со схемой
 *
 * Позволяет применить validation schema к форме без изменения
 * зарегистрированной схемы в ValidationRegistry.
 *
 * Используется для:
 * - Валидации отдельных шагов multi-step форм
 * - Условной валидации
 * - Временной валидации без изменения состояния
 */

import type { GroupNode } from '../core/nodes/group-node';
import type { ValidationSchemaFn } from '../types';
import { ValidationRegistry } from './validation-registry';
import { createFieldPath } from './field-path';

/**
 * Валидировать форму в соответствии с указанной схемой
 *
 * Функция создает временный контекст валидации, применяет валидаторы
 * из схемы и очищает контекст без сохранения в реестр.
 *
 * @param form - GroupNode для валидации
 * @param schema - Схема валидации
 * @returns Promise<boolean> - true если форма валидна
 *
 * @example
 * ```typescript
 * // Валидация отдельного шага
 * const isValid = await validateForm(form, step1ValidationSchema);
 *
 * if (isValid) {
 *   // Переход на следующий шаг
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Валидация полной формы
 * const isValid = await validateForm(form, fullValidationSchema);
 *
 * if (isValid) {
 *   await form.submit(onSubmit);
 * }
 * ```
 */
export async function validateForm<T extends Record<string, any>>(
  form: GroupNode<T>,
  schema: ValidationSchemaFn<T>
): Promise<boolean> {
  // Начинаем регистрацию валидаторов
  ValidationRegistry.beginRegistration();

  let tempValidators: any[] = [];
  let cancelled = false;

  try {
    // Регистрируем валидаторы из схемы
    const path = createFieldPath<T>();
    schema(path);

    // Получаем валидаторы БЕЗ сохранения в реестр
    const context = ValidationRegistry.getCurrentContext();
    tempValidators = context?.getValidators() || [];

    // Отменяем регистрацию (не сохраняем в глобальный реестр)
    ValidationRegistry.cancelRegistration();
    cancelled = true;

    // Очищаем текущие ошибки полей
    form.clearErrors();

    // Валидируем все поля (field-level валидация)
    const formInternal = form as any;
    await Promise.all(
      Array.from(formInternal.fields.values()).map((field: any) =>
        field.validate()
      )
    );

    // Применяем contextual validators
    if (tempValidators.length > 0) {
      await form.applyContextualValidators(tempValidators);
    }

    // Проверяем результат
    return form.valid.value;
  } catch (error) {
    // В случае ошибки отменяем регистрацию только если еще не отменили
    if (!cancelled) {
      ValidationRegistry.cancelRegistration();
    }
    throw error;
  }
}
