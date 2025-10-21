# Вариант 5: Proxy-based Deep Access + FormArray

> **Расширение варианта 5** с поддержкой массивов вложенных форм
> **Дата**: 2025-10-21

---

## Концепция

Вариант 5 использует JavaScript Proxy для создания элегантного API с глубоким доступом. Добавление массивов форм сохраняет эту элегантность и добавляет возможность работы с динамическими коллекциями.

**Ключевая идея**: Массивы форм также представляются через Proxy, который предоставляет:
- Доступ по индексу: `form.controls.properties[0].type.value`
- Array методы: `form.controls.properties.push()`, `remove(index)`
- Реактивность: `form.controls.properties.length.value`

---

## Пример API

### Базовое использование

```typescript
interface CreditForm {
  loanAmount: number;
  personalData: PersonalData;
  properties: PropertyItem[]; // Массив форм
  existingLoans: ExistingLoan[]; // Еще один массив
}

interface PropertyItem {
  type: PropertyType;
  description: string;
  estimatedValue: number;
}

// Создание формы
const form = new FormStore<CreditForm>(schema);

// ============================================================================
// Доступ к вложенным формам (как раньше)
// ============================================================================
form.controls.personalData.firstName.value = 'John';
form.controls.personalData.lastName.value = 'Doe';

// ============================================================================
// Работа с массивами форм - элегантный API через Proxy
// ============================================================================

// Доступ по индексу - как к обычному массиву
form.controls.properties[0].type.value = 'apartment';
form.controls.properties[0].estimatedValue.value = 5000000;

// Array методы
form.controls.properties.push(); // Добавить новый элемент
form.controls.properties.push({ type: 'house', estimatedValue: 8000000 }); // С данными
form.controls.properties.remove(0); // Удалить по индексу
form.controls.properties.insert(1, { type: 'car' }); // Вставить в позицию
form.controls.properties.clear(); // Очистить массив

// Реактивная длина
const count = form.controls.properties.length.value; // Signal<number>

// Итерация
form.controls.properties.forEach((item, index) => {
  console.log(item.type.value);
});

// Получить все элементы
const items = form.controls.properties.items.value; // Signal<FieldController[]>

// Валидация массива
form.controls.properties.valid; // boolean
form.controls.properties.errors; // ValidationError[]

// Получение значений массива
const values = form.controls.properties.getValue(); // PropertyItem[]
```

### Работа с вложенными массивами

```typescript
interface CreditForm {
  properties: PropertyItem[];
}

interface PropertyItem {
  type: string;
  owners: Owner[]; // Вложенный массив внутри массива!
}

interface Owner {
  name: string;
  share: number;
}

// Deep access к вложенным массивам
form.controls.properties[0].owners[0].name.value = 'John';
form.controls.properties[0].owners[1].share.value = 0.5;

// Управление вложенными массивами
form.controls.properties[0].owners.push({ name: 'Jane', share: 0.5 });
```

---

## Схема с массивами

```typescript
const schema: DeepFormSchema<CreditForm> = {
  loanAmount: {
    value: 0,
    component: Input,
    componentProps: { label: 'Сумма кредита' },
  },

  personalData: {
    firstName: {
      value: '',
      component: Input,
      componentProps: { label: 'Имя' },
    },
    lastName: {
      value: '',
      component: Input,
      componentProps: { label: 'Фамилия' },
    },
  },

  // Массив форм
  properties: {
    type: 'array',
    factory: {
      type: {
        value: 'apartment' as PropertyType,
        component: Select,
        componentProps: {
          label: 'Тип имущества',
          options: PROPERTY_TYPES,
        },
      },
      description: {
        value: '',
        component: Textarea,
        componentProps: { label: 'Описание' },
      },
      estimatedValue: {
        value: 0,
        component: Input,
        componentProps: {
          label: 'Оценочная стоимость',
          type: 'number',
        },
      },
    },
    initial: [], // Начальные значения
  },

  existingLoans: {
    type: 'array',
    factory: {
      bank: { value: '', component: Input },
      amount: { value: 0, component: Input },
      monthlyPayment: { value: 0, component: Input },
    },
    initial: [],
  },
};
```

---

## Реализация

### 1. ArrayProxy класс

```typescript
/**
 * Proxy для массива форм
 * Предоставляет элегантный API для работы с массивами
 */
class ArrayProxy<T extends Record<string, any>> {
  private _items: Signal<GroupProxy<T>[]>;
  private _errors: Signal<ValidationError[]>;
  private factory: DeepFormSchema<T>;

  constructor(
    private store: FormStore<any>,
    private path: string[],
    private config: ArrayConfig<T>
  ) {
    this.factory = config.factory;
    this._items = signal([]);
    this._errors = signal([]);

    // Инициализируем начальные элементы
    if (config.initial && config.initial.length > 0) {
      config.initial.forEach(item => this.push(item));
    }
  }

  // ============================================================================
  // Proxy для доступа по индексу
  // ============================================================================

  private itemsProxy = new Proxy([] as any, {
    get: (target, prop: string | symbol) => {
      // Числовой индекс
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        const index = parseInt(prop, 10);
        return this._items.value[index];
      }

      // Array методы и свойства
      if (prop === 'length') {
        return this.length;
      }
      if (prop === 'push') {
        return this.push.bind(this);
      }
      if (prop === 'remove') {
        return this.remove.bind(this);
      }
      if (prop === 'insert') {
        return this.insert.bind(this);
      }
      if (prop === 'clear') {
        return this.clear.bind(this);
      }
      if (prop === 'forEach') {
        return this.forEach.bind(this);
      }
      if (prop === 'map') {
        return this.map.bind(this);
      }
      if (prop === 'at') {
        return this.at.bind(this);
      }
      if (prop === 'items') {
        return this._items;
      }

      // Validation
      if (prop === 'valid') {
        return this.valid;
      }
      if (prop === 'invalid') {
        return this.invalid;
      }
      if (prop === 'errors') {
        return this._errors.value;
      }
      if (prop === 'validate') {
        return this.validate.bind(this);
      }

      // Value
      if (prop === 'getValue') {
        return this.getValue.bind(this);
      }
      if (prop === 'setValue') {
        return this.setValue.bind(this);
      }

      return undefined;
    },

    // Поддержка for...of, spread operator
    has: (target, prop) => {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        const index = parseInt(prop, 10);
        return index >= 0 && index < this._items.value.length;
      }
      return prop in this;
    },
  });

  // ============================================================================
  // Реактивные свойства
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

  /**
   * Добавить новый элемент в конец массива
   */
  push(initialValue?: Partial<T>): void {
    const itemProxy = this.createItem(this._items.value.length, initialValue);
    this._items.value = [...this._items.value, itemProxy];
  }

  /**
   * Удалить элемент по индексу
   */
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

  /**
   * Вставить элемент в указанную позицию
   */
  insert(index: number, initialValue?: Partial<T>): void {
    if (index < 0 || index > this._items.value.length) {
      console.warn(`ArrayProxy: index ${index} out of bounds`);
      return;
    }

    // Сдвигаем индексы существующих элементов
    const newItems = [...this._items.value];
    this.shiftIndices(index, 1);

    // Создаем новый элемент
    const itemProxy = this.createItem(index, initialValue);
    newItems.splice(index, 0, itemProxy);

    this._items.value = newItems;
  }

  /**
   * Очистить массив
   */
  clear(): void {
    // Удаляем все поля из FormStore
    for (let i = this._items.value.length - 1; i >= 0; i--) {
      this.removeItemFields(i);
    }

    this._items.value = [];
  }

  /**
   * Получить элемент по индексу
   */
  at(index: number): GroupProxy<T> | undefined {
    return this._items.value[index];
  }

  // ============================================================================
  // Итерация
  // ============================================================================

  forEach(callback: (item: GroupProxy<T>, index: number) => void): void {
    this._items.value.forEach(callback);
  }

  map<R>(callback: (item: GroupProxy<T>, index: number) => R): R[] {
    return this._items.value.map(callback);
  }

  // ============================================================================
  // Валидация
  // ============================================================================

  async validate(): Promise<boolean> {
    const results = await Promise.all(
      this._items.value.map(item => item.validate())
    );

    // Array-level validation (можно добавить кастомные валидаторы)
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

  // ============================================================================
  // Получение/установка значений
  // ============================================================================

  getValue(): T[] {
    return this._items.value.map(item => item.getValue());
  }

  setValue(values: Partial<T>[]): void {
    // Очищаем существующие элементы
    this.clear();

    // Добавляем новые
    values.forEach(value => this.push(value));
  }

  // ============================================================================
  // Private методы
  // ============================================================================

  /**
   * Создать новый элемент массива
   */
  private createItem(index: number, initialValue?: Partial<T>): GroupProxy<T> {
    const itemPath = [...this.path, String(index)];

    // Создаем поля для элемента в FormStore
    this.createItemFields(index, initialValue);

    // Создаем GroupProxy для элемента
    return new GroupProxy<T>(this.store, itemPath);
  }

  /**
   * Создать поля для элемента в FormStore
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

        if (this.isFieldConfig(config)) {
          // Это поле
          const value = values?.[key] ?? (config as any).value;
          this.store['fields'].set(
            flatKey,
            new FieldController({ ...config, value })
          );
        } else if (config.type === 'array') {
          // Вложенный массив
          // Создаем ArrayProxy
          const arrayProxy = new ArrayProxy(
            this.store,
            currentPath,
            config as ArrayConfig<any>
          );
          // Инициализируем значения если есть
          if (values?.[key]) {
            arrayProxy.setValue(values[key]);
          }
        } else {
          // Вложенная группа
          flattenField(config, currentPath, values?.[key]);
        }
      }
    };

    const itemPath = [...this.path, String(index)];
    flattenField(this.factory, itemPath, initialValue);
  }

  /**
   * Удалить поля элемента из FormStore
   */
  private removeItemFields(index: number): void {
    const prefix = [...this.path, String(index)].join('.');

    // Находим и удаляем все поля с этим префиксом
    const keysToRemove: string[] = [];
    this.store['fields'].forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => this.store['fields'].delete(key));
  }

  /**
   * Переиндексировать элементы после удаления
   */
  private reindexItems(items: GroupProxy<T>[], fromIndex: number): void {
    for (let i = fromIndex; i < items.length; i++) {
      this.renameItemFields(i + 1, i);
    }
  }

  /**
   * Сдвинуть индексы при вставке
   */
  private shiftIndices(fromIndex: number, offset: number): void {
    for (let i = this._items.value.length - 1; i >= fromIndex; i--) {
      this.renameItemFields(i, i + offset);
    }
  }

  /**
   * Переименовать поля элемента (изменить индекс)
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

  // ============================================================================
  // Proxy accessor
  // ============================================================================

  get proxy(): any {
    return this.itemsProxy;
  }
}
```

### 2. Обновленный GroupProxy

```typescript
/**
 * Обновленный GroupProxy с поддержкой вложенных массивов
 */
class GroupProxy<T extends Record<string, any>> {
  constructor(
    private store: FormStore<any>,
    private path: string[]
  ) {}

  // Proxy для доступа к полям и вложенным структурам
  private controlsProxy = new Proxy({} as any, {
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
          const arrayProxy = new ArrayProxy(
            this.store,
            currentPath,
            arrayConfig
          );
          this.store['arrayProxies'].set(flatKey, arrayProxy);
        }
        return this.store['arrayProxies'].get(flatKey).proxy;
      }

      // Проверяем, есть ли вложенные поля с таким префиксом?
      const hasNestedFields = Array.from(this.store['fields'].keys())
        .some(key => key.startsWith(flatKey + '.'));

      if (hasNestedFields) {
        // Возвращаем новый GroupProxy
        return new GroupProxy(this.store, currentPath).proxy;
      }

      return undefined;
    }
  });

  get proxy(): any {
    return this.controlsProxy;
  }

  // Validation
  get valid(): boolean {
    const prefix = this.path.join('.');
    return Array.from(this.store['fields'].entries())
      .filter(([key]) => key.startsWith(prefix))
      .every(([_, field]) => field.valid);
  }

  get invalid(): boolean {
    return !this.valid;
  }

  async validate(): Promise<boolean> {
    const prefix = this.path.join('.');
    const fields = Array.from(this.store['fields'].entries())
      .filter(([key]) => key.startsWith(prefix))
      .map(([_, field]) => field);

    const results = await Promise.all(fields.map(f => f.validate()));
    return results.every(r => r);
  }

  // Values
  getValue(): T {
    const prefix = this.path.join('.');
    const result: any = {};

    this.store['fields'].forEach((field, key) => {
      if (key.startsWith(prefix)) {
        const relativePath = key.substring(prefix.length + 1);
        setNestedValue(result, relativePath, field.getValue());
      }
    });

    // Также получаем значения массивов
    this.store['arrayProxies']?.forEach((arrayProxy, key) => {
      if (key.startsWith(prefix)) {
        const relativePath = key.substring(prefix.length + 1);
        setNestedValue(result, relativePath, arrayProxy.getValue());
      }
    });

    return result;
  }
}
```

### 3. Обновленный FormStore

```typescript
export class FormStore<T extends Record<string, any>> {
  private fields: Map<string, FieldController<any>>;
  private arrayConfigs: Map<string, ArrayConfig<any>>;
  private arrayProxies: Map<string, ArrayProxy<any>>;
  private controlsProxy: any;

  constructor(schema: DeepFormSchema<T>) {
    this.fields = new Map();
    this.arrayConfigs = new Map();
    this.arrayProxies = new Map();

    // Разворачиваем схему
    this.flattenSchema(schema, []);

    // Создаем Proxy для доступа
    this.controlsProxy = this.createControlsProxy([]);
  }

  private flattenSchema(schema: any, path: string[]): void {
    for (const [key, config] of Object.entries(schema)) {
      const currentPath = [...path, key];
      const flatKey = currentPath.join('.');

      if (config.type === 'array') {
        // Это массив - сохраняем конфигурацию
        this.arrayConfigs.set(flatKey, config);
      } else if (this.isFieldConfig(config)) {
        // Это поле
        this.fields.set(flatKey, new FieldController(config));
      } else {
        // Это группа - рекурсия
        this.flattenSchema(config, currentPath);
      }
    }
  }

  private createControlsProxy(path: string[]): any {
    return new Proxy({}, {
      get: (_, prop: string | symbol) => {
        if (typeof prop !== 'string') return undefined;

        const currentPath = [...path, prop];
        const flatKey = currentPath.join('.');

        // Проверяем, это поле?
        const field = this.fields.get(flatKey);
        if (field) {
          return field;
        }

        // Проверяем, это массив?
        const arrayConfig = this.arrayConfigs.get(flatKey);
        if (arrayConfig) {
          // Создаем или получаем ArrayProxy
          if (!this.arrayProxies.has(flatKey)) {
            const arrayProxy = new ArrayProxy(
              this,
              currentPath,
              arrayConfig
            );
            this.arrayProxies.set(flatKey, arrayProxy);
          }
          return this.arrayProxies.get(flatKey)!.proxy;
        }

        // Проверяем наличие вложенных полей
        const hasNestedFields =
          Array.from(this.fields.keys()).some(key => key.startsWith(flatKey + '.')) ||
          Array.from(this.arrayConfigs.keys()).some(key => key.startsWith(flatKey + '.'));

        if (hasNestedFields) {
          // Возвращаем GroupProxy
          return new GroupProxy(this, currentPath).proxy;
        }

        return undefined;
      }
    });
  }

  get controls(): DeepControls<T> {
    return this.controlsProxy;
  }

  getValue(): T {
    const result: any = {};

    // Собираем значения полей
    this.fields.forEach((field, key) => {
      setNestedValue(result, key, field.getValue());
    });

    // Собираем значения массивов
    this.arrayProxies.forEach((arrayProxy, key) => {
      setNestedValue(result, key, arrayProxy.getValue());
    });

    return result;
  }

  private isFieldConfig(config: any): boolean {
    return config && 'value' in config && 'component' in config;
  }
}
```

### 4. Типы

```typescript
// Конфигурация массива
interface ArrayConfig<T extends Record<string, any>> {
  type: 'array';
  factory: DeepFormSchema<T>;
  initial?: Partial<T>[];
  validators?: ValidatorFn[];
}

// Deep schema с поддержкой массивов
type DeepFormSchema<T> = {
  [K in keyof T]: T[K] extends Array<infer U>
    ? U extends Record<string, any>
      ? ArrayConfig<U>
      : FieldConfig<T[K]>
    : T[K] extends Record<string, any>
    ? DeepFormSchema<T[K]> | FieldConfig<T[K]>
    : FieldConfig<T[K]>;
};

// Deep controls с поддержкой массивов
type DeepControls<T> = {
  [K in keyof T]: T[K] extends Array<infer U>
    ? U extends Record<string, any>
      ? ArrayControlProxy<U>
      : FieldController<T[K]>
    : T[K] extends Record<string, any>
    ? DeepControls<T[K]> & GroupProxy<T[K]>
    : FieldController<T[K]>;
};

// Proxy для массива с методами и индексацией
interface ArrayControlProxy<T extends Record<string, any>> {
  // Доступ по индексу
  [index: number]: DeepControls<T> & GroupProxy<T>;

  // Свойства
  length: ReadonlySignal<number>;
  items: ReadonlySignal<GroupProxy<T>[]>;
  valid: boolean;
  invalid: boolean;
  errors: ValidationError[];

  // Методы управления
  push(value?: Partial<T>): void;
  remove(index: number): void;
  insert(index: number, value?: Partial<T>): void;
  clear(): void;
  at(index: number): GroupProxy<T> | undefined;

  // Итерация
  forEach(callback: (item: GroupProxy<T>, index: number) => void): void;
  map<R>(callback: (item: GroupProxy<T>, index: number) => R): R[];

  // Валидация
  validate(): Promise<boolean>;

  // Значения
  getValue(): T[];
  setValue(values: Partial<T>[]): void;
}
```

---

## Пример использования в React

### Компонент с массивом форм

```typescript
import { useSignals } from '@preact/signals-react/runtime';
import { FormStore } from '@/lib/forms/core/form-store';

interface PropertyItem {
  type: PropertyType;
  description: string;
  estimatedValue: number;
  hasEncumbrance: boolean;
}

interface CreditForm {
  loanAmount: number;
  properties: PropertyItem[];
}

function PropertiesForm({ form }: { form: FormStore<CreditForm> }) {
  useSignals();

  const properties = form.controls.properties;

  return (
    <div className="properties-section">
      <h3>Имущество</h3>

      {/* Список элементов */}
      {properties.items.value.map((_, index) => (
        <div key={index} className="property-item">
          <h4>Объект #{index + 1}</h4>

          {/* Доступ через индекс - элегантный API */}
          <FormField control={properties[index].type} />
          <FormField control={properties[index].description} />
          <FormField control={properties[index].estimatedValue} />
          <FormField control={properties[index].hasEncumbrance} />

          {/* Удаление */}
          <button
            onClick={() => properties.remove(index)}
            className="btn-danger"
          >
            Удалить
          </button>
        </div>
      ))}

      {/* Добавление нового элемента */}
      <button
        onClick={() => properties.push()}
        className="btn-primary"
      >
        Добавить имущество
      </button>

      {/* Количество элементов - реактивное */}
      <div className="info">
        Всего объектов: {properties.length.value}
      </div>

      {/* Валидация массива */}
      {properties.invalid && (
        <div className="error">
          {properties.errors.map((error, i) => (
            <div key={i}>{error.message}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Вложенные массивы

```typescript
interface PropertyItem {
  type: string;
  owners: Owner[]; // Вложенный массив
}

interface Owner {
  name: string;
  share: number;
}

function PropertyWithOwnersForm({ form }: { form: FormStore<CreditForm> }) {
  useSignals();

  const properties = form.controls.properties;

  return (
    <div>
      {properties.items.value.map((_, propIndex) => (
        <div key={propIndex}>
          <h3>Объект #{propIndex + 1}</h3>

          <FormField control={properties[propIndex].type} />

          {/* Вложенный массив владельцев */}
          <div className="owners">
            <h4>Владельцы</h4>

            {properties[propIndex].owners.items.value.map((_, ownerIndex) => (
              <div key={ownerIndex}>
                <FormField
                  control={properties[propIndex].owners[ownerIndex].name}
                />
                <FormField
                  control={properties[propIndex].owners[ownerIndex].share}
                />

                <button
                  onClick={() =>
                    properties[propIndex].owners.remove(ownerIndex)
                  }
                >
                  Удалить владельца
                </button>
              </div>
            ))}

            <button
              onClick={() => properties[propIndex].owners.push()}
            >
              Добавить владельца
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Array методы и утилиты

```typescript
function PropertyManagement({ form }: { form: FormStore<CreditForm> }) {
  useSignals();

  const properties = form.controls.properties;

  // Вспомогательные функции
  const addDefaultProperty = () => {
    properties.push({
      type: 'apartment',
      description: 'Новый объект',
      estimatedValue: 0,
      hasEncumbrance: false,
    });
  };

  const duplicateProperty = (index: number) => {
    const original = properties[index].getValue();
    properties.insert(index + 1, original);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const item = properties[index].getValue();
    properties.remove(index);
    properties.insert(index - 1, item);
  };

  const moveDown = (index: number) => {
    if (index === properties.length.value - 1) return;
    const item = properties[index].getValue();
    properties.remove(index);
    properties.insert(index + 1, item);
  };

  const clearAll = () => {
    if (confirm('Удалить все объекты?')) {
      properties.clear();
    }
  };

  // Подсчет общей стоимости - реактивно
  const totalValue = computed(() =>
    properties.items.value.reduce(
      (sum, item) => sum + item.estimatedValue.value,
      0
    )
  );

  return (
    <div>
      {/* Список с управлением */}
      {properties.items.value.map((_, index) => (
        <div key={index} className="property-card">
          <div className="property-header">
            <h4>Объект #{index + 1}</h4>

            <div className="actions">
              <button onClick={() => duplicateProperty(index)}>
                Дублировать
              </button>
              <button onClick={() => moveUp(index)} disabled={index === 0}>
                ↑
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === properties.length.value - 1}
              >
                ↓
              </button>
              <button onClick={() => properties.remove(index)}>
                Удалить
              </button>
            </div>
          </div>

          {/* Поля формы */}
          <FormField control={properties[index].type} />
          <FormField control={properties[index].description} />
          <FormField control={properties[index].estimatedValue} />
          <FormField control={properties[index].hasEncumbrance} />
        </div>
      ))}

      {/* Кнопки управления */}
      <div className="controls">
        <button onClick={() => properties.push()}>
          Добавить пустой
        </button>
        <button onClick={addDefaultProperty}>
          Добавить с данными
        </button>
        <button onClick={clearAll} disabled={properties.length.value === 0}>
          Очистить все
        </button>
      </div>

      {/* Статистика */}
      <div className="stats">
        <div>Всего объектов: {properties.length.value}</div>
        <div>Общая стоимость: {totalValue.value.toLocaleString()} ₽</div>
      </div>
    </div>
  );
}
```

---

## Преимущества расширенного Варианта 5

### ✅ Элегантный API
```typescript
// Доступ выглядит естественно
form.controls.properties[0].type.value = 'apartment';

// Array методы интуитивны
form.controls.properties.push();
form.controls.properties.remove(0);
```

### ✅ Полная типизация
TypeScript понимает всю структуру, включая индексы массивов:
```typescript
// Type-safe доступ
const type: FieldController<PropertyType> = form.controls.properties[0].type;

// Автодополнение работает
form.controls.properties[0]. // <- показывает все поля PropertyItem
```

### ✅ Реактивность
Все изменения реактивны благодаря Signals:
```typescript
// Длина массива - реактивна
<div>Элементов: {properties.length.value}</div>

// Элементы массива - реактивны
properties.items.value.map(...)
```

### ✅ Вложенные структуры
Поддержка любой глубины вложенности:
```typescript
// Массив внутри массива
form.controls.properties[0].owners[0].name.value = 'John';

// Группа внутри массива
form.controls.properties[0].address.city.value = 'Moscow';
```

### ✅ Flat хранилище
Несмотря на вложенный API, внутри плоская структура:
- Хорошая производительность
- Простая сериализация
- Легкая отладка

---

## Недостатки

### ❌ Сложная реализация
- Много Proxy логики
- Сложная система переиндексации
- Трудно отлаживать

### ❌ TypeScript ограничения
- Сложные условные типы
- Проблемы с выводом типов при глубокой вложенности
- IDE может тормозить на больших типах

### ❌ Производительность Proxy
- Proxy медленнее прямого доступа
- Много операций при работе с массивами
- Переиндексация при вставке/удалении

### ❌ Память
- Каждый ArrayProxy хранит Signal с элементами
- Дополнительная память на Proxy объекты

---

## Сравнение с Вариантом 2 (FormGroup)

| Аспект | Вариант 5 + Arrays | Вариант 2 (FormGroup + FormArray) |
|--------|-------------------|-----------------------------------|
| **API для массивов** | `form.controls.properties[0].type` | `form.controls.properties.at(0).controls.type` |
| **Типизация** | ⭐⭐⭐⭐ (хорошая) | ⭐⭐⭐⭐⭐ (отличная) |
| **Читаемость** | ⭐⭐⭐⭐⭐ (очень читаемо) | ⭐⭐⭐⭐ (читаемо) |
| **Простота реализации** | ⭐⭐ (сложно) | ⭐⭐⭐⭐ (проще) |
| **Производительность** | ⭐⭐⭐ (Proxy overhead) | ⭐⭐⭐⭐ (прямой доступ) |
| **Отладка** | ⭐⭐ (Proxy сложно) | ⭐⭐⭐⭐ (понятно) |
| **Переиндексация** | Автоматическая | Явная через контроллер |

---

## Заключение

**Вариант 5 с массивами** предоставляет **самый элегантный API** для работы с вложенными формами и массивами:

```typescript
// Максимально чистый и понятный код
form.controls.properties[0].type.value = 'apartment';
form.controls.properties[0].owners[0].name.value = 'John';
form.controls.properties.push({ type: 'house' });
```

Однако, за элегантность приходится платить:
- Сложной реализацией
- Overhead от Proxy
- Трудностями с отладкой

**Рекомендация**:
- Для **production** проектов → **Вариант 2 (FormGroup + FormArray)** - надежнее и понятнее
- Для **экспериментов** и **прототипов** → **Вариант 5** - красивейший API

Можно также рассмотреть **гибридный подход**:
- Использовать FormGroup/FormArray для структуры
- Добавить тонкий Proxy слой для удобного доступа по индексам
