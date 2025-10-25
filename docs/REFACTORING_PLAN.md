# ПОШАГОВЫЙ ПЛАН РЕФАКТОРИНГА МОДУЛЯ ФОРМ

> Детальный план реализации рефакторинга с учетом Приоритетов 1 и 2
> Дата: 2025-10-25
> Общая длительность: 18-26 рабочих дней

---

## Executive Summary

### Цель рефакторинга
Преобразовать модуль форм в production-ready систему с:
- ✅ Высокой производительностью (computed signals вместо геттеров)
- ✅ Единой архитектурой (FormNode иерархия)
- ✅ Полной типобезопасностью
- ✅ Поддержкой вложенных форм и массивов
- ✅ Интеграцией ресурсов

### Структура плана

**7 фаз реализации:**
1. **Фаза 1** (1-2 дня) - Критичные исправления производительности
2. **Фаза 2** (3-4 дня) - Архитектура FormNode
3. **Фаза 3** (1 день) - Прямой доступ к полям
4. **Фаза 4** (2-3 дня) - Система валидации
5. **Фаза 5** (4-5 дней) - ArrayNode и вложенные формы
6. **Фаза 6** (3-4 дня) - Интеграция ресурсов
7. **Фаза 7** (3-4 дня) - Очистка и документация

### Критические зависимости

```
Фаза 1 (Production fixes)
  ↓
Фаза 2 (FormNode architecture) ← КРИТИЧНАЯ для всего остального
  ↓
  ├─→ Фаза 3 (Proxy access)
  ├─→ Фаза 4 (Validation)
  └─→ Фаза 5 (Arrays & nesting) → Фаза 6 (Resources) → Фаза 7 (Cleanup)
```

---

## Предварительная подготовка

### Шаг 0.1: Создать feature branch
```bash
git checkout -b refactor/form-node-architecture
```

### Шаг 0.2: Создать структуру для новых файлов
```bash
# Создать директории
mkdir -p src/lib/forms/core/nodes
mkdir -p src/lib/forms/core/legacy
mkdir -p src/lib/forms/__tests__
```

### Шаг 0.3: Создать файл миграции
```typescript
// src/lib/forms/MIGRATION.md
# Migration Guide: FormStore → FormNode

## Breaking Changes
...

## Step-by-step migration
...
```

### Шаг 0.4: Настроить TypeScript для проверки типов
```json
// tsconfig.json - убедиться что strict mode включен
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

## Фаза 1: Критичные исправления производительности

**Длительность:** 1-2 дня
**Breaking changes:** Минимальные
**Приоритет:** ВЫСОКИЙ 🔥

### Цель
Исправить проблемы производительности без изменения архитектуры

---

### Шаг 1.1: Заменить геттеры на computed signals в FormStore

**Файл:** `src/lib/forms/core/form-store.ts`

#### 1.1.1: Добавить readonly signals в класс
```typescript
export class FormStore<T extends Record<string, any>> {
  private fields: Map<keyof T, FieldController<any>>;
  private _submitting: Signal<boolean>;

  // ✅ НОВОЕ: Публичные computed signals
  public readonly valid: ReadonlySignal<boolean>;
  public readonly invalid: ReadonlySignal<boolean>;
  public readonly pending: ReadonlySignal<boolean>;
  public readonly touched: ReadonlySignal<boolean>;
  public readonly dirty: ReadonlySignal<boolean>;

  // Удалить: геттеры get valid(), get invalid(), и т.д.
```

#### 1.1.2: Инициализировать signals в конструкторе
```typescript
constructor(schema: FormSchema<T>) {
  this.fields = new Map();
  this._submitting = signal(false);

  // Создать поля...
  for (const [key, config] of Object.entries(schema)) {
    this.fields.set(key as keyof T, new FieldController(config));
  }

  // ✅ НОВОЕ: Создать computed signals
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
}
```

#### 1.1.3: Обновить использование в коде
```bash
# Найти все использования
grep -r "form\.valid" src/
grep -r "form\.invalid" src/

# Заменить: form.valid → form.valid.value
# Можно использовать sed или IDE Find & Replace
```

**Чек-лист:**
- [ ] Заменить 5 геттеров на computed signals
- [ ] Обновить все использования в примерах
- [ ] Проверить что TypeScript не выдает ошибок
- [ ] Запустить build: `npm run build`

---

### Шаг 1.2: Параллелизировать async валидаторы

**Файл:** `src/lib/forms/core/field-controller.ts`

#### 1.2.1: Добавить tracking для валидаций
```typescript
export class FieldController<T = any> {
  private currentValidationId = 0;

  async validate(): Promise<boolean> {
    const validationId = ++this.currentValidationId;

    // Синхронная валидация (без изменений)
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

    // ✅ НОВОЕ: Асинхронная валидация параллельно
    if (this.asyncValidators.length > 0) {
      this._pending.value = true;
      this._status.value = 'pending';

      const asyncResults = await Promise.all(
        this.asyncValidators.map(validator => validator(this.value))
      );

      // ✅ НОВОЕ: Проверить актуальность валидации
      if (validationId !== this.currentValidationId) {
        return false; // Валидация устарела
      }

      this._pending.value = false;

      const asyncErrors = asyncResults.filter(Boolean) as ValidationError[];
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
}
```

**Чек-лист:**
- [ ] Добавить currentValidationId
- [ ] Заменить for...of на Promise.all
- [ ] Добавить проверку актуальности
- [ ] Протестировать с async валидаторами
- [ ] Запустить `npm run build`

---

### Шаг 1.3: Добавить dev-mode проверки

**Файл:** `src/lib/forms/core/form-store.ts`

#### 1.3.1: Добавить проверку существования полей
```typescript
private async applyContextualValidators(validators: any[]): Promise<void> {
  const validatorsByField = new Map<string, any[]>();

  for (const registration of validators) {
    if (registration.type === 'tree') continue;

    const fieldPath = registration.fieldPath;
    const existing = validatorsByField.get(fieldPath) || [];
    existing.push(registration);
    validatorsByField.set(fieldPath, existing);
  }

  for (const [fieldPath, fieldValidators] of validatorsByField) {
    const fieldKey = fieldPath as keyof T;
    const control = this.fields.get(fieldKey);

    // ✅ НОВОЕ: Dev-mode проверка
    if (!control) {
      if (import.meta.env.DEV) {
        const available = Array.from(this.fields.keys()).join(', ');
        throw new Error(
          `Field "${fieldPath}" not found in FormStore.\n` +
          `Available fields: ${available}`
        );
      }
      console.warn(`Field ${fieldPath} not found in FormStore`);
      continue;
    }

    // ... остальной код ...
  }
}
```

**Чек-лист:**
- [ ] Добавить проверку существования поля
- [ ] Добавить полезное сообщение об ошибке
- [ ] Протестировать с несуществующим полем
- [ ] Убедиться что в production только warning

---

### Шаг 1.4: Повторить для DeepFormStore

**Файл:** `src/lib/forms/core/deep-form-store.ts`

Повторить шаги 1.1-1.3 для DeepFormStore:
- Заменить геттеры на computed signals (строки 206-242)
- Включить проверку массивов в computed:
```typescript
this.valid = computed(() => {
  const fieldsValid = Array.from(this.fields.values()).every(
    field => field.valid.value
  );
  const arraysValid = Array.from(this.arrayProxies.values()).every(
    arr => arr.valid
  );
  return fieldsValid && arraysValid;
});
```

**Чек-лист:**
- [ ] Заменить 5 геттеров на computed signals
- [ ] Учесть arrayProxies в computed
- [ ] Обновить использование
- [ ] Запустить `npm run build`

---

### Тестирование Фазы 1

#### Запустить build
```bash
npm run build
```

#### Ручное тестирование
```typescript
// Создать тестовую форму
const form = new FormStore({
  email: { value: '', component: Input },
  password: { value: '', component: Input },
});

// Проверить реактивность
console.log(form.valid.value); // false
form.controls.email.setValue('test@mail.com');
form.controls.password.setValue('12345678');
console.log(form.valid.value); // может быть true если нет валидаторов
```

#### Результат
- ✅ Производительность: Computed signals вместо О(n) геттеров
- ✅ Реактивность: Компоненты будут перерендериваться
- ✅ Валидация: Async валидаторы выполняются параллельно

---

## Фаза 2: Архитектура FormNode

**Длительность:** 3-4 дня
**Breaking changes:** Средние (с алиасами - низкие)
**Приоритет:** ВЫСОКИЙ 🔥
**Блокирует:** Фазы 3-7

### Цель
Создать единую иерархию классов для всех типов узлов формы

---

### Шаг 2.1: Создать абстрактный класс FormNode

**Файл:** `src/lib/forms/core/nodes/form-node.ts`

```typescript
import type { Signal, ReadonlySignal } from '@preact/signals-react';
import type { ValidationError } from '../../types';

export type FieldStatus = 'valid' | 'invalid' | 'pending';

/**
 * Абстрактный базовый класс для всех узлов формы
 * Аналог AbstractControl из Angular Forms
 */
export abstract class FormNode<T = any> {
  // ============================================================================
  // Реактивные signals (должны быть реализованы в подклассах)
  // ============================================================================

  abstract readonly value: ReadonlySignal<T>;
  abstract readonly valid: ReadonlySignal<boolean>;
  abstract readonly invalid: ReadonlySignal<boolean>;
  abstract readonly touched: ReadonlySignal<boolean>;
  abstract readonly dirty: ReadonlySignal<boolean>;
  abstract readonly pending: ReadonlySignal<boolean>;
  abstract readonly errors: ReadonlySignal<ValidationError[]>;
  abstract readonly status: ReadonlySignal<FieldStatus>;

  // ============================================================================
  // Методы управления значениями
  // ============================================================================

  abstract getValue(): T;
  abstract setValue(value: T, options?: SetValueOptions): void;
  abstract patchValue(value: Partial<T>): void;
  abstract reset(value?: T): void;

  // ============================================================================
  // Методы валидации
  // ============================================================================

  abstract validate(): Promise<boolean>;
  abstract setErrors(errors: ValidationError[]): void;
  abstract clearErrors(): void;

  // ============================================================================
  // Методы управления состоянием
  // ============================================================================

  abstract markAsTouched(): void;
  abstract markAsUntouched(): void;
  abstract markAsDirty(): void;
  abstract markAsPristine(): void;

  // Опциональные методы (disable/enable)
  disable?(): void;
  enable?(): void;
}

export interface SetValueOptions {
  emitEvent?: boolean;
  onlySelf?: boolean;
}
```

**Чек-лист:**
- [ ] Создать файл form-node.ts
- [ ] Определить все абстрактные методы
- [ ] Добавить типы SetValueOptions
- [ ] Экспортировать в index

---

### Шаг 2.2: Создать FieldNode (замена FieldController)

**Файл:** `src/lib/forms/core/nodes/field-node.ts`

```typescript
import { signal, computed } from '@preact/signals-react';
import type { Signal, ReadonlySignal } from '@preact/signals-react';
import { FormNode, FieldStatus, SetValueOptions } from './form-node';
import type { FieldConfig, ValidationError, ValidatorFn, AsyncValidatorFn } from '../../types';

export class FieldNode<T = any> extends FormNode<T> {
  // Приватные сигналы
  private _value: Signal<T>;
  private _errors: Signal<ValidationError[]>;
  private _touched: Signal<boolean>;
  private _dirty: Signal<boolean>;
  private _status: Signal<FieldStatus>;
  private _pending: Signal<boolean>;

  // Публичные computed signals
  public readonly value: ReadonlySignal<T>;
  public readonly valid: ReadonlySignal<boolean>;
  public readonly invalid: ReadonlySignal<boolean>;
  public readonly touched: ReadonlySignal<boolean>;
  public readonly dirty: ReadonlySignal<boolean>;
  public readonly pending: ReadonlySignal<boolean>;
  public readonly errors: ReadonlySignal<ValidationError[]>;
  public readonly status: ReadonlySignal<FieldStatus>;
  public readonly shouldShowError: ReadonlySignal<boolean>;

  // Конфигурация
  private validators: ValidatorFn<T>[];
  private asyncValidators: AsyncValidatorFn<T>[];
  private initialValue: T;
  private currentValidationId = 0;

  public readonly component: any;
  public readonly componentProps: Record<string, any>;

  constructor(config: FieldConfig<T>) {
    super();

    this.initialValue = config.value;
    this.validators = config.validators || [];
    this.asyncValidators = config.asyncValidators || [];
    this.component = config.component;
    this.componentProps = config.componentProps || {};

    // Инициализация приватных сигналов
    this._value = signal(config.value);
    this._errors = signal<ValidationError[]>([]);
    this._touched = signal(false);
    this._dirty = signal(false);
    this._status = signal<FieldStatus>('valid');
    this._pending = signal(false);

    // Создание computed signals
    this.value = computed(() => this._value.value);
    this.valid = computed(() => this._status.value === 'valid');
    this.invalid = computed(() => this._status.value === 'invalid');
    this.touched = computed(() => this._touched.value);
    this.dirty = computed(() => this._dirty.value);
    this.pending = computed(() => this._pending.value);
    this.errors = computed(() => this._errors.value);
    this.status = computed(() => this._status.value);
    this.shouldShowError = computed(() =>
      this._status.value === 'invalid' &&
      (this._touched.value || this._dirty.value)
    );
  }

  // ============================================================================
  // Реализация абстрактных методов
  // ============================================================================

  getValue(): T {
    return this._value.peek();
  }

  setValue(value: T, options?: SetValueOptions): void {
    this._value.value = value;
    this._dirty.value = true;
  }

  patchValue(value: Partial<T>): void {
    this.setValue(value as T);
  }

  reset(value?: T): void {
    this._value.value = value ?? this.initialValue;
    this._touched.value = false;
    this._dirty.value = false;
    this._errors.value = [];
    this._status.value = 'valid';
  }

  async validate(): Promise<boolean> {
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

    // Асинхронная валидация
    if (this.asyncValidators.length > 0) {
      this._pending.value = true;
      this._status.value = 'pending';

      const asyncResults = await Promise.all(
        this.asyncValidators.map(validator => validator(this._value.value))
      );

      if (validationId !== this.currentValidationId) {
        return false;
      }

      this._pending.value = false;

      const asyncErrors = asyncResults.filter(Boolean) as ValidationError[];
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
}
```

**Чек-лист:**
- [ ] Создать файл field-node.ts
- [ ] Скопировать логику из FieldController
- [ ] Наследовать от FormNode
- [ ] Реализовать все абстрактные методы
- [ ] Протестировать создание и валидацию

---

### Шаг 2.3: Создать GroupNode (замена FormStore)

**Файл:** `src/lib/forms/core/nodes/group-node.ts`

```typescript
import { signal, computed } from '@preact/signals-react';
import type { Signal, ReadonlySignal } from '@preact/signals-react';
import { FormNode, FieldStatus, SetValueOptions } from './form-node';
import { FieldNode } from './field-node';
import type { FormSchema, ValidationError, FieldConfig } from '../../types';

export class GroupNode<T extends Record<string, any> = any> extends FormNode<T> {
  private fields: Map<keyof T, FormNode<any>>;
  private _submitting: Signal<boolean>;

  // Публичные computed signals
  public readonly value: ReadonlySignal<T>;
  public readonly valid: ReadonlySignal<boolean>;
  public readonly invalid: ReadonlySignal<boolean>;
  public readonly touched: ReadonlySignal<boolean>;
  public readonly dirty: ReadonlySignal<boolean>;
  public readonly pending: ReadonlySignal<boolean>;
  public readonly errors: ReadonlySignal<ValidationError[]>;
  public readonly status: ReadonlySignal<FieldStatus>;
  public readonly submitting: ReadonlySignal<boolean>;

  constructor(schema: FormSchema<T>) {
    super();

    this.fields = new Map();
    this._submitting = signal(false);

    // Создать поля из схемы
    for (const [key, config] of Object.entries(schema)) {
      this.fields.set(
        key as keyof T,
        new FieldNode(config as FieldConfig<any>)
      );
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

    this.errors = computed(() => {
      const allErrors: ValidationError[] = [];
      this.fields.forEach(field => {
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
    return new Proxy(this, {
      get(target, prop: string | symbol) {
        // Если это поле формы
        if (typeof prop === 'string' && target.fields.has(prop as keyof T)) {
          return target.fields.get(prop as keyof T);
        }
        // Иначе - свойство/метод GroupNode
        return (target as any)[prop];
      }
    }) as GroupNode<T> & { [K in keyof T]: FormNode<T[K]> };
  }

  // ============================================================================
  // Реализация абстрактных методов
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
    const results = await Promise.all(
      Array.from(this.fields.values()).map(field => field.validate())
    );
    return results.every(Boolean);
  }

  setErrors(errors: ValidationError[]): void {
    // GroupNode errors - можно реализовать позже
  }

  clearErrors(): void {
    this.fields.forEach(field => field.clearErrors());
  }

  markAsTouched(): void {
    this.fields.forEach(field => field.markAsTouched());
  }

  markAsUntouched(): void {
    this.fields.forEach(field => field.markAsUntouched());
  }

  markAsDirty(): void {
    this.fields.forEach(field => field.markAsDirty());
  }

  markAsPristine(): void {
    this.fields.forEach(field => field.markAsPristine());
  }

  // ============================================================================
  // Дополнительные методы (из FormStore)
  // ============================================================================

  async submit(
    onSubmit: (values: T) => void | Promise<void>
  ): Promise<void> {
    const isValid = await this.validate();
    if (!isValid) {
      this.markAsTouched();
      return;
    }

    this._submitting.value = true;
    try {
      await onSubmit(this.getValue());
    } finally {
      this._submitting.value = false;
    }
  }

  getField(key: keyof T): FormNode<any> | undefined {
    return this.fields.get(key);
  }
}
```

**Чек-лист:**
- [ ] Создать файл group-node.ts
- [ ] Реализовать все абстрактные методы
- [ ] Добавить Proxy для прямого доступа
- [ ] Добавить submit() метод
- [ ] Протестировать создание и валидацию

---

### Шаг 2.4: Создать алиасы для обратной совместимости

**Файл:** `src/lib/forms/core/form-store.ts`

```typescript
// LEGACY: Алиас для обратной совместимости
import { GroupNode } from './nodes/group-node';
import { FieldNode } from './nodes/field-node';

/**
 * @deprecated Используйте GroupNode вместо FormStore
 * FormStore будет удален в версии 2.0
 */
export const FormStore = GroupNode;

/**
 * @deprecated Используйте FieldNode вместо FieldController
 * FieldController будет удален в версии 2.0
 */
export const FieldController = FieldNode;

// Экспорт типов
export type { FormSchema, FieldConfig } from '../types';
```

**Чек-лист:**
- [ ] Создать алиасы FormStore = GroupNode
- [ ] Создать алиас FieldController = FieldNode
- [ ] Добавить @deprecated комментарии
- [ ] Обновить экспорты в index.ts

---

### Шаг 2.5: Обновить экспорты

**Файл:** `src/lib/forms/index.ts`

```typescript
// ============================================================================
// Новая архитектура (рекомендуется)
// ============================================================================
export { FormNode } from './core/nodes/form-node';
export { FieldNode } from './core/nodes/field-node';
export { GroupNode } from './core/nodes/group-node';

// ============================================================================
// Legacy (для обратной совместимости)
// ============================================================================
export { FormStore, FieldController } from './core/form-store';

// ============================================================================
// Типы
// ============================================================================
export type * from './types';
```

---

### Тестирование Фазы 2

#### Создать тестовую форму
```typescript
import { GroupNode } from './lib/forms';

const form = new GroupNode({
  email: {
    value: '',
    component: Input,
    validators: [required, email],
  },
  password: {
    value: '',
    component: Input,
    validators: [required, minLength(8)],
  },
});

// ✅ Прямой доступ к полям через Proxy
console.log(form.email.value.value); // ''
form.email.setValue('test@mail.com');
console.log(form.email.value.value); // 'test@mail.com'

// ✅ Computed signals работают
console.log(form.valid.value); // false (если password не заполнен)
form.password.setValue('12345678');
console.log(form.valid.value); // true

// ✅ Validate работает
await form.validate();
console.log(form.valid.value);
```

#### Проверить обратную совместимость
```typescript
import { FormStore } from './lib/forms';

// ✅ Старый код должен работать
const form = new FormStore({
  email: { value: '', component: Input },
});

form.controls.email.setValue('test@mail.com');
console.log(form.valid.value);
```

**Чек-лист:**
- [ ] Новый API работает (GroupNode)
- [ ] Старый API работает (FormStore)
- [ ] Прямой доступ через Proxy работает
- [ ] Computed signals обновляются
- [ ] `npm run build` успешен

---

## Фаза 3: Прямой доступ к полям

**Длительность:** 1 день
**Breaking changes:** Высокие (но можно минимизировать)
**Приоритет:** Средний
**Зависит от:** Фазы 2

### Цель
Убрать промежуточный `.controls` для более чистого API

---

### Шаг 3.1: Обновить типизацию

**Файл:** `src/lib/forms/core/nodes/group-node.ts`

Типизация уже реализована в Фазе 2 через Proxy return type:
```typescript
return new Proxy(this, { ... }) as GroupNode<T> & { [K in keyof T]: FormNode<T[K]> };
```

**Проверить что работает:**
```typescript
const form = new GroupNode({
  email: { value: '', component: Input },
  password: { value: '', component: Input },
});

// ✅ TypeScript должен знать типы
form.email; // FormNode<string>
form.password; // FormNode<string>
form.email.value.value; // string
```

---

### Шаг 3.2: Создать codemod для миграции

**Файл:** `scripts/migrate-to-direct-access.ts`

```typescript
/**
 * Codemod для миграции form.controls.field → form.field
 */
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

function transformFile(filePath: string): void {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const transformer = <T extends ts.Node>(context: ts.TransformationContext) => {
    return (rootNode: T): T => {
      function visit(node: ts.Node): ts.Node {
        // Найти: form.controls.field → form.field
        if (
          ts.isPropertyAccessExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.name) &&
          node.expression.name.text === 'controls'
        ) {
          // Заменить на прямой доступ
          return ts.factory.createPropertyAccessExpression(
            node.expression.expression,
            node.name
          );
        }

        return ts.visitEachChild(node, visit, context);
      }

      return ts.visitNode(rootNode, visit) as T;
    };
  };

  const result = ts.transform(sourceFile, [transformer]);
  const printer = ts.createPrinter();
  const transformedCode = printer.printFile(result.transformed[0]);

  fs.writeFileSync(filePath, transformedCode);
  console.log(`✅ Migrated: ${filePath}`);
}

// Применить к всем файлам
const srcDir = path.join(__dirname, '../src');
// ... logic to iterate files ...
```

---

### Шаг 3.3: Запустить миграцию

```bash
# Создать резервную копию
git add .
git commit -m "Before controls migration"

# Запустить codemod
npx ts-node scripts/migrate-to-direct-access.ts

# Проверить изменения
git diff
```

---

### Шаг 3.4: Сохранить `.controls` как геттер (опционально)

Для плавной миграции можно сохранить `.controls`:

```typescript
export class GroupNode<T> extends FormNode<T> {
  // ...

  /**
   * @deprecated Используйте прямой доступ: form.field вместо form.controls.field
   */
  get controls(): this {
    return this;
  }
}
```

Тогда оба варианта будут работать:
```typescript
form.email.setValue('test@mail.com'); // ✅ Новый способ
form.controls.email.setValue('test@mail.com'); // ✅ Старый способ (deprecated)
```

**Чек-лист:**
- [ ] Обновить типизацию
- [ ] Создать codemod (опционально)
- [ ] Запустить миграцию кода
- [ ] Добавить deprecated геттер controls
- [ ] Обновить примеры
- [ ] `npm run build`

---

## Фаза 4: Система валидации

**Длительность:** 2-3 дня
**Breaking changes:** Низкие
**Приоритет:** Средний
**Зависит от:** Фазы 2

### Цель
Доработать систему валидации до полной функциональности

---

### Шаг 4.1: Реализовать debounce для async валидаторов

**Файл:** `src/lib/forms/core/nodes/field-node.ts`

```typescript
export class FieldNode<T = any> extends FormNode<T> {
  private validateDebounceTimer?: number;
  private debounceMs: number;

  constructor(config: FieldConfig<T>) {
    super();
    // ...
    this.debounceMs = config.debounce || 0;
  }

  async validate(options?: { debounce?: number }): Promise<boolean> {
    const debounce = options?.debounce ?? this.debounceMs;

    if (debounce > 0) {
      return new Promise((resolve) => {
        clearTimeout(this.validateDebounceTimer);
        this.validateDebounceTimer = setTimeout(async () => {
          const result = await this.validateImmediate();
          resolve(result);
        }, debounce) as any;
      });
    }

    return this.validateImmediate();
  }

  private async validateImmediate(): Promise<boolean> {
    // ... текущая логика validate() ...
  }
}
```

**Обновить FieldConfig:**
```typescript
export interface FieldConfig<T = any> {
  value: T;
  component: ComponentType;
  validators?: ValidatorFn<T>[];
  asyncValidators?: AsyncValidatorFn<T>[];
  debounce?: number; // ✅ Добавить
  componentProps?: Record<string, any>;
}
```

---

### Шаг 4.2: Поддержка вложенных путей в ValidationContext

**Файл:** `src/lib/forms/validators/validation-context.ts`

```typescript
export class ValidationContextImpl<TForm = any, TField = any>
  implements ValidationContext<TForm, TField>
{
  // ...

  getField(path: string): any {
    if (typeof path !== 'string') {
      return this.form[path]?.value?.value;
    }

    const keys = path.split('.');
    let current: any = this.form;

    for (const key of keys) {
      if (current && current[key]) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    // Если это FormNode, вернуть значение
    return current?.value?.value ?? current;
  }

  setField(path: string, value: any): void {
    if (typeof path !== 'string') {
      const control = this.form[path];
      if (control) {
        control.setValue(value);
      }
      return;
    }

    const keys = path.split('.');
    let current: any = this.form;

    for (let i = 0; i < keys.length - 1; i++) {
      if (current && current[keys[i]]) {
        current = current[keys[i]];
      } else {
        return;
      }
    }

    const lastKey = keys[keys.length - 1];
    if (current && current[lastKey]) {
      current[lastKey].setValue(value);
    }
  }
}
```

---

### Шаг 4.3: Реализовать toFieldPath для декомпозиции схем

**Файл:** `src/lib/forms/validators/field-path.ts`

```typescript
/**
 * Преобразовать FieldPathNode в FieldPath для переиспользования схем
 */
export function toFieldPath<T>(node: FieldPathNode<any, T>): FieldPath<T> {
  const basePath = extractPath(node);
  return createFieldPathProxy<T>(basePath);
}

// Экспортировать createFieldPathProxy
export { createFieldPathProxy };
```

**Использование:**
```typescript
const personalDataValidation = (path: FieldPath<PersonalData>) => {
  required(path.firstName, { message: 'Имя обязательно' });
  required(path.lastName, { message: 'Фамилия обязательна' });
};

const mainValidation = (path: FieldPath<MyForm>) => {
  // ✅ Переиспользуем схему
  personalDataValidation(toFieldPath(path.personalData));
  required(path.email);
};
```

---

### Шаг 4.4: Удалить нереализованную функцию updateOn

**Файл:** `src/lib/forms/validators/schema-validators.ts`

```typescript
// ❌ УДАЛИТЬ:
export function updateOn<TForm = any, TField = any>(
  fieldPath: FieldPathNode<TForm, TField>,
  trigger: 'change' | 'blur' | 'submit'
): void {
  // ...
}
```

**Обновить README:**
```markdown
## updateOn Configuration

Используйте updateOn в схеме формы:

const form = new GroupNode({
  email: {
    value: '',
    component: Input,
    updateOn: 'blur', // Валидация при blur
  },
});
```

**Чек-лист:**
- [ ] Добавить debounce в FieldNode
- [ ] Реализовать getField/setField для вложенных путей
- [ ] Добавить toFieldPath
- [ ] Удалить updateOn из schema-validators
- [ ] Обновить документацию
- [ ] `npm run build`

---

## Фаза 5: ArrayNode и вложенные формы

**Длительность:** 4-5 дней
**Breaking changes:** Средние
**Приоритет:** Высокий 🔥
**Зависит от:** Фазы 2

### Цель
Реализовать поддержку динамических массивов и вложенных форм

---

### Шаг 5.1: Создать ArrayNode

**Файл:** `src/lib/forms/core/nodes/array-node.ts`

```typescript
import { signal, computed } from '@preact/signals-react';
import type { Signal, ReadonlySignal } from '@preact/signals-react';
import { FormNode, FieldStatus, SetValueOptions } from './form-node';
import { GroupNode } from './group-node';
import type { ValidationError, DeepFormSchema } from '../../types';

export class ArrayNode<T = any> extends FormNode<T[]> {
  private items: Signal<FormNode<T>[]>;
  private itemSchema: DeepFormSchema<T>;

  // Публичные computed signals
  public readonly value: ReadonlySignal<T[]>;
  public readonly valid: ReadonlySignal<boolean>;
  public readonly invalid: ReadonlySignal<boolean>;
  public readonly touched: ReadonlySignal<boolean>;
  public readonly dirty: ReadonlySignal<boolean>;
  public readonly pending: ReadonlySignal<boolean>;
  public readonly errors: ReadonlySignal<ValidationError[]>;
  public readonly status: ReadonlySignal<FieldStatus>;
  public readonly length: ReadonlySignal<number>;

  constructor(schema: DeepFormSchema<T>, initialItems: Partial<T>[] = []) {
    super();

    this.itemSchema = schema;
    this.items = signal<FormNode<T>[]>([]);

    // Создать начальные элементы
    for (const initialValue of initialItems) {
      this.push(initialValue);
    }

    // Computed signals
    this.length = computed(() => this.items.value.length);

    this.value = computed(() =>
      this.items.value.map(item => item.value.value)
    );

    this.valid = computed(() =>
      this.items.value.every(item => item.valid.value)
    );

    this.invalid = computed(() => !this.valid.value);

    this.pending = computed(() =>
      this.items.value.some(item => item.pending.value)
    );

    this.touched = computed(() =>
      this.items.value.some(item => item.touched.value)
    );

    this.dirty = computed(() =>
      this.items.value.some(item => item.dirty.value)
    );

    this.errors = computed(() => {
      const allErrors: ValidationError[] = [];
      this.items.value.forEach(item => {
        allErrors.push(...item.errors.value);
      });
      return allErrors;
    });

    this.status = computed(() => {
      if (this.pending.value) return 'pending';
      if (this.invalid.value) return 'invalid';
      return 'valid';
    });
  }

  // ============================================================================
  // CRUD операции
  // ============================================================================

  push(initialValue?: Partial<T>): void {
    const newItem = this.createItem(initialValue);
    this.items.value = [...this.items.value, newItem];
  }

  removeAt(index: number): void {
    if (index < 0 || index >= this.items.value.length) {
      console.warn(`ArrayNode: index ${index} out of bounds`);
      return;
    }
    this.items.value = this.items.value.filter((_, i) => i !== index);
  }

  insert(index: number, initialValue?: Partial<T>): void {
    if (index < 0 || index > this.items.value.length) {
      console.warn(`ArrayNode: index ${index} out of bounds`);
      return;
    }

    const newItem = this.createItem(initialValue);
    const newItems = [...this.items.value];
    newItems.splice(index, 0, newItem);
    this.items.value = newItems;
  }

  clear(): void {
    this.items.value = [];
  }

  at(index: number): FormNode<T> | undefined {
    return this.items.value[index];
  }

  // ============================================================================
  // Реализация абстрактных методов
  // ============================================================================

  getValue(): T[] {
    return this.items.value.map(item => item.getValue());
  }

  setValue(values: T[], options?: SetValueOptions): void {
    this.clear();
    values.forEach(value => this.push(value));
  }

  patchValue(values: Partial<T>[]): void {
    values.forEach((value, index) => {
      if (this.items.value[index]) {
        this.items.value[index].patchValue(value);
      }
    });
  }

  reset(values?: T[]): void {
    this.clear();
    if (values) {
      values.forEach(value => this.push(value));
    }
  }

  async validate(): Promise<boolean> {
    const results = await Promise.all(
      this.items.value.map(item => item.validate())
    );
    return results.every(Boolean);
  }

  setErrors(errors: ValidationError[]): void {
    // ArrayNode level errors
  }

  clearErrors(): void {
    this.items.value.forEach(item => item.clearErrors());
  }

  markAsTouched(): void {
    this.items.value.forEach(item => item.markAsTouched());
  }

  markAsUntouched(): void {
    this.items.value.forEach(item => item.markAsUntouched());
  }

  markAsDirty(): void {
    this.items.value.forEach(item => item.markAsDirty());
  }

  markAsPristine(): void {
    this.items.value.forEach(item => item.markAsPristine());
  }

  // ============================================================================
  // Итерация
  // ============================================================================

  forEach(callback: (item: FormNode<T>, index: number) => void): void {
    this.items.value.forEach(callback);
  }

  map<R>(callback: (item: FormNode<T>, index: number) => R): R[] {
    return this.items.value.map(callback);
  }

  // ============================================================================
  // Private методы
  // ============================================================================

  private createItem(initialValue?: Partial<T>): FormNode<T> {
    // Определить тип узла на основе схемы
    if (this.isGroupSchema(this.itemSchema)) {
      const node = new GroupNode(this.itemSchema as any);
      if (initialValue) {
        node.patchValue(initialValue);
      }
      return node as any;
    }

    // Если схема - FieldConfig
    throw new Error('ArrayNode поддерживает только GroupNode элементы');
  }

  private isGroupSchema(schema: any): boolean {
    return typeof schema === 'object' && !('component' in schema);
  }
}
```

**Чек-лист:**
- [ ] Создать файл array-node.ts
- [ ] Реализовать CRUD методы
- [ ] Реализовать computed signals
- [ ] Добавить forEach/map
- [ ] Протестировать push/remove/insert

---

### Шаг 5.2: Обновить GroupNode для поддержки вложенности

**Файл:** `src/lib/forms/core/nodes/group-node.ts`

```typescript
import { ArrayNode } from './array-node';

export class GroupNode<T extends Record<string, any> = any> extends FormNode<T> {
  constructor(schema: DeepFormSchema<T>) {
    super();

    this.fields = new Map();
    this._submitting = signal(false);

    // ✅ НОВОЕ: Создать поля с поддержкой массивов и групп
    for (const [key, config] of Object.entries(schema)) {
      const node = this.createNode(config);
      this.fields.set(key as keyof T, node);
    }

    // ... computed signals ...
  }

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

  private isGroupConfig(config: any): boolean {
    return (
      typeof config === 'object' &&
      config !== null &&
      !('component' in config) &&
      !Array.isArray(config)
    );
  }
}
```

**Чек-лист:**
- [ ] Добавить createNode метод
- [ ] Поддержать Array схемы
- [ ] Поддержать вложенные Group схемы
- [ ] Протестировать вложенность

---

### Шаг 5.3: Создать типы для вложенных схем

**Файл:** `src/lib/forms/types/index.ts`

```typescript
export type DeepFormSchema<T> = {
  [K in keyof T]: T[K] extends Array<infer U>
    ? [DeepFormSchema<U>] // Массив
    : T[K] extends Record<string, any>
    ? DeepFormSchema<T[K]> | FieldConfig<T[K]> // Группа или поле
    : FieldConfig<T[K]>; // Поле
};
```

---

### Шаг 5.4: Мигрировать DeepFormStore на GroupNode

**Файл:** `src/lib/forms/core/deep-form-store.ts`

```typescript
// LEGACY: Алиас для обратной совместимости
import { GroupNode } from './nodes/group-node';

/**
 * @deprecated Используйте GroupNode вместо DeepFormStore
 * DeepFormStore будет удален в версии 2.0
 */
export const DeepFormStore = GroupNode;
```

---

### Шаг 5.5: Удалить устаревшие файлы

После тестирования переместить в legacy:
```bash
mv src/lib/forms/core/array-proxy.ts src/lib/forms/core/legacy/
mv src/lib/forms/core/group-proxy.ts src/lib/forms/core/legacy/
```

**Чек-лист:**
- [ ] Создать ArrayNode
- [ ] Обновить GroupNode
- [ ] Создать DeepFormSchema типы
- [ ] Мигрировать DeepFormStore
- [ ] Переместить array-proxy/group-proxy в legacy
- [ ] `npm run build`

---

### Тестирование Фазы 5

```typescript
const form = new GroupNode({
  properties: [
    {
      title: { value: '', component: Input },
      price: { value: 0, component: Input },
    }
  ],
  personalData: {
    firstName: { value: '', component: Input },
    lastName: { value: '', component: Input },
  },
});

// ✅ Доступ к массиву
form.properties.push({ title: 'Item 1', price: 100 });
form.properties.at(0)?.title.setValue('Item 1');
console.log(form.properties.length.value); // 1

// ✅ Доступ к вложенной группе
form.personalData.firstName.setValue('John');
console.log(form.personalData.firstName.value.value); // 'John'

// ✅ Валидация работает
await form.validate();
console.log(form.valid.value);
```

---

## Фаза 6: Интеграция ресурсов

**Длительность:** 3-4 дня
**Breaking changes:** Средние
**Приоритет:** Средний
**Зависит от:** Фазы 2

### Цель
Интегрировать систему ресурсов с FieldNode

---

### Шаг 6.1: Расширить FieldConfig для поддержки resource

**Файл:** `src/lib/forms/types/index.ts`

```typescript
import type { ResourceConfig } from '../core/resources';

export interface FieldConfig<T = any> {
  value: T;
  component: ComponentType;
  validators?: ValidatorFn<T>[];
  asyncValidators?: AsyncValidatorFn<T>[];
  debounce?: number;
  componentProps?: Record<string, any>;

  // ✅ НОВОЕ: Поддержка ресурсов
  resource?: ResourceConfig<any>;
}
```

---

### Шаг 6.2: Добавить логику загрузки ресурсов в FieldNode

**Файл:** `src/lib/forms/core/nodes/field-node.ts`

```typescript
import type { ResourceConfig, ResourceItem, ResourceLoadParams } from '../resources';

export class FieldNode<T = any> extends FormNode<T> {
  // Ресурс
  private resource?: ResourceConfig<any>;

  // Реактивное состояние загрузки
  private _loading: Signal<boolean>;
  private _resourceError: Signal<Error | null>;
  private _resourceItems: Signal<ResourceItem[]>;

  public readonly loading: ReadonlySignal<boolean>;
  public readonly resourceError: ReadonlySignal<Error | null>;
  public readonly resourceItems: ReadonlySignal<ResourceItem[]>;

  constructor(config: FieldConfig<T>) {
    super();
    // ...

    // ✅ НОВОЕ: Инициализация ресурса
    this.resource = config.resource;
    this._loading = signal(false);
    this._resourceError = signal<Error | null>(null);
    this._resourceItems = signal<ResourceItem[]>([]);

    this.loading = computed(() => this._loading.value);
    this.resourceError = computed(() => this._resourceError.value);
    this.resourceItems = computed(() => this._resourceItems.value);

    // Автоматическая загрузка для preload
    if (this.resource?.type === 'preload') {
      this.loadResource();
    }
  }

  async loadResource(params?: ResourceLoadParams): Promise<void> {
    if (!this.resource) return;

    this._loading.value = true;
    this._resourceError.value = null;

    try {
      const result = await this.resource.load(params);
      this._resourceItems.value = result.items;
    } catch (error) {
      this._resourceError.value = error as Error;
    } finally {
      this._loading.value = false;
    }
  }
}
```

---

### Шаг 6.3: Добавить AbortController в resources

**Файл:** `src/lib/forms/core/resources.ts`

```typescript
export interface ResourceConfig<T = any> {
  type: 'static' | 'preload' | 'partial';
  load: (params?: ResourceLoadParams, signal?: AbortSignal) => Promise<ResourceResult<T>>;
}

export function partialResource<T>(
  loader: (params: ResourceLoadParams, signal?: AbortSignal) => Promise<ResourceItem<T>[]>
): ResourceConfig<T> {
  let currentController: AbortController | null = null;

  return {
    type: 'partial',
    load: async (params, signal) => {
      // Отменить предыдущий запрос
      if (currentController) {
        currentController.abort();
      }

      currentController = new AbortController();

      try {
        const items = await loader(params || {}, currentController.signal);
        return { items, totalCount: items.length };
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return { items: [], totalCount: 0 };
        }
        throw error;
      }
    }
  };
}
```

---

### Шаг 6.4: Обновить компоненты Select/Search

**Файл:** `src/components/Select.tsx`

```typescript
import { FieldNode } from '@/lib/forms';

interface SelectProps {
  field: FieldNode<any>;
}

export function Select({ field }: SelectProps) {
  const items = field.resourceItems.value;
  const loading = field.loading.value;
  const error = field.resourceError.value;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <select
      value={field.value.value}
      onChange={(e) => field.setValue(e.target.value)}
    >
      <option value="">Select...</option>
      {items.map(item => (
        <option key={item.id} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}
```

**Чек-лист:**
- [ ] Расширить FieldConfig
- [ ] Добавить loading/resourceItems в FieldNode
- [ ] Добавить AbortController в resources
- [ ] Обновить Select компонент
- [ ] Обновить Search компонент
- [ ] Протестировать загрузку данных
- [ ] `npm run build`

---

## Фаза 7: Очистка и документация

**Длительность:** 3-4 дня
**Breaking changes:** Нет
**Приоритет:** Средний

### Цель
Завершить рефакторинг, написать тесты и документацию

---

### Шаг 7.1: Написать unit тесты

**Файл:** `src/lib/forms/__tests__/field-node.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { FieldNode } from '../core/nodes/field-node';

describe('FieldNode', () => {
  it('should create with initial value', () => {
    const field = new FieldNode({
      value: 'test',
      component: () => null,
    });

    expect(field.value.value).toBe('test');
  });

  it('should update value with setValue', () => {
    const field = new FieldNode({
      value: '',
      component: () => null,
    });

    field.setValue('new value');
    expect(field.value.value).toBe('new value');
  });

  // ... больше тестов
});
```

**Тесты для:**
- [ ] FieldNode (setValue, validate, reset, markAsTouched)
- [ ] GroupNode (getValue, setValue, validate)
- [ ] ArrayNode (push, removeAt, insert, validate)
- [ ] Resources (static, preload, partial)
- [ ] Validation (sync, async, contextual)

---

### Шаг 7.2: Обновить CLAUDE.md

**Файл:** `CLAUDE.md`

```markdown
## Архитектура форм (ОБНОВЛЕНО)

### FormNode иерархия

Модуль форм построен на единой иерархии классов:

- **FormNode<T>** - абстрактный базовый класс
  - **FieldNode<T>** - поле формы
  - **GroupNode<T>** - группа полей (объект)
  - **ArrayNode<T>** - массив форм

### Использование

#### Простая форма
// ...

#### Вложенные формы
// ...

#### Массивы
// ...

#### Ресурсы
// ...
```

---

### Шаг 7.3: Создать migration guide

**Файл:** `MIGRATION.md`

```markdown
# Migration Guide: v1 → v2

## Breaking Changes

### 1. FormStore → GroupNode
### 2. FieldController → FieldNode
### 3. form.controls.field → form.field

## Step-by-step

### Before
### After
```

---

### Шаг 7.4: Удалить legacy код

После успешной миграции всех файлов:
```bash
rm -rf src/lib/forms/core/legacy/
```

**Чек-лист:**
- [ ] Написать unit тесты (coverage > 80%)
- [ ] Написать integration тесты
- [ ] Обновить CLAUDE.md
- [ ] Создать MIGRATION.md
- [ ] Обновить README.md
- [ ] Удалить legacy код
- [ ] Запустить финальный build
- [ ] Создать PR

---

## Стратегия тестирования

### Unit тесты
- Каждый класс FormNode
- Валидаторы
- Ресурсы

### Integration тесты
- Создание сложных форм
- Валидация с условиями
- Массивы с CRUD
- Ресурсы с загрузкой

### E2E тесты (опционально)
- Пользовательские сценарии
- Заполнение форм
- Submit

---

## Стратегия миграции

### Подход: Постепенная миграция

1. **Фазы 1-2:** Не ломают существующий код (алиасы)
2. **Фаза 3:** Breaking change (можно отложить)
3. **Фазы 4-7:** Добавляют функциональность

### Timeline для production

1. **Week 1-2:** Фазы 1-2 (основа)
2. **Week 3:** Фаза 5 (массивы)
3. **Week 4:** Фазы 4, 6 (валидация, ресурсы)
4. **Week 5:** Фаза 7 (тесты, документация)
5. **Week 6:** Фаза 3 (breaking change - опционально)

---

## Оценка рисков

| Риск | Вероятность | Воздействие | Митигация |
|------|-------------|-------------|-----------|
| Breaking changes ломают код | Средняя | Высокое | Алиасы, постепенная миграция |
| Производительность хуже | Низкая | Высокое | Бенчмарки до/после |
| TypeScript ошибки | Средняя | Среднее | Строгая типизация с начала |
| Баги в ArrayNode | Средняя | Среднее | Тщательное тестирование |
| Пропущенные edge cases | Средняя | Среднее | Code review, тесты |

---

## Чек-лист финального релиза

### Код
- [ ] Все фазы завершены
- [ ] Все тесты проходят
- [ ] TypeScript без ошибок
- [ ] ESLint без ошибок
- [ ] Build успешен

### Документация
- [ ] CLAUDE.md обновлен
- [ ] README.md обновлен
- [ ] MIGRATION.md создан
- [ ] JSDoc комментарии добавлены
- [ ] Примеры обновлены

### Тестирование
- [ ] Unit тесты (coverage > 80%)
- [ ] Integration тесты
- [ ] Manual QA
- [ ] Performance тесты

### Релиз
- [ ] Создать PR
- [ ] Code review
- [ ] Merge в main
- [ ] Tag версии (v2.0.0)
- [ ] Обновить changelog

---

## Итоговая оценка

| Фаза | Длительность | Сложность | Приоритет |
|------|--------------|-----------|-----------|
| Фаза 1: Performance fixes | 1-2 дня | Средняя | ВЫСОКИЙ 🔥 |
| Фаза 2: FormNode architecture | 3-4 дня | Высокая | ВЫСОКИЙ 🔥 |
| Фаза 3: Proxy access | 1 день | Средняя | Средний |
| Фаза 4: Validation | 2-3 дня | Средняя | Средний |
| Фаза 5: Arrays & nesting | 4-5 дней | Высокая | ВЫСОКИЙ 🔥 |
| Фаза 6: Resources | 3-4 дня | Средняя | Средний |
| Фаза 7: Cleanup & docs | 3-4 дня | Низкая | Средний |
| **ИТОГО** | **18-26 дней** | | |

---

**Дата создания:** 2025-10-25
**Версия:** 1.0
**Статус:** Готов к реализации