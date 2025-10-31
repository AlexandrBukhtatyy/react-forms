/**
 * Типы и интерфейсы для Behavior Schema API
 */

import type { FormNode } from '../core/nodes/form-node';
import type { ValidationError } from '../types';

/**
 * Тип функции behavior схемы
 * Принимает FieldPath и описывает поведение формы
 */
export type BehaviorSchemaFn<T> = (path: FieldPath<T>) => void;

/**
 * FieldPath - типизированный путь к полям формы
 * Генерируется через createFieldPath() аналогично ValidationSchema
 */
export type FieldPath<T> = {
  [K in keyof T]: FieldPathNode<T, T[K]>;
};

/**
 * Узел пути к полю с метаданными
 */
export interface FieldPathNode<TForm, TField> {
  /** Строковый путь к полю (например, "address.city") */
  __fieldPath: string;
  /** Тип формы */
  __formType?: TForm;
  /** Тип поля */
  __fieldType?: TField;
}

/**
 * Контекст для behavior callback функций
 * Предоставляет методы для работы с формой
 */
export interface BehaviorContext<TForm> {
  /**
   * Получить значение поля по строковому пути
   * @param path - Путь к полю (например, "address.city")
   */
  getField<K extends keyof TForm>(path: string): any;

  /**
   * Установить значение поля по строковому пути
   * @param path - Путь к полю
   * @param value - Новое значение
   */
  setField<K extends keyof TForm>(path: string, value: any): void;

  /**
   * Обновить componentProps поля
   * @param field - FieldPathNode поля
   * @param props - Частичные пропсы для обновления
   */
  updateComponentProps(
    field: FieldPathNode<TForm, any>,
    props: Record<string, any>
  ): void;

  /**
   * Перевалидировать поле
   * @param field - FieldPathNode поля
   */
  validateField(field: FieldPathNode<TForm, any>): Promise<boolean>;

  /**
   * Установить ошибки поля
   * @param field - FieldPathNode поля
   * @param errors - Массив ошибок валидации
   */
  setErrors(field: FieldPathNode<TForm, any>, errors: ValidationError[]): void;

  /**
   * Очистить ошибки поля
   * @param field - FieldPathNode поля
   */
  clearErrors(field: FieldPathNode<TForm, any>): void;

  /**
   * Получить всю форму целиком
   */
  getForm(): TForm;
}

/**
 * Тип behavior регистрации
 */
export type BehaviorType =
  | 'copy' // Копирование значений между полями
  | 'enable' // Условное enable/disable
  | 'show' // Условное show/hide
  | 'compute' // Вычисляемые поля
  | 'watch' // Подписка на изменения
  | 'revalidate' // Перевалидация при изменении
  | 'sync'; // Двусторонняя синхронизация

/**
 * Регистрация behavior в реестре
 */
export interface BehaviorRegistration<TForm = any> {
  /** Тип поведения */
  type: BehaviorType;

  /** Поле-источник (для copy, compute, watch) */
  sourceField?: FieldPathNode<TForm, any>;

  /** Поля-источники (для compute) */
  sourceFields?: FieldPathNode<TForm, any>[];

  /** Поле-цель (для copy, enable, show, compute) */
  targetField?: FieldPathNode<TForm, any>;

  /** Условие применения */
  condition?: (form: TForm) => boolean;

  /** Callback функция */
  callback?: (
    value: any,
    node: FormNode<any> | undefined,
    context: BehaviorContext<TForm>
  ) => void | Promise<void>;

  /** Функция вычисления (для compute) */
  computeFn?: (...values: any[]) => any;

  /** Функция трансформации (для copy) */
  transform?: (value: any) => any;

  /** Поля для копирования (для copy групп) */
  fields?: string[] | 'all';

  /** Debounce в миллисекундах */
  debounce?: number;

  /** Вызвать сразу при инициализации (для watch) */
  immediate?: boolean;

  /** Сбросить значение при disable (для enable) */
  resetOnDisable?: boolean;

  /** Триггер для вычислений (для compute) */
  trigger?: 'change' | 'blur';

  /** Дополнительные опции */
  options?: Record<string, any>;
}

/**
 * Опции для copyFrom
 */
export interface CopyFromOptions<TForm, TSource> {
  /** Условие копирования */
  when?: (form: TForm) => boolean;

  /** Какие поля копировать (для групп) */
  fields?: keyof TSource[] | 'all';

  /** Трансформация значения */
  transform?: (value: TSource) => any;

  /** Debounce в мс */
  debounce?: number;
}

/**
 * Опции для enableWhen/disableWhen
 */
export interface EnableWhenOptions {
  /** Сбросить значение при disable */
  resetOnDisable?: boolean;

  /** Debounce в мс */
  debounce?: number;
}

/**
 * Опции для computeFrom
 */
export interface ComputeFromOptions<TForm> {
  /** Когда вычислять */
  trigger?: 'change' | 'blur';

  /** Debounce в мс */
  debounce?: number;

  /** Условие применения */
  condition?: (form: TForm) => boolean;
}

/**
 * Опции для watchField
 */
export interface WatchFieldOptions {
  /** Debounce в мс */
  debounce?: number;

  /** Вызвать сразу при инициализации */
  immediate?: boolean;
}

/**
 * Опции для revalidateWhen
 */
export interface RevalidateWhenOptions {
  /** Debounce в мс */
  debounce?: number;
}

/**
 * Опции для syncFields
 */
export interface SyncFieldsOptions<T> {
  /** Трансформация значения */
  transform?: (value: T) => T;

  /** Debounce в мс */
  debounce?: number;
}
