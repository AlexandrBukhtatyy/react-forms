# GroupNode Constructor Overload - Реализация

## Обзор

Реализован **Вариант 5 с перегрузками конструктора** для GroupNode, позволяющий автоматически применять behavior и validation схемы при создании формы.

## Мотивация

**Проблема**: Ранее для применения схем требовалось делать это вручную:

```typescript
const form = new GroupNode({ email: { value: '', component: Input } });
form.applyBehaviorSchema(behaviorSchema);
form.applyValidationSchema(validationSchema);
```

**Решение**: Теперь схемы можно передать прямо в конструктор:

```typescript
const form = new GroupNode({
  form: { email: { value: '', component: Input } },
  behavior: (path) => { /* ... */ },
  validation: (path) => { /* ... */ },
});
```

## API

### Перегрузка 1: Старый API (обратная совместимость)

```typescript
constructor(schema: DeepFormSchema<T>);
```

**Пример**:
```typescript
const form = new GroupNode({
  email: { value: '', component: Input },
  password: { value: '', component: Input },
});
```

### Перегрузка 2: Новый API с конфигурацией

```typescript
constructor(config: GroupNodeConfig<T>);

interface GroupNodeConfig<T> {
  form: DeepFormSchema<T>;
  behavior?: BehaviorSchemaFn<T>;
  validation?: ValidationSchemaFn<T>;
}
```

**Пример**:
```typescript
const form = new GroupNode({
  form: {
    email: { value: '', component: Input },
    password: { value: '', component: Input },
  },
  behavior: (path) => {
    computeFrom(path.email, [path.email], (v) => v[0]?.trim());
  },
  validation: (path) => {
    required(path.email);
    email(path.email);
    required(path.password);
    minLength(path.password, 8);
  },
});
```

## Реализация

### 1. Добавлен тип `GroupNodeConfig`

**Файл**: [src/lib/forms/types/index.ts](../src/lib/forms/types/index.ts)

```typescript
export interface GroupNodeConfig<T extends Record<string, any>> {
  form: DeepFormSchema<T>;
  behavior?: BehaviorSchemaFn<T>;
  validation?: ValidationSchemaFn<T>;
}
```

### 2. Обновлен конструктор GroupNode

**Файл**: [src/lib/forms/core/nodes/group-node.ts](../src/lib/forms/core/nodes/group-node.ts)

```typescript
export class GroupNode<T extends Record<string, any> = any> extends FormNode<T> {
  // Перегрузка 1: только schema (старый API)
  constructor(schema: DeepFormSchema<T>);

  // Перегрузка 2: config с form, behavior, validation
  constructor(config: GroupNodeConfig<T>);

  constructor(schemaOrConfig: DeepFormSchema<T> | GroupNodeConfig<T>) {
    super();

    // Определяем, что передано
    const isNewAPI = 'form' in schemaOrConfig;
    const formSchema = isNewAPI ? schemaOrConfig.form : schemaOrConfig;
    const behaviorSchema = isNewAPI ? schemaOrConfig.behavior : undefined;
    const validationSchema = isNewAPI ? schemaOrConfig.validation : undefined;

    // Инициализируем поля из formSchema
    this.initializeFields(formSchema);

    // Создаем Proxy
    const proxy = new Proxy(this, { /* ... */ }) as GroupNodeWithControls<T>;

    // Применяем схемы, если они переданы
    if (behaviorSchema) {
      this.applyBehaviorSchema(behaviorSchema);
    }
    if (validationSchema) {
      this.applyValidationSchema(validationSchema);
    }

    return proxy;
  }
}
```

### 3. Ключевые особенности реализации

**Runtime определение типа**:
```typescript
const isNewAPI = 'form' in schemaOrConfig;
```

- Если в объекте есть ключ `form` → новый API
- Иначе → старый API (DeepFormSchema)

**Автоматическое применение схем**:
```typescript
if (behaviorSchema) {
  this.applyBehaviorSchema(behaviorSchema);
}
if (validationSchema) {
  this.applyValidationSchema(validationSchema);
}
```

Схемы применяются **сразу после создания полей**, но **до возврата Proxy**.

## Примеры использования

### Пример 1: Простая форма (старый API)

```typescript
const form = new GroupNode({
  email: { value: '', component: Input },
  password: { value: '', component: Input },
});

// Схемы применяются вручную
form.applyValidationSchema((path) => {
  required(path.email);
  email(path.email);
});
```

### Пример 2: Форма с полной конфигурацией

```typescript
interface LoginForm {
  email: string;
  password: string;
}

const form = new GroupNode<LoginForm>({
  form: {
    email: { value: '', component: Input },
    password: { value: '', component: Input },
  },
  behavior: (path) => {
    // Автоматически обрезаем пробелы в email
    computeFrom(path.email, [path.email], (values) =>
      values[path.email]?.trim() || ''
    );
  },
  validation: (path) => {
    required(path.email, { message: 'Email обязателен' });
    email(path.email, { message: 'Некорректный email' });
    required(path.password);
    minLength(path.password, 8);
  },
});

// Схемы уже применены!
```

### Пример 3: Только validation

```typescript
const form = new GroupNode({
  form: {
    username: { value: '', component: Input },
    email: { value: '', component: Input },
  },
  validation: (path) => {
    required(path.username);
    minLength(path.username, 3);
    required(path.email);
    email(path.email);
  },
});
```

### Пример 4: Только behavior

```typescript
const form = new GroupNode({
  form: {
    price: { value: 0, component: Input },
    quantity: { value: 1, component: Input },
    total: { value: 0, component: Input },
  },
  behavior: (path) => {
    computeFrom(path.total, [path.price, path.quantity], (values) => {
      const price = values[path.price] as number;
      const quantity = values[path.quantity] as number;
      return (price || 0) * (quantity || 0);
    });
  },
});
```

### Пример 5: Комплексная форма кредитной заявки

```typescript
interface LoanApplicationForm {
  loanType: 'mortgage' | 'consumer' | 'auto' | '';
  loanAmount: number | null;
  propertyValue: number | null;
  initialPayment: number | null;
}

const form = new GroupNode<LoanApplicationForm>({
  form: {
    loanType: { value: '', component: Select },
    loanAmount: { value: null, component: Input },
    propertyValue: { value: null, component: Input },
    initialPayment: { value: null, component: Input },
  },
  behavior: (path) => {
    // Показываем propertyValue только для ипотеки
    enableWhen(path.propertyValue, path.loanType, {
      condition: (type) => type === 'mortgage',
      resetOnDisable: true,
    });

    // Автоматически вычисляем 20% от стоимости
    computeFrom(path.initialPayment, [path.propertyValue], (values) => {
      const propertyValue = values[path.propertyValue] as number | null;
      return propertyValue ? propertyValue * 0.2 : null;
    });
  },
  validation: (path) => {
    required(path.loanType);
    required(path.loanAmount);

    // Условная валидация для ипотеки
    applyWhen(path.loanType, (type) => type === 'mortgage', () => {
      required(path.propertyValue);
      required(path.initialPayment);
    });
  },
});
```

### Пример 6: Вложенные формы

```typescript
interface UserForm {
  personalData: {
    firstName: string;
    lastName: string;
  };
  address: {
    city: string;
    street: string;
  };
}

const form = new GroupNode<UserForm>({
  form: {
    personalData: {
      firstName: { value: '', component: Input },
      lastName: { value: '', component: Input },
    },
    address: {
      city: { value: '', component: Input },
      street: { value: '', component: Input },
    },
  },
  validation: (path) => {
    required(path.personalData.firstName);
    required(path.personalData.lastName);
    required(path.address.city);
    required(path.address.street);
  },
});
```

### Пример 7: Копирование адресов

```typescript
const form = new GroupNode({
  form: {
    sameAsRegistration: { value: false, component: Input },
    registrationAddress: {
      city: { value: '', component: Input },
      street: { value: '', component: Input },
    },
    residenceAddress: {
      city: { value: '', component: Input },
      street: { value: '', component: Input },
    },
  },
  behavior: (path) => {
    copyFrom(path.residenceAddress, path.registrationAddress, {
      when: (form) => form.sameAsRegistration === true,
    });
  },
  validation: (path) => {
    required(path.registrationAddress.city);
    required(path.registrationAddress.street);

    applyWhen(path.sameAsRegistration, (same) => !same, () => {
      required(path.residenceAddress.city);
      required(path.residenceAddress.street);
    });
  },
});
```

## Преимущества

### 1. Декларативный стиль

Вся конфигурация формы в одном месте:

```typescript
const form = new GroupNode({
  form: { /* структура */ },
  behavior: (path) => { /* поведение */ },
  validation: (path) => { /* валидация */ },
});
```

### 2. Обратная совместимость

Старый код продолжает работать без изменений:

```typescript
const form = new GroupNode({
  email: { value: '', component: Input },
});
```

### 3. TypeScript автоматически определяет тип

Благодаря перегрузкам, TypeScript знает, какой API используется:

```typescript
// TypeScript знает, что это DeepFormSchema<T>
new GroupNode({ email: { value: '', component: Input } });

// TypeScript знает, что это GroupNodeConfig<T>
new GroupNode({ form: { email: { value: '', component: Input } } });
```

### 4. Гибкость

Можно использовать только нужные схемы:

```typescript
// Только validation
new GroupNode({ form: { /* ... */ }, validation: (path) => { /* ... */ } });

// Только behavior
new GroupNode({ form: { /* ... */ }, behavior: (path) => { /* ... */ } });

// Обе схемы
new GroupNode({
  form: { /* ... */ },
  behavior: (path) => { /* ... */ },
  validation: (path) => { /* ... */ }
});
```

## Сравнение с другими вариантами

### Вариант 1: Объект с отдельными свойствами

```typescript
new GroupNode({
  form: { /* ... */ },
  behavior: (path) => { /* ... */ },
  validation: (path) => { /* ... */ },
})
```

**Проблема**: ❌ Breaking change - старый API не работает

### Вариант 2: Два параметра (schema + options)

```typescript
new GroupNode(
  { /* schema */ },
  { behavior: ..., validation: ... }
)
```

**Проблема**: ⚠️ Менее явный синтаксис

### Вариант 5: Перегрузки (реализовано)

```typescript
// Старый API
new GroupNode({ /* schema */ });

// Новый API
new GroupNode({ form: { /* ... */ }, behavior: ..., validation: ... });
```

**Преимущества**: ✅ Полная обратная совместимость, явный синтаксис

## Файлы

### Созданные

- [src/lib/forms/types/index.ts](../src/lib/forms/types/index.ts) - добавлен `GroupNodeConfig<T>`
- [src/examples/group-node-config-example.ts](../src/examples/group-node-config-example.ts) - 7 примеров использования

### Изменённые

- [src/lib/forms/core/nodes/group-node.ts](../src/lib/forms/core/nodes/group-node.ts) - обновлён конструктор с перегрузками
- [CLAUDE.md](../CLAUDE.md) - добавлена документация нового API

### Документация

- [docs/GROUP_NODE_CONSTRUCTOR_PROPOSALS.md](./GROUP_NODE_CONSTRUCTOR_PROPOSALS.md) - анализ 6 вариантов API
- [docs/GROUP_NODE_CONSTRUCTOR_OVERLOAD.md](./GROUP_NODE_CONSTRUCTOR_OVERLOAD.md) - текущий файл

## Тестирование

### TypeScript компиляция

```bash
npx tsc --noEmit
```

**Результат**: ✅ Успешно, без ошибок

### Примеры

Все 7 примеров в [src/examples/group-node-config-example.ts](../src/examples/group-node-config-example.ts) компилируются успешно.

## Заключение

Реализация **Варианта 5 с перегрузками конструктора** обеспечивает:

✅ **Полную обратную совместимость** - старый код работает без изменений
✅ **Декларативный синтаксис** - все схемы в одном месте
✅ **Автоматическое применение схем** - не нужно вызывать `.apply*()` вручную
✅ **TypeScript type safety** - автоматическое определение типа
✅ **Гибкость** - можно использовать только нужные схемы

**Дата реализации**: 2025-10-31
**Версия**: 1.0.0
