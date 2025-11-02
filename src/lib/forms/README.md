# Forms Library

Библиотека для управления формами на основе **@preact/signals-react** и **TypeScript**.

## 🎯 Что это?

Современная библиотека форм с:
- ✅ **Type-safe** архитектурой на основе иерархии классов
- ✅ **Reactive** состоянием через @preact/signals
- ✅ **Declarative** API для валидации и поведения
- ✅ **Composable** структурой для переиспользования

## 🚀 Quick Start

```typescript
import { GroupNode } from './core/nodes/group-node';
import { required, email } from './validators';

interface LoginForm {
  email: string;
  password: string;
}

const form = new GroupNode<LoginForm>({
  form: {
    email: { value: '', component: Input },
    password: { value: '', component: Input },
  },
  validation: (path) => {
    required(path.email);
    email(path.email);
    required(path.password);
  },
});

// Использование
form.email.setValue('test@mail.com');
const isValid = await form.validate();
```

## 📚 Архитектура

### Иерархия классов

```
FormNode<T>                      # Абстрактный базовый класс
├── FieldNode<T>                 # Поле с валидацией
├── GroupNode<T>                 # Группа полей (объект)
└── ArrayNode<T>                 # Массив форм
```

### FormNode - базовый класс

Определяет единый интерфейс для всех узлов:

```typescript
abstract class FormNode<T> {
  // Readonly signals (реактивное состояние)
  abstract readonly value: ReadonlySignal<T>;
  abstract readonly valid: ReadonlySignal<boolean>;
  abstract readonly errors: ReadonlySignal<ValidationError[]>;
  abstract readonly touched: ReadonlySignal<boolean>;
  abstract readonly dirty: ReadonlySignal<boolean>;

  // Методы
  abstract getValue(): T;
  abstract setValue(value: T): void;
  abstract validate(): Promise<boolean>;
}
```

### FieldNode - поле формы

```typescript
const field = new FieldNode({
  value: '',
  component: Input,
  validators: [required, email],
  asyncValidators: [checkEmailUnique],
  debounce: 300,
});

field.setValue('test@mail.com');
await field.validate();
```

### GroupNode - группа полей

```typescript
const form = new GroupNode({
  form: {
    name: { value: '', component: Input },
    address: {
      city: { value: '', component: Input },
      street: { value: '', component: Input },
    },
  },
});

// Прямой доступ через proxy
form.name.setValue('John');
form.address.city.setValue('Moscow');
```

### ArrayNode - массив форм

```typescript
const form = new GroupNode({
  form: {
    items: [{
      title: { value: '', component: Input },
      price: { value: 0, component: Input },
    }],
  },
});

// CRUD операции
form.items.push({ title: 'Item 1', price: 100 });
form.items.at(0)?.title.setValue('Updated');
form.items.removeAt(0);
```

## 🔍 Validation Schema API

Декларативная валидация:

```typescript
const form = new GroupNode({
  form: { /* ... */ },
  validation: (path) => {
    // Sync валидаторы
    required(path.email);
    email(path.email);
    minLength(path.password, 8);

    // Async валидаторы
    validateAsync(
      path.email,
      async (value) => {
        const exists = await api.checkEmail(value);
        return exists ? { code: 'exists', message: 'Email занят' } : null;
      },
      { debounce: 300 }
    );

    // Кросс-полевая валидация
    validate(
      [path.password, path.confirmPassword],
      (values) => {
        const [password, confirm] = values;
        return password !== confirm
          ? { code: 'mismatch', message: 'Пароли не совпадают' }
          : null;
      },
      { targetField: 'confirmPassword' }
    );

    // Условная валидация
    applyWhen(
      path.loanType,
      (type) => type === 'mortgage',
      (path) => {
        required(path.propertyValue);
      }
    );
  },
});
```

### Доступные валидаторы

```typescript
import {
  required,
  email,
  min,
  max,
  minLength,
  maxLength,
  pattern,
  validate,
  validateAsync,
  validateTree,
  applyWhen,
} from './validators';
```

### Композиция валидации

```typescript
// address-validation.ts
export const addressValidation: ValidationSchemaFn<Address> = (path) => {
  required(path.city);
  required(path.street);
};

// user-validation.ts
import { apply } from './validators';

export const userValidation: ValidationSchemaFn<User> = (path) => {
  // Применить к нескольким полям
  apply([path.homeAddress, path.workAddress], addressValidation);
};
```

## ⚡ Behavior Schema API

Декларативное реактивное поведение:

```typescript
const form = new GroupNode({
  form: { /* ... */ },
  behavior: (path) => {
    // Копирование полей
    copyFrom(path.residenceAddress, path.registrationAddress, {
      when: (form) => form.sameAsRegistration === true
    });

    // Условное включение
    enableWhen(path.propertyValue, path.loanType, {
      condition: (type) => type === 'mortgage',
      resetOnDisable: true,
    });

    // Вычисляемое поле
    computeFrom(
      path.fullName,
      [path.firstName, path.lastName],
      ({ firstName, lastName }) => `${firstName} ${lastName}`.trim()
    );

    // Callback при изменении
    watchField(path.country, async (country, ctx) => {
      const regions = await fetchRegions(country);
      ctx.updateComponentProps(path.region, { options: regions });
    });
  },
});
```

### Доступные behaviors

```typescript
import {
  copyFrom,
  enableWhen,
  computeFrom,
  watchField,
  apply,
  applyWhen,
} from './behaviors';
```

## 📁 Структура проекта

```
src/lib/forms/
├── core/
│   └── nodes/                   # Узлы формы
│       ├── form-node.ts         # Базовый класс
│       ├── field-node.ts        # Поле
│       ├── group-node.ts        # Группа
│       └── array-node.ts        # Массив
│
├── validators/                  # Validation Schema API
│   ├── schema-validators.ts     # Функции валидации
│   ├── validation-registry.ts   # Реестр валидаторов
│   ├── validation-context.ts    # Контекст валидации
│   ├── field-path.ts            # Type-safe пути
│   └── index.ts
│
├── behaviors/                   # Behavior Schema API
│   ├── schema-behaviors.ts      # Behavior функции
│   ├── behavior-registry.ts     # Реестр behaviors
│   ├── behavior-context.ts      # Контекст behaviors
│   ├── create-field-path.ts     # Type-safe пути
│   └── index.ts
│
├── hooks/                       # React hooks
│   ├── useFormEffect.ts
│   ├── useComputedField.ts
│   ├── useCopyField.ts
│   └── useEnableWhen.ts
│
├── types/                       # TypeScript типы
└── README.md                    # Этот файл
```

## 🧪 Тестирование

Unit тесты находятся в `src/tests/unit/forms/`:

```bash
npm run test:unit         # Запустить unit тесты
npm run test:coverage     # С coverage
```

**Текущее покрытие**:
- ✅ FormNode, FieldNode, GroupNode, ArrayNode
- ✅ ValidationContext
- ✅ BehaviorRegistry
- ✅ 70+ тестов

## 📖 Документация

### Основная документация
- **[Architecture](../../../docs/ARCHITECTURE.md)** - полное описание архитектуры
- **[Quick Start](../../../docs/QUICK-START.md)** - быстрое введение
- **[Migration Guide](./MIGRATION.md)** - миграция со старой архитектуры

### Примеры
- **[Validation Examples](../../examples/validation-example.ts)** - примеры валидации
- **[Behavior Examples](../../examples/behavior-schema-example.ts)** - примеры behaviors
- **[React Hooks](../../examples/react-hooks-example.tsx)** - React integration
- **[GroupNode Config](../../examples/group-node-config-example.ts)** - конфигурация

## 🔧 API Reference

### GroupNode

```typescript
// Создание формы
const form = new GroupNode<T>({
  form: DeepFormSchema<T>,
  validation?: ValidationSchemaFn<T>,
  behavior?: BehaviorSchemaFn<T>,
});

// Получение/установка значений
form.getValue(): T
form.setValue(value: T): void
form.patchValue(partial: Partial<T>): void
form.reset(): void

// Валидация
form.validate(): Promise<boolean>
form.clearErrors(): void

// Состояние
form.markAsTouched(): void
form.markAsDirty(): void

// Submit
form.submit(callback: (values: T) => Promise<void>): Promise<void>

// Signals (readonly)
form.value: ReadonlySignal<T>
form.valid: ReadonlySignal<boolean>
form.errors: ReadonlySignal<ValidationError[]>
form.touched: ReadonlySignal<boolean>
form.dirty: ReadonlySignal<boolean>
```

### ArrayNode

```typescript
// CRUD
array.push(value: Partial<T>): void
array.removeAt(index: number): void
array.insert(index: number, value: Partial<T>): void
array.clear(): void
array.at(index: number): GroupNode<T> | undefined

// Итерация
array.forEach(callback: (item, index) => void): void
array.map<R>(callback: (item, index) => R): R[]

// Schemas
array.applyValidationSchema(schema: ValidationSchemaFn<T>): void
array.applyBehaviorSchema(schema: BehaviorSchemaFn<T>): void

// Helpers
array.watchItems(field: keyof T, callback: (values) => void): () => void
array.watchLength(callback: (length: number) => void): () => void

// Signals
array.length: ReadonlySignal<number>
array.value: ReadonlySignal<T[]>
array.valid: ReadonlySignal<boolean>
```

## 💡 Best Practices

1. **Используйте новый API** - GroupNode вместо FormStore (legacy)
2. **Декларативный подход** - validation/behavior в конструкторе
3. **Композиция схем** - переиспользуйте validation/behavior функции через `apply`
4. **Type-safe пути** - используйте `path.*` вместо строк
5. **Cleanup** - вызывайте cleanup функции в React useEffect

## 🔄 Миграция

Переход со старой архитектуры:

**Было**:
```typescript
const form = new FormStore({ email: '', password: '' });
form.controls.email.setValue('test@mail.com');
```

**Стало**:
```typescript
const form = new GroupNode({
  form: {
    email: { value: '', component: Input },
    password: { value: '', component: Input },
  },
});
form.email.setValue('test@mail.com');
```

См. [MIGRATION.md](./MIGRATION.md) для деталей.

## 📞 Поддержка

- Вопросы: создайте issue
- Примеры: см. `src/examples/`
- Тесты: см. `src/tests/unit/forms/`

## 📄 Лицензия

MIT
