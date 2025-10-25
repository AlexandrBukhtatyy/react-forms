import { signal, computed } from "@preact/signals-react";
import type { Signal, ReadonlySignal } from "@preact/signals-react";
import { FieldController } from "./field-controller";
import type { FormSchema, ValidationSchemaFn } from "../types";
import { ValidationRegistry, createFieldPath } from "../validators";

export class FormStore<T extends Record<string, any>> {
  private fields: Map<keyof T, FieldController<any>>;
  private _submitting: Signal<boolean>;

  // Публичные computed signals
  public readonly value: ReadonlySignal<T>;
  public readonly valid: ReadonlySignal<boolean>;
  public readonly invalid: ReadonlySignal<boolean>;
  public readonly pending: ReadonlySignal<boolean>;
  public readonly touched: ReadonlySignal<boolean>;
  public readonly dirty: ReadonlySignal<boolean>;
  public readonly submitting: ReadonlySignal<boolean>;

  constructor(schema: FormSchema<T>) {
    this.fields = new Map();
    this._submitting = signal(false);

    // Создаем контроллеры для каждого поля
    for (const [key, config] of Object.entries(schema)) {
      this.fields.set(key as keyof T, new FieldController(config));
    }

    // Создаем computed signal для отслеживания изменений значений
    this.value = computed(() => {
      const result = {} as T;
      this.fields.forEach((field, key) => {
        result[key] = field.value;
      });
      return result;
    });

    // Создаем computed signals для состояния формы
    this.valid = computed(() =>
      Array.from(this.fields.values()).every(field => field.valid.value)
    );

    this.invalid = computed(() => !this.valid.value);

    this.pending = computed(() =>
      Array.from(this.fields.values()).some(field => field.pending.value)
    );

    this.touched = computed(() =>
      Array.from(this.fields.values()).some(field => field.touched.value)
    );

    this.dirty = computed(() =>
      Array.from(this.fields.values()).some(field => field.dirty.value)
    );

    this.submitting = computed(() => this._submitting.value);
  }

  // ============================================================================
  // Доступ к полям через Proxy
  // ============================================================================

  private fieldProxy = new Proxy({} as Record<keyof T, FieldController>, {
    get: (_, prop: string | symbol) => {
      if (typeof prop === 'string') {
        return this.fields.get(prop as keyof T);
      }
      return undefined;
    }
  });

  get controls(): Record<keyof T, FieldController> {
    return this.fieldProxy;
  }

  // ============================================================================
  // Методы управления
  // ============================================================================

  async validate(): Promise<boolean> {
    // Шаг 1: Стандартная валидация через FieldController
    const results = await Promise.all(
      Array.from(this.fields.values()).map(field => field.validate())
    );

    // Шаг 2: Применение contextual валидаторов из validation schema
    const validators = ValidationRegistry.getValidators(this);
    if (validators && validators.length > 0) {
      await this.applyContextualValidators(validators);
    }

    // Проверяем, все ли поля валидны
    return Array.from(this.fields.values()).every(field => field.valid.value);
  }

  /**
   * Применить contextual валидаторы к полям
   * @private
   */
  private async applyContextualValidators(validators: any[]): Promise<void> {
    // Импортируем необходимые классы
    const { ValidationContextImpl, TreeValidationContextImpl } = await import('../validators/validation-context');

    // Группируем валидаторы по полям
    const validatorsByField = new Map<string, any[]>();
    const treeValidators: any[] = [];

    for (const registration of validators) {
      if (registration.type === 'tree') {
        treeValidators.push(registration);
      } else {
        const existing = validatorsByField.get(registration.fieldPath) || [];
        existing.push(registration);
        validatorsByField.set(registration.fieldPath, existing);
      }
    }

    // Применяем валидаторы к полям
    for (const [fieldPath, fieldValidators] of validatorsByField) {
      const fieldKey = fieldPath as keyof T;
      const control = this.fields.get(fieldKey);

      if (!control) {
        if (import.meta.env.DEV) {
          const availableFields = Array.from(this.fields.keys()).join(', ');
          throw new Error(
            `Field "${fieldPath}" not found in FormStore.\n` +
            `Available fields: ${availableFields}`
          );
        }
        console.warn(`Field ${fieldPath} not found in FormStore`);
        continue;
      }

      const errors: any[] = [];

      // Создаем ValidationContext для поля
      const context = new ValidationContextImpl(this, fieldKey, control);

      // Выполняем валидаторы
      for (const registration of fieldValidators) {
        // Проверяем условие, если есть
        if (registration.condition) {
          const conditionField = this.fields.get(registration.condition.fieldPath as keyof T);
          if (conditionField) {
            const conditionValue = conditionField.value;
            const shouldApply = registration.condition.conditionFn(conditionValue);
            if (!shouldApply) {
              continue; // Пропускаем этот валидатор
            }
          }
        }

        // Вызываем валидатор
        try {
          let error;
          if (registration.type === 'sync') {
            error = registration.validator(context);
          } else if (registration.type === 'async') {
            error = await registration.validator(context);
          }

          if (error) {
            errors.push(error);
          }
        } catch (e) {
          console.error(`Error in validator for ${fieldPath}:`, e);
        }
      }

      // Устанавливаем ошибки в FieldController
      if (errors.length > 0) {
        control.setErrors(errors);
      } else {
        // Очищаем ошибки, если они были
        if (control.errors.length > 0 && !control.errors.some(e => e.code !== 'contextual')) {
          control.clearErrors();
        }
      }
    }

    // Применяем tree валидаторы
    for (const registration of treeValidators) {
      const context = new TreeValidationContextImpl(this);

      // Проверяем условие, если есть
      if (registration.condition) {
        const conditionField = this.fields.get(registration.condition.fieldPath as keyof T);
        if (conditionField) {
          const conditionValue = conditionField.value;
          const shouldApply = registration.condition.conditionFn(conditionValue);
          if (!shouldApply) {
            continue;
          }
        }
      }

      try {
        const error = registration.validator(context);
        if (error && registration.options?.targetField) {
          // Устанавливаем ошибку на целевое поле
          const targetControl = this.fields.get(registration.options.targetField as keyof T);
          if (targetControl) {
            const existingErrors = targetControl.errors;
            targetControl.setErrors([...existingErrors, error]);
          }
        }
      } catch (e) {
        console.error('Error in tree validator:', e);
      }
    }
  }

  markAllAsTouched(): void {
    this.fields.forEach(field => field.markAsTouched());
  }

  reset(values?: Partial<T>): void {
    if (values) {
      for (const [key, value] of Object.entries(values)) {
        this.fields.get(key as keyof T)?.reset(value);
      }
    } else {
      this.fields.forEach(field => field.reset());
    }
  }

  disable(): void {
    this.fields.forEach(field => field.disable());
  }

  enable(): void {
    this.fields.forEach(field => field.enable());
  }

  // ============================================================================
  // Работа со значениями
  // ============================================================================

  getValue(): T {
    const result = {} as T;
    this.fields.forEach((field, key) => {
      result[key] = field.getValue();
    });
    return result;
  }

  setValue(values: Partial<T>, options?: { emitEvent?: boolean }): void {
    for (const [key, value] of Object.entries(values)) {
      this.fields.get(key as keyof T)?.setValue(value, options);
    }
  }

  patchValue(values: Partial<T>): void {
    this.setValue(values, { emitEvent: false });
  }

  // ============================================================================
  // Submit
  // ============================================================================

  async submit<R = any>(
    onSubmit: (values: T) => Promise<R> | R
  ): Promise<R | null> {
    this.markAllAsTouched();

    const isValid = await this.validate();
    if (!isValid) {
      return null;
    }

    this._submitting.value = true;
    try {
      const result = await onSubmit(this.getValue());
      return result;
    } finally {
      this._submitting.value = false;
    }
  }

  // ============================================================================
  // Validation Schema
  // ============================================================================

  /**
   * Применить validation schema к форме
   *
   * @example
   * ```typescript
   * const form = new FormStore(schema);
   * form.applyValidationSchema((path) => {
   *   required(path.email, { message: 'Email обязателен' });
   *   applyWhen(
   *     path.loanType,
   *     (type) => type === 'mortgage',
   *     (path) => {
   *       required(path.propertyValue, { message: 'Укажите стоимость' });
   *     }
   *   );
   * });
   * ```
   */
  applyValidationSchema(schemaFn: ValidationSchemaFn<T>): void {
    // Начинаем регистрацию валидаторов
    ValidationRegistry.beginRegistration();

    try {
      // Создаем FieldPath proxy
      const path = createFieldPath<T>();

      // Вызываем validation schema функцию
      // Она зарегистрирует все валидаторы через ValidationRegistry
      schemaFn(path);

      // Завершаем регистрацию и применяем валидаторы
      ValidationRegistry.endRegistration(this);
    } catch (error) {
      console.error('Error applying validation schema:', error);
      throw error;
    }
  }
}
