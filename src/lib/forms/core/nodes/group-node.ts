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

import { signal, computed, effect } from '@preact/signals-react';
import type { Signal, ReadonlySignal } from '@preact/signals-react';
import { FormNode, type SetValueOptions } from './form-node';
import { FieldNode } from './field-node';
import { ArrayNode } from './array-node';
import type {
  ValidationError,
  FieldStatus,
  ValidationSchemaFn,
  DeepFormSchema,
} from '../../types';
import type { GroupNodeWithControls } from '../../types/group-node-proxy';
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
    // Используем GroupNodeWithControls для правильной типизации вложенных форм и массивов
    return new Proxy(this, {
      get(target, prop: string | symbol) {
        // Если это поле формы
        if (typeof prop === 'string' && target.fields.has(prop as keyof T)) {
          return target.fields.get(prop as keyof T);
        }
        // Иначе - свойство/метод GroupNode
        return (target as any)[prop];
      },
    }) as GroupNodeWithControls<T>;
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
   * Получить вложенное поле по пути (например, "personalData.lastName")
   */
  private getFieldByPath(path: string): FormNode<any> | undefined {
    const parts = path.split('.');
    let current: FormNode<any> = this;

    for (const part of parts) {
      if (current instanceof GroupNode) {
        current = current.fields.get(part as any);
        if (!current) return undefined;
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Применить contextual валидаторы к полям
   * Используется для временной валидации (например, в validateForm)
   */
  async applyContextualValidators(validators: any[]): Promise<void> {
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
      // Поддержка вложенных путей (например, "personalData.lastName")
      const control = this.getFieldByPath(fieldPath);

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
      const context = new ValidationContextImpl(this as any, fieldPath, control);

      for (const registration of fieldValidators) {
        if (registration.condition) {
          // Поддержка вложенных путей для условной валидации
          const conditionField = this.getFieldByPath(registration.condition.fieldPath);
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

  // ============================================================================
  // Методы-помощники для реактивности (Фаза 1)
  // ============================================================================

  /**
   * Связывает два поля: при изменении source автоматически обновляется target
   * Поддерживает опциональную трансформацию значения
   *
   * @param sourceKey - Ключ поля-источника
   * @param targetKey - Ключ поля-цели
   * @param transform - Опциональная функция трансформации значения
   * @returns Функция отписки для cleanup
   *
   * @example
   * ```typescript
   * // Автоматический расчет минимального взноса от стоимости недвижимости
   * const dispose = form.linkFields(
   *   'propertyValue',
   *   'initialPayment',
   *   (propertyValue) => propertyValue ? propertyValue * 0.2 : null
   * );
   *
   * // При изменении propertyValue → автоматически обновится initialPayment
   * form.propertyValue.setValue(1000000);
   * // initialPayment станет 200000
   *
   * // Cleanup
   * useEffect(() => dispose, []);
   * ```
   */
  linkFields<K1 extends keyof T, K2 extends keyof T>(
    sourceKey: K1,
    targetKey: K2,
    transform?: (value: T[K1]) => T[K2]
  ): () => void {
    const sourceField = this.fields.get(sourceKey);
    const targetField = this.fields.get(targetKey);

    if (!sourceField || !targetField) {
      if (import.meta.env.DEV) {
        console.warn(
          `GroupNode.linkFields: field "${String(sourceKey)}" or "${String(targetKey)}" not found`
        );
      }
      return () => {}; // noop
    }

    return effect(() => {
      const sourceValue = sourceField.value.value;
      const transformedValue = transform
        ? transform(sourceValue as T[K1])
        : (sourceValue as any);

      targetField.setValue(transformedValue, { emitEvent: false });
    });
  }

  /**
   * Подписка на изменения вложенного поля по строковому пути
   * Поддерживает вложенные пути типа "address.city"
   *
   * @param fieldPath - Строковый путь к полю (например, "address.city")
   * @param callback - Функция, вызываемая при изменении поля
   * @returns Функция отписки для cleanup
   *
   * @example
   * ```typescript
   * // Подписка на изменение страны для загрузки городов
   * const dispose = form.watchField(
   *   'registrationAddress.country',
   *   async (countryCode) => {
   *     if (countryCode) {
   *       const cities = await fetchCitiesByCountry(countryCode);
   *       form.registrationAddress.city.updateComponentProps({
   *         options: cities
   *       });
   *     }
   *   }
   * );
   *
   * // Cleanup
   * useEffect(() => dispose, []);
   * ```
   */
  watchField<K extends keyof T>(
    fieldPath: K extends string ? K : string,
    callback: (value: any) => void | Promise<void>
  ): () => void {
    const field = this.getFieldByPath(fieldPath as string);

    if (!field) {
      if (import.meta.env.DEV) {
        console.warn(`GroupNode.watchField: field "${fieldPath}" not found`);
      }
      return () => {}; // noop
    }

    return effect(() => {
      const value = field.value.value;
      callback(value);
    });
  }
}
