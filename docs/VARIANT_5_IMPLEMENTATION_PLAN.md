# План поэтапной реализации Варианта 5: Proxy-based Deep Access

> **Архитектура**: Proxy-based с автоматическим определением массивов
> **Сложность**: Высокая
> **Срок**: 15-22 рабочих дня
> **Дата создания**: 2025-10-21

---

## Обзор варианта

**Вариант 5 - Proxy-based Deep Access** предоставляет самый элегантный API для работы с формами:

```typescript
// Вложенные формы - без .controls
form.controls.personalData.firstName.value = 'John';

// Массивы - доступ по индексу [i]
form.controls.properties[0].type.value = 'apartment';

// Массивы с вложенными формами
form.controls.coBorrowers[0].personalData.firstName.value = 'John';
```

**Ключевые особенности**:
- ✅ Автоматическое определение типов (поле/группа/массив)
- ✅ Proxy для элегантного доступа
- ✅ Flat хранилище для производительности
- ✅ Массивы через синтаксис `[{...}]`
- ✅ Полная типизация TypeScript

---

## Архитектура

### Компоненты системы

```
FormStore
├── fields: Map<string, FieldController>     // Плоское хранилище полей
├── arrayConfigs: Map<string, ArrayConfig>   // Конфигурации массивов
├── arrayProxies: Map<string, ArrayProxy>    // Экземпляры ArrayProxy
└── controlsProxy: Proxy                     // Главный Proxy для доступа

FieldController
├── _value: Signal<T>
├── _errors: Signal<ValidationError[]>
├── _touched: Signal<boolean>
└── validate(): Promise<boolean>

GroupProxy
├── path: string[]
├── store: FormStore
└── proxy: Proxy -> доступ к полям и вложенным группам

ArrayProxy
├── _items: Signal<GroupProxy[]>
├── factory: DeepFormSchema<T>
├── proxy: Proxy -> доступ по индексу [i]
└── методы: push(), remove(), insert(), clear()
```

### Процесс работы

1. **Парсинг схемы** (flattenSchema):
   - `[{...}]` → ArrayConfig (массив)
   - `{field1: {...}, field2: {...}}` → рекурсия (группа)
   - `{value: ..., component: ...}` → FieldController (поле)

2. **Создание Proxy**:
   - Главный Proxy перехватывает доступ к `controls`
   - При обращении к свойству проверяет: поле? массив? группа?
   - Возвращает соответствующий объект

3. **Доступ к данным**:
   - Поля: `form.controls.name` → FieldController
   - Группы: `form.controls.address` → GroupProxy
   - Массивы: `form.controls.items` → ArrayProxy

4. **Реактивность**:
   - Все изменения через Signals
   - Computed для агрегированных значений
   - Автоматические обновления UI

---

## Фаза 1: Подготовка и типы (2-3 дня)

### Цель
Создать базовые типы и интерфейсы для Варианта 5.

### Задачи

#### 1.1 Создать типы для схемы

**Файл**: `src/lib/forms/types/deep-schema.ts`

```typescript
import type { ComponentType } from 'react';
import type { ValidatorFn, AsyncValidatorFn, ValidationError } from './validators';

// ============================================================================
// Базовые типы
// ============================================================================

/**
 * Конфигурация поля
 */
export interface FieldConfig<T = any> {
  value: T;
  component: ComponentType<any>;
  componentProps?: Record<string, any>;
  validators?: ValidatorFn<T>[];
  asyncValidators?: AsyncValidatorFn<T>[];
  disabled?: boolean;
  updateOn?: 'change' | 'blur' | 'submit';
}

/**
 * Конфигурация массива (внутренняя)
 */
export interface ArrayConfig<T extends Record<string, any>> {
  itemSchema: DeepFormSchema<T>;
  initial?: Partial<T>[];
}

// ============================================================================
// Deep Schema - автоматическое определение типов
// ============================================================================

/**
 * Автоматически определяет тип схемы на основе TypeScript типа:
 * - T[] -> [DeepFormSchema<T>] (массив с одним элементом)
 * - object -> DeepFormSchema<T> (группа)
 * - primitive -> FieldConfig<T> (поле)
 */
export type DeepFormSchema<T> = {
  [K in keyof T]: T[K] extends Array<infer U>
    ? U extends Record<string, any>
      ? [DeepFormSchema<U>]  // Массив
      : FieldConfig<T[K]>
    : T[K] extends Record<string, any>
    ? DeepFormSchema<T[K]> | FieldConfig<T[K]>  // Группа или поле с объектным типом
    : FieldConfig<T[K]>;  // Поле
};

// ============================================================================
// Deep Controls - типы для Proxy доступа
// ============================================================================

/**
 * Типы контроллеров с учетом вложенности
 */
export type DeepControls<T> = {
  [K in keyof T]: T[K] extends Array<infer U>
    ? U extends Record<string, any>
      ? ArrayControlProxy<U>
      : FieldController<T[K]>
    : T[K] extends Record<string, any>
    ? DeepControls<T[K]> & GroupControlProxy<T[K]>
    : FieldController<T[K]>;
};

/**
 * Интерфейс для GroupProxy (вложенные формы)
 */
export interface GroupControlProxy<T extends Record<string, any>> {
  valid: boolean;
  invalid: boolean;
  errors: ValidationError[];
  touched: boolean;
  dirty: boolean;
  getValue(): T;
  setValue(value: Partial<T>): void;
  validate(): Promise<boolean>;
  markAsTouched(): void;
  reset(): void;
}

/**
 * Интерфейс для ArrayProxy (массивы форм)
 */
export interface ArrayControlProxy<T extends Record<string, any>> {
  // Доступ по индексу
  [index: number]: DeepControls<T> & GroupControlProxy<T>;

  // Свойства
  length: ReadonlySignal<number>;
  items: ReadonlySignal<Array<DeepControls<T> & GroupControlProxy<T>>>;
  valid: boolean;
  invalid: boolean;
  errors: ValidationError[];

  // Методы управления
  push(value?: Partial<T>): void;
  remove(index: number): void;
  insert(index: number, value?: Partial<T>): void;
  clear(): void;
  at(index: number): (DeepControls<T> & GroupControlProxy<T>) | undefined;

  // Итерация
  forEach(callback: (item: DeepControls<T> & GroupControlProxy<T>, index: number) => void): void;
  map<R>(callback: (item: DeepControls<T> & GroupControlProxy<T>, index: number) => R): R[];

  // Валидация и значения
  validate(): Promise<boolean>;
  getValue(): T[];
  setValue(values: Partial<T>[]): void;
  markAsTouched(): void;
  reset(): void;
}
```

#### 1.2 Обновить существующие типы

**Файл**: `src/lib/forms/types/index.ts`

```typescript
// Re-export всех типов
export * from './validators';
export * from './field-config';
export * from './deep-schema';

// Backward compatibility
export type { FormSchema } from './field-config';
```

#### 1.3 Написать unit тесты для типов

**Файл**: `src/lib/forms/types/__tests__/deep-schema.test.ts`

```typescript
import type { DeepFormSchema, DeepControls } from '../deep-schema';

describe('DeepFormSchema types', () => {
  it('should infer field config for primitives', () => {
    interface Form {
      name: string;
      age: number;
    }

    const schema: DeepFormSchema<Form> = {
      name: { value: '', component: Input },
      age: { value: 0, component: Input },
    };

    // TypeScript должен скомпилировать без ошибок
    expect(schema).toBeDefined();
  });

  it('should infer group schema for nested objects', () => {
    interface Form {
      address: {
        city: string;
        street: string;
      };
    }

    const schema: DeepFormSchema<Form> = {
      address: {
        city: { value: '', component: Input },
        street: { value: '', component: Input },
      },
    };

    expect(schema).toBeDefined();
  });

  it('should infer array schema for arrays', () => {
    interface Form {
      items: Array<{
        name: string;
        value: number;
      }>;
    }

    const schema: DeepFormSchema<Form> = {
      items: [{
        name: { value: '', component: Input },
        value: { value: 0, component: Input },
      }],
    };

    expect(schema).toBeDefined();
  });
});
```

### Deliverables
- ✅ `src/lib/forms/types/deep-schema.ts` с типами
- ✅ Обновленный `src/lib/forms/types/index.ts`
- ✅ Unit тесты для типов
- ✅ Документация типов в TSDoc

**Время**: 2-3 дня

---

## Фаза 2: GroupProxy - вложенные формы (3-4 дня)

### Цель
Реализовать GroupProxy для работы с вложенными формами через Proxy.

### Задачи

#### 2.1 Создать класс GroupProxy

**Файл**: `src/lib/forms/core/group-proxy.ts`

```typescript
import type { Signal, ReadonlySignal } from '@preact/signals-react';
import { signal, computed } from '@preact/signals-react';
import type { FormStore } from './form-store';
import type { ValidationError } from '../types';

/**
 * Proxy для группы полей (вложенной формы)
 * Предоставляет доступ к вложенным полям через точку
 */
export class GroupProxy<T extends Record<string, any>> {
  private controlsProxy: any;

  constructor(
    private store: FormStore<any>,
    private path: string[]
  ) {
    this.controlsProxy = this.createControlsProxy();
  }

  /**
   * Создать Proxy для доступа к вложенным полям
   */
  private createControlsProxy(): any {
    return new Proxy({} as any, {
      get: (_, prop: string | symbol) => {
        if (typeof prop !== 'string') return undefined;

        const currentPath = [...this.path, prop];
        const flatKey = currentPath.join('.');

        // Проверяем, это поле?
        const field = this.store['fields'].get(flatKey);
        if (field) {
          return field;
        }

        // Проверяем, это массив?
        const arrayConfig = this.store['arrayConfigs']?.get(flatKey);
        if (arrayConfig) {
          // Создаем или получаем ArrayProxy
          if (!this.store['arrayProxies']?.has(flatKey)) {
            const ArrayProxy = require('./array-proxy').ArrayProxy;
            const arrayProxy = new ArrayProxy(
              this.store,
              currentPath,
              arrayConfig
            );
            this.store['arrayProxies'].set(flatKey, arrayProxy);
          }
          return this.store['arrayProxies'].get(flatKey).proxy;
        }

        // Проверяем, есть ли вложенные поля?
        const hasNestedFields = Array.from(this.store['fields'].keys())
          .some(key => key.startsWith(flatKey + '.'));

        if (hasNestedFields) {
          // Возвращаем новый GroupProxy
          return new GroupProxy(this.store, currentPath).proxy;
        }

        return undefined;
      }
    });
  }

  /**
   * Получить Proxy для доступа
   */
  get proxy(): any {
    return this.controlsProxy;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  get valid(): boolean {
    const prefix = this.path.join('.');
    return Array.from(this.store['fields'].entries())
      .filter(([key]) => key.startsWith(prefix))
      .every(([_, field]) => field.valid);
  }

  get invalid(): boolean {
    return !this.valid;
  }

  get errors(): ValidationError[] {
    const prefix = this.path.join('.');
    const errors: ValidationError[] = [];

    this.store['fields'].forEach((field, key) => {
      if (key.startsWith(prefix)) {
        errors.push(...field.errors);
      }
    });

    return errors;
  }

  async validate(): Promise<boolean> {
    const prefix = this.path.join('.');
    const fields = Array.from(this.store['fields'].entries())
      .filter(([key]) => key.startsWith(prefix))
      .map(([_, field]) => field);

    const results = await Promise.all(fields.map(f => f.validate()));
    return results.every(r => r);
  }

  // ============================================================================
  // State
  // ============================================================================

  get touched(): boolean {
    const prefix = this.path.join('.');
    return Array.from(this.store['fields'].entries())
      .filter(([key]) => key.startsWith(prefix))
      .some(([_, field]) => field.touched);
  }

  get dirty(): boolean {
    const prefix = this.path.join('.');
    return Array.from(this.store['fields'].entries())
      .filter(([key]) => key.startsWith(prefix))
      .some(([_, field]) => field.dirty);
  }

  markAsTouched(): void {
    const prefix = this.path.join('.');
    this.store['fields'].forEach((field, key) => {
      if (key.startsWith(prefix)) {
        field.markAsTouched();
      }
    });
  }

  // ============================================================================
  // Values
  // ============================================================================

  getValue(): T {
    const prefix = this.path.join('.');
    const result: any = {};

    this.store['fields'].forEach((field, key) => {
      if (key.startsWith(prefix)) {
        const relativePath = key.substring(prefix.length + 1);
        this.setNestedValue(result, relativePath, field.getValue());
      }
    });

    // Также получаем значения массивов
    this.store['arrayProxies']?.forEach((arrayProxy, key) => {
      if (key.startsWith(prefix)) {
        const relativePath = key.substring(prefix.length + 1);
        this.setNestedValue(result, relativePath, arrayProxy.getValue());
      }
    });

    return result;
  }

  setValue(values: Partial<T>): void {
    const prefix = this.path.join('.');

    // Рекурсивно устанавливаем значения
    const setValues = (obj: any, currentPath: string) => {
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = currentPath ? `${currentPath}.${key}` : key;
        const field = this.store['fields'].get(fieldPath);

        if (field) {
          field.setValue(value);
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          setValues(value, fieldPath);
        }
      }
    };

    setValues(values, prefix);
  }

  reset(): void {
    const prefix = this.path.join('.');
    this.store['fields'].forEach((field, key) => {
      if (key.startsWith(prefix)) {
        field.reset();
      }
    });
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
}
```

#### 2.2 Написать тесты для GroupProxy

**Файл**: `src/lib/forms/core/__tests__/group-proxy.test.ts`

#### 2.3 Интегрировать GroupProxy в FormStore

**Обновить**: `src/lib/forms/core/form-store.ts`

### Deliverables
- ✅ `src/lib/forms/core/group-proxy.ts`
- ✅ Тесты для GroupProxy
- ✅ Интеграция с FormStore
- ✅ Примеры использования

**Время**: 3-4 дня

---

## Фаза 3: ArrayProxy - массивы форм (4-5 дней)

### Цель
Реализовать ArrayProxy для работы с массивами форм.

### Задачи

#### 3.1 Создать класс ArrayProxy

**Файл**: `src/lib/forms/core/array-proxy.ts`

```typescript
import { signal, computed } from '@preact/signals-react';
import type { Signal, ReadonlySignal } from '@preact/signals-react';
import type { FormStore } from './form-store';
import type { DeepFormSchema, ArrayConfig, ValidationError } from '../types';
import { GroupProxy } from './group-proxy';
import { FieldController } from './field-controller';

/**
 * Proxy для массива форм
 * Предоставляет элегантный API: items[0].field
 */
export class ArrayProxy<T extends Record<string, any>> {
  private _items: Signal<GroupProxy<T>[]>;
  private _errors: Signal<ValidationError[]>;
  private itemsProxy: any;

  constructor(
    private store: FormStore<any>,
    private path: string[],
    private config: ArrayConfig<T>
  ) {
    this._items = signal([]);
    this._errors = signal([]);

    // Инициализируем начальные элементы
    if (config.initial && config.initial.length > 0) {
      config.initial.forEach(item => this.push(item));
    }

    // Создаем Proxy для доступа
    this.itemsProxy = this.createItemsProxy();
  }

  /**
   * Создать Proxy для доступа по индексу и методам
   */
  private createItemsProxy(): any {
    return new Proxy([] as any, {
      get: (target, prop: string | symbol) => {
        // Числовой индекс
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          const index = parseInt(prop, 10);
          return this._items.value[index]?.proxy;
        }

        // Array методы и свойства
        switch (prop) {
          case 'length':
            return this.length;
          case 'items':
            return this._items;
          case 'push':
            return this.push.bind(this);
          case 'remove':
            return this.remove.bind(this);
          case 'insert':
            return this.insert.bind(this);
          case 'clear':
            return this.clear.bind(this);
          case 'at':
            return this.at.bind(this);
          case 'forEach':
            return this.forEach.bind(this);
          case 'map':
            return this.map.bind(this);
          case 'valid':
            return this.valid;
          case 'invalid':
            return this.invalid;
          case 'errors':
            return this._errors.value;
          case 'validate':
            return this.validate.bind(this);
          case 'getValue':
            return this.getValue.bind(this);
          case 'setValue':
            return this.setValue.bind(this);
          case 'markAsTouched':
            return this.markAsTouched.bind(this);
          case 'reset':
            return this.reset.bind(this);
          default:
            return undefined;
        }
      },

      has: (target, prop) => {
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          const index = parseInt(prop, 10);
          return index >= 0 && index < this._items.value.length;
        }
        return prop in this;
      },
    });
  }

  /**
   * Получить Proxy
   */
  get proxy(): any {
    return this.itemsProxy;
  }

  // ============================================================================
  // Свойства
  // ============================================================================

  get length(): ReadonlySignal<number> {
    return computed(() => this._items.value.length);
  }

  get valid(): boolean {
    return this._items.value.every(item => item.valid);
  }

  get invalid(): boolean {
    return !this.valid;
  }

  // ============================================================================
  // CRUD операции
  // ============================================================================

  push(initialValue?: Partial<T>): void {
    const index = this._items.value.length;
    const itemProxy = this.createItem(index, initialValue);
    this._items.value = [...this._items.value, itemProxy];
  }

  remove(index: number): void {
    if (index < 0 || index >= this._items.value.length) {
      console.warn(`ArrayProxy: index ${index} out of bounds`);
      return;
    }

    // Удаляем поля из FormStore
    this.removeItemFields(index);

    // Обновляем массив
    const newItems = [...this._items.value];
    newItems.splice(index, 1);

    // Переиндексируем оставшиеся элементы
    this.reindexItems(newItems, index);

    this._items.value = newItems;
  }

  insert(index: number, initialValue?: Partial<T>): void {
    if (index < 0 || index > this._items.value.length) {
      console.warn(`ArrayProxy: index ${index} out of bounds`);
      return;
    }

    // Сдвигаем индексы
    this.shiftIndices(index, 1);

    // Создаем элемент
    const itemProxy = this.createItem(index, initialValue);
    const newItems = [...this._items.value];
    newItems.splice(index, 0, itemProxy);

    this._items.value = newItems;
  }

  clear(): void {
    for (let i = this._items.value.length - 1; i >= 0; i--) {
      this.removeItemFields(i);
    }
    this._items.value = [];
  }

  at(index: number): GroupProxy<T> | undefined {
    return this._items.value[index];
  }

  // ============================================================================
  // Итерация
  // ============================================================================

  forEach(callback: (item: any, index: number) => void): void {
    this._items.value.forEach((item, index) => {
      callback(item.proxy, index);
    });
  }

  map<R>(callback: (item: any, index: number) => R): R[] {
    return this._items.value.map((item, index) => {
      return callback(item.proxy, index);
    });
  }

  // ============================================================================
  // Валидация и значения
  // ============================================================================

  async validate(): Promise<boolean> {
    const results = await Promise.all(
      this._items.value.map(item => item.validate())
    );

    const arrayValid = results.every(r => r);

    if (!arrayValid) {
      this._errors.value = [{
        code: 'invalidItems',
        message: 'Некоторые элементы массива содержат ошибки',
      }];
    } else {
      this._errors.value = [];
    }

    return arrayValid;
  }

  getValue(): T[] {
    return this._items.value.map(item => item.getValue());
  }

  setValue(values: Partial<T>[]): void {
    this.clear();
    values.forEach(value => this.push(value));
  }

  markAsTouched(): void {
    this._items.value.forEach(item => item.markAsTouched());
  }

  reset(): void {
    this._items.value.forEach(item => item.reset());
  }

  // ============================================================================
  // Private методы
  // ============================================================================

  /**
   * Создать элемент массива
   */
  private createItem(index: number, initialValue?: Partial<T>): GroupProxy<T> {
    const itemPath = [...this.path, String(index)];
    this.createItemFields(index, initialValue);
    return new GroupProxy<T>(this.store, itemPath);
  }

  /**
   * Создать поля для элемента
   */
  private createItemFields(index: number, initialValue?: Partial<T>): void {
    const flattenField = (
      schema: any,
      path: string[],
      values?: any
    ): void => {
      for (const [key, config] of Object.entries(schema)) {
        const currentPath = [...path, key];
        const flatKey = currentPath.join('.');

        if (Array.isArray(config) && config.length === 1) {
          // Вложенный массив
          const arrayConfig = { itemSchema: config[0], initial: values?.[key] || [] };
          this.store['arrayConfigs'].set(flatKey, arrayConfig);
        } else if (this.isFieldConfig(config)) {
          // Поле
          const value = values?.[key] ?? (config as any).value;
          this.store['fields'].set(
            flatKey,
            new FieldController({ ...config, value })
          );
        } else {
          // Вложенная группа
          flattenField(config, currentPath, values?.[key]);
        }
      }
    };

    const itemPath = [...this.path, String(index)];
    flattenField(this.config.itemSchema, itemPath, initialValue);
  }

  /**
   * Удалить поля элемента
   */
  private removeItemFields(index: number): void {
    const prefix = [...this.path, String(index)].join('.');
    const keysToRemove: string[] = [];

    this.store['fields'].forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => this.store['fields'].delete(key));

    // Также удаляем ArrayProxy если есть
    this.store['arrayProxies']?.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        this.store['arrayProxies'].delete(key);
      }
    });
  }

  /**
   * Переиндексировать элементы
   */
  private reindexItems(items: GroupProxy<T>[], fromIndex: number): void {
    for (let i = fromIndex; i < items.length; i++) {
      this.renameItemFields(i + 1, i);
    }
  }

  /**
   * Сдвинуть индексы
   */
  private shiftIndices(fromIndex: number, offset: number): void {
    for (let i = this._items.value.length - 1; i >= fromIndex; i--) {
      this.renameItemFields(i, i + offset);
    }
  }

  /**
   * Переименовать поля элемента
   */
  private renameItemFields(oldIndex: number, newIndex: number): void {
    const oldPrefix = [...this.path, String(oldIndex)].join('.');
    const newPrefix = [...this.path, String(newIndex)].join('.');

    const fieldsToRename: Array<[string, FieldController<any>]> = [];

    this.store['fields'].forEach((field, key) => {
      if (key.startsWith(oldPrefix)) {
        const newKey = key.replace(oldPrefix, newPrefix);
        fieldsToRename.push([newKey, field]);
        this.store['fields'].delete(key);
      }
    });

    fieldsToRename.forEach(([key, field]) => {
      this.store['fields'].set(key, field);
    });
  }

  private isFieldConfig(config: any): boolean {
    return config && 'value' in config && 'component' in config;
  }
}
```

#### 3.2 Написать тесты для ArrayProxy

#### 3.3 Интегрировать с FormStore

### Deliverables
- ✅ `src/lib/forms/core/array-proxy.ts`
- ✅ Тесты для ArrayProxy
- ✅ Интеграция с FormStore

**Время**: 4-5 дней

---

## Фаза 4: FormStore с автоопределением (3-4 дня)

### Цель
Обновить FormStore для автоматического определения типов схемы.

### Задачи

#### 4.1 Обновить метод flattenSchema

**Файл**: `src/lib/forms/core/form-store.ts`

```typescript
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

private isFieldConfig(config: any): boolean {
  return (
    config &&
    typeof config === 'object' &&
    'value' in config &&
    'component' in config
  );
}

private isPlainObject(obj: any): boolean {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    !this.isFieldConfig(obj)
  );
}
```

#### 4.2 Создать главный Proxy

```typescript
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
```

### Deliverables
- ✅ Обновленный FormStore
- ✅ Автоматическое определение типов
- ✅ Integration тесты

**Время**: 3-4 дней

---

## Фаза 5: Валидация (2-3 дня)

### Цель
Интегрировать существующую систему валидации с Proxy структурой.

### Задачи

#### 5.1 Поддержка валидации для вложенных путей

```typescript
// Валидация должна работать с путями через точку
required(path.personalData.firstName);
required(path.properties[0].type); // Для массивов
```

#### 5.2 Валидация массивов

#### 5.3 Cross-field валидация

### Deliverables
- ✅ Валидация работает с Proxy
- ✅ Тесты валидации

**Время**: 2-3 дня

---

## Фаза 6: Примеры и документация (2-3 дня)

### Цель
Создать примеры и документацию.

### Задачи

#### 6.1 Создать базовый пример

**Файл**: `src/examples/variant5-basic-example.tsx`

#### 6.2 Создать сложный пример (форма заявки на кредит)

**Файл**: `src/examples/variant5-credit-form.tsx`

#### 6.3 Написать документацию

- API Reference
- Migration Guide
- Best Practices

### Deliverables
- ✅ Примеры использования
- ✅ Полная документация
- ✅ Migration guide

**Время**: 2-3 дня

---

## Фаза 7: Тестирование и оптимизация (2-3 дня)

### Цель
Всестороннее тестирование и оптимизация производительности.

### Задачи

#### 7.1 Производительность

- Benchmark тесты
- Оптимизация Proxy
- Оптимизация переиндексации

#### 7.2 Edge cases

- Глубокая вложенность (5+ уровней)
- Большие массивы (100+ элементов)
- Массивы внутри массивов

#### 7.3 Browser compatibility

### Deliverables
- ✅ Performance tests
- ✅ Edge case tests
- ✅ Browser compatibility report

**Время**: 2-3 дня

---

## Timeline

| Фаза | Задачи | Время |
|------|--------|-------|
| 1. Подготовка | Типы, интерфейсы | 2-3 дня |
| 2. GroupProxy | Вложенные формы | 3-4 дня |
| 3. ArrayProxy | Массивы форм | 4-5 дней |
| 4. FormStore | Автоопределение | 3-4 дня |
| 5. Валидация | Интеграция | 2-3 дня |
| 6. Примеры | Документация | 2-3 дня |
| 7. Тестирование | Оптимизация | 2-3 дня |

**Итого: 18-25 дней** (3.5-5 недель)

---

## Риски и митигация

### Риск 1: Сложность Proxy

**Описание**: Proxy логика может быть сложной и хрупкой

**Митигация**:
- Extensive unit tests
- Хорошая документация кода
- Code review на каждом этапе
- Fallback механизмы

### Риск 2: TypeScript типы

**Описание**: Сложные conditional types могут не работать идеально

**Митигация**:
- Тестирование типов с tsd
- Упрощение типов где возможно
- Документация type limitations

### Риск 3: Производительность

**Описание**: Proxy может быть медленнее прямого доступа

**Митигация**:
- Early benchmarking
- Кеширование Proxy объектов
- Оптимизация hot paths
- Рассмотреть гибридный подход

### Риск 4: Отладка

**Описание**: Proxy сложно отлаживать

**Митигация**:
- Хорошее логирование
- Debug mode с detailed logging
- DevTools integration
- Error boundaries

---

## Success Criteria

### Must Have
- ✅ Работает доступ через точку: `form.controls.personalData.firstName`
- ✅ Работает доступ по индексу: `form.controls.items[0].title`
- ✅ Автоматическое определение типов из схемы
- ✅ Полная типизация TypeScript
- ✅ Валидация на всех уровнях
- ✅ Реактивность через Signals
- ✅ Unit test coverage > 80%

### Should Have
- ✅ Performance comparable to Вариант 2 (±20%)
- ✅ Хорошая документация
- ✅ Примеры для всех use cases
- ✅ Migration guide

### Nice to Have
- ✅ DevTools integration
- ✅ Debug mode
- ✅ Performance profiler

---

## Следующие шаги после реализации

1. **Сравнительное тестирование** с Вариантом 2
2. **User feedback** от команды
3. **Performance optimization** на основе метрик
4. **Production pilot** на небольшом проекте
5. **Документация best practices**
6. **Решение**: оставить один вариант или поддерживать оба

---

## Заключение

**Вариант 5** предоставляет самый элегантный API, но требует значительных усилий на реализацию и тестирование.

**Рекомендуется**:
- Начать с MVP (Фазы 1-4)
- Получить early feedback
- Принять решение о продолжении на основе результатов

**Альтернатива**: Реализовать **Вариант 2** (быстрее и надежнее) с тонким Proxy слоем для доступа по индексам.
