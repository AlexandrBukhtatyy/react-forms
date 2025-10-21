## Variant 5: Proxy-based Deep Access

**Статус**: ✅ Реализовано

**Дата реализации**: 2025-10-21

---

## Обзор

**Variant 5** предоставляет самый элегантный API для работы с вложенными формами и массивами через JavaScript Proxy. Это архитектурный подход, который сочетает удобство использования с производительностью flat storage.

### Ключевые особенности

- ✅ **Proxy-based доступ**: Элегантный синтаксис без `.controls` на каждом уровне
- ✅ **Автоматическое определение типов**: Поля, группы и массивы определяются из схемы
- ✅ **Flat хранилище**: Высокая производительность благодаря плоской структуре
- ✅ **Массивы через `[{...}]`**: Интуитивный синтаксис для массивов
- ✅ **Полная типизация TypeScript**: Автоматический вывод типов
- ✅ **Реактивность через Signals**: Автоматические обновления UI

---

## Синтаксис

### Простые поля

```typescript
form.controls.firstName.value = 'John';
```

### Вложенные формы

```typescript
form.controls.address.city.value = 'Moscow';
form.controls.address.street.value = 'Tverskaya 1';
```

### Массивы

```typescript
// Добавить элемент
form.controls.items.push({ title: 'New item' });

// Доступ по индексу
form.controls.items[0].title.value = 'Updated';

// Удалить элемент
form.controls.items.remove(0);
```

### Массивы с вложенными формами

```typescript
form.controls.coBorrowers[0].personalData.firstName.value = 'John';
```

---

## Установка и использование

### 1. Определение интерфейса

```typescript
interface ContactForm {
  name: string;
  email: string;
  address: {
    city: string;
    street: string;
  };
  phoneNumbers: Array<{
    type: string;
    number: string;
  }>;
}
```

### 2. Создание схемы

```typescript
import { DeepFormSchema } from '@/lib/forms';

const schema: DeepFormSchema<ContactForm> = {
  // Простые поля
  name: { value: '', component: Input },
  email: { value: '', component: Input },

  // Вложенная группа
  address: {
    city: { value: '', component: Input },
    street: { value: '', component: Input },
  },

  // Массив - используем синтаксис [{...}]
  phoneNumbers: [{
    type: { value: 'mobile', component: Input },
    number: { value: '', component: Input },
  }],
};
```

### 3. Создание формы

```typescript
import { DeepFormStore } from '@/lib/forms';

const form = new DeepFormStore(schema);
```

### 4. Использование в React

```typescript
export function ContactForm() {
  return (
    <div>
      {/* Простое поле */}
      <Input
        value={form.controls.name.value}
        onChange={e => form.controls.name.value = e.target.value}
      />

      {/* Вложенное поле */}
      <Input
        value={form.controls.address.city.value}
        onChange={e => form.controls.address.city.value = e.target.value}
      />

      {/* Массив */}
      <Button onClick={() => form.controls.phoneNumbers.push()}>
        Add Phone
      </Button>

      {form.controls.phoneNumbers.map((phone, index) => (
        <div key={index}>
          <Input
            value={phone.number.value}
            onChange={e => phone.number.value = e.target.value}
          />
          <Button onClick={() => form.controls.phoneNumbers.remove(index)}>
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}
```

---

## API Reference

### DeepFormStore

Основной класс для создания форм с поддержкой вложенных структур.

#### Конструктор

```typescript
const form = new DeepFormStore<T>(schema: DeepFormSchema<T>)
```

#### Свойства

| Свойство | Тип | Описание |
|----------|-----|----------|
| `controls` | `DeepControls<T>` | Proxy для доступа к полям |
| `value` | `ReadonlySignal<T>` | Реактивное значение формы |
| `valid` | `boolean` | Все поля валидны |
| `invalid` | `boolean` | Хотя бы одно поле невалидно |
| `touched` | `boolean` | Хотя бы одно поле touched |
| `dirty` | `boolean` | Хотя бы одно поле изменено |
| `submitting` | `boolean` | Форма в процессе отправки |

#### Методы

```typescript
// Валидация
validate(): Promise<boolean>

// Получение значений
getValue(): T

// Установка значений
setValue(values: Partial<T>): void
patchValue(values: Partial<T>): void

// Состояние
markAllAsTouched(): void
reset(values?: Partial<T>): void
disable(): void
enable(): void

// Отправка
submit<R>(onSubmit: (values: T) => Promise<R> | R): Promise<R | null>

// Validation Schema
applyValidationSchema(schemaFn: ValidationSchemaFn<T>): void
```

---

### GroupProxy

Proxy для вложенных групп полей.

#### Свойства

| Свойство | Тип | Описание |
|----------|-----|----------|
| `valid` | `boolean` | Все поля группы валидны |
| `invalid` | `boolean` | Хотя бы одно поле группы невалидно |
| `errors` | `ValidationError[]` | Все ошибки группы |
| `touched` | `boolean` | Хотя бы одно поле touched |
| `dirty` | `boolean` | Хотя бы одно поле изменено |

#### Методы

```typescript
validate(): Promise<boolean>
getValue(): T
setValue(value: Partial<T>): void
markAsTouched(): void
reset(): void
```

---

### ArrayProxy

Proxy для массивов форм.

#### Свойства

| Свойство | Тип | Описание |
|----------|-----|----------|
| `length` | `ReadonlySignal<number>` | Количество элементов |
| `items` | `ReadonlySignal<T[]>` | Массив элементов |
| `valid` | `boolean` | Все элементы валидны |
| `invalid` | `boolean` | Хотя бы один элемент невалиден |
| `errors` | `ValidationError[]` | Все ошибки массива |
| `[index]` | `DeepControls<T>` | Доступ по индексу |

#### Методы управления

```typescript
// CRUD операции
push(value?: Partial<T>): void
remove(index: number): void
insert(index: number, value?: Partial<T>): void
clear(): void
at(index: number): T | undefined

// Итерация
forEach(callback: (item: T, index: number) => void): void
map<R>(callback: (item: T, index: number) => R): R[]

// Валидация и значения
validate(): Promise<boolean>
getValue(): T[]
setValue(values: Partial<T>[]): void
markAsTouched(): void
reset(): void
```

---

## Примеры

### Базовый пример

См. [variant5-basic-example.tsx](../src/examples/variant5-basic-example.tsx)

### Комплексный пример (Заявка на кредит)

См. [variant5-credit-application.tsx](../src/examples/variant5-credit-application.tsx)

---

## Архитектура

### Компоненты системы

```
DeepFormStore
├── fields: Map<string, FieldController>     // Плоское хранилище полей (dot notation)
├── arrayConfigs: Map<string, ArrayConfig>   // Конфигурации массивов
├── arrayProxies: Map<string, ArrayProxy>    // Кэш ArrayProxy экземпляров
└── controlsProxy: Proxy                     // Главный Proxy для доступа

FieldController
├── _value: Signal<T>
├── _errors: Signal<ValidationError[]>
├── _touched: Signal<boolean>
└── validate(): Promise<boolean>

GroupProxy
├── path: string[]                           // Путь к группе
├── store: FormStore                         // Ссылка на FormStore
└── proxy: Proxy                             // Proxy для доступа

ArrayProxy
├── _items: Signal<GroupProxy[]>             // Элементы массива
├── factory: DeepFormSchema<T>               // Схема элемента
├── proxy: Proxy                             // Proxy для доступа
└── методы: push(), remove(), insert(), clear()
```

### Процесс работы

1. **Парсинг схемы** (`flattenSchema`):
   - `[{...}]` → ArrayConfig (массив)
   - `{field1: {...}, field2: {...}}` → рекурсия (группа)
   - `{value: ..., component: ...}` → FieldController (поле)

2. **Создание Proxy**:
   - Главный Proxy перехватывает доступ к `controls`
   - При обращении к свойству проверяет: поле? массив? группа?
   - Возвращает соответствующий объект

3. **Flat хранилище**:
   - Поля хранятся с dot notation: `"address.city"`, `"items.0.title"`
   - Автоматическая переиндексация при удалении элементов массива
   - Высокая производительность

4. **Реактивность**:
   - Все изменения через Signals
   - Computed для агрегированных значений (valid, value, и т.д.)
   - Автоматические обновления UI

---

## Сравнение с Variant 2

| Аспект | Variant 2 (FormGroup) | Variant 5 (Proxy) |
|--------|----------------------|-------------------|
| **API** | `form.controls.items.controls[0].controls.title` | `form.controls.items[0].title` |
| **Схема** | `FormArray({ factory: ... })` | `[{...}]` |
| **Сложность** | Средняя | Высокая |
| **Типизация** | Хорошая | Отличная |
| **Отладка** | Проще | Сложнее |
| **Производительность** | Хорошая | Хорошая |

---

## Лучшие практики

### 1. Использование TypeScript интерфейсов

Всегда определяйте интерфейс формы:

```typescript
interface MyForm {
  field1: string;
  nested: {
    field2: number;
  };
}

const schema: DeepFormSchema<MyForm> = { ... };
const form = new DeepFormStore<MyForm>(schema);
```

### 2. Валидация групп

Валидируйте группы независимо:

```typescript
const personalDataValid = await form.controls.personalData.validate();
const addressValid = await form.controls.address.validate();
```

### 3. Работа с массивами

Используйте методы итерации:

```typescript
// ✅ Хорошо
form.controls.items.forEach((item, index) => {
  console.log(item.title.value);
});

// ❌ Плохо - прямой доступ к приватному массиву
form.controls.items._items.value.forEach(...);
```

### 4. Реактивность

Используйте `.value` для реактивности:

```typescript
// В React компоненте
<div>
  {form.controls.items.map((item, index) => (
    <div key={index}>{item.title.value}</div>
  ))}
</div>
```

### 5. Обработка ошибок

Проверяйте валидность перед отправкой:

```typescript
const submit = async () => {
  const isValid = await form.validate();
  if (!isValid) {
    console.error('Form is invalid:', form.controls);
    return;
  }

  await form.submit(async (values) => {
    // отправка
  });
};
```

---

## Ограничения

### 1. Отладка

Proxy может усложнить отладку. Используйте:

```typescript
// Получить все поля
console.log(form['fields']);

// Получить значения
console.log(form.getValue());
```

### 2. Производительность

Для очень больших массивов (1000+ элементов) рассмотрите:
- Виртуализацию списков
- Ленивую загрузку
- Пагинацию

### 3. TypeScript

Сложные вложенные типы могут увеличить время компиляции.

---

## Миграция с Variant 2

### До (Variant 2)

```typescript
const schema: FormSchema = {
  items: FormArray({
    factory: () => ({
      title: { value: '', component: Input },
    }),
  }),
};

form.controls.items.controls[0].controls.title.value = 'New';
```

### После (Variant 5)

```typescript
const schema: DeepFormSchema = {
  items: [{
    title: { value: '', component: Input },
  }],
};

form.controls.items[0].title.value = 'New';
```

---

## Roadmap

- [ ] DevTools integration для отладки
- [ ] Performance profiler
- [ ] Дополнительные примеры
- [ ] Сравнительные бенчмарки с Variant 2

---

## Поддержка

Для вопросов и предложений создавайте issue в репозитории проекта.
