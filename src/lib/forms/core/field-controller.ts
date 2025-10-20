import { signal } from "@preact/signals-react";
import type { Signal } from "@preact/signals-react";
import type { ValidatorFn, AsyncValidatorFn, ValidationError, FieldStatus, FieldConfig } from "../types";

export class FieldController<T = any> {
  // Приватные сигналы
  private _value: Signal<T>;
  private _errors: Signal<ValidationError[]>;
  private _touched: Signal<boolean>;
  private _dirty: Signal<boolean>;
  private _status: Signal<FieldStatus>;
  private _pending: Signal<boolean>;

  // Конфигурация
  private validators: ValidatorFn<T>[];
  private asyncValidators: AsyncValidatorFn<T>[];
  private updateOn: 'change' | 'blur' | 'submit';

  public readonly component: FieldConfig<T>['component'];
  public readonly componentProps: Record<string, any>;

  constructor(config: FieldConfig<T>) {
    this._value = signal(config.value);
    this._errors = signal<ValidationError[]>([]);
    this._touched = signal(false);
    this._dirty = signal(false);
    this._status = signal<FieldStatus>(config.disabled ? 'disabled' : 'valid');
    this._pending = signal(false);

    this.validators = config.validators || [];
    this.asyncValidators = config.asyncValidators || [];
    this.updateOn = config.updateOn || 'change';
    this.component = config.component;
    this.componentProps = config.componentProps || {};
  }

  // ============================================================================
  // Публичные геттеры
  // ============================================================================

  get value(): T {
    return this._value.value;
  }

  set value(newValue: T) {
    this._value.value = newValue;
    this._dirty.value = true;

    if (this.updateOn === 'change') {
      this.validate();
    }
  }

  get errors(): ValidationError[] {
    return this._errors.value;
  }

  get touched(): boolean {
    return this._touched.value;
  }

  get dirty(): boolean {
    return this._dirty.value;
  }

  get status(): FieldStatus {
    return this._status.value;
  }

  get valid(): boolean {
    return this._status.value === 'valid';
  }

  get invalid(): boolean {
    return this._status.value === 'invalid';
  }

  get pending(): boolean {
    return this._pending.value;
  }

  // Computed: показывать ли ошибку
  get shouldShowError(): boolean {
    return this.invalid && (this.touched || this.dirty);
  }

  // ============================================================================
  // Методы управления
  // ============================================================================

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

  // ============================================================================
  // Валидация
  // ============================================================================

  async validate(): Promise<boolean> {
    // Синхронная валидация
    const syncErrors: ValidationError[] = [];
    for (const validator of this.validators) {
      const error = validator(this.value);
      if (error) syncErrors.push(error);
    }

    if (syncErrors.length > 0) {
      this._errors.value = syncErrors;
      this._status.value = 'invalid';
      return false;
    }

    // Асинхронная валидация
    if (this.asyncValidators.length > 0) {
      this._pending.value = true;
      this._status.value = 'pending';

      const asyncErrors: ValidationError[] = [];
      for (const validator of this.asyncValidators) {
        const error = await validator(this.value);
        if (error) asyncErrors.push(error);
      }

      this._pending.value = false;

      if (asyncErrors.length > 0) {
        this._errors.value = asyncErrors;
        this._status.value = 'invalid';
        return false;
      }
    }

    this._errors.value = [];
    this._status.value = 'valid';
    return true;
  }

  /**
   * Установить ошибки валидации извне
   * Используется для contextual validators
   */
  setErrors(errors: ValidationError[]): void {
    this._errors.value = errors;
    this._status.value = errors.length > 0 ? 'invalid' : 'valid';
  }

  /**
   * Очистить ошибки валидации
   */
  clearErrors(): void {
    this._errors.value = [];
    this._status.value = 'valid';
  }

  reset(value?: T): void {
    this._value.value = value !== undefined ? value : this._value.peek();
    this._errors.value = [];
    this._touched.value = false;
    this._dirty.value = false;
    this._status.value = 'valid';
  }

  // ============================================================================
  // Сериализация
  // ============================================================================

  getValue(): T {
    return this._value.value;
  }

  setValue(value: T, options?: { emitEvent?: boolean }): void {
    this._value.value = value;

    if (options?.emitEvent !== false) {
      this.validate();
    }
  }
}
