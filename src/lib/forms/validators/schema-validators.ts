/**
 * Функции валидации для validation schema
 */

import { ValidationRegistry } from './validation-registry';
import { extractPath, createFieldPath } from './field-path';
import type {
  FieldPathNode,
  ContextualValidatorFn,
  ContextualAsyncValidatorFn,
  TreeValidatorFn,
  ConditionFn,
  ValidateOptions,
  ValidateAsyncOptions,
  ValidateTreeOptions,
  FieldPath,
} from '../types/validation-schema';

// ============================================================================
// validate - Кастомная валидация поля
// ============================================================================

/**
 * Зарегистрировать кастомный синхронный валидатор для поля
 *
 * @example
 * ```typescript
 * validate(path.birthDate, (ctx) => {
 *   const birthDate = new Date(ctx.value());
 *   const age = calculateAge(birthDate);
 *
 *   if (age < 18) {
 *     return {
 *       code: 'tooYoung',
 *       message: 'Заемщику должно быть не менее 18 лет',
 *     };
 *   }
 *
 *   return null;
 * });
 * ```
 */
export function validate<TForm = any, TField = any>(
  fieldPath: FieldPathNode<TForm, TField>,
  validatorFn: ContextualValidatorFn<TForm, TField>,
  options?: ValidateOptions
): void {
  const path = extractPath(fieldPath);
  ValidationRegistry.registerSync(path, validatorFn, options);
}

// ============================================================================
// validateAsync - Асинхронная валидация поля
// ============================================================================

/**
 * Зарегистрировать асинхронный валидатор для поля
 *
 * @example
 * ```typescript
 * validateAsync(
 *   path.inn,
 *   async (ctx) => {
 *     const inn = ctx.value();
 *     if (!inn) return null;
 *
 *     const response = await fetch('/api/validate-inn', {
 *       method: 'POST',
 *       body: JSON.stringify({ inn }),
 *     });
 *
 *     const data = await response.json();
 *     if (!data.valid) {
 *       return {
 *         code: 'invalidInn',
 *         message: 'ИНН не найден в базе данных ФНС',
 *       };
 *     }
 *
 *     return null;
 *   },
 *   { debounce: 1000 }
 * );
 * ```
 */
export function validateAsync<TForm = any, TField = any>(
  fieldPath: FieldPathNode<TForm, TField>,
  validatorFn: ContextualAsyncValidatorFn<TForm, TField>,
  options?: ValidateAsyncOptions
): void {
  const path = extractPath(fieldPath);
  ValidationRegistry.registerAsync(path, validatorFn, options);
}

// ============================================================================
// validateTree - Cross-field валидация
// ============================================================================

/**
 * Зарегистрировать cross-field валидатор
 *
 * Используется для валидации, которая зависит от нескольких полей
 *
 * @example
 * ```typescript
 * validateTree(
 *   (ctx) => {
 *     const form = ctx.formValue();
 *     if (form.initialPayment && form.propertyValue) {
 *       if (form.initialPayment > form.propertyValue) {
 *         return {
 *           code: 'initialPaymentTooHigh',
 *           message: 'Первоначальный взнос не может превышать стоимость',
 *         };
 *       }
 *     }
 *     return null;
 *   },
 *   { targetField: 'initialPayment' }
 * );
 * ```
 */
export function validateTree<TForm = any>(
  validatorFn: TreeValidatorFn<TForm>,
  options?: ValidateTreeOptions
): void {
  ValidationRegistry.registerTree(validatorFn, options);
}

// ============================================================================
// applyWhen - Условная валидация
// ============================================================================

/**
 * Применить валидацию только при выполнении условия
 *
 * @example
 * ```typescript
 * applyWhen(
 *   path.loanType,
 *   (type) => type === 'mortgage',
 *   (path) => {
 *     required(path.propertyValue, { message: 'Укажите стоимость' });
 *     min(path.propertyValue, 1000000);
 *   }
 * );
 * ```
 */
export function applyWhen<TForm = any, TField = any>(
  fieldPath: FieldPathNode<TForm, TField>,
  condition: ConditionFn<TField>,
  validationFn: (path: FieldPath<TForm>) => void
): void {
  const path = extractPath(fieldPath);

  // Входим в условный блок
  ValidationRegistry.enterCondition(path, condition);

  try {
    // Выполняем вложенную валидацию
    // Создаем новый FieldPath proxy для вложенной функции
    const nestedPath = createFieldPath<TForm>();
    validationFn(nestedPath);
  } finally {
    // Выходим из условного блока
    ValidationRegistry.exitCondition();
  }
}

// ============================================================================
// updateOn - Управление триггерами валидации
// ============================================================================

/**
 * Установить триггер валидации для поля
 *
 * @example
 * ```typescript
 * updateOn(path.email, 'blur'); // Валидировать только при потере фокуса
 * ```
 */
export function updateOn<TForm = any, TField = any>(
  fieldPath: FieldPathNode<TForm, TField>,
  trigger: 'change' | 'blur' | 'submit'
): void {
  const path = extractPath(fieldPath);

  // TODO: Реализовать применение updateOn к полю
  // Пока просто логируем
  console.log(`Set updateOn for ${path} to ${trigger}`);
}

// ============================================================================
// Переиспользуемые валидаторы (адаптеры для old-style validators)
// ============================================================================

/**
 * Адаптер для required валидатора
 */
export function required<TForm = any, TField = any>(
  fieldPath: FieldPathNode<TForm, TField>,
  options?: ValidateOptions
): void {
  validate(fieldPath, (ctx) => {
    const value = ctx.value();

    // Проверка на пустое значение
    if (value === null || value === undefined || value === '') {
      return {
        code: 'required',
        message: options?.message || 'Поле обязательно для заполнения',
        params: options?.params,
      };
    }

    // Для булевых значений требуем true
    if (typeof value === 'boolean' && value !== true) {
      return {
        code: 'required',
        message: options?.message || 'Поле обязательно для заполнения',
        params: options?.params,
      };
    }

    return null;
  });
}

/**
 * Адаптер для min валидатора
 */
export function min<TForm = any>(
  fieldPath: FieldPathNode<TForm, number>,
  minValue: number,
  options?: ValidateOptions
): void {
  validate(fieldPath, (ctx) => {
    const value = ctx.value();

    if (value === null || value === undefined) {
      return null; // Пропускаем, если пусто (используйте required для обязательности)
    }

    if (value < minValue) {
      return {
        code: 'min',
        message: options?.message || `Минимальное значение: ${minValue}`,
        params: { min: minValue, actual: value, ...options?.params },
      };
    }

    return null;
  });
}

/**
 * Адаптер для max валидатора
 */
export function max<TForm = any>(
  fieldPath: FieldPathNode<TForm, number>,
  maxValue: number,
  options?: ValidateOptions
): void {
  validate(fieldPath, (ctx) => {
    const value = ctx.value();

    if (value === null || value === undefined) {
      return null;
    }

    if (value > maxValue) {
      return {
        code: 'max',
        message: options?.message || `Максимальное значение: ${maxValue}`,
        params: { max: maxValue, actual: value, ...options?.params },
      };
    }

    return null;
  });
}

/**
 * Адаптер для minLength валидатора
 */
export function minLength<TForm = any>(
  fieldPath: FieldPathNode<TForm, string>,
  minLen: number,
  options?: ValidateOptions
): void {
  validate(fieldPath, (ctx) => {
    const value = ctx.value();

    if (!value) {
      return null;
    }

    if (value.length < minLen) {
      return {
        code: 'minLength',
        message: options?.message || `Минимальная длина: ${minLen} символов`,
        params: { minLength: minLen, actualLength: value.length, ...options?.params },
      };
    }

    return null;
  });
}

/**
 * Адаптер для maxLength валидатора
 */
export function maxLength<TForm = any>(
  fieldPath: FieldPathNode<TForm, string>,
  maxLen: number,
  options?: ValidateOptions
): void {
  validate(fieldPath, (ctx) => {
    const value = ctx.value();

    if (!value) {
      return null;
    }

    if (value.length > maxLen) {
      return {
        code: 'maxLength',
        message: options?.message || `Максимальная длина: ${maxLen} символов`,
        params: { maxLength: maxLen, actualLength: value.length, ...options?.params },
      };
    }

    return null;
  });
}

/**
 * Адаптер для email валидатора
 */
export function email<TForm = any>(
  fieldPath: FieldPathNode<TForm, string>,
  options?: ValidateOptions
): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  validate(fieldPath, (ctx) => {
    const value = ctx.value();

    if (!value) {
      return null;
    }

    if (!emailRegex.test(value)) {
      return {
        code: 'email',
        message: options?.message || 'Неверный формат email',
        params: options?.params,
      };
    }

    return null;
  });
}

/**
 * Адаптер для pattern валидатора
 */
export function pattern<TForm = any>(
  fieldPath: FieldPathNode<TForm, string>,
  regex: RegExp,
  options?: ValidateOptions
): void {
  validate(fieldPath, (ctx) => {
    const value = ctx.value();

    if (!value) {
      return null;
    }

    if (!regex.test(value)) {
      return {
        code: 'pattern',
        message: options?.message || 'Значение не соответствует требуемому формату',
        params: { pattern: regex.source, ...options?.params },
      };
    }

    return null;
  });
}
