# Варианты API конструктора GroupNode

## Проблема

Текущий конструктор GroupNode принимает только схему формы. Нужно добавить возможность передачи:
1. **Form Schema** - структура полей
2. **Behavior Schema** - реактивное поведение (copyFrom, enableWhen и т.д.)
3. **Validation Schema** - правила валидации

## Требования

- ✅ Максимальное удобство использования
- ✅ Гибкость (все схемы опциональны)
- ✅ Type-safe (полная поддержка TypeScript)
- ✅ Читаемый код
- ✅ Обратная совместимость (по возможности)
- ✅ Минимум boilerplate

---

## Вариант 1: Объект с отдельными свойствами

### API

```typescript
new GroupNode<T>({
  form: { /* form schema */ },
  behavior?: (path) => { /* behavior schema */ },
  validation?: (path) => { /* validation schema */ },
})
```

### Пример использования

```typescript
const loginForm = new GroupNode({
  form: {
    email: { value: '', component: Input },
    password: { value: '', component: Input },
  },
  behavior: (path) => {
    // Автоматически обрезаем пробелы в email
    computeFrom(
      path.email,
      [path.email],
      (values) => values[0]?.trim()
    );
  },
  validation: (path) => {
    required(path.email, { message: 'Email обязателен' });
    email(path.email);
    required(path.password);
    minLength(path.password, 8);
  },
});
```

### Преимущества ✅

- Явное разделение схем
- Все в одном месте
- Легко понять структуру
- Схемы применяются автоматически

### Недостатки ❌

- **BREAKING CHANGE** - не совместимо с текущим API
- Нужно оборачивать в `form: {}`
- Больше вложенности

---

## Вариант 2: Два параметра (schema + options)

### API

```typescript
new GroupNode<T>(
  formSchema: DeepFormSchema<T>,
  options?: {
    behavior?: BehaviorSchemaFn<T>;
    validation?: ValidationSchemaFn<T>;
  }
)
```

### Пример использования

```typescript
const loginForm = new GroupNode(
  {
    email: { value: '', component: Input },
    password: { value: '', component: Input },
  },
  {
    behavior: (path) => {
      computeFrom(path.email, [path.email], (v) => v[0]?.trim());
    },
    validation: (path) => {
      required(path.email);
      email(path.email);
      required(path.password);
      minLength(path.password, 8);
    },
  }
);
```

### Преимущества ✅

- ✅ **Обратная совместимость** - первый параметр не изменился
- Схемы опциональны
- Минимальная вложенность
- Привычный паттерн (config, options)

### Недостатки ❌

- Два параметра (не так явно, как объект)
- Options могут разрастись

---

## Вариант 3: Fluent API (Builder Pattern)

### API

```typescript
new GroupNode<T>(formSchema)
  .withBehavior((path) => { /* ... */ })
  .withValidation((path) => { /* ... */ })
```

### Пример использования

```typescript
const loginForm = new GroupNode({
  email: { value: '', component: Input },
  password: { value: '', component: Input },
})
  .withBehavior((path) => {
    computeFrom(path.email, [path.email], (v) => v[0]?.trim());
  })
  .withValidation((path) => {
    required(path.email);
    email(path.email);
    required(path.password);
    minLength(path.password, 8);
  });
```

### Преимущества ✅

- ✅ **Обратная совместимость** - конструктор не изменился
- Явное добавление схем
- Читаемый код (chain)
- Легко расширять (новые .withXxx() методы)

### Недостатки ❌

- Длинные цепочки методов
- Нужно возвращать `this` из каждого метода
- Не сразу видна полная структура

---

## Вариант 4: Статические фабрики

### API

```typescript
GroupNode.create<T>({
  form: { /* ... */ },
  behavior?: (path) => { /* ... */ },
  validation?: (path) => { /* ... */ },
})

// Или специализированные
GroupNode.createWithSchemas<T>(...)
```

### Пример использования

```typescript
const loginForm = GroupNode.create({
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

// Обратная совместимость через обычный конструктор
const simpleForm = new GroupNode({
  email: { value: '', component: Input },
});
```

### Преимущества ✅

- ✅ **Обратная совместимость** - старый конструктор остался
- Явное именование
- Все схемы в одном месте
- Можно создать несколько фабрик

### Недостатки ❌

- Два способа создания (new vs .create)
- Непонятно, какой использовать

---

## Вариант 5: Перегрузки конструктора

### API

```typescript
// Перегрузка 1: только form schema (обратная совместимость)
constructor(formSchema: DeepFormSchema<T>);

// Перегрузка 2: объект со всеми схемами
constructor(config: {
  form: DeepFormSchema<T>;
  behavior?: BehaviorSchemaFn<T>;
  validation?: ValidationSchemaFn<T>;
});
```

### Пример использования

```typescript
// Старый способ (работает)
const simpleForm = new GroupNode({
  email: { value: '', component: Input },
});

// Новый способ (со схемами)
const fullForm = new GroupNode({
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
  },
});
```

### Реализация

```typescript
constructor(
  schemaOrConfig:
    | DeepFormSchema<T>
    | {
        form: DeepFormSchema<T>;
        behavior?: BehaviorSchemaFn<T>;
        validation?: ValidationSchemaFn<T>;
      }
) {
  super();

  // Определяем, что передано
  const isNewAPI = 'form' in schemaOrConfig;
  const formSchema = isNewAPI ? schemaOrConfig.form : schemaOrConfig;
  const behaviorSchema = isNewAPI ? schemaOrConfig.behavior : undefined;
  const validationSchema = isNewAPI ? schemaOrConfig.validation : undefined;

  // Создаем поля
  this.initializeFields(formSchema);

  // Применяем схемы
  if (behaviorSchema) {
    this.applyBehaviorSchema(behaviorSchema);
  }
  if (validationSchema) {
    this.applyValidationSchema(validationSchema);
  }
}
```

### Преимущества ✅

- ✅ **Полная обратная совместимость**
- Один конструктор (не путаница)
- TypeScript автоматически определяет тип
- Гибкость: можно использовать оба способа

### Недостатки ❌

- Сложность определения типа внутри конструктора
- Нужен рантайм check (`'form' in schemaOrConfig`)

---

## Вариант 6: Комбинированный (рекомендуемый)

### API

Объединяет **Вариант 2** (два параметра) и **Вариант 3** (fluent API):

```typescript
// Способ 1: Через options
new GroupNode<T>(
  formSchema,
  {
    behavior?: BehaviorSchemaFn<T>,
    validation?: ValidationSchemaFn<T>,
  }
)

// Способ 2: Через fluent методы
new GroupNode<T>(formSchema)
  .withBehavior((path) => { /* ... */ })
  .withValidation((path) => { /* ... */ })

// Способ 3: Комбинация (behavior через options, validation через метод)
new GroupNode<T>(formSchema, { behavior: ... })
  .withValidation((path) => { /* ... */ })
```

### Пример использования

```typescript
// Простая форма (без схем)
const simpleForm = new GroupNode({
  email: { value: '', component: Input },
});

// Со схемами через options
const formWithOptions = new GroupNode(
  {
    email: { value: '', component: Input },
    password: { value: '', component: Input },
  },
  {
    behavior: (path) => {
      computeFrom(path.email, [path.email], (v) => v[0]?.trim());
    },
    validation: (path) => {
      required(path.email);
      email(path.email);
    },
  }
);

// Со схемами через fluent API
const formWithFluent = new GroupNode({
  email: { value: '', component: Input },
  password: { value: '', component: Input },
})
  .withBehavior((path) => {
    computeFrom(path.email, [path.email], (v) => v[0]?.trim());
  })
  .withValidation((path) => {
    required(path.email);
    email(path.email);
  });

// Комбинация (гибкость)
const formCombined = new GroupNode(
  {
    loanType: { value: '', component: Select },
    propertyValue: { value: null, component: Input },
  },
  {
    // Behavior в options
    behavior: (path) => {
      enableWhen(path.propertyValue, path.loanType, {
        condition: (type) => type === 'mortgage',
      });
    },
  }
)
  // Validation через fluent (добавляется позже)
  .withValidation((path) => {
    required(path.loanType);
    applyWhen(path.loanType, (type) => type === 'mortgage', () => {
      required(path.propertyValue);
    });
  });
```

### Реализация

```typescript
export class GroupNode<T extends Record<string, any> = any> extends FormNode<T> {
  constructor(
    schema: DeepFormSchema<T>,
    options?: {
      behavior?: BehaviorSchemaFn<T>;
      validation?: ValidationSchemaFn<T>;
    }
  ) {
    super();

    // Инициализация полей
    this.initializeFields(schema);

    // Применяем схемы из options
    if (options?.behavior) {
      this.applyBehaviorSchema(options.behavior);
    }
    if (options?.validation) {
      this.applyValidationSchema(options.validation);
    }
  }

  /**
   * Fluent метод для добавления behavior схемы
   */
  withBehavior(schemaFn: BehaviorSchemaFn<T>): this {
    this.applyBehaviorSchema(schemaFn);
    return this;
  }

  /**
   * Fluent метод для добавления validation схемы
   */
  withValidation(schemaFn: ValidationSchemaFn<T>): this {
    this.applyValidationSchema(schemaFn);
    return this;
  }
}
```

### Преимущества ✅

- ✅ **Полная обратная совместимость**
- ✅ **Максимальная гибкость** (3 способа)
- Читаемый код
- Легко добавлять новые схемы (новый .withXxx() метод)
- Options для "статичных" схем, fluent для "динамических"

### Недостатки ❌

- Может запутать начинающих (3 способа)
- Нужна хорошая документация

---

## Сравнительная таблица

| Вариант | Обратная совместимость | Гибкость | Читаемость | Простота | Рекомендация |
|---------|----------------------|----------|------------|----------|--------------|
| **1. Объект** | ❌ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ❌ Не рекомендуется |
| **2. Два параметра** | ✅ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Хорошо |
| **3. Fluent API** | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Хорошо |
| **4. Статические фабрики** | ✅ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ❌ Не рекомендуется |
| **5. Перегрузки** | ✅ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⚠️ Средне |
| **6. Комбинированный** | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅✅ **РЕКОМЕНДУЕТСЯ** |

---

## Рекомендация: Вариант 6 (Комбинированный)

### Почему?

1. **Обратная совместимость** - старый код работает без изменений
2. **Максимальная гибкость** - 3 способа на выбор:
   - Без схем (простые формы)
   - Через options (все схемы сразу)
   - Через fluent API (постепенное добавление)
3. **Читаемость** - каждый способ читается естественно
4. **Расширяемость** - легко добавить `.withXxx()` методы

### Примеры использования

#### Простая форма (без схем)

```typescript
const form = new GroupNode({
  email: { value: '', component: Input },
  password: { value: '', component: Input },
});
```

#### С behavior и validation через options

```typescript
const form = new GroupNode(
  {
    email: { value: '', component: Input },
    password: { value: '', component: Input },
  },
  {
    behavior: (path) => {
      computeFrom(path.email, [path.email], (v) => v[0]?.trim());
    },
    validation: (path) => {
      required(path.email);
      email(path.email);
      required(path.password);
      minLength(path.password, 8);
    },
  }
);
```

#### С behavior и validation через fluent API

```typescript
const form = new GroupNode({
  email: { value: '', component: Input },
  password: { value: '', component: Input },
})
  .withBehavior((path) => {
    computeFrom(path.email, [path.email], (v) => v[0]?.trim());
  })
  .withValidation((path) => {
    required(path.email);
    email(path.email);
    required(path.password);
    minLength(path.password, 8);
  });
```

#### Комбинация (максимальная гибкость)

```typescript
// Behavior сразу, validation добавляется позже
const form = new GroupNode(
  {
    loanType: { value: '', component: Select },
    propertyValue: { value: null, component: Input },
  },
  {
    behavior: (path) => {
      enableWhen(path.propertyValue, path.loanType, {
        condition: (type) => type === 'mortgage',
      });
    },
  }
);

// Позже добавляем validation (например, после загрузки правил с сервера)
form.withValidation((path) => {
  required(path.loanType);
  applyWhen(path.loanType, (type) => type === 'mortgage', () => {
    required(path.propertyValue);
  });
});
```

#### Вложенные формы с схемами

```typescript
const form = new GroupNode(
  {
    user: {
      firstName: { value: '', component: Input },
      lastName: { value: '', component: Input },
    },
    address: {
      city: { value: '', component: Input },
      street: { value: '', component: Input },
    },
  },
  {
    behavior: (path) => {
      // Автоматически генерируем fullName
      computeFrom(
        path.user.fullName,
        [path.user.firstName, path.user.lastName],
        (values) => `${values[0]} ${values[1]}`.trim()
      );
    },
    validation: (path) => {
      required(path.user.firstName);
      required(path.user.lastName);
      required(path.address.city);
    },
  }
);
```

---

## План реализации

### Шаг 1: Обновить конструктор GroupNode

```typescript
constructor(
  schema: DeepFormSchema<T>,
  options?: {
    behavior?: BehaviorSchemaFn<T>;
    validation?: ValidationSchemaFn<T>;
  }
) {
  super();

  // Инициализация полей (существующий код)
  this.initializeFields(schema);

  // Применяем схемы из options (новый код)
  if (options?.behavior) {
    this.applyBehaviorSchema(options.behavior);
  }
  if (options?.validation) {
    this.applyValidationSchema(options.validation);
  }
}
```

### Шаг 2: Добавить fluent методы

```typescript
/**
 * Применяет behavior схему
 * @returns this для цепочки вызовов
 */
withBehavior(schemaFn: BehaviorSchemaFn<T>): this {
  this.applyBehaviorSchema(schemaFn);
  return this;
}

/**
 * Применяет validation схему
 * @returns this для цепочки вызовов
 */
withValidation(schemaFn: ValidationSchemaFn<T>): this {
  this.applyValidationSchema(schemaFn);
  return this;
}
```

### Шаг 3: Обновить типы

```typescript
export interface GroupNodeOptions<T> {
  /** Схема поведения формы */
  behavior?: BehaviorSchemaFn<T>;

  /** Схема валидации формы */
  validation?: ValidationSchemaFn<T>;
}
```

### Шаг 4: Обновить документацию

- Обновить [CLAUDE.md](../CLAUDE.md)
- Обновить примеры в [src/examples/](../src/examples/)
- Добавить примеры в README

### Шаг 5: Написать тесты

- Тесты для options API
- Тесты для fluent API
- Тесты для комбинации обоих способов

---

## Альтернативные имена методов

Если `.withBehavior()` и `.withValidation()` кажутся длинными:

```typescript
// Вариант 1: короткие имена
.behavior((path) => { /* ... */ })
.validation((path) => { /* ... */ })

// Вариант 2: глагольные имена
.applyBehavior((path) => { /* ... */ })
.applyValidation((path) => { /* ... */ })

// Вариант 3: set префикс
.setBehavior((path) => { /* ... */ })
.setValidation((path) => { /* ... */ })

// Вариант 4: use префикс (как React hooks)
.useBehavior((path) => { /* ... */ })
.useValidation((path) => { /* ... */ })
```

**Рекомендация**: `.withBehavior()` и `.withValidation()` - стандартный паттерн builder.

---

## Заключение

**Рекомендуемый вариант: Комбинированный (Вариант 6)**

```typescript
// Поддерживает все эти паттерны:

// 1. Простая форма (обратная совместимость)
new GroupNode({ email: { value: '', component: Input } })

// 2. С options
new GroupNode(schema, { behavior, validation })

// 3. С fluent API
new GroupNode(schema).withBehavior(...).withValidation(...)

// 4. Комбинация
new GroupNode(schema, { behavior }).withValidation(...)
```

Этот подход обеспечивает:
- ✅ Полную обратную совместимость
- ✅ Максимальную гибкость
- ✅ Отличную читаемость
- ✅ Простоту использования
