/**
 * DeepFormStore - FormStore с поддержкой Variant 5
 *
 * Поддерживает:
 * - Вложенные формы через Proxy: form.controls.address.city
 * - Массивы форм: form.controls.items[0].title
 * - Автоматическое определение типов из схемы
 * - Flat хранилище для производительности
 */

import { signal, computed } from '@preact/signals-react';
import type { Signal, ReadonlySignal } from '@preact/signals-react';
import { FieldController } from './field-controller';
import { GroupProxy } from './group-proxy';
import { ArrayProxy } from './array-proxy';
import type {
  DeepFormSchema,
  DeepControls,
  ArrayConfig,
  ValidationSchemaFn,
} from '../types';
import { ValidationRegistry, createFieldPath } from '../validators';

/**
 * DeepFormStore - форма с поддержкой вложенных форм и массивов (Variant 5)
 *
 * @example
 * ```typescript
 * interface Form {
 *   name: string;
 *   address: {
 *     city: string;
 *     street: string;
 *   };
 *   items: Array<{
 *     title: string;
 *     price: number;
 *   }>;
 * }
 *
 * const schema: DeepFormSchema<Form> = {
 *   name: { value: '', component: Input },
 *   address: {
 *     city: { value: '', component: Input },
 *     street: { value: '', component: Input },
 *   },
 *   items: [{
 *     title: { value: '', component: Input },
 *     price: { value: 0, component: Input },
 *   }],
 * };
 *
 * const form = new DeepFormStore(schema);
 *
 * // Доступ к полям
 * form.controls.name.value;
 * form.controls.address.city.value;
 * form.controls.items[0].title.value;
 * form.controls.items.push({ title: 'New' });
 * ```
 */
export class DeepFormStore<T extends Record<string, any>> {
  // Flat хранилище с dot notation
  private fields: Map<string, FieldController<any>>;
  private arrayConfigs: Map<string, ArrayConfig<any>>;
  private arrayProxies: Map<string, ArrayProxy<any>>;

  private _submitting: Signal<boolean>;
  private controlsProxy: any;
  public value: ReadonlySignal<T>;

  constructor(schema: DeepFormSchema<T>) {
    this.fields = new Map();
    this.arrayConfigs = new Map();
    this.arrayProxies = new Map();
    this._submitting = signal(false);

    // Парсим схему и создаем flat структуру
    this.flattenSchema(schema, []);

    // Создаем Proxy для доступа к контроллерам
    this.controlsProxy = this.createControlsProxy([]);

    // Создаем computed signal для отслеживания изменений значений
    this.value = computed(() => {
      return this.getValue();
    });
  }

  // ============================================================================
  // Парсинг схемы
  // ============================================================================

  /**
   * Разворачивает вложенную схему в плоскую структуру
   * Автоматически определяет: массивы, группы, поля
   */
  private flattenSchema(schema: any, path: string[]): void {
    for (const [key, config] of Object.entries(schema)) {
      const currentPath = [...path, key];
      const flatKey = currentPath.join('.');

      // Проверка 1: Массив? (массив с одним элементом)
      if (Array.isArray(config) && config.length === 1) {
        this.arrayConfigs.set(flatKey, {
          itemSchema: config[0],
          initial: [],
        });
        continue;
      }

      // Проверка 2: Поле? (имеет value и component)
      if (this.isFieldConfig(config)) {
        this.fields.set(flatKey, new FieldController(config));
        continue;
      }

      // Проверка 3: Группа (plain object)
      if (this.isPlainObject(config)) {
        this.flattenSchema(config, currentPath);
        continue;
      }

      console.warn(`Unknown schema type for ${flatKey}:`, config);
    }
  }

  /**
   * Проверить, является ли конфиг конфигурацией поля
   */
  private isFieldConfig(config: any): boolean {
    return (
      config &&
      typeof config === 'object' &&
      'value' in config &&
      'component' in config
    );
  }

  /**
   * Проверить, является ли объект plain object (группой)
   */
  private isPlainObject(obj: any): boolean {
    return (
      obj !== null &&
      typeof obj === 'object' &&
      !Array.isArray(obj) &&
      !this.isFieldConfig(obj)
    );
  }

  // ============================================================================
  // Доступ к полям через Proxy
  // ============================================================================

  /**
   * Создать Proxy для доступа к контроллерам
   */
  private createControlsProxy(path: string[]): any {
    return new Proxy({}, {
      get: (_, prop: string | symbol) => {
        if (typeof prop !== 'string') return undefined;

        const currentPath = [...path, prop];
        const flatKey = currentPath.join('.');

        // Проверяем: поле?
        const field = this.fields.get(flatKey);
        if (field) return field;

        // Проверяем: массив?
        const arrayConfig = this.arrayConfigs.get(flatKey);
        if (arrayConfig) {
          if (!this.arrayProxies.has(flatKey)) {
            const arrayProxy = new ArrayProxy(this, currentPath, arrayConfig);
            this.arrayProxies.set(flatKey, arrayProxy);
          }
          return this.arrayProxies.get(flatKey)!.proxy;
        }

        // Проверяем: группа?
        const hasNested =
          Array.from(this.fields.keys()).some(k => k.startsWith(flatKey + '.')) ||
          Array.from(this.arrayConfigs.keys()).some(k => k.startsWith(flatKey + '.'));

        if (hasNested) {
          return new GroupProxy(this, currentPath).proxy;
        }

        return undefined;
      }
    });
  }

  /**
   * Получить типизированный доступ к контроллерам
   */
  get controls(): DeepControls<T> {
    return this.controlsProxy;
  }

  // ============================================================================
  // Computed значения
  // ============================================================================

  get valid(): boolean {
    // Проверяем все поля
    const fieldsValid = Array.from(this.fields.values()).every(field => field.valid);

    // Проверяем все массивы
    const arraysValid = Array.from(this.arrayProxies.values()).every(arr => arr.valid);

    return fieldsValid && arraysValid;
  }

  get invalid(): boolean {
    return !this.valid;
  }

  get pending(): boolean {
    return Array.from(this.fields.values()).some(field => field.pending);
  }

  get touched(): boolean {
    // Хотя бы одно поле или массив touched
    const fieldsTouched = Array.from(this.fields.values()).some(field => field.touched);
    const arraysTouched = Array.from(this.arrayProxies.values()).some(arr => arr.touched);

    return fieldsTouched || arraysTouched;
  }

  get dirty(): boolean {
    // Хотя бы одно поле или массив dirty
    const fieldsDirty = Array.from(this.fields.values()).some(field => field.dirty);
    const arraysDirty = Array.from(this.arrayProxies.values()).some(arr => arr.dirty);

    return fieldsDirty || arraysDirty;
  }

  get submitting(): boolean {
    return this._submitting.value;
  }

  // ============================================================================
  // Проверка валидности по пути
  // ============================================================================

  /**
   * Проверить валидность поля, группы или массива по пути
   *
   * @example
   * form.isValid('email') // Проверка поля
   * form.isValid('personalData') // Проверка группы
   * form.isValid('personalData.firstName') // Проверка вложенного поля
   * form.isValid('properties') // Проверка массива
   * form.isValid('properties.0.title') // Проверка поля элемента массива
   */
  isValid(path: string): boolean {
    const flatKey = path;

    // Проверяем: поле?
    const field = this.fields.get(flatKey);
    if (field) {
      return field.valid;
    }

    // Проверяем: массив?
    const arrayProxy = this.arrayProxies.get(flatKey);
    if (arrayProxy) {
      return arrayProxy.valid;
    }

    // Проверяем: группа?
    // Группа валидна, если все её дочерние поля валидны
    const hasNested =
      Array.from(this.fields.keys()).some(k => k.startsWith(flatKey + '.')) ||
      Array.from(this.arrayProxies.keys()).some(k => k.startsWith(flatKey + '.'));

    if (hasNested) {
      // Проверяем все дочерние поля
      const childFieldsValid = Array.from(this.fields.entries())
        .filter(([key]) => key.startsWith(flatKey + '.'))
        .every(([_, field]) => field.valid);

      // Проверяем все дочерние массивы
      const childArraysValid = Array.from(this.arrayProxies.entries())
        .filter(([key]) => key.startsWith(flatKey + '.'))
        .every(([_, arr]) => arr.valid);

      return childFieldsValid && childArraysValid;
    }

    // Путь не найден
    console.warn(`isValid: Path "${path}" not found in form`);
    return false;
  }

  // ============================================================================
  // Методы управления
  // ============================================================================

  async validate(): Promise<boolean> {
    // Шаг 1: Валидация всех полей
    const fieldResults = await Promise.all(
      Array.from(this.fields.values()).map(field => field.validate())
    );

    // Шаг 2: Валидация всех массивов
    const arrayResults = await Promise.all(
      Array.from(this.arrayProxies.values()).map(arr => arr.validate())
    );

    // Шаг 3: Применение contextual валидаторов из validation schema
    const validators = ValidationRegistry.getValidators(this);
    if (validators && validators.length > 0) {
      await this.applyContextualValidators(validators);
    }

    // Проверяем, все ли валидно
    return this.valid;
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
      const control = this.fields.get(fieldPath);

      if (!control) {
        console.warn(`Field ${fieldPath} not found in FormStore`);
        continue;
      }

      const errors: any[] = [];

      // Создаем ValidationContext для поля
      const context = new ValidationContextImpl(this, fieldPath, control);

      // Выполняем валидаторы
      for (const registration of fieldValidators) {
        // Проверяем условие, если есть
        if (registration.condition) {
          const conditionField = this.fields.get(registration.condition.fieldPath);
          if (conditionField) {
            const conditionValue = conditionField.value;
            const shouldApply = registration.condition.conditionFn(conditionValue);
            if (!shouldApply) {
              continue;
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
        if (control.errors.length > 0 && !control.errors.some(e => e.code !== 'contextual')) {
          control.clearErrors();
        }
      }
    }

    // Применяем tree валидаторы
    for (const registration of treeValidators) {
      const context = new TreeValidationContextImpl(this);

      if (registration.condition) {
        const conditionField = this.fields.get(registration.condition.fieldPath);
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
          const targetControl = this.fields.get(registration.options.targetField);
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
    this.arrayProxies.forEach(arr => arr.markAsTouched());
  }

  reset(values?: Partial<T>): void {
    if (values) {
      this.setValue(values);
      // Сбрасываем состояния
      this.fields.forEach(field => {
        field['_touched'].value = false;
        field['_dirty'].value = false;
      });
    } else {
      this.fields.forEach(field => field.reset());
      this.arrayProxies.forEach(arr => arr.reset());
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
    const result: any = {};

    // Собираем значения полей
    this.fields.forEach((field, key) => {
      this.setNestedValue(result, key, field.getValue());
    });

    // Собираем значения массивов
    this.arrayProxies.forEach((arrayProxy, key) => {
      this.setNestedValue(result, key, arrayProxy.getValue());
    });

    return result;
  }

  setValue(values: Partial<T>, options?: { emitEvent?: boolean }): void {
    this.setValuesRecursive(values, '', options);
  }

  patchValue(values: Partial<T>): void {
    this.setValue(values, { emitEvent: false });
  }

  /**
   * Рекурсивно устанавливает значения
   */
  private setValuesRecursive(obj: any, prefix: string, options?: { emitEvent?: boolean }): void {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      const field = this.fields.get(fieldPath);

      if (field) {
        field.setValue(value, options);
      } else if (Array.isArray(value)) {
        const arrayProxy = this.arrayProxies.get(fieldPath);
        if (arrayProxy) {
          arrayProxy.setValue(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        this.setValuesRecursive(value, fieldPath, options);
      }
    }
  }

  /**
   * Установить значение по вложенному пути
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
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
   */
  applyValidationSchema(schemaFn: ValidationSchemaFn<T>): void {
    ValidationRegistry.beginRegistration();

    try {
      const path = createFieldPath<T>();
      schemaFn(path);
      ValidationRegistry.endRegistration(this);
    } catch (error) {
      console.error('Error applying validation schema:', error);
      throw error;
    }
  }
}
