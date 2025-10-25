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
}
