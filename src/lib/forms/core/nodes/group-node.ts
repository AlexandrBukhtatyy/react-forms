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
  FormSchema,
  GroupNodeConfig,
} from '../../types';
import type { GroupNodeWithControls } from '../../types/group-node-proxy';
import { ValidationRegistry, createFieldPath } from '../../validators';
import { ValidationContextImpl, TreeValidationContextImpl } from '../../validators/validation-context';
import type { BehaviorSchemaFn } from '../../behaviors/types';
import { BehaviorRegistry } from '../../behaviors/behavior-registry';
import { createFieldPath as createBehaviorFieldPath } from '../../behaviors/create-field-path';

/**
 * GroupNode - узел для группы полей
 *
 * Поддерживает два API:
 * 1. Старый API (только schema) - обратная совместимость
 * 2. Новый API (config с form, behavior, validation) - автоматическое применение схем
 *
 * @example
 * ```typescript
 * // 1. Старый способ (обратная совместимость)
 * const simpleForm = new GroupNode({
 *   email: { value: '', component: Input },
 *   password: { value: '', component: Input },
 * });
 *
 * // 2. Новый способ (с behavior и validation схемами)
 * const fullForm = new GroupNode({
 *   form: {
 *     email: { value: '', component: Input },
 *     password: { value: '', component: Input },
 *   },
 *   behavior: (path) => {
 *     computeFrom(path.email, [path.email], (values) => values[0]?.trim());
 *   },
 *   validation: (path) => {
 *     required(path.email, { message: 'Email обязателен' });
 *     email(path.email);
 *     required(path.password);
 *     minLength(path.password, 8);
 *   },
 * });
 *
 * // Прямой доступ к полям через Proxy
 * fullForm.email.setValue('test@mail.com');
 * await fullForm.validate();
 * console.log(fullForm.valid.value); // true
 * ```
 */
export class GroupNode<T extends Record<string, any> = any> extends FormNode<T> {
  // ============================================================================
  // Приватные поля
  // ============================================================================

  private fields: Map<keyof T, FormNode<any>>;
  private _submitting: Signal<boolean>;
  private _disabled: Signal<boolean>;

  /**
   * Form-level validation errors (не связанные с конкретным полем)
   * Используется для server-side errors или кросс-полевой валидации
   */
  private _formErrors: Signal<ValidationError[]>;

  /**
   * Кэш для value computed (reference equality optimization)
   * Хранит последний возвращенный объект и значения полей
   */
  private _cachedValue: T | null = null;
  private _cachedFieldValues: Map<keyof T, any> = new Map();

  /**
   * Массив disposers для централизованного cleanup
   * Хранит все функции отписки от subscriptions
   */
  private disposers: Array<() => void> = [];

  /**
   * Ссылка на Proxy-инстанс для использования в BehaviorContext
   * Устанавливается в конструкторе до применения behavior schema
   */
  private _proxyInstance?: GroupNodeWithControls<T>;

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
  // Конструктор с перегрузками
  // ============================================================================

  /**
   * Создать GroupNode только со схемой формы (обратная совместимость)
   */
  constructor(schema: FormSchema<T>);

  /**
   * Создать GroupNode с полной конфигурацией (form, behavior, validation)
   */
  constructor(config: GroupNodeConfig<T>);

  constructor(
    schemaOrConfig: FormSchema<T> | GroupNodeConfig<T>
  ) {
    super();

    this.fields = new Map();
    this._submitting = signal(false);
    this._disabled = signal(false);
    this._formErrors = signal<ValidationError[]>([]);

    // Определяем, что передано: schema или config
    const isNewAPI = 'form' in schemaOrConfig;
    const formSchema = isNewAPI ? schemaOrConfig.form : schemaOrConfig;
    const behaviorSchema = isNewAPI ? schemaOrConfig.behavior : undefined;
    const validationSchema = isNewAPI ? schemaOrConfig.validation : undefined;

    // Создать поля из схемы с поддержкой вложенности
    for (const [key, config] of Object.entries(formSchema)) {
      const node = this.createNode(config);
      this.fields.set(key as keyof T, node);
    }

    // Создать computed signals
    this.value = computed(() => {
      // Проверяем изменения через shallow comparison
      let hasChanges = false;

      // Если кэш пустой - создаем первый объект
      if (!this._cachedValue) {
        hasChanges = true;
      } else {
        // Проверяем каждое поле на изменения
        this.fields.forEach((field, key) => {
          const currentValue = field.value.value;
          const cachedValue = this._cachedFieldValues.get(key);

          // Сравниваем по reference equality
          if (currentValue !== cachedValue) {
            hasChanges = true;
          }
        });
      }

      // Если нет изменений - возвращаем кэшированный объект
      if (!hasChanges && this._cachedValue) {
        return this._cachedValue;
      }

      // Создаем новый объект только если есть изменения
      const result = {} as T;
      this.fields.forEach((field, key) => {
        const value = field.value.value;
        result[key] = value;
        this._cachedFieldValues.set(key, value);
      });

      this._cachedValue = result;
      return result;
    });

    this.valid = computed(() => {
      // Проверяем отсутствие form-level errors
      const hasFormErrors = this._formErrors.value.length > 0;
      if (hasFormErrors) return false;

      // Проверяем все поля
      return Array.from(this.fields.values()).every((field) => field.valid.value);
    });

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

      // Добавляем form-level errors
      allErrors.push(...this._formErrors.value);

      // Добавляем field-level errors
      this.fields.forEach((field) => {
        allErrors.push(...field.errors.value);
      });

      return allErrors;
    });

    this.status = computed(() => {
      if (this._disabled.value) return 'disabled';
      if (this.pending.value) return 'pending';
      if (this.invalid.value) return 'invalid';
      return 'valid';
    });

    this.submitting = computed(() => this._submitting.value);

    // Создать Proxy для прямого доступа к полям
    const proxy = new Proxy(this, {
      get(target, prop: string | symbol) {
        // Приоритет 1: Собственные свойства и методы GroupNode
        if (prop in target) {
          return (target as any)[prop];
        }

        // Приоритет 2: Поля формы
        if (typeof prop === 'string' && target.fields.has(prop as keyof T)) {
          return target.fields.get(prop as keyof T);
        }

        // Fallback
        return undefined;
      },
    }) as GroupNodeWithControls<T>;

    // ✅ Сохраняем Proxy-инстанс перед применением схем
    // Это позволяет BehaviorContext получить доступ к прокси через formNode
    this._proxyInstance = proxy;

    // Применяем схемы, если они переданы (новый API)
    if (behaviorSchema) {
      this.applyBehaviorSchema(behaviorSchema);
    }
    if (validationSchema) {
      this.applyValidationSchema(validationSchema);
    }

    // ✅ ВАЖНО: Возвращаем Proxy для прямого доступа к полям
    // Это позволяет писать form.email вместо form.controls.email
    // Используем GroupNodeWithControls для правильной типизации вложенных форм и массивов
    return proxy;
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

  /**
   * Сбросить форму к указанным значениям (или к initialValues)
   *
   * @param value - опциональный объект со значениями для сброса
   *
   * @remarks
   * Рекурсивно вызывает reset() для всех полей формы
   *
   * @example
   * ```typescript
   * // Сброс к initialValues
   * form.reset();
   *
   * // Сброс к новым значениям
   * form.reset({ email: 'new@mail.com', password: '' });
   * ```
   */
  reset(value?: T): void {
    this.fields.forEach((field, key) => {
      const resetValue = value?.[key];
      field.reset(resetValue);
    });
  }

  /**
   * Сбросить форму к исходным значениям (initialValues)
   *
   * @remarks
   * Рекурсивно вызывает resetToInitial() для всех полей формы.
   * Более явный способ сброса к начальным значениям по сравнению с reset()
   *
   * Полезно когда:
   * - Пользователь нажал "Cancel" - полная отмена изменений
   * - Форма была изменена через reset(newValues), но нужно вернуться к самому началу
   * - Явное намерение показать "отмена всех изменений"
   *
   * @example
   * ```typescript
   * const form = new GroupNode({
   *   email: { value: 'initial@mail.com', component: Input },
   *   name: { value: 'John', component: Input }
   * });
   *
   * form.email.setValue('changed@mail.com');
   * form.reset({ email: 'temp@mail.com', name: 'Jane' });
   * console.log(form.getValue()); // { email: 'temp@mail.com', name: 'Jane' }
   *
   * form.resetToInitial();
   * console.log(form.getValue()); // { email: 'initial@mail.com', name: 'John' }
   * ```
   */
  resetToInitial(): void {
    this.fields.forEach((field) => {
      if ('resetToInitial' in field && typeof field.resetToInitial === 'function') {
        field.resetToInitial();
      } else {
        field.reset();
      }
    });
  }

  async validate(): Promise<boolean> {
    // Шаг 1: Валидация всех полей
    const results = await Promise.all(
      Array.from(this.fields.values()).map((field) => field.validate())
    );

    // Шаг 2: Применение contextual валидаторов из validation schema
    const validators = ValidationRegistry.getValidators(this._proxyInstance || (this as GroupNode<T>));
    if (validators && validators.length > 0) {
      await this.applyContextualValidators(validators);
    }

    // Проверяем, все ли поля валидны
    return Array.from(this.fields.values()).every(
      (field) => field.valid.value
    );
  }

  /**
   * Установить form-level validation errors
   * Используется для server-side validation или кросс-полевых ошибок
   *
   * @param errors - массив ошибок уровня формы
   *
   * @example
   * ```typescript
   * // Server-side validation после submit
   * try {
   *   await api.createUser(form.getValue());
   * } catch (error) {
   *   form.setErrors([
   *     { code: 'duplicate_email', message: 'Email уже используется' }
   *   ]);
   * }
   * ```
   */
  setErrors(errors: ValidationError[]): void {
    this._formErrors.value = errors;
  }

  /**
   * Очистить все errors (form-level + field-level)
   */
  clearErrors(): void {
    // Очищаем form-level errors
    this._formErrors.value = [];

    // Очищаем field-level errors
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
      // ✅ Передаём proxy-инстанс, если доступен (консистентность с applyBehaviorSchema)
      const formToUse = (this._proxyInstance || this) as GroupNodeWithControls<T>;
      ValidationRegistry.endRegistration(formToUse);
    } catch (error) {
      console.error('Error applying validation schema:', error);
      throw error;
    }
  }

  /**
   * Применить behavior schema к форме
   * Декларативное описание реактивного поведения через схему
   *
   * @param schemaFn - Функция описания поведения формы
   * @returns Функция cleanup для отписки от всех behaviors
   *
   * @example
   * ```typescript
   * import { copyFrom, enableWhen, computeFrom } from '@/lib/forms/behaviors';
   *
   * const behaviorSchema: BehaviorSchemaFn<MyForm> = (path) => {
   *   // Копирование адреса
   *   copyFrom(path.residenceAddress, path.registrationAddress, {
   *     when: (form) => form.sameAsRegistration === true
   *   });
   *
   *   // Условное отображение
   *   enableWhen(path.propertyValue, (form) => form.loanType === 'mortgage');
   *
   *   // Вычисляемое поле
   *   computeFrom(
   *     path.initialPayment,
   *     [path.propertyValue],
   *     ({ propertyValue }) => propertyValue ? propertyValue * 0.2 : null
   *   );
   * };
   *
   * const cleanup = form.applyBehaviorSchema(behaviorSchema);
   *
   * // Cleanup при unmount
   * useEffect(() => cleanup, []);
   * ```
   */
  applyBehaviorSchema(schemaFn: BehaviorSchemaFn<T>): () => void {
    BehaviorRegistry.beginRegistration();

    try {
      const path = createBehaviorFieldPath<T>();
      schemaFn(path);
      // ✅ Передаём proxy-инстанс в endRegistration, если доступен
      const formToUse = (this._proxyInstance || this) as GroupNodeWithControls<T>;
      const result = BehaviorRegistry.endRegistration(formToUse);
      return result.cleanup;
    } catch (error) {
      console.error('Error applying behavior schema:', error);
      throw error;
    }
  }

  /**
   * Получить вложенное поле по пути
   *
   * Поддерживаемые форматы путей:
   * - Simple: "email" - получить поле верхнего уровня
   * - Nested: "address.city" - получить вложенное поле
   * - Array index: "items[0]" - получить элемент массива по индексу
   * - Combined: "items[0].name" - получить поле элемента массива
   *
   * @param path - Путь к полю
   * @returns FormNode если найдено, undefined если путь не существует
   *
   * @example
   * ```typescript
   * const form = new GroupNode({
   *   email: { value: '', component: Input },
   *   address: {
   *     city: { value: '', component: Input }
   *   },
   *   items: [{ name: { value: '', component: Input } }]
   * });
   *
   * form.getFieldByPath('email');           // FieldNode
   * form.getFieldByPath('address.city');    // FieldNode
   * form.getFieldByPath('items[0]');        // GroupNode
   * form.getFieldByPath('items[0].name');   // FieldNode
   * form.getFieldByPath('invalid.path');    // undefined
   * ```
   */
  public getFieldByPath(path: string): FormNode<any> | undefined {
    // Проверка на некорректные пути (leading/trailing dots)
    if (path.startsWith('.') || path.endsWith('.')) {
      return undefined;
    }

    const parts = this.parsePathWithArrays(path);
    if (parts.length === 0) {
      return undefined;
    }

    let current: FormNode<any> = this;

    for (const part of parts) {
      // Проверяем, является ли это array access (например, "items[0]")
      const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);

      if (arrayMatch) {
        // Array access: "items[0]"
        const [, fieldName, indexStr] = arrayMatch;
        const index = parseInt(indexStr, 10);

        // Сначала получаем поле (ArrayNode) через fields.get
        if (!(current instanceof GroupNode)) {
          return undefined;
        }

        const arrayField = current.fields.get(fieldName as any);
        if (!arrayField) return undefined;

        // Затем получаем элемент по индексу
        // Используем duck typing вместо instanceof из-за circular dependency
        if ('at' in arrayField && 'length' in arrayField && typeof (arrayField as any).at === 'function') {
          const item = (arrayField as any).at(index);
          if (!item) return undefined;
          current = item;
        } else {
          return undefined;
        }
      } else {
        // Regular field access
        if (!(current instanceof GroupNode)) {
          return undefined;
        }

        current = current.fields.get(part as any);
        if (!current) return undefined;
      }
    }

    return current;
  }

  /**
   * Парсит путь с учетом array notation
   * @private
   * @example
   * parsePathWithArrays("items[0].name") => ["items[0]", "name"]
   * parsePathWithArrays("address.city") => ["address", "city"]
   */
  private parsePathWithArrays(path: string): string[] {
    const parts: string[] = [];
    let currentPart = '';
    let inBrackets = false;

    for (let i = 0; i < path.length; i++) {
      const char = path[i];

      if (char === '[') {
        inBrackets = true;
        currentPart += char;
      } else if (char === ']') {
        inBrackets = false;
        currentPart += char;
      } else if (char === '.' && !inBrackets) {
        if (currentPart) {
          parts.push(currentPart);
          currentPart = '';
        }
      } else {
        currentPart += char;
      }
    }

    if (currentPart) {
      parts.push(currentPart);
    }

    return parts;
  }

  /**
   * Применить contextual валидаторы к полям
   * Используется для временной валидации (например, в validateForm)
   */
  async applyContextualValidators(validators: any[]): Promise<void> {
    // ✅ ИСПРАВЛЕНО: Используем статический import вместо динамического

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
    if (Array.isArray(config) && config.length >= 1) {
      const [itemSchema, ...restItems] = config;

      // Извлекаем значения из всех элементов массива (включая первый)
      const initialItems = config.map((item: any) => {
        if (this.isGroupConfig(item)) {
          // Это schema config - извлекаем значения
          return this.extractValuesFromSchema(item);
        }
        // Это уже values
        return item;
      });

      return new ArrayNode(itemSchema, initialItems);
    }

    // Проверка 2: Группа?
    if (this.isGroupConfig(config)) {
      return new GroupNode(config);
    }

    // Проверка 3: Поле
    return new FieldNode(config);
  }

  /**
   * Извлечь значения из schema config объекта
   * Преобразует {name: {value: 'John', component: Input}} в {name: 'John'}
   */
  private extractValuesFromSchema(schema: any): any {
    const result: any = {};

    for (const [key, config] of Object.entries(schema)) {
      if (this.isFieldConfig(config)) {
        // Это FieldConfig - берем value
        result[key] = (config as any).value;
      } else if (this.isGroupConfig(config)) {
        // Это вложенная группа - рекурсивно извлекаем
        result[key] = this.extractValuesFromSchema(config);
      } else if (Array.isArray(config) && config.length > 0) {
        // Массив - рекурсивно извлекаем значения из всех элементов
        result[key] = config.map((item: any) => {
          if (this.isGroupConfig(item)) {
            return this.extractValuesFromSchema(item);
          }
          return item;
        });
      } else {
        // Обычное значение или пустой массив
        result[key] = config;
      }
    }

    return result;
  }

  /**
   * Проверить, является ли конфигурация полем (содержит value и component)
   */
  private isFieldConfig(config: any): boolean {
    return (
      typeof config === 'object' &&
      config !== null &&
      'value' in config &&
      'component' in config
    );
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

    const dispose = effect(() => {
      const sourceValue = sourceField.value.value;
      const transformedValue = transform
        ? transform(sourceValue as T[K1])
        : (sourceValue as any);

      targetField.setValue(transformedValue, { emitEvent: false });
    });

    // Регистрируем disposer для централизованного cleanup
    this.disposers.push(dispose);

    // Возвращаем обертку, которая удаляет из массива и вызывает dispose
    return () => {
      const index = this.disposers.indexOf(dispose);
      if (index > -1) {
        this.disposers.splice(index, 1);
      }
      dispose();
    };
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

    const dispose = effect(() => {
      const value = field.value.value;
      callback(value);
    });

    // Регистрируем disposer для централизованного cleanup
    this.disposers.push(dispose);

    // Возвращаем обертку, которая удаляет из массива и вызывает dispose
    return () => {
      const index = this.disposers.indexOf(dispose);
      if (index > -1) {
        this.disposers.splice(index, 1);
      }
      dispose();
    };
  }

  /**
   * Отключить все поля группы
   * Рекурсивно отключает каждое поле, если у него есть метод disable()
   */
  disable(): void {
    this._disabled.value = true;
    this.fields.forEach((field) => {
      if ('disable' in field && typeof field.disable === 'function') {
        field.disable();
      }
    });
  }

  /**
   * Включить все поля группы
   * Рекурсивно включает каждое поле, если у него есть метод enable()
   */
  enable(): void {
    this._disabled.value = false;
    this.fields.forEach((field) => {
      if ('enable' in field && typeof field.enable === 'function') {
        field.enable();
      }
    });
  }

  /**
   * Очистить все ресурсы узла
   * Рекурсивно очищает все subscriptions и дочерние узлы
   *
   * @example
   * ```typescript
   * useEffect(() => {
   *   return () => {
   *     form.dispose();
   *   };
   * }, []);
   * ```
   */
  dispose(): void {
    // Очищаем все subscriptions
    this.disposers.forEach((d) => d());
    this.disposers = [];

    // Рекурсивно очищаем дочерние узлы
    this.fields.forEach((field) => {
      if ('dispose' in field && typeof field.dispose === 'function') {
        field.dispose();
      }
    });
  }
}
