/**
 * GroupNode - узел группы полей формы
 *
 * Представляет группу полей (объект), где каждое поле может быть:
 * - FieldNode (простое поле)
 * - GroupNode (вложенная группа)
 * - ArrayNode (массив форм)
 *
 * Наследует от FormNode и реализует все его абстрактные методы
 */

import { signal, computed } from '@preact/signals-react';
import type { Signal, ReadonlySignal } from '@preact/signals-react';
import { FormNode, type SetValueOptions } from './form-node';
import { FieldNode } from './field-node';
import { ArrayNode } from './array-node';
import type {
  FormSchema,
  ValidationError,
  FieldStatus,
  ValidationSchemaFn,
  DeepFormSchema,
} from '../../types';
import { ValidationRegistry, createFieldPath } from '../../validators';

/**
 * GroupNode - узел для группы полей
 *
 * @example
 * ```typescript
 * const form = new GroupNode({
 *   email: { value: '', component: Input, validators: [required, email] },
 *   password: { value: '', component: Input, validators: [required, minLength(8)] },
 * });
 *
 * // Прямой доступ к полям через Proxy
 * form.email.setValue('test@mail.com');
 * await form.validate();
 * console.log(form.valid.value); // true
 * ```
 */
export class GroupNode<T extends Record<string, any> = any> extends FormNode<T> {
  // ============================================================================
  // Приватные поля
  // ============================================================================

  private fields: Map<keyof T, FormNode<any>>;
  private _submitting: Signal<boolean>;

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
  public readonly submitting: ReadonlySignal<boolean>;

  // ============================================================================
  // Конструктор
  // ============================================================================

  constructor(schema: DeepFormSchema<T>) {
    super();

    this.fields = new Map();
    this._submitting = signal(false);

    // Создать поля из схемы с поддержкой вложенности
    for (const [key, config] of Object.entries(schema)) {
      const node = this.createNode(config);
      this.fields.set(key as keyof T, node);
    }

    // Создать computed signals
    this.value = computed(() => {
      const result = {} as T;
      this.fields.forEach((field, key) => {
        result[key] = field.value.value;
      });
      return result;
    });

    this.valid = computed(() =>
      Array.from(this.fields.values()).every((field) => field.valid.value)
    );

    this.invalid = computed(() => !this.valid.value);

    this.pending = computed(() =>
      Array.from(this.fields.values()).some((field) => field.pending.value)
    );

    this.touched = computed(() =>
      Array.from(this.fields.values()).some((field) => field.touched.value)
    );

    this.dirty = computed(() =>
      Array.from(this.fields.values()).some((field) => field.dirty.value)
    );

    this.errors = computed(() => {
      const allErrors: ValidationError[] = [];
      this.fields.forEach((field) => {
        allErrors.push(...field.errors.value);
      });
      return allErrors;
    });

    this.status = computed(() => {
      if (this.pending.value) return 'pending';
      if (this.invalid.value) return 'invalid';
      return 'valid';
    });

    this.submitting = computed(() => this._submitting.value);

    // ✅ ВАЖНО: Возвращаем Proxy для прямого доступа к полям
    // Это позволяет писать form.email вместо form.controls.email
    return new Proxy(this, {
      get(target, prop: string | symbol) {
        // Если это поле формы
        if (typeof prop === 'string' && target.fields.has(prop as keyof T)) {
          return target.fields.get(prop as keyof T);
        }
        // Иначе - свойство/метод GroupNode
        return (target as any)[prop];
      },
    }) as GroupNode<T> & { [K in keyof T]: FormNode<T[K]> };
  }

  // ============================================================================
  // Реализация абстрактных методов FormNode
  // ============================================================================

  getValue(): T {
    const result = {} as T;
    this.fields.forEach((field, key) => {
      result[key] = field.getValue();
    });
    return result;
  }

  setValue(value: T, options?: SetValueOptions): void {
    for (const [key, fieldValue] of Object.entries(value)) {
      const field = this.fields.get(key as keyof T);
      if (field) {
        field.setValue(fieldValue, options);
      }
    }
  }

  patchValue(value: Partial<T>): void {
    for (const [key, fieldValue] of Object.entries(value)) {
      const field = this.fields.get(key as keyof T);
      if (field && fieldValue !== undefined) {
        field.setValue(fieldValue);
      }
    }
  }

  reset(value?: T): void {
    this.fields.forEach((field, key) => {
      const resetValue = value?.[key];
      field.reset(resetValue);
    });
  }

  async validate(): Promise<boolean> {
    // Шаг 1: Валидация всех полей
    const results = await Promise.all(
      Array.from(this.fields.values()).map((field) => field.validate())
    );

    // Шаг 2: Применение contextual валидаторов из validation schema
    const validators = ValidationRegistry.getValidators(this as any);
    if (validators && validators.length > 0) {
      await this.applyContextualValidators(validators);
    }

    // Проверяем, все ли поля валидны
    return Array.from(this.fields.values()).every(
      (field) => field.valid.value
    );
  }

  setErrors(errors: ValidationError[]): void {
    // GroupNode errors - можно реализовать позже для form-level ошибок
  }

  clearErrors(): void {
    this.fields.forEach((field) => field.clearErrors());
  }

  markAsTouched(): void {
    this.fields.forEach((field) => field.markAsTouched());
  }

  markAsUntouched(): void {
    this.fields.forEach((field) => field.markAsUntouched());
  }

  markAsDirty(): void {
    this.fields.forEach((field) => field.markAsDirty());
  }

  markAsPristine(): void {
    this.fields.forEach((field) => field.markAsPristine());
  }

  // ============================================================================
  // Дополнительные методы (из FormStore)
  // ============================================================================

  /**
   * Отправить форму
   * Валидирует форму и вызывает onSubmit если форма валидна
   */
  async submit<R = any>(
    onSubmit: (values: T) => Promise<R> | R
  ): Promise<R | null> {
    this.markAsTouched();

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

  /**
   * Получить поле по ключу
   */
  getField(key: keyof T): FormNode<any> | undefined {
    return this.fields.get(key);
  }

  /**
   * Доступ к полям через .controls (deprecated)
   * Для обратной совместимости
   */
  get controls(): Record<keyof T, FormNode<any>> {
    const proxy = new Proxy({} as Record<keyof T, FormNode>, {
      get: (_, prop: string | symbol) => {
        if (typeof prop === 'string') {
          return this.fields.get(prop as keyof T);
        }
        return undefined;
      },
    });
    return proxy;
  }

  /**
   * Применить validation schema к форме
   */
  applyValidationSchema(schemaFn: ValidationSchemaFn<T>): void {
    ValidationRegistry.beginRegistration();

    try {
      const path = createFieldPath<T>();
      schemaFn(path);
      ValidationRegistry.endRegistration(this as any);
    } catch (error) {
      console.error('Error applying validation schema:', error);
      throw error;
    }
  }

  /**
   * Применить contextual валидаторы к полям
   * @private
   */
  private async applyContextualValidators(validators: any[]): Promise<void> {
    const { ValidationContextImpl, TreeValidationContextImpl } = await import(
      '../../validators/validation-context'
    );

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
            `Field "${fieldPath}" not found in GroupNode.\n` +
              `Available fields: ${availableFields}`
          );
        }
        console.warn(`Field ${fieldPath} not found in GroupNode`);
        continue;
      }

      const errors: any[] = [];
      const context = new ValidationContextImpl(this as any, fieldKey, control);

      for (const registration of fieldValidators) {
        if (registration.condition) {
          const conditionField = this.fields.get(
            registration.condition.fieldPath as keyof T
          );
          if (conditionField) {
            const conditionValue = conditionField.value.value;
            const shouldApply = registration.condition.conditionFn(conditionValue);
            if (!shouldApply) {
              continue;
            }
          }
        }

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

      if (errors.length > 0) {
        control.setErrors(errors);
      } else {
        if (
          control.errors.value.length > 0 &&
          !control.errors.value.some((e) => e.code !== 'contextual')
        ) {
          control.clearErrors();
        }
      }
    }

    // Применяем tree валидаторы
    for (const registration of treeValidators) {
      const context = new TreeValidationContextImpl(this as any);

      if (registration.condition) {
        const conditionField = this.fields.get(
          registration.condition.fieldPath as keyof T
        );
        if (conditionField) {
          const conditionValue = conditionField.value.value;
          const shouldApply = registration.condition.conditionFn(conditionValue);
          if (!shouldApply) {
            continue;
          }
        }
      }

      try {
        const error = registration.validator(context);
        if (error && registration.options?.targetField) {
          const targetControl = this.fields.get(
            registration.options.targetField as keyof T
          );
          if (targetControl) {
            const existingErrors = targetControl.errors.value;
            targetControl.setErrors([...existingErrors, error]);
          }
        }
      } catch (e) {
        console.error('Error in tree validator:', e);
      }
    }
  }

  // ============================================================================
  // Private методы для создания узлов
  // ============================================================================

  /**
   * Создать узел на основе конфигурации
   * Автоматически определяет тип: FieldNode, GroupNode или ArrayNode
   */
  private createNode(config: any): FormNode<any> {
    // Проверка 1: Массив?
    if (Array.isArray(config) && config.length === 1) {
      const [itemSchema] = config;
      return new ArrayNode(itemSchema);
    }

    // Проверка 2: Группа?
    if (this.isGroupConfig(config)) {
      return new GroupNode(config);
    }

    // Проверка 3: Поле
    return new FieldNode(config);
  }

  /**
   * Проверить, является ли конфигурация групповой (объект полей)
   */
  private isGroupConfig(config: any): boolean {
    return (
      typeof config === 'object' &&
      config !== null &&
      !('component' in config) &&
      !Array.isArray(config)
    );
  }
}
