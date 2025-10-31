/**
 * FieldNode - узел поля формы
 *
 * Представляет одно поле формы с валидацией и состоянием
 * Наследует от FormNode и реализует все его абстрактные методы
 */

import { signal, computed, effect } from '@preact/signals-react';
import type { Signal, ReadonlySignal } from '@preact/signals-react';
import { FormNode } from './form-node';
import type { SetValueOptions }  from "./form-node"
import type {
  FieldConfig,
  ValidationError,
  FieldStatus,
  ValidatorFn,
  AsyncValidatorFn,
} from '../../types';

/**
 * FieldNode - узел для отдельного поля формы
 *
 * @example
 * ```typescript
 * const field = new FieldNode({
 *   value: '',
 *   component: Input,
 *   validators: [required, email],
 * });
 *
 * field.setValue('test@mail.com');
 * await field.validate();
 * console.log(field.valid.value); // true
 * ```
 */
export class FieldNode<T = any> extends FormNode<T> {
  // ============================================================================
  // Приватные сигналы
  // ============================================================================

  private _value: Signal<T>;
  private _errors: Signal<ValidationError[]>;
  private _touched: Signal<boolean>;
  private _dirty: Signal<boolean>;
  private _status: Signal<FieldStatus>;
  private _pending: Signal<boolean>;
  private _componentProps: Signal<Record<string, any>>;

  // ============================================================================
  // Публичные computed signals
  // ============================================================================

  public readonly value: ReadonlySignal<T>;
  public readonly valid: ReadonlySignal<boolean>;
  public readonly invalid: ReadonlySignal<boolean>;
  public readonly touched: ReadonlySignal<boolean>;
  public readonly dirty: ReadonlySignal<boolean>;
  public readonly pending: ReadonlySignal<boolean>;
  public readonly errors: ReadonlySignal<ValidationError[]>;
  public readonly status: ReadonlySignal<FieldStatus>;
  public readonly componentProps: ReadonlySignal<Record<string, any>>;

  /**
   * Вычисляемое свойство: нужно ли показывать ошибку
   * Ошибка показывается если поле невалидно И (touched ИЛИ dirty)
   */
  public readonly shouldShowError: ReadonlySignal<boolean>;

  // ============================================================================
  // Конфигурация
  // ============================================================================

  private validators: ValidatorFn<T>[];
  private asyncValidators: AsyncValidatorFn<T>[];
  private updateOn: 'change' | 'blur' | 'submit';
  private initialValue: T;
  private currentValidationId = 0;
  private debounceMs: number;
  private validateDebounceTimer?: ReturnType<typeof setTimeout>;

  public readonly component: FieldConfig<T>['component'];

  // ============================================================================
  // Конструктор
  // ============================================================================

  constructor(config: FieldConfig<T>) {
    super();

    // Сохраняем конфигурацию
    this.initialValue = config.value;
    this.validators = config.validators || [];
    this.asyncValidators = config.asyncValidators || [];
    this.updateOn = config.updateOn || 'change';
    this.debounceMs = config.debounce || 0;
    this.component = config.component;

    // Инициализация приватных сигналов
    this._value = signal(config.value);
    this._errors = signal<ValidationError[]>([]);
    this._touched = signal(false);
    this._dirty = signal(false);
    this._status = signal<FieldStatus>(config.disabled ? 'disabled' : 'valid');
    this._pending = signal(false);
    this._componentProps = signal(config.componentProps || {});

    // Создание computed signals
    this.value = computed(() => this._value.value);
    this.valid = computed(() => this._status.value === 'valid');
    this.invalid = computed(() => this._status.value === 'invalid');
    this.touched = computed(() => this._touched.value);
    this.dirty = computed(() => this._dirty.value);
    this.pending = computed(() => this._pending.value);
    this.errors = computed(() => this._errors.value);
    this.status = computed(() => this._status.value);
    this.componentProps = computed(() => this._componentProps.value);
    this.shouldShowError = computed(
      () =>
        this._status.value === 'invalid' &&
        (this._touched.value || this._dirty.value)
    );
  }

  // ============================================================================
  // Реализация абстрактных методов FormNode
  // ============================================================================

  getValue(): T {
    return this._value.peek();
  }

  setValue(value: T, options?: SetValueOptions): void {
    this._value.value = value;
    this._dirty.value = true;

    if (options?.emitEvent === false) {
      return;
    }

    const hasOwnValidators = this.validators.length > 0 || this.asyncValidators.length > 0;
    const hasErrors = this._errors.value.length > 0;

    // 1. Если updateOn === 'change' → всегда валидируем
    if (this.updateOn === 'change') {
      this.validate();
      return;
    }

    // 2. Если у поля есть ошибки и собственные валидаторы
    //    → валидируем при каждом изменении
    //    Поведение:
    //    - Если значение некорректно → обновляем/показываем ошибку
    //    - Если значение корректно → скрываем ошибку
    if (hasErrors && hasOwnValidators) {
      this.validate();
    }
  }

  patchValue(value: Partial<T>): void {
    this.setValue(value as T);
  }

  reset(value?: T): void {
    this._value.value = value !== undefined ? value : this.initialValue;
    this._errors.value = [];
    this._touched.value = false;
    this._dirty.value = false;
    this._status.value = 'valid';
  }

  async validate(options?: { debounce?: number }): Promise<boolean> {
    const debounce = options?.debounce ?? this.debounceMs;

    // Если задан debounce, откладываем валидацию
    if (debounce > 0 && this.asyncValidators.length > 0) {
      return new Promise((resolve) => {
        // Отменяем предыдущий таймер
        if (this.validateDebounceTimer) {
          clearTimeout(this.validateDebounceTimer);
        }

        this.validateDebounceTimer = setTimeout(async () => {
          const result = await this.validateImmediate();
          resolve(result);
        }, debounce);
      });
    }

    return this.validateImmediate();
  }

  private async validateImmediate(): Promise<boolean> {
    const validationId = ++this.currentValidationId;

    // Синхронная валидация
    const syncErrors: ValidationError[] = [];
    for (const validator of this.validators) {
      const error = validator(this._value.value);
      if (error) syncErrors.push(error);
    }

    if (syncErrors.length > 0) {
      this._errors.value = syncErrors;
      this._status.value = 'invalid';
      return false;
    }

    // Асинхронная валидация - ПАРАЛЛЕЛЬНО
    if (this.asyncValidators.length > 0) {
      this._pending.value = true;
      this._status.value = 'pending';

      // Выполняем все async валидаторы параллельно
      const asyncResults = await Promise.all(
        this.asyncValidators.map((validator) => validator(this._value.value))
      );

      // Проверяем, не была ли запущена новая валидация
      if (validationId !== this.currentValidationId) {
        return false; // Эта валидация устарела
      }

      this._pending.value = false;

      const asyncErrors = asyncResults.filter(Boolean) as ValidationError[];
      if (asyncErrors.length > 0) {
        this._errors.value = asyncErrors;
        this._status.value = 'invalid';
        return false;
      }
    }

    // ✅ Очищаем ошибки только если у поля есть собственные валидаторы
    // Если валидаторов нет, значит используется ValidationSchema на уровне формы
    // и ошибки устанавливаются извне через setErrors()
    const hasOwnValidators =
      this.validators.length > 0 || this.asyncValidators.length > 0;

    if (hasOwnValidators) {
      this._errors.value = [];
      this._status.value = 'valid';
    }

    return this._errors.value.length === 0;
  }

  setErrors(errors: ValidationError[]): void {
    this._errors.value = errors;
    this._status.value = errors.length > 0 ? 'invalid' : 'valid';
  }

  clearErrors(): void {
    this._errors.value = [];
    this._status.value = 'valid';
  }

  markAsTouched(): void {
    this._touched.value = true;

    if (this.updateOn === 'blur') {
      this.validate();
    }
  }

  markAsUntouched(): void {
    this._touched.value = false;
  }

  markAsDirty(): void {
    this._dirty.value = true;
  }

  markAsPristine(): void {
    this._dirty.value = false;
  }

  disable(): void {
    this._status.value = 'disabled';
  }

  enable(): void {
    this._status.value = 'valid';
    this.validate();
  }

  /**
   * Обновляет свойства компонента (например, опции для Select)
   *
   * @example
   * ```typescript
   * // Обновление опций для Select после загрузки справочников
   * form.registrationAddress.city.updateComponentProps({
   *   options: cities
   * });
   * ```
   */
  updateComponentProps(props: Partial<Record<string, any>>): void {
    this._componentProps.value = {
      ...this._componentProps.value,
      ...props,
    };
  }

  // ============================================================================
  // Методы-помощники для реактивности (Фаза 1)
  // ============================================================================

  /**
   * Подписка на изменения значения поля
   * Автоматически отслеживает изменения через @preact/signals effect
   *
   * @param callback - Функция, вызываемая при изменении значения
   * @returns Функция отписки для cleanup
   *
   * @example
   * ```typescript
   * const unsubscribe = form.email.watch((value) => {
   *   console.log('Email changed:', value);
   * });
   *
   * // Cleanup
   * useEffect(() => unsubscribe, []);
   * ```
   */
  watch(callback: (value: T) => void | Promise<void>): () => void {
    return effect(() => {
      const currentValue = this.value.value; // track changes
      callback(currentValue);
    });
  }

  /**
   * Вычисляемое значение из других полей
   * Автоматически обновляет текущее поле при изменении источников
   *
   * @param sources - Массив ReadonlySignal для отслеживания
   * @param computeFn - Функция вычисления нового значения
   * @returns Функция отписки для cleanup
   *
   * @example
   * ```typescript
   * // Автоматический расчет первоначального взноса (20% от стоимости)
   * const dispose = form.initialPayment.computeFrom(
   *   [form.propertyValue.value],
   *   (propertyValue) => {
   *     return propertyValue ? propertyValue * 0.2 : null;
   *   }
   * );
   *
   * // Cleanup
   * useEffect(() => dispose, []);
   * ```
   */
  computeFrom<TSource extends any[]>(
    sources: ReadonlySignal<TSource[number]>[],
    computeFn: (...values: TSource) => T
  ): () => void {
    return effect(() => {
      // Читаем все источники для отслеживания
      const sourceValues = sources.map((source) => source.value) as TSource;

      // Вычисляем новое значение
      const newValue = computeFn(...sourceValues);

      // Устанавливаем значение без триггера событий (избегаем циклов)
      this.setValue(newValue, { emitEvent: false });
    });
  }
}
