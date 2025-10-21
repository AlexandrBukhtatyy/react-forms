# Архитектурные варианты для вложенных форм в FormStore

> **Дата исследования**: 2025-10-21
> **Статус**: Завершено
> **Цель**: Разработать архитектурные варианты для поддержки вложенных форм (nested forms) и массивов форм (form arrays)

---

## Резюме анализа

На основе изучения документации Angular Signal Forms и текущей реализации FormStore, разработано **5 архитектурных вариантов** для поддержки вложенных форм (nested forms) и массивов форм (form arrays).

### Контекст исследования

**Изученные материалы:**
- [docs/signals-in-angular/SIGNAL_FORMS_COMPLETE_GUIDE.md](signals-in-angular/SIGNAL_FORMS_COMPLETE_GUIDE.md)
- [docs/signals-in-angular/CREDIT_APPLICATION_EXAMPLE.md](signals-in-angular/CREDIT_APPLICATION_EXAMPLE.md)
- [src/lib/forms/core/form-store.ts](../src/lib/forms/core/form-store.ts)
- [src/lib/forms/core/field-controller.ts](../src/lib/forms/core/field-controller.ts)
- [src/domains/credit-applications/form/](../src/domains/credit-applications/form/)

**Текущая архитектура:**
- `FormStore<T>` - главный класс управления состоянием формы
- `FieldController<T>` - управление отдельным полем
- `@preact/signals-react` - реактивное состояние
- Валидация через `ValidationRegistry` и contextual validators

---

## Вариант 1: Flat Schema с Dot Notation

### Описание подхода
Самый простой подход - сохранить плоскую структуру FormStore, но использовать dot notation для обозначения вложенности. Вложенные объекты разворачиваются в плоские ключи.

### Пример API

```typescript
interface CreditForm {
  loanAmount: number;
  personalData: PersonalData; // Вложенная форма
}

interface PersonalData {
  firstName: string;
  lastName: string;
}

// Использование
const form = new FormStore<CreditForm>(schema);

// Доступ через dot notation
form.controls['personalData.firstName'].value = 'John';
form.controls['personalData.lastName'].value = 'Doe';

// Получение значений
const values = form.getValue(); // { loanAmount: 1000, personalData: { firstName: 'John', lastName: 'Doe' } }
```

### Пример схемы

```typescript
const schema: FormSchema<CreditForm> = {
  loanAmount: {
    value: 0,
    component: Input,
    componentProps: { label: 'Сумма кредита' },
  },

  // Плоские поля для вложенной формы
  'personalData.firstName': {
    value: '',
    component: Input,
    componentProps: { label: 'Имя' },
  },
  'personalData.lastName': {
    value: '',
    component: Input,
    componentProps: { label: 'Фамилия' },
  },
};
```

### Реализация

```typescript
export class FormStore<T extends Record<string, any>> {
  private fields: Map<string, FieldController<any>>;

  constructor(schema: FormSchema<T>) {
    this.fields = new Map();

    for (const [key, config] of Object.entries(schema)) {
      // Поддержка dot notation
      this.fields.set(key, new FieldController(config));
    }
  }

  getValue(): T {
    const result: any = {};

    this.fields.forEach((field, key) => {
      // Парсим dot notation и создаем вложенную структуру
      const parts = key.split('.');
      let current = result;

      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = current[parts[i]] || {};
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = field.getValue();
    });

    return result as T;
  }
}
```

### Преимущества
✅ Минимальные изменения в текущей архитектуре
✅ Простая реализация
✅ Работает с существующим FieldController
✅ Легко понять и использовать

### Недостатки
❌ Плохая типизация TypeScript (теряется type safety)
❌ Нет переиспользования схем для вложенных форм
❌ Схема становится громоздкой при глубокой вложенности
❌ Нет изоляции логики вложенных форм
❌ Сложно делать условную валидацию вложенных групп

---

## Вариант 2: FormGroup Controller

### Описание подхода
Создаем новый тип контроллера - `FormGroupController`, который управляет группой полей. FormStore может содержать как `FieldController`, так и `FormGroupController`.

### Пример API

```typescript
interface CreditForm {
  loanAmount: number;
  personalData: PersonalData;
}

// Использование
const form = new FormStore<CreditForm>({
  loanAmount: {
    value: 0,
    component: Input,
  },
  personalData: FormGroup<PersonalData>({
    firstName: { value: '', component: Input },
    lastName: { value: '', component: Input },
  }),
});

// Доступ к вложенной форме
form.controls.personalData.controls.firstName.value = 'John';

// Валидация вложенной группы
form.controls.personalData.valid; // boolean
form.controls.personalData.getValue(); // { firstName: 'John', lastName: 'Doe' }
```

### Пример схемы

```typescript
const personalDataSchema = {
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
  birthDate: {
    value: '',
    component: Input,
    componentProps: { label: 'Дата рождения', type: 'date' },
  },
};

const schema: FormSchema<CreditForm> = {
  loanAmount: {
    value: 0,
    component: Input,
  },

  // Вложенная форма через FormGroup
  personalData: FormGroup<PersonalData>(personalDataSchema),
};
```

### Реализация

```typescript
// Базовый интерфейс для всех контроллеров
interface AbstractControl<T = any> {
  value: T;
  valid: boolean;
  invalid: boolean;
  errors: ValidationError[];
  touched: boolean;
  dirty: boolean;

  getValue(): T;
  setValue(value: T): void;
  validate(): Promise<boolean>;
  markAsTouched(): void;
  reset(): void;
}

// FormGroupController для вложенных форм
export class FormGroupController<T extends Record<string, any>> implements AbstractControl<T> {
  private fields: Map<keyof T, AbstractControl<any>>;
  private _value: ReadonlySignal<T>;

  constructor(schema: FormGroupSchema<T>) {
    this.fields = new Map();

    for (const [key, config] of Object.entries(schema)) {
      if (config.type === 'field') {
        this.fields.set(key as keyof T, new FieldController(config));
      } else if (config.type === 'group') {
        this.fields.set(key as keyof T, new FormGroupController(config.schema));
      }
    }

    this._value = computed(() => {
      const result = {} as T;
      this.fields.forEach((control, key) => {
        result[key] = control.value;
      });
      return result;
    });
  }

  get value(): T {
    return this._value.value;
  }

  get controls(): Record<keyof T, AbstractControl> {
    return Object.fromEntries(this.fields) as any;
  }

  get valid(): boolean {
    return Array.from(this.fields.values()).every(field => field.valid);
  }

  async validate(): Promise<boolean> {
    const results = await Promise.all(
      Array.from(this.fields.values()).map(field => field.validate())
    );
    return results.every(r => r);
  }

  getValue(): T {
    const result = {} as T;
    this.fields.forEach((field, key) => {
      result[key] = field.getValue();
    });
    return result;
  }

  setValue(values: Partial<T>): void {
    for (const [key, value] of Object.entries(values)) {
      this.fields.get(key as keyof T)?.setValue(value);
    }
  }

  markAsTouched(): void {
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
}

// Helper для создания группы
export function FormGroup<T extends Record<string, any>>(
  schema: FormGroupSchema<T>
): FormGroupConfig<T> {
  return {
    type: 'group',
    schema,
    component: () => null,
    componentProps: {},
  };
}

// Обновленный FormStore
export class FormStore<T extends Record<string, any>> {
  private fields: Map<keyof T, AbstractControl<any>>;

  // Поддержка как FieldController, так и FormGroupController
  constructor(schema: FormSchema<T>) {
    this.fields = new Map();

    for (const [key, config] of Object.entries(schema)) {
      if ('type' in config && config.type === 'group') {
        this.fields.set(key as keyof T, new FormGroupController(config.schema));
      } else {
        this.fields.set(key as keyof T, new FieldController(config));
      }
    }
  }
}
```

### Преимущества
✅ **Отличная типизация** - TypeScript полностью понимает структуру
✅ **Переиспользование** - схемы вложенных форм можно переиспользовать
✅ **Изоляция логики** - каждая группа имеет свою валидацию и состояние
✅ **Familiar API** - похож на Angular FormGroup (проверенный паттерн)
✅ **Composition** - можно создавать сложные формы из простых блоков

### Недостатки
❌ Требует создания нового класса FormGroupController
❌ Усложнение архитектуры (больше классов)
❌ Нужно обновить типы FormSchema
❌ Duplicate code между FormGroupController и FormStore

---

## Вариант 3: Nested FormStore (Composition)

### Описание подхода
Вложенные формы - это отдельные экземпляры FormStore. Главная форма содержит FormStore как значения полей. Чистая композиция.

### Пример API

```typescript
interface CreditForm {
  loanAmount: number;
  personalData: PersonalData;
}

// Создаем схему для вложенной формы
const personalDataForm = new FormStore<PersonalData>({
  firstName: { value: '', component: Input },
  lastName: { value: '', component: Input },
  birthDate: { value: '', component: Input },
});

// Создаем главную форму
const creditForm = new FormStore<CreditForm>({
  loanAmount: {
    value: 0,
    component: Input,
  },
  personalData: {
    value: personalDataForm,
    component: PersonalDataFormComponent,
    componentProps: {},
  },
});

// Доступ к вложенной форме
creditForm.controls.personalData.value.controls.firstName.value = 'John';

// Или через helper
creditForm.getNestedForm('personalData').controls.firstName.value = 'John';
```

### Пример схемы

```typescript
// Переиспользуемая схема для PersonalData
export const createPersonalDataFormStore = () => new FormStore<PersonalData>({
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
  birthDate: {
    value: '',
    component: Input,
    componentProps: { label: 'Дата рождения', type: 'date' },
  },
});

// Главная форма
const schema: FormSchema<CreditForm> = {
  loanAmount: {
    value: 0,
    component: Input,
  },

  personalData: {
    value: createPersonalDataFormStore(),
    component: PersonalDataFormComponent,
  },
};
```

### Реализация

```typescript
// Расширяем FieldController для поддержки вложенных FormStore
export class FieldController<T = any> {
  private _value: Signal<T>;

  // Определяем, является ли значение FormStore
  get isNestedForm(): boolean {
    return this._value.value instanceof FormStore;
  }

  // Helper для безопасного доступа к вложенной форме
  asFormStore<N extends Record<string, any>>(): FormStore<N> | null {
    if (this.isNestedForm) {
      return this._value.value as FormStore<N>;
    }
    return null;
  }

  getValue(): T {
    if (this.isNestedForm) {
      return (this._value.value as FormStore<any>).getValue();
    }
    return this._value.value;
  }

  async validate(): Promise<boolean> {
    // Валидация вложенной формы
    if (this.isNestedForm) {
      return (this._value.value as FormStore<any>).validate();
    }

    // Обычная валидация
    // ... existing code
  }
}

// Расширяем FormStore
export class FormStore<T extends Record<string, any>> {
  // Helper для получения вложенной формы
  getNestedForm<K extends keyof T>(key: K): FormStore<T[K]> | null {
    const control = this.fields.get(key);
    if (control && control.isNestedForm) {
      return control.asFormStore<T[K]>();
    }
    return null;
  }

  getValue(): T {
    const result = {} as T;
    this.fields.forEach((field, key) => {
      result[key] = field.getValue(); // Автоматически обработает вложенные FormStore
    });
    return result;
  }
}
```

### Преимущества
✅ **Простая концепция** - FormStore внутри FormStore
✅ **Полное переиспользование** - вложенные формы независимы
✅ **Изоляция** - каждая форма полностью изолирована
✅ **Минимальные изменения** - используем существующий FormStore
✅ **Powerful composition** - можно создавать сложные иерархии

### Недостатки
❌ Громоздкий API для доступа (form.controls.personalData.value.controls.firstName)
❌ TypeScript может путаться с типами
❌ Нужны helper методы для удобства
❌ Производительность при глубокой вложенности (много Signal updates)

---

## Вариант 4: Unified Controller Pattern

### Описание подхода
Создаем единый универсальный контроллер `Control<T>`, который может быть как для простого поля, так и для группы полей. Определяется автоматически по типу значения.

### Пример API

```typescript
const form = createForm<CreditForm>({
  loanAmount: 0,
  personalData: {
    firstName: '',
    lastName: '',
    birthDate: '',
  },
});

// Unified API
form.controls.loanAmount.value = 1000; // FieldControl
form.controls.personalData.controls.firstName.value = 'John'; // GroupControl

// Type-safe доступ
form.value; // { loanAmount: number, personalData: PersonalData }
```

### Пример схемы

```typescript
// Schema inference из значения
const form = createForm({
  loanAmount: field(0, {
    component: Input,
    validators: [required, min(1000)],
  }),

  personalData: group({
    firstName: field('', { component: Input }),
    lastName: field('', { component: Input }),
    birthDate: field('', { component: Input, type: 'date' }),
  }),
});

// Или declarative schema
const schema = {
  loanAmount: 0,
  personalData: {
    firstName: '',
    lastName: '',
    birthDate: '',
  },
} satisfies FormValue;

const form = createForm(schema);
```

### Реализация

```typescript
// Unified control type
type Control<T> =
  T extends Record<string, any>
    ? GroupControl<T>
    : FieldControl<T>;

// Helper functions
export function field<T>(
  value: T,
  config?: FieldConfig<T>
): FieldConfig<T> {
  return { value, ...config };
}

export function group<T extends Record<string, any>>(
  schema: FormValue<T>
): GroupConfig<T> {
  return { type: 'group', schema };
}

// Фабричная функция
export function createForm<T extends Record<string, any>>(
  schema: FormValue<T>
): FormStore<T> {
  return new FormStore(normalizeSchema(schema));
}

// Normalize schema - автоматически определяет поля и группы
function normalizeSchema<T>(value: any): FormSchema<T> {
  const schema: any = {};

  for (const [key, val] of Object.entries(value)) {
    if (isPlainObject(val) && !isFieldConfig(val)) {
      // Вложенный объект = группа
      schema[key] = {
        type: 'group',
        schema: normalizeSchema(val),
      };
    } else if (isFieldConfig(val)) {
      // Уже сконфигурированное поле
      schema[key] = val;
    } else {
      // Простое значение
      schema[key] = {
        value: val,
        component: () => null,
      };
    }
  }

  return schema;
}

// Обновленный FormStore с generic controls
export class FormStore<T extends Record<string, any>> {
  private fields: Map<keyof T, Control<T[keyof T]>>;

  get controls(): {
    [K in keyof T]: Control<T[K]>
  } {
    return new Proxy({} as any, {
      get: (_, prop: string | symbol) => {
        if (typeof prop === 'string') {
          return this.fields.get(prop as keyof T);
        }
      }
    });
  }
}
```

### Преимущества
✅ **Лучшая типизация** - TypeScript полностью выводит типы
✅ **Clean API** - минимальный boilerplate
✅ **Auto-detection** - автоматически определяет поля и группы
✅ **Flexibility** - можно использовать declarative или функциональный стиль
✅ **Modern** - использует новейшие возможности TypeScript

### Недостатки
❌ **Сложная реализация** - требует продвинутых TypeScript типов
❌ **Большие изменения** - переписывание существующей архитектуры
❌ **Learning curve** - нужно понимать новую систему типов
❌ **Debugging** - сложнее отлаживать из-за generic magic

---

## Вариант 5: Proxy-based Deep Access

### Описание подхода
Используем JavaScript Proxy для создания "виртуальных" вложенных контроллеров. Физически хранится плоская структура, но API выглядит как вложенная.

### Пример API

```typescript
const form = new FormStore<CreditForm>(schema);

// Deep access через proxy
form.controls.personalData.firstName.value = 'John';
form.controls.personalData.lastName.value = 'Doe';

// Validation работает на любом уровне
form.controls.personalData.valid; // boolean для группы
form.controls.personalData.firstName.valid; // boolean для поля

// Получение значений
form.controls.personalData.getValue(); // { firstName: 'John', lastName: 'Doe' }
```

### Пример схемы

```typescript
const schema: DeepFormSchema<CreditForm> = {
  loanAmount: {
    value: 0,
    component: Input,
  },

  personalData: {
    firstName: {
      value: '',
      component: Input,
    },
    lastName: {
      value: '',
      component: Input,
    },
    birthDate: {
      value: '',
      component: Input,
      componentProps: { type: 'date' },
    },
  },
};
```

### Реализация

```typescript
// Поддержка глубокой схемы
type DeepFormSchema<T> = {
  [K in keyof T]: T[K] extends Record<string, any>
    ? DeepFormSchema<T[K]> | FieldConfig<T[K]>
    : FieldConfig<T[K]>;
};

// Виртуальный GroupProxy
class GroupProxy<T extends Record<string, any>> {
  constructor(
    private store: FormStore<any>,
    private path: string[]
  ) {}

  get valid(): boolean {
    // Проверяем все поля с текущим префиксом
    const prefix = this.path.join('.');
    return Array.from(this.store['fields'].entries())
      .filter(([key]) => key.startsWith(prefix))
      .every(([_, field]) => field.valid);
  }

  getValue(): T {
    const prefix = this.path.join('.');
    const result: any = {};

    this.store['fields'].forEach((field, key) => {
      if (key.startsWith(prefix)) {
        const relativePath = key.substring(prefix.length + 1);
        setNestedValue(result, relativePath, field.getValue());
      }
    });

    return result;
  }
}

// Расширенный FormStore с Proxy
export class FormStore<T extends Record<string, any>> {
  private fields: Map<string, FieldController<any>>;
  private controlsProxy: any;

  constructor(schema: DeepFormSchema<T>) {
    this.fields = new Map();

    // Разворачиваем вложенную схему в плоскую
    this.flattenSchema(schema, []);

    // Создаем Proxy для вложенного доступа
    this.controlsProxy = this.createControlsProxy([]);
  }

  private flattenSchema(schema: any, path: string[]): void {
    for (const [key, config] of Object.entries(schema)) {
      const currentPath = [...path, key];

      if (this.isFieldConfig(config)) {
        // Это поле
        const flatKey = currentPath.join('.');
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

        // Проверяем, есть ли поле с таким ключом
        const field = this.fields.get(flatKey);
        if (field) {
          return field;
        }

        // Проверяем, есть ли вложенные поля с таким префиксом
        const hasNestedFields = Array.from(this.fields.keys())
          .some(key => key.startsWith(flatKey + '.'));

        if (hasNestedFields) {
          // Возвращаем GroupProxy
          return new GroupProxy(this, currentPath);
        }

        // Возвращаем Proxy для дальнейшей навигации
        return this.createControlsProxy(currentPath);
      }
    });
  }

  get controls(): DeepControls<T> {
    return this.controlsProxy;
  }
}

// Type для глубокого доступа
type DeepControls<T> = {
  [K in keyof T]: T[K] extends Record<string, any>
    ? DeepControls<T[K]> & GroupProxy<T[K]>
    : FieldController<T[K]>;
};
```

### Преимущества
✅ **Элегантный API** - выглядит как настоящая вложенная структура
✅ **Типизация** - TypeScript понимает вложенность
✅ **Flat storage** - внутри плоская структура (производительность)
✅ **Backward compatible** - можно добавить к существующей реализации
✅ **Flexible** - легко добавлять функциональность к GroupProxy

### Недостатки
❌ **Complexity** - Proxy логика может быть сложной для понимания
❌ **Debugging** - сложно отлаживать Proxy
❌ **Performance** - Proxy может быть медленнее прямого доступа
❌ **TypeScript limits** - сложные типы могут не всегда работать идеально

---

## Bonus: Массивы форм (FormArray)

Для всех вариантов выше можно добавить поддержку массивов форм:

### Подход с FormArray Controller

```typescript
interface CreditForm {
  properties: PropertyItem[]; // Массив форм
}

// API
const form = new FormStore<CreditForm>({
  properties: FormArray<PropertyItem>({
    factory: () => ({
      type: { value: 'apartment', component: Select },
      value: { value: 0, component: Input },
      description: { value: '', component: Textarea },
    }),
    initial: [], // Начальные значения
  }),
});

// Управление массивом
form.controls.properties.push(); // Добавить новый элемент
form.controls.properties.removeAt(0); // Удалить по индексу
form.controls.properties.at(0).controls.type.value = 'house'; // Доступ к элементу

// Реактивность
form.controls.properties.length.value; // Signal<number>
form.controls.properties.controls; // ReadonlySignal<FormStore<PropertyItem>[]>
```

### Реализация FormArrayController

```typescript
export class FormArrayController<T extends Record<string, any>> {
  private _items: Signal<FormStore<T>[]>;
  private factory: () => FormSchema<T>;

  constructor(config: FormArrayConfig<T>) {
    this.factory = config.factory;
    this._items = signal(
      config.initial.map(value => this.createItem(value))
    );
  }

  private createItem(initialValue?: Partial<T>): FormStore<T> {
    const schema = this.factory();
    const form = new FormStore(schema);
    if (initialValue) {
      form.setValue(initialValue);
    }
    return form;
  }

  get controls(): ReadonlySignal<FormStore<T>[]> {
    return computed(() => this._items.value);
  }

  get length(): ReadonlySignal<number> {
    return computed(() => this._items.value.length);
  }

  push(value?: Partial<T>): void {
    this._items.value = [...this._items.value, this.createItem(value)];
  }

  removeAt(index: number): void {
    const newItems = [...this._items.value];
    newItems.splice(index, 1);
    this._items.value = newItems;
  }

  insert(index: number, value?: Partial<T>): void {
    const newItems = [...this._items.value];
    newItems.splice(index, 0, this.createItem(value));
    this._items.value = newItems;
  }

  at(index: number): FormStore<T> | undefined {
    return this._items.value[index];
  }

  clear(): void {
    this._items.value = [];
  }

  async validate(): Promise<boolean> {
    const results = await Promise.all(
      this._items.value.map(form => form.validate())
    );
    return results.every(r => r);
  }

  getValue(): T[] {
    return this._items.value.map(form => form.getValue());
  }

  setValue(values: Partial<T>[]): void {
    this._items.value = values.map(value => this.createItem(value));
  }

  get valid(): boolean {
    return this._items.value.every(form => form.valid);
  }

  get invalid(): boolean {
    return !this.valid;
  }

  get touched(): boolean {
    return this._items.value.some(form => form.touched);
  }

  get dirty(): boolean {
    return this._items.value.some(form => form.dirty);
  }

  markAsTouched(): void {
    this._items.value.forEach(form => form.markAllAsTouched());
  }

  reset(values?: Partial<T>[]): void {
    if (values) {
      this.setValue(values);
    } else {
      this._items.value.forEach(form => form.reset());
    }
  }
}

// Helper для создания массива
export function FormArray<T extends Record<string, any>>(
  config: FormArrayConfig<T>
): FormArrayControllerConfig<T> {
  return {
    type: 'array',
    config,
    component: () => null,
    componentProps: {},
  };
}
```

### Пример использования FormArray

```typescript
// Определение типов
interface PropertyItem {
  type: PropertyType;
  description: string;
  estimatedValue: number;
  hasEncumbrance: boolean;
}

// Создание формы с массивом
const form = new FormStore<CreditForm>({
  loanAmount: {
    value: 0,
    component: Input,
  },

  properties: FormArray<PropertyItem>({
    factory: () => ({
      type: {
        value: 'apartment',
        component: Select,
        componentProps: {
          options: PROPERTY_TYPES,
        },
      },
      description: {
        value: '',
        component: Textarea,
        componentProps: {
          label: 'Описание имущества',
        },
      },
      estimatedValue: {
        value: 0,
        component: Input,
        componentProps: {
          type: 'number',
          label: 'Оценочная стоимость',
        },
      },
      hasEncumbrance: {
        value: false,
        component: Checkbox,
        componentProps: {
          label: 'Имеется обременение',
        },
      },
    }),
    initial: [],
  }),
});

// Использование в React компоненте
function PropertiesSection({ form }: { form: FormStore<CreditForm> }) {
  useSignals();

  const propertiesArray = form.controls.properties;

  return (
    <div>
      <h3>Имущество</h3>

      {propertiesArray.controls.value.map((propertyForm, index) => (
        <div key={index} className="property-item">
          <h4>Имущество #{index + 1}</h4>

          <FormField control={propertyForm.controls.type} />
          <FormField control={propertyForm.controls.description} />
          <FormField control={propertyForm.controls.estimatedValue} />
          <FormField control={propertyForm.controls.hasEncumbrance} />

          <button onClick={() => propertiesArray.removeAt(index)}>
            Удалить
          </button>
        </div>
      ))}

      <button onClick={() => propertiesArray.push()}>
        Добавить имущество
      </button>

      <div>
        Всего объектов: {propertiesArray.length.value}
      </div>
    </div>
  );
}
```

---

## Сравнительная таблица

| Критерий | Вариант 1: Dot Notation | Вариант 2: FormGroup | Вариант 3: Nested FormStore | Вариант 4: Unified | Вариант 5: Proxy |
|----------|------------------------|---------------------|----------------------------|-------------------|------------------|
| **Type Safety** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **API Удобство** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Простота реализации** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Переиспользование** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Производительность** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Масштабируемость** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Изоляция логики** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Валидация** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Обратная совместимость** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ |

### Расшифровка оценок

**Type Safety** - насколько хорошо TypeScript понимает и проверяет типы
**API Удобство** - насколько удобно использовать API в повседневной работе
**Простота реализации** - сколько усилий требуется для реализации
**Переиспользование** - возможность переиспользовать схемы форм
**Производительность** - скорость работы и количество re-renders
**Масштабируемость** - возможность работать со сложными формами
**Изоляция логики** - насколько хорошо изолирована логика вложенных форм
**Валидация** - возможности валидации на разных уровнях
**Обратная совместимость** - совместимость с текущим кодом

---

## Рекомендации

### 🏆 Рекомендуемый вариант: **Вариант 2 - FormGroup Controller**

**Обоснование:**
1. **Proven pattern** - паттерн из Angular, проверенный годами в production
2. **Отличная типизация** - полная поддержка TypeScript
3. **Изоляция** - каждая группа управляет своим состоянием
4. **Переиспользование** - схемы можно использовать многократно
5. **Валидация** - поддержка валидации на уровне группы и отдельных полей
6. **Масштабируемость** - легко расширять для сложных форм
7. **Знакомый API** - разработчики знакомы с этим паттерном

### Альтернативные сценарии:

- **Для быстрого прототипа**: Вариант 1 (Dot Notation)
  - Минимальные изменения, быстрая реализация

- **Для максимальной гибкости**: Вариант 3 (Nested FormStore)
  - Полная изоляция форм, максимальное переиспользование

- **Для modern codebase**: Вариант 4 (Unified Controller)
  - Современный подход с type inference

- **Для элегантного API**: Вариант 5 (Proxy)
  - Красивый API с глубоким доступом

### Комбинированный подход

Можно комбинировать варианты:
1. Начать с **Варианта 2** (FormGroup) для вложенных форм
2. Добавить **Вариант 5** (Proxy) для удобного доступа
3. Использовать **FormArray** для массивов форм

---

## План поэтапной реализации (Вариант 2)

### Фаза 1: Подготовка (1-2 дня)
**Цель**: Подготовить базу для новой архитектуры

1. Создать интерфейс `AbstractControl<T>`
   ```typescript
   interface AbstractControl<T = any> {
     value: T;
     valid: boolean;
     invalid: boolean;
     errors: ValidationError[];
     touched: boolean;
     dirty: boolean;
     getValue(): T;
     setValue(value: T): void;
     validate(): Promise<boolean>;
     markAsTouched(): void;
     reset(): void;
   }
   ```

2. Обновить `FieldController` для реализации `AbstractControl`
   ```typescript
   export class FieldController<T = any> implements AbstractControl<T> {
     // ... existing code
   }
   ```

3. Написать unit-тесты для текущего функционала
   - Тесты для FieldController
   - Тесты для FormStore
   - Baseline для regression testing

**Deliverables**:
- `src/lib/forms/core/abstract-control.ts`
- Обновленный `FieldController`
- Test suite

---

### Фаза 2: Базовая реализация FormGroup (2-3 дня)
**Цель**: Создать рабочий FormGroupController

1. Создать класс `FormGroupController`
   ```typescript
   export class FormGroupController<T extends Record<string, any>>
     implements AbstractControl<T> {
     // Implementation
   }
   ```

2. Реализовать базовые методы:
   - `getValue()` / `setValue()`
   - `validate()`
   - `reset()`
   - `markAsTouched()`

3. Добавить поддержку signals для реактивности
   - Computed value signal
   - Reactive controls map

4. Написать тесты для FormGroupController
   - Unit тесты для всех методов
   - Integration тесты с FieldController

**Deliverables**:
- `src/lib/forms/core/form-group-controller.ts`
- Test suite для FormGroupController

---

### Фаза 3: Интеграция с FormStore (1-2 дня)
**Цель**: Обновить FormStore для поддержки групп

1. Обновить FormStore для поддержки обоих типов контроллеров
   ```typescript
   private fields: Map<keyof T, AbstractControl<any>>;
   ```

2. Создать helper функцию `FormGroup()`
   ```typescript
   export function FormGroup<T>(schema: FormGroupSchema<T>): FormGroupConfig<T>
   ```

3. Обновить типы TypeScript
   - `FormSchema` для поддержки groups
   - `FormGroupSchema`
   - `FormGroupConfig`

4. Написать integration тесты
   - FormStore с вложенными группами
   - getValue() / setValue() для вложенных структур

**Deliverables**:
- Обновленный FormStore
- `src/lib/forms/helpers/form-group.ts`
- Обновленные типы

---

### Фаза 4: Валидация (2-3 дня)
**Цель**: Полная поддержка валидации для групп

1. Добавить поддержку валидации на уровне группы
   - Group-level validators
   - Aggregate validation results

2. Реализовать cross-field валидацию для вложенных форм
   - Access to parent form
   - Access to sibling fields

3. Интегрировать с существующей ValidationRegistry
   - Поддержка вложенных путей (personalData.firstName)
   - Contextual validators для групп

4. Написать тесты валидации
   - Field-level validation в группах
   - Group-level validation
   - Cross-field validation между группами

**Deliverables**:
- Обновленная валидация
- Примеры валидации для вложенных форм
- Comprehensive test suite

---

### Фаза 5: FormArray (2-3 дня)
**Цель**: Поддержка массивов форм

1. Создать класс `FormArrayController`
   ```typescript
   export class FormArrayController<T extends Record<string, any>>
     implements AbstractControl<T[]>
   ```

2. Реализовать методы управления массивом:
   - `push()` / `removeAt()` / `insert()`
   - `at(index)` для доступа к элементам
   - `clear()` для очистки массива

3. Добавить валидацию для массивов
   - Валидация каждого элемента
   - Валидация на уровне массива (min/max length)

4. Написать тесты
   - CRUD операции с массивом
   - Реактивность при изменениях
   - Валидация массивов

**Deliverables**:
- `src/lib/forms/core/form-array-controller.ts`
- Helper `FormArray()`
- Test suite

---

### Фаза 6: Документация и примеры (1-2 дня)
**Цель**: Полная документация нового функционала

1. Обновить документацию API
   - API reference для FormGroup
   - API reference для FormArray
   - Migration guide

2. Создать примеры использования
   - Базовый пример вложенной формы
   - Сложный пример с multiple levels
   - Пример с FormArray

3. Написать migration guide из текущего подхода
   - Как мигрировать существующие формы
   - Breaking changes (если есть)
   - Best practices

4. Обновить CLAUDE.md
   - Добавить информацию о новой архитектуре
   - Обновить примеры

**Deliverables**:
- `docs/FORM_GROUP_API.md`
- `docs/FORM_ARRAY_API.md`
- `docs/MIGRATION_GUIDE.md`
- Примеры в `src/examples/`

---

### Фаза 7: Рефакторинг существующего кода (2-3 дня)
**Цель**: Применить новую архитектуру к существующему коду

1. Обновить CreditApplicationForm для использования FormGroup
   ```typescript
   const schema = {
     personalData: FormGroup<PersonalData>({ ... }),
     passportData: FormGroup<PassportData>({ ... }),
     // etc
   }
   ```

2. Рефакторинг вложенных форм:
   - PersonalDataForm
   - PassportDataForm
   - AddressForm

3. Обновить валидацию
   - Использовать group-level validators
   - Упростить схему валидации

4. Добавить FormArray для массивов:
   - properties array
   - existingLoans array
   - coBorrowers array

5. Проверить работоспособность
   - Manual testing
   - E2E tests (если есть)

**Deliverables**:
- Рефакторинг CreditApplicationForm
- Обновленные компоненты
- Все тесты проходят

---

### Итоговый timeline

| Фаза | Задачи | Время |
|------|--------|-------|
| 1. Подготовка | Интерфейсы, обновление FieldController, тесты | 1-2 дня |
| 2. FormGroup | Базовая реализация FormGroupController | 2-3 дня |
| 3. Интеграция | Интеграция с FormStore, helpers, типы | 1-2 дня |
| 4. Валидация | Group validation, cross-field validation | 2-3 дня |
| 5. FormArray | Реализация FormArrayController | 2-3 дня |
| 6. Документация | API docs, примеры, migration guide | 1-2 дня |
| 7. Рефакторинг | Применение к существующему коду | 2-3 дня |

**Общее время: 11-18 дней** (в зависимости от сложности и качества требований)

---

## Риски и митигация

### Риск 1: Breaking changes
**Описание**: Новая архитектура может сломать существующий код

**Митигация**:
- Сохранить обратную совместимость где возможно
- Создать comprehensive migration guide
- Добавить deprecation warnings
- Поддерживать старый API в течение transition period

### Риск 2: TypeScript complexity
**Описание**: Сложные generic типы могут быть трудны для понимания

**Митигация**:
- Написать подробную документацию типов
- Создать примеры для типичных use cases
- Использовать type aliases для упрощения
- Добавить JSDoc комментарии с примерами

### Риск 3: Производительность
**Описание**: Вложенные формы могут вызвать проблемы с производительностью

**Митигация**:
- Benchmarking на каждом этапе
- Оптимизация signal updates
- Lazy validation где возможно
- Memoization для computed values

### Риск 4: Learning curve
**Описание**: Команде нужно время чтобы освоить новый API

**Митигация**:
- Comprehensive documentation
- Code examples
- Internal workshop/presentation
- Gradual adoption (не обязательно мигрировать все сразу)

---

## Заключение

Рекомендуемый подход - **Вариант 2: FormGroup Controller** - предоставляет оптимальный баланс между:
- Простотой реализации
- Качеством API
- Типизацией TypeScript
- Возможностями валидации
- Масштабируемостью

Этот подход проверен временем (Angular Forms), имеет отличную типизацию и предоставляет мощные возможности для построения сложных форм с вложенными структурами и массивами.

**Следующие шаги:**
1. Получить approval на выбранный вариант
2. Начать реализацию согласно плану
3. Регулярный review прогресса
4. Итеративное улучшение на основе feedback

---

**Дополнительные материалы:**
- Angular Forms documentation: https://angular.io/guide/reactive-forms
- Angular Signal Forms: https://www.angulararchitects.io/blog/all-about-angulars-new-signal-forms/
- React Hook Form (для сравнения): https://react-hook-form.com/
