/**
 * Типы для validation schema паттерна
 *
 * Основано на Angular Signal Forms подходе:
 * - Валидация определяется отдельно от схемы полей
 * - Поддержка условной валидации (applyWhen)
 * - Cross-field валидация (validateTree)
 * - Асинхронная валидация с контекстом
 */

import type { GroupNode } from '../core/nodes/group-node';
import type { FieldNode } from '../core/nodes/field-node';
import type { ValidationError } from './index';

// ============================================================================
// Контекст валидации
// ============================================================================

/**
 * Контекст валидации для отдельного поля
 * Предоставляет доступ к:
 * - Значению текущего поля
 * - Значениям других полей
 * - Всей форме
 */
export interface ValidationContext<TForm = any, TField = any> {
  /**
   * Получить текущее значение поля
   */
  value(): TField;

  /**
   * Получить значение другого поля по пути
   * @param path - Путь к полю (например, 'loanType', 'personalData.firstName')
   */
  getField<K extends keyof TForm>(path: K): TForm[K];
  getField(path: string): any;

  /**
   * Установить значение другого поля по пути
   * @param path - Путь к полю (например, 'loanType', 'personalData.firstName')
   * @param value - Новое значение поля
   */
  setField<K extends keyof TForm>(path: K, value: TForm[K]): void;
  setField(path: string, value: any): void;

  /**
   * Получить значения всей формы
   */
  formValue(): TForm;

  /**
   * Получить контроллер поля
   */
  getControl(): FieldNode<TField>;

  /**
   * Получить GroupNode
   */
  getForm(): GroupNode<TForm>;
}

/**
 * Контекст для cross-field валидации
 * Имеет доступ ко всей форме, но не к конкретному полю
 */
export interface TreeValidationContext<TForm = any> {
  /**
   * Получить значение поля по пути
   */
  getField<K extends keyof TForm>(path: K): TForm[K];
  getField(path: string): any;

  /**
   * Получить значения всей формы
   */
  formValue(): TForm;

  /**
   * Получить GroupNode
   */
  getForm(): GroupNode<TForm>;
}

// ============================================================================
// Функции валидации
// ============================================================================

/**
 * Функция валидации поля с контекстом
 */
export type ContextualValidatorFn<TForm = any, TField = any> = (
  ctx: ValidationContext<TForm, TField>
) => ValidationError | null;

/**
 * Асинхронная функция валидации поля с контекстом
 */
export type ContextualAsyncValidatorFn<TForm = any, TField = any> = (
  ctx: ValidationContext<TForm, TField>
) => Promise<ValidationError | null>;

/**
 * Функция cross-field валидации
 */
export type TreeValidatorFn<TForm = any> = (
  ctx: TreeValidationContext<TForm>
) => ValidationError | null;

/**
 * Функция условия для applyWhen
 */
export type ConditionFn<T = any> = (value: T) => boolean;

// ============================================================================
// FieldPath - proxy для доступа к путям полей
// ============================================================================

/**
 * FieldPath предоставляет типобезопасный доступ к путям полей формы
 *
 * Использование:
 * ```typescript
 * const validation = (path: FieldPath<MyForm>) => {
 *   required(path.email, { message: 'Email обязателен' });
 *   applyWhen(
 *     path.loanType,
 *     (type) => type === 'mortgage',
 *     (path) => {
 *       required(path.propertyValue, { message: 'Укажите стоимость' });
 *     }
 *   );
 * };
 * ```
 */
export type FieldPath<T> = {
  [K in keyof T]: FieldPathNode<T, T[K], K>;
};

/**
 * Узел в пути поля
 * Содержит метаинформацию о поле для валидации
 */
export interface FieldPathNode<TForm, TField, TKey extends keyof TForm = any> {
  /** Ключ поля */
  readonly __key: TKey;
  /** Путь к полю (для вложенных объектов) */
  readonly __path: string;
  /** Тип формы */
  readonly __formType?: TForm;
  /** Тип поля */
  readonly __fieldType?: TField;
}

// ============================================================================
// Опции валидации
// ============================================================================

/**
 * Опции для функции validate
 */
export interface ValidateOptions {
  /** Сообщение об ошибке */
  message?: string;
  /** Параметры ошибки */
  params?: Record<string, any>;
}

/**
 * Опции для функции validateAsync
 */
export interface ValidateAsyncOptions extends ValidateOptions {
  /** Задержка перед выполнением валидации (в мс) */
  debounce?: number;
}

/**
 * Опции для функции validateTree
 */
export interface ValidateTreeOptions {
  /** Поле, к которому привязать ошибку */
  targetField?: string;
}

// ============================================================================
// Тип функции validation schema
// ============================================================================

/**
 * Функция validation schema
 *
 * Принимает FieldPath и определяет все правила валидации для формы
 */
export type ValidationSchemaFn<T> = (path: FieldPath<T>) => void;

// ============================================================================
// Внутренние типы для реализации
// ============================================================================

/**
 * Регистрация валидатора в системе
 * @internal
 */
export interface ValidatorRegistration {
  fieldPath: string;
  type: 'sync' | 'async' | 'tree';
  validator: ContextualValidatorFn | ContextualAsyncValidatorFn | TreeValidatorFn;
  options?: ValidateOptions | ValidateAsyncOptions | ValidateTreeOptions;
  condition?: {
    fieldPath: string;
    conditionFn: ConditionFn;
  };
}
