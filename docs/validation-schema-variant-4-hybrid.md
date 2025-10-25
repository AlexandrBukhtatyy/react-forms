# Вариант 4: Hybrid Approach (Гибридный подход)

## Концепция

Комбинирует лучшие черты всех подходов: декларативность Варианта 1, выразительность Варианта 2, и возможность интеграции с Zod/Yup из Варианта 3. Предоставляет максимальную гибкость разработчику.

## Преимущества

- ✅ Максимальная гибкость - используйте любой подход
- ✅ Постепенное внедрение - начните с простого, усложняйте при необходимости
- ✅ Совместимость - работает с существующим кодом
- ✅ Расширяемость - легко добавлять новые возможности
- ✅ Выбор инструмента под задачу
- ✅ Унифицированный API

## Недостатки

- ⚠️ Более сложная реализация (4-5 дней)
- ⚠️ Больше API для изучения
- ⚠️ Требует хорошей документации
- ⚠️ Может привести к разным стилям в команде

## API Design

### Унифицированный тип ValidationSchema

```typescript
// Универсальная схема валидации поддерживает все подходы
type FormValidationSchema<T extends Record<string, any>> =
  // Вариант 1: Декларативная схема
  | DeclarativeSchema<T>
  // Вариант 2: Функциональный билдер
  | FunctionalSchema<T>
  // Вариант 3: Zod/Yup
  | ExternalSchema<T>
  // Вариант 4: Комбинация
  | HybridSchema<T>;

// Декларативная схема
interface DeclarativeSchema<T> {
  type: 'declarative';
  schema: {
    [K in keyof T]?: FieldValidationRule<T[K]>;
  } & {
    _form?: FormLevelValidation<T>;
  };
}

// Функциональная схема
interface FunctionalSchema<T> {
  type: 'functional';
  builder: (path: FieldPath<T>, schema: SchemaBuilder<T>) => void;
}

// Внешняя схема (Zod/Yup)
interface ExternalSchema<T> {
  type: 'external';
  library: 'zod' | 'yup' | 'vest';
  schema: any;
  adapter?: SchemaAdapter<T>;
}

// Гибридная схема
interface HybridSchema<T> {
  type: 'hybrid';
  schemas: Array<
    DeclarativeSchema<T> | FunctionalSchema<T> | ExternalSchema<T>
  >;
  mergeStrategy?: 'override' | 'merge' | 'compose';
}
```

### Использование: Простой декларативный подход

```typescript
const validationSchema = createValidationSchema<UserFormModel>({
  type: 'declarative',
  schema: {
    username: {
      validators: [
        Validators.required('Имя пользователя обязательно'),
        Validators.minLength(3, 'Минимум 3 символа'),
      ],
    },
    email: {
      validators: [
        Validators.required('Email обязателен'),
        Validators.email('Некорректный email'),
      ],
    },
  },
});

const form = new FormStore(fieldSchema, validationSchema);
```

### Использование: Функциональный DSL

```typescript
const validationSchema = createValidationSchema<UserFormModel>({
  type: 'functional',
  builder: (path, schema) => {
    schema.required(path.username, { message: 'Имя пользователя обязательно' });
    schema.minLength(path.username, 3);
    schema.email(path.email);
    schema.validateTree((ctx) => {
      const values = ctx.formValue();
      if (values.password !== values.confirmPassword) {
        return { code: 'mismatch', message: 'Пароли не совпадают' };
      }
      return null;
    }, { targetField: 'confirmPassword' });
  },
});

const form = new FormStore(fieldSchema, validationSchema);
```

### Использование: Zod интеграция

```typescript
const zodSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8),
});

const validationSchema = createValidationSchema<UserFormModel>({
  type: 'external',
  library: 'zod',
  schema: zodSchema,
});

const form = new FormStore(fieldSchema, validationSchema);
```

### Использование: Гибридный подход

```typescript
// Комбинируем Zod для базовой валидации + кастомные правила
const validationSchema = createValidationSchema<UserFormModel>({
  type: 'hybrid',
  schemas: [
    // Базовая валидация через Zod
    {
      type: 'external',
      library: 'zod',
      schema: z.object({
        username: z.string().min(3).max(20),
        email: z.string().email(),
        password: z.string().min(8),
      }),
    },

    // Дополнительная асинхронная валидация
    {
      type: 'declarative',
      schema: {
        username: {
          asyncValidators: [checkUsernameAvailability],
          updateOn: 'blur',
        },
        email: {
          asyncValidators: [checkEmailAvailability],
        },
      },
    },

    // Кросс-филд валидация через билдер
    {
      type: 'functional',
      builder: (path, schema) => {
        schema.validateTree((ctx) => {
          const values = ctx.formValue();
          if (values.password !== values.confirmPassword) {
            return { code: 'mismatch', message: 'Пароли не совпадают' };
          }
          return null;
        }, { targetField: 'confirmPassword' });
      },
    },
  ],
  mergeStrategy: 'compose', // Все валидаторы применяются последовательно
});

const form = new FormStore(fieldSchema, validationSchema);
```

## Расширенные возможности

### 1. Условная валидация с разными подходами

```typescript
const validationSchema = createValidationSchema<UserFormModel>({
  type: 'hybrid',
  schemas: [
    // Базовая валидация
    {
      type: 'declarative',
      schema: {
        country: {
          validators: [Validators.required()],
        },
      },
    },

    // Условная валидация через билдер
    {
      type: 'functional',
      builder: (path, schema) => {
        // Если выбрана Россия, требуем город
        schema.applyWhenValue(
          path.country,
          (value) => value === 'Russia',
          (schema) => schema.required(path.city, { message: 'Укажите город' })
        );

        // Если выбраны США, требуем ZIP
        schema.applyWhenValue(
          path.country,
          (value) => value === 'USA',
          (schema) => schema.required(path.zipCode, { message: 'Укажите ZIP' })
        );
      },
    },
  ],
});
```

### 2. Переиспользование схем

```typescript
// Базовая схема аутентификации (переиспользуемая)
const authBaseSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Схема регистрации расширяет базовую
const registrationSchema = createValidationSchema<RegistrationFormModel>({
  type: 'hybrid',
  schemas: [
    // Используем базовую схему
    {
      type: 'external',
      library: 'zod',
      schema: authBaseSchema.extend({
        username: z.string().min(3).max(20),
        confirmPassword: z.string(),
        acceptTerms: z.boolean(),
      }),
    },

    // Добавляем специфичные для регистрации правила
    {
      type: 'declarative',
      schema: {
        username: {
          asyncValidators: [checkUsernameAvailability],
        },
      },
    },

    // Валидация совпадения паролей
    {
      type: 'functional',
      builder: (path, schema) => {
        schema.validateTree((ctx) => {
          const values = ctx.formValue();
          if (values.password !== values.confirmPassword) {
            return { code: 'mismatch', message: 'Пароли не совпадают' };
          }
          return null;
        }, { targetField: 'confirmPassword' });
      },
    },
  ],
});
```

### 3. Композиция валидаторов

```typescript
// Создаем переиспользуемые валидаторы
const usernameValidation = createValidationSchema<{ username: string }>({
  type: 'declarative',
  schema: {
    username: {
      validators: [
        Validators.required(),
        Validators.minLength(3),
        Validators.maxLength(20),
      ],
      asyncValidators: [checkUsernameAvailability],
    },
  },
});

const emailValidation = createValidationSchema<{ email: string }>({
  type: 'declarative',
  schema: {
    email: {
      validators: [Validators.required(), Validators.email()],
      asyncValidators: [checkEmailAvailability],
    },
  },
});

const passwordValidation = createValidationSchema<{
  password: string;
  confirmPassword: string;
}>({
  type: 'hybrid',
  schemas: [
    {
      type: 'declarative',
      schema: {
        password: {
          validators: [
            Validators.required(),
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
          ],
        },
      },
    },
    {
      type: 'functional',
      builder: (path, schema) => {
        schema.validateTree((ctx) => {
          const values = ctx.formValue();
          if (values.password !== values.confirmPassword) {
            return { code: 'mismatch', message: 'Пароли не совпадают' };
          }
          return null;
        }, { targetField: 'confirmPassword' });
      },
    },
  ],
});

// Комбинируем все вместе
const registrationValidation = composeValidationSchemas(
  usernameValidation,
  emailValidation,
  passwordValidation,
  createValidationSchema({
    type: 'declarative',
    schema: {
      acceptTerms: {
        validators: [
          (value) =>
            value === true ? null : { code: 'required', message: 'Примите условия' },
        ],
      },
    },
  })
);

const form = new FormStore(fieldSchema, registrationValidation);
```

### 4. Динамическая валидация

```typescript
// Схема может меняться в runtime
class DynamicFormStore<T extends Record<string, any>> extends FormStore<T> {
  updateValidationSchema(newSchema: FormValidationSchema<T>): void {
    this.applyValidationSchema(newSchema);
    this.validate(); // Перепроверяем форму
  }

  addFieldValidation<K extends keyof T>(
    field: K,
    validator: ValidatorFn<T[K]>
  ): void {
    const control = this.controls[field];
    control.addValidator(validator);
  }

  removeFieldValidation<K extends keyof T>(
    field: K,
    validator: ValidatorFn<T[K]>
  ): void {
    const control = this.controls[field];
    control.removeValidator(validator);
  }
}

// Использование
const form = new DynamicFormStore(fieldSchema, baseValidationSchema);

// Динамически добавляем правило
form.addFieldValidation('age', Validators.min(21)); // Например, изменились требования

// Динамически меняем всю схему
form.updateValidationSchema(newValidationSchema);
```

## Реализация

### Фабрика схем валидации

```typescript
export function createValidationSchema<T extends Record<string, any>>(
  config:
    | DeclarativeSchema<T>
    | FunctionalSchema<T>
    | ExternalSchema<T>
    | HybridSchema<T>
): CompiledValidationSchema<T> {
  const compiler = new ValidationSchemaCompiler<T>();
  return compiler.compile(config);
}
```

### Компилятор схем

```typescript
class ValidationSchemaCompiler<T extends Record<string, any>> {
  compile(
    config:
      | DeclarativeSchema<T>
      | FunctionalSchema<T>
      | ExternalSchema<T>
      | HybridSchema<T>
  ): CompiledValidationSchema<T> {
    switch (config.type) {
      case 'declarative':
        return this.compileDeclarative(config);

      case 'functional':
        return this.compileFunctional(config);

      case 'external':
        return this.compileExternal(config);

      case 'hybrid':
        return this.compileHybrid(config);

      default:
        throw new Error('Unknown schema type');
    }
  }

  private compileDeclarative(
    config: DeclarativeSchema<T>
  ): CompiledValidationSchema<T> {
    // Преобразуем декларативную схему в compiled format
    const fieldValidators = new Map<keyof T, CompiledFieldValidation>();

    for (const [field, rule] of Object.entries(config.schema)) {
      if (field === '_form') continue;

      fieldValidators.set(field as keyof T, {
        syncValidators: rule.validators || [],
        asyncValidators: rule.asyncValidators || [],
        crossFieldValidators: rule.crossFieldValidators || [],
        updateOn: rule.updateOn || 'change',
      });
    }

    return {
      fieldValidators,
      formValidators: config.schema._form?.validators || [],
      formAsyncValidators: config.schema._form?.asyncValidators || [],
    };
  }

  private compileFunctional(
    config: FunctionalSchema<T>
  ): CompiledValidationSchema<T> {
    // Выполняем билдер и получаем правила
    const builder = new SchemaBuilderImpl<T>();
    const path = createFieldPath<T>();
    config.builder(path, builder);

    return builder.compile();
  }

  private compileExternal(
    config: ExternalSchema<T>
  ): CompiledValidationSchema<T> {
    // Используем адаптер для библиотеки
    const adapter =
      config.adapter ||
      this.createDefaultAdapter(config.library, config.schema);

    return adapter.compile();
  }

  private compileHybrid(
    config: HybridSchema<T>
  ): CompiledValidationSchema<T> {
    // Компилируем каждую схему и объединяем
    const compiledSchemas = config.schemas.map((schema) =>
      this.compile(schema)
    );

    return this.mergeSchemas(compiledSchemas, config.mergeStrategy || 'compose');
  }

  private mergeSchemas(
    schemas: CompiledValidationSchema<T>[],
    strategy: 'override' | 'merge' | 'compose'
  ): CompiledValidationSchema<T> {
    switch (strategy) {
      case 'override':
        // Последняя схема переопределяет предыдущие
        return schemas[schemas.length - 1];

      case 'merge':
        // Объединяем без дублирования
        return this.mergeUnique(schemas);

      case 'compose':
        // Все валидаторы применяются последовательно
        return this.composeAll(schemas);

      default:
        throw new Error('Unknown merge strategy');
    }
  }

  private composeAll(
    schemas: CompiledValidationSchema<T>[]
  ): CompiledValidationSchema<T> {
    const result: CompiledValidationSchema<T> = {
      fieldValidators: new Map(),
      formValidators: [],
      formAsyncValidators: [],
    };

    // Объединяем валидаторы полей
    for (const schema of schemas) {
      for (const [field, validation] of schema.fieldValidators) {
        if (!result.fieldValidators.has(field)) {
          result.fieldValidators.set(field, {
            syncValidators: [],
            asyncValidators: [],
            crossFieldValidators: [],
            updateOn: 'change',
          });
        }

        const existing = result.fieldValidators.get(field)!;
        existing.syncValidators.push(...validation.syncValidators);
        existing.asyncValidators.push(...validation.asyncValidators);
        existing.crossFieldValidators.push(...validation.crossFieldValidators);
      }

      // Объединяем валидаторы формы
      result.formValidators.push(...schema.formValidators);
      result.formAsyncValidators.push(...schema.formAsyncValidators);
    }

    return result;
  }

  private createDefaultAdapter(
    library: 'zod' | 'yup' | 'vest',
    schema: any
  ): SchemaAdapter<T> {
    switch (library) {
      case 'zod':
        return new ZodAdapter(schema);
      case 'yup':
        return new YupAdapter(schema);
      case 'vest':
        return new VestAdapter(schema);
      default:
        throw new Error(`Unsupported library: ${library}`);
    }
  }
}
```

### Композиция схем

```typescript
export function composeValidationSchemas<T extends Record<string, any>>(
  ...schemas: Array<FormValidationSchema<Partial<T>>>
): CompiledValidationSchema<T> {
  const compiler = new ValidationSchemaCompiler<T>();

  const compiledSchemas = schemas.map((schema) =>
    compiler.compile(schema as any)
  );

  return compiler['composeAll'](compiledSchemas);
}
```

## Тестирование

### Тесты гибридной схемы

```typescript
describe('Hybrid ValidationSchema', () => {
  it('должен комбинировать Zod и декларативную схему', async () => {
    const schema = createValidationSchema<UserFormModel>({
      type: 'hybrid',
      schemas: [
        {
          type: 'external',
          library: 'zod',
          schema: z.object({
            username: z.string().min(3),
          }),
        },
        {
          type: 'declarative',
          schema: {
            username: {
              asyncValidators: [checkUsernameAvailability],
            },
          },
        },
      ],
    });

    const form = new FormStore(fieldSchema, schema);

    form.controls.username.setValue('ab'); // Zod validation fails
    await form.validate();
    expect(form.controls.username.invalid).toBe(true);

    form.controls.username.setValue('taken_name'); // Async validation fails
    await form.validate();
    expect(form.controls.username.invalid).toBe(true);

    form.controls.username.setValue('valid_unique_name');
    await form.validate();
    expect(form.controls.username.valid).toBe(true);
  });

  it('должен применять условную валидацию из разных источников', async () => {
    const schema = createValidationSchema<AddressFormModel>({
      type: 'hybrid',
      schemas: [
        {
          type: 'external',
          library: 'zod',
          schema: z.object({
            country: z.string(),
            city: z.string().optional(),
          }),
        },
        {
          type: 'functional',
          builder: (path, schema) => {
            schema.applyWhenValue(
              path.country,
              (value) => value === 'Russia',
              (schema) => schema.required(path.city)
            );
          },
        },
      ],
    });

    const form = new FormStore(fieldSchema, schema);

    form.controls.country.setValue('USA');
    await form.validate();
    expect(form.controls.city.valid).toBe(true); // Город не обязателен

    form.controls.country.setValue('Russia');
    await form.validate();
    expect(form.controls.city.invalid).toBe(true); // Город обязателен
  });
});
```

## Преимущества каждого подхода в Hybrid

| Подход | Когда использовать | Пример |
|--------|-------------------|---------|
| **Declarative** | Простая валидация полей | `{ username: { validators: [...] } }` |
| **Functional** | Кросс-филд, условная валидация | `schema.validateTree(...)` |
| **External (Zod)** | Сложная типизация, трансформация | `z.object({...}).refine(...)` |
| **Hybrid** | Комбинация требований | Zod для базы + async для API |

## Примеры использования

### Пример 1: Простая форма (Declarative)

```typescript
// Для простых случаев используем декларативный подход
const schema = createValidationSchema<LoginFormModel>({
  type: 'declarative',
  schema: {
    email: {
      validators: [Validators.required(), Validators.email()],
    },
    password: {
      validators: [Validators.required(), Validators.minLength(8)],
    },
  },
});
```

### Пример 2: Форма с кросс-филд валидацией (Functional)

```typescript
// Для кросс-филд валидации используем функциональный подход
const schema = createValidationSchema<PasswordChangeFormModel>({
  type: 'functional',
  builder: (path, schema) => {
    schema.required(path.oldPassword);
    schema.required(path.newPassword);
    schema.minLength(path.newPassword, 8);

    schema.validateTree((ctx) => {
      const values = ctx.formValue();
      if (values.newPassword === values.oldPassword) {
        return {
          code: 'same',
          message: 'Новый пароль должен отличаться от старого',
        };
      }
      return null;
    }, { targetField: 'newPassword' });
  },
});
```

### Пример 3: Типобезопасная форма (Zod)

```typescript
// Для максимальной типобезопасности используем Zod
const zodSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18).max(100),
  country: z.enum(['USA', 'Russia', 'Germany']),
});

const schema = createValidationSchema({
  type: 'external',
  library: 'zod',
  schema: zodSchema,
});

// Тип автоматически выводится из схемы
type FormModel = z.infer<typeof zodSchema>;
```

### Пример 4: Комплексная форма (Hybrid)

```typescript
// Для сложных форм комбинируем подходы
const schema = createValidationSchema<RegistrationFormModel>({
  type: 'hybrid',
  schemas: [
    // Базовая валидация через Zod (типобезопасность + трансформация)
    {
      type: 'external',
      library: 'zod',
      schema: z.object({
        username: z.string().min(3).max(20),
        email: z.string().email().transform(v => v.toLowerCase()),
        password: z.string().min(8),
        confirmPassword: z.string(),
        age: z.number().min(18),
        country: z.string(),
        city: z.string().optional(),
      }),
    },

    // Асинхронная валидация уникальности
    {
      type: 'declarative',
      schema: {
        username: {
          asyncValidators: [checkUsernameAvailability],
          updateOn: 'blur',
        },
        email: {
          asyncValidators: [checkEmailAvailability],
          updateOn: 'blur',
        },
      },
    },

    // Сложная кросс-филд и условная валидация
    {
      type: 'functional',
      builder: (path, schema) => {
        // Проверка совпадения паролей
        schema.validateTree((ctx) => {
          const values = ctx.formValue();
          if (values.password !== values.confirmPassword) {
            return { code: 'mismatch', message: 'Пароли не совпадают' };
          }
          return null;
        }, { targetField: 'confirmPassword' });

        // Условная валидация города
        schema.applyWhenValue(
          path.country,
          (value) => value === 'Russia',
          (schema) => schema.required(path.city, { message: 'Укажите город' })
        );

        // Дополнительные требования для несовершеннолетних
        schema.applyWhenValue(
          path.age,
          (age) => age < 18,
          (schema) => schema.minLength(path.username, 5, {
            message: 'Для несовершеннолетних требуется имя не короче 5 символов',
          })
        );
      },
    },
  ],
  mergeStrategy: 'compose',
});
```

## Сложность реализации

- **Время**: 4-5 дней
- **Изменения**:
  - Объединение всех трех предыдущих вариантов
  - Новый класс: `ValidationSchemaCompiler`
  - Новые функции: `createValidationSchema`, `composeValidationSchemas`
  - Адаптеры для Zod/Yup/Vest
  - Система мержинга схем
  - Расширенная документация
- **Тестирование**: Комплексное, но переиспользует тесты из предыдущих вариантов

## Рекомендации

Этот вариант подходит, если:
- ✅ Нужна максимальная гибкость
- ✅ Разные части формы имеют разные требования
- ✅ Команда имеет разный уровень экспертизы
- ✅ Проект будет развиваться и усложняться
- ✅ Хотите возможность постепенной миграции
- ✅ Важна расширяемость системы
- ✅ Можно выделить время на более сложную реализацию

**Рекомендуется для крупных проектов** с разнообразными требованиями к валидации.
