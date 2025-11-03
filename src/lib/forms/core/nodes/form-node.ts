/**
 * FormNode - абстрактный базовый класс для всех узлов формы
 *
 * Аналог AbstractControl из Angular Forms
 * Унифицирует работу с полями (FieldNode), группами (GroupNode) и массивами (ArrayNode)
 */

import type { ReadonlySignal } from '@preact/signals-react';
import type { ValidationError, FieldStatus } from '../../types';

/**
 * Опции для setValue
 */
export interface SetValueOptions {
  /** Не вызывать событие изменения (не триггерить валидацию) */
  emitEvent?: boolean;
  /** Обновить только этот узел, не распространять на родителей */
  onlySelf?: boolean;
}

/**
 * Абстрактный базовый класс для всех узлов формы
 *
 * Все узлы (поля, группы, массивы) наследуют от этого класса
 * и реализуют единый интерфейс для работы с состоянием и валидацией
 */
export abstract class FormNode<T = any> {
  // ============================================================================
  // Реактивные signals (должны быть реализованы в подклассах)
  // ============================================================================

  /**
   * Текущее значение узла
   * - Для FieldNode: значение поля
   * - Для GroupNode: объект со значениями всех полей
   * - Для ArrayNode: массив значений элементов
   */
  abstract readonly value: ReadonlySignal<T>;

  /**
   * Узел валиден (все валидаторы прошли успешно)
   */
  abstract readonly valid: ReadonlySignal<boolean>;

  /**
   * Узел невалиден (есть ошибки валидации)
   */
  abstract readonly invalid: ReadonlySignal<boolean>;

  /**
   * Пользователь взаимодействовал с узлом (touched)
   */
  abstract readonly touched: ReadonlySignal<boolean>;

  /**
   * Значение узла было изменено (dirty)
   */
  abstract readonly dirty: ReadonlySignal<boolean>;

  /**
   * Выполняется асинхронная валидация
   */
  abstract readonly pending: ReadonlySignal<boolean>;

  /**
   * Массив ошибок валидации
   */
  abstract readonly errors: ReadonlySignal<ValidationError[]>;

  /**
   * Текущий статус узла
   */
  abstract readonly status: ReadonlySignal<FieldStatus>;

  // ============================================================================
  // Методы управления значениями
  // ============================================================================

  /**
   * Получить значение узла (non-reactive)
   * Использует .peek() для получения значения без создания зависимости
   */
  abstract getValue(): T;

  /**
   * Установить значение узла
   * @param value - новое значение
   * @param options - опции установки значения
   */
  abstract setValue(value: T, options?: SetValueOptions): void;

  /**
   * Частично обновить значение узла
   * Для FieldNode: работает как setValue
   * Для GroupNode: обновляет только указанные поля
   * Для ArrayNode: обновляет только указанные элементы
   *
   * @param value - частичное значение для обновления
   */
  abstract patchValue(value: Partial<T>): void;

  /**
   * Сбросить узел к начальному состоянию
   * @param value - опциональное новое начальное значение
   */
  abstract reset(value?: T): void;

  // ============================================================================
  // Методы валидации
  // ============================================================================

  /**
   * Запустить валидацию узла
   * @returns Promise<boolean> - true если валидация успешна
   */
  abstract validate(): Promise<boolean>;

  /**
   * Установить ошибки валидации извне
   * @param errors - массив ошибок
   */
  abstract setErrors(errors: ValidationError[]): void;

  /**
   * Очистить ошибки валидации
   */
  abstract clearErrors(): void;

  // ============================================================================
  // Методы управления состоянием
  // ============================================================================

  /**
   * Отметить узел как touched (пользователь взаимодействовал)
   */
  abstract markAsTouched(): void;

  /**
   * Отметить узел как untouched
   */
  abstract markAsUntouched(): void;

  /**
   * Отметить узел как dirty (значение изменено)
   */
  abstract markAsDirty(): void;

  /**
   * Отметить узел как pristine (значение не изменено)
   */
  abstract markAsPristine(): void;

  /**
   * Пометить все поля (включая вложенные) как touched
   * Алиас для markAsTouched(), но более явно показывает намерение
   * пометить ВСЕ поля рекурсивно
   *
   * Полезно для:
   * - Показа всех ошибок валидации перед submit
   * - Принудительного отображения ошибок при нажатии "Validate All"
   * - Отображения невалидных полей в wizard/step form
   *
   * @example
   * ```typescript
   * // Показать все ошибки перед submit
   * form.touchAll();
   * const isValid = await form.validate();
   * if (!isValid) {
   *   // Все ошибки теперь видны пользователю
   * }
   *
   * // Или использовать submit() который уже вызывает touchAll
   * await form.submit(async (values) => {
   *   await api.save(values);
   * });
   * ```
   */
  touchAll(): void {
    this.markAsTouched();
  }

  // ============================================================================
  // Опциональные методы (могут быть реализованы в подклассах)
  // ============================================================================

  /**
   * Отключить узел
   * Отключенные узлы не проходят валидацию и не включаются в getValue()
   */
  disable?(): void;

  /**
   * Включить узел
   */
  enable?(): void;

  /**
   * Очистить все ресурсы узла
   * Должен вызываться при unmount компонента для предотвращения memory leaks
   *
   * @example
   * ```typescript
   * // React component
   * useEffect(() => {
   *   return () => {
   *     form.dispose(); // Cleanup при unmount
   *   };
   * }, []);
   * ```
   */
  dispose?(): void;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard для проверки, является ли узел FieldNode
 *
 * @param node - проверяемый узел
 * @returns true если node является FieldNode
 *
 * @example
 * ```typescript
 * if (isFieldNode(node)) {
 *   // TypeScript знает, что node - это FieldNode
 *   node.markAsTouched();
 * }
 * ```
 */
export function isFieldNode<T = any>(node: FormNode<any>): node is import('./field-node').FieldNode<T> {
  return Boolean(
    node &&
    typeof node === 'object' &&
    'touched' in node &&
    'dirty' in node &&
    // FieldNode имеет markAsTouched, но GroupNode/ArrayNode нет (они итерируются)
    typeof (node as any).markAsTouched === 'function' &&
    // У FieldNode нет fields/items
    !('fields' in node) &&
    !('items' in node)
  );
}

/**
 * Type guard для проверки, является ли узел GroupNode
 *
 * @param node - проверяемый узел
 * @returns true если node является GroupNode
 *
 * @example
 * ```typescript
 * if (isGroupNode(node)) {
 *   // TypeScript знает, что node - это GroupNode
 *   node.applyValidationSchema(schema);
 * }
 * ```
 */
export function isGroupNode<T = any>(node: FormNode<any>): node is import('./group-node').GroupNode<T> {
  return Boolean(
    node &&
    typeof node === 'object' &&
    'applyValidationSchema' in node &&
    'applyBehaviorSchema' in node &&
    // GroupNode имеет fields Map, но ArrayNode имеет items
    !('items' in node) &&
    !('push' in node) &&
    !('removeAt' in node)
  );
}

/**
 * Type guard для проверки, является ли узел ArrayNode
 *
 * @param node - проверяемый узел
 * @returns true если node является ArrayNode
 *
 * @example
 * ```typescript
 * if (isArrayNode(node)) {
 *   // TypeScript знает, что node - это ArrayNode
 *   node.push({ name: 'New Item' });
 * }
 * ```
 */
export function isArrayNode<T = any>(node: FormNode<any>): node is import('./array-node').ArrayNode<T> {
  return Boolean(
    node &&
    typeof node === 'object' &&
    'length' in node &&
    'push' in node &&
    'removeAt' in node &&
    'at' in node &&
    typeof (node as any).push === 'function'
  );
}
