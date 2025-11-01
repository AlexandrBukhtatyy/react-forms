/**
 * ArrayNode - узел формы для работы с массивами
 *
 * Управляет массивом форм с поддержкой:
 * - Динамического добавления/удаления элементов
 * - Валидации всех элементов
 * - Реактивного состояния через signals
 */

import { signal, computed, effect } from '@preact/signals-react';
import type { Signal, ReadonlySignal } from '@preact/signals-react';
import { FormNode,  type SetValueOptions } from './form-node';
import { GroupNode } from './group-node';
import type { FieldStatus, ValidationError } from '../../types';
import type { DeepFormSchema } from '../../types/deep-schema';
import type { GroupNodeWithControls } from '../../types/group-node-proxy';

/**
 * ArrayNode - массив форм с реактивным состоянием
 *
 * @example
 * ```typescript
 * const array = new ArrayNode({
 *   title: { value: '', component: Input },
 *   price: { value: 0, component: Input },
 * });
 *
 * array.push({ title: 'Item 1', price: 100 });
 * array.at(0)?.title.setValue('Updated');
 * console.log(array.length.value); // 1
 * ```
 */
export class ArrayNode<T = any> extends FormNode<T[]> {
  // ============================================================================
  // Приватные поля
  // ============================================================================

  private items: Signal<FormNode<T>[]>;
  private itemSchema: DeepFormSchema<T>;

  // ============================================================================
  // Публичные computed signals
  // ============================================================================

  public readonly value: ReadonlySignal<T[]>;
  public readonly valid: ReadonlySignal<boolean>;
  public readonly invalid: ReadonlySignal<boolean>;
  public readonly touched: ReadonlySignal<boolean>;
  public readonly dirty: ReadonlySignal<boolean>;
  public readonly pending: ReadonlySignal<boolean>;
  public readonly errors: ReadonlySignal<ValidationError[]>;
  public readonly status: ReadonlySignal<FieldStatus>;
  public readonly length: ReadonlySignal<number>;

  // ============================================================================
  // Конструктор
  // ============================================================================

  constructor(schema: DeepFormSchema<T>, initialItems: Partial<T>[] = []) {
    super();

    this.itemSchema = schema;
    this.items = signal<FormNode<T>[]>([]);

    // Создать начальные элементы
    for (const initialValue of initialItems) {
      this.push(initialValue);
    }

    // ============================================================================
    // Computed signals
    // ============================================================================

    this.length = computed(() => this.items.value.length);

    this.value = computed(() =>
      this.items.value.map((item) => item.value.value as T)
    );

    this.valid = computed(() =>
      this.items.value.every((item) => item.valid.value)
    );

    this.invalid = computed(() => !this.valid.value);

    this.pending = computed(() =>
      this.items.value.some((item) => item.pending.value)
    );

    this.touched = computed(() =>
      this.items.value.some((item) => item.touched.value)
    );

    this.dirty = computed(() =>
      this.items.value.some((item) => item.dirty.value)
    );

    this.errors = computed(() => {
      const allErrors: ValidationError[] = [];
      this.items.value.forEach((item) => {
        allErrors.push(...item.errors.value);
      });
      return allErrors;
    });

    this.status = computed(() => {
      if (this.pending.value) return 'pending';
      if (this.invalid.value) return 'invalid';
      return 'valid';
    });
  }

  // ============================================================================
  // CRUD операции
  // ============================================================================

  /**
   * Добавить элемент в конец массива
   * @param initialValue - Начальные значения для нового элемента
   */
  push(initialValue?: Partial<T>): void {
    const newItem = this.createItem(initialValue);
    this.items.value = [...this.items.value, newItem];
  }

  /**
   * Удалить элемент по индексу
   * @param index - Индекс элемента для удаления
   */
  removeAt(index: number): void {
    if (index < 0 || index >= this.items.value.length) {
      if (import.meta.env.DEV) {
        console.warn(`ArrayNode: index ${index} out of bounds (length: ${this.items.value.length})`);
      }
      return;
    }
    this.items.value = this.items.value.filter((_, i) => i !== index);
  }

  /**
   * Вставить элемент в массив
   * @param index - Индекс для вставки
   * @param initialValue - Начальные значения для нового элемента
   */
  insert(index: number, initialValue?: Partial<T>): void {
    if (index < 0 || index > this.items.value.length) {
      if (import.meta.env.DEV) {
        console.warn(`ArrayNode: index ${index} out of bounds (length: ${this.items.value.length})`);
      }
      return;
    }

    const newItem = this.createItem(initialValue);
    const newItems = [...this.items.value];
    newItems.splice(index, 0, newItem);
    this.items.value = newItems;
  }

  /**
   * Удалить все элементы массива
   */
  clear(): void {
    this.items.value = [];
  }

  /**
   * Получить элемент по индексу
   * @param index - Индекс элемента
   * @returns Типизированный GroupNode или undefined если индекс вне границ
   */
  at(index: number): GroupNodeWithControls<T> | undefined {
    return this.items.value[index] as GroupNodeWithControls<T> | undefined;
  }

  // ============================================================================
  // Реализация абстрактных методов
  // ============================================================================

  getValue(): T[] {
    return this.items.value.map((item) => item.getValue());
  }

  setValue(values: T[], options?: SetValueOptions): void {
    this.clear();
    values.forEach((value) => this.push(value));
  }

  patchValue(values: Partial<T>[]): void {
    values.forEach((value, index) => {
      if (this.items.value[index]) {
        this.items.value[index].patchValue(value);
      }
    });
  }

  reset(values?: T[]): void {
    this.clear();
    if (values) {
      values.forEach((value) => this.push(value));
    }
  }

  async validate(): Promise<boolean> {
    const results = await Promise.all(
      this.items.value.map((item) => item.validate())
    );
    return results.every(Boolean);
  }

  setErrors(errors: ValidationError[]): void {
    // ArrayNode level errors - можно реализовать позже
    // Пока просто игнорируем
  }

  clearErrors(): void {
    this.items.value.forEach((item) => item.clearErrors());
  }

  markAsTouched(): void {
    this.items.value.forEach((item) => item.markAsTouched());
  }

  markAsUntouched(): void {
    this.items.value.forEach((item) => item.markAsUntouched());
  }

  markAsDirty(): void {
    this.items.value.forEach((item) => item.markAsDirty());
  }

  markAsPristine(): void {
    this.items.value.forEach((item) => item.markAsPristine());
  }

  // ============================================================================
  // Итерация
  // ============================================================================

  /**
   * Итерировать по элементам массива
   * @param callback - Функция, вызываемая для каждого элемента с типизированным GroupNode
   */
  forEach(callback: (item: GroupNodeWithControls<T>, index: number) => void): void {
    this.items.value.forEach((item, index) => {
      callback(item as GroupNodeWithControls<T>, index);
    });
  }

  /**
   * Маппинг элементов массива
   * @param callback - Функция преобразования с типизированным GroupNode
   * @returns Новый массив результатов
   */
  map<R>(callback: (item: GroupNodeWithControls<T>, index: number) => R): R[] {
    return this.items.value.map((item, index) => {
      return callback(item as GroupNodeWithControls<T>, index);
    });
  }

  // ============================================================================
  // Private методы
  // ============================================================================

  /**
   * Создать новый элемент массива на основе схемы
   * @param initialValue - Начальные значения
   */
  private createItem(initialValue?: Partial<T>): FormNode<T> {
    // Определить тип узла на основе схемы
    if (this.isGroupSchema(this.itemSchema)) {
      const node = new GroupNode(this.itemSchema as any);
      if (initialValue) {
        node.patchValue(initialValue);
      }

      // Применяем validation schema к новому элементу, если она была установлена
      const validationSchemaFn = (this as any).validationSchemaFn;
      if (validationSchemaFn && 'applyValidationSchema' in node) {
        node.applyValidationSchema(validationSchemaFn);
      }

      return node as any;
    }

    // Если схема - FieldConfig, ArrayNode не поддерживает примитивные массивы
    throw new Error(
      'ArrayNode поддерживает только GroupNode элементы. ' +
      'Для массива примитивов используйте обычное поле с типом массива.'
    );
  }

  /**
   * Проверить, является ли схема групповой (объект полей)
   * @param schema - Схема для проверки
   */
  private isGroupSchema(schema: any): boolean {
    return (
      typeof schema === 'object' &&
      schema !== null &&
      !('component' in schema) &&
      !Array.isArray(schema)
    );
  }

  // ============================================================================
  // Validation Schema
  // ============================================================================

  /**
   * Применить validation schema ко всем элементам массива
   *
   * Validation schema будет применена к:
   * - Всем существующим элементам
   * - Всем новым элементам, добавляемым через push/insert
   *
   * @param schemaFn - Функция валидации для элемента массива
   *
   * @example
   * ```typescript
   * import { propertyValidation } from './validation/property-validation';
   *
   * form.properties.applyValidationSchema(propertyValidation);
   * ```
   */
  applyValidationSchema(schemaFn: any): void {
    // Сохраняем validation schema для применения к новым элементам
    (this as any).validationSchemaFn = schemaFn;

    // Применяем validation schema ко всем существующим элементам
    this.items.value.forEach((item) => {
      if ('applyValidationSchema' in item && typeof item.applyValidationSchema === 'function') {
        item.applyValidationSchema(schemaFn);
      }
    });
  }

  // ============================================================================
  // Методы-помощники для реактивности (Фаза 1)
  // ============================================================================

  /**
   * Подписка на изменения конкретного поля во всех элементах массива
   * Срабатывает при изменении значения поля в любом элементе
   *
   * @param fieldKey - Ключ поля для отслеживания
   * @param callback - Функция, вызываемая при изменении, получает массив всех значений и индекс измененного элемента
   * @returns Функция отписки для cleanup
   *
   * @example
   * ```typescript
   * // Автоматический пересчет общей стоимости при изменении цен
   * const dispose = form.existingLoans.watchItems(
   *   'remainingAmount',
   *   (amounts) => {
   *     const totalDebt = amounts.reduce((sum, amount) => sum + (amount || 0), 0);
   *     form.totalDebt.setValue(totalDebt);
   *   }
   * );
   *
   * // При изменении любого remainingAmount → пересчитается totalDebt
   * form.existingLoans.at(0)?.remainingAmount.setValue(500000);
   *
   * // Cleanup
   * useEffect(() => dispose, []);
   * ```
   */
  watchItems<K extends keyof T>(
    fieldKey: K,
    callback: (values: Array<T[K] | undefined>) => void | Promise<void>
  ): () => void {
    return effect(() => {
      // Отслеживаем изменения всех элементов массива
      const values = this.items.value.map((item) => {
        if (item instanceof GroupNode) {
          const field = item.fields.get(fieldKey as string);
          return field?.value.value as T[K];
        }
        return undefined;
      });

      callback(values);
    });
  }

  /**
   * Подписка на изменение длины массива
   * Срабатывает при добавлении/удалении элементов
   *
   * @param callback - Функция, вызываемая при изменении длины, получает новую длину
   * @returns Функция отписки для cleanup
   *
   * @example
   * ```typescript
   * // Обновление счетчика элементов в UI
   * const dispose = form.properties.watchLength((length) => {
   *   console.log(`Количество объектов недвижимости: ${length}`);
   *   form.propertyCount.setValue(length);
   * });
   *
   * form.properties.push({ title: 'Квартира', value: 5000000 });
   * // Выведет: "Количество объектов недвижимости: 1"
   *
   * // Cleanup
   * useEffect(() => dispose, []);
   * ```
   */
  watchLength(callback: (length: number) => void | Promise<void>): () => void {
    return effect(() => {
      const currentLength = this.length.value;
      callback(currentLength);
    });
  }
}
