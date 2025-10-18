# Вариант 2: Functional Builder Schema (Angular-подобный)

## Концепция

Схема валидации задается через функцию-билдер с использованием DSL (Domain Specific Language), похожего на Angular Signal Forms. Использует паттерн "path" для доступа к полям.

## Преимущества

- ✅ Максимально похож на Angular Signal Forms
- ✅ Выразительный DSL синтаксис
- ✅ Отличная поддержка условной валидации
- ✅ Легко добавлять новые правила валидации
- ✅ Хорошая читаемость для сложных схем
- ✅ Type-safe благодаря TypeScript

## Недостатки

- ⚠️ Более сложная реализация (3-4 дня)
- ⚠️ Требует создания DSL инфраструктуры
- ⚠️ Может быть непривычен для разработчиков, не знакомых с Angular

## API Design

### Типы

```typescript
// Путь к полю формы (для типобезопасности)
type FieldPath<T> = {
  [K in keyof T]: {
    key: K;
    _type: T[K];
  };
};

// Контекст валидации
interface ValidationContext<T = any> {
  value: () => T;
  formValue: () => Record<string, any>;
  getField: <K extends keyof any>(key: K) => any;
}

// Билдер схемы
interface SchemaBuilder<T extends Record<string, any>> {
  // Built-in validators
  required<K extends keyof T>(
    path: FieldPath<T>[K],
    options?: { message?: string }
  ): SchemaBuilder<T>;

  minLength<K extends keyof T>(
    path: FieldPath<T>[K],
    length: number,
    options?: { message?: string }
  ): SchemaBuilder<T>;

  maxLength<K extends keyof T>(
    path: FieldPath<T>[K],
    length: number,
    options?: { message?: string }
  ): SchemaBuilder<T>;

  email<K extends keyof T>(
    path: FieldPath<T>[K],
    options?: { message?: string }
  ): SchemaBuilder<T>;

  pattern<K extends keyof T>(
    path: FieldPath<T>[K],
    regex: RegExp,
    options?: { message?: string }
  ): SchemaBuilder<T>;

  min<K extends keyof T>(
    path: FieldPath<T>[K],
    value: number,
    options?: { message?: string }
  ): SchemaBuilder<T>;

  max<K extends keyof T>(
    path: FieldPath<T>[K],
    value: number,
    options?: { message?: string }
  ): SchemaBuilder<T>;

  // Custom validator
  validate<K extends keyof T>(
    path: FieldPath<T>[K],
    validator: (ctx: ValidationContext<T[K]>) => ValidationError | null,
    options?: { message?: string }
  ): SchemaBuilder<T>;

  // Async validator
  validateAsync<K extends keyof T>(
    path: FieldPath<T>[K],
    validator: (
      ctx: ValidationContext<T[K]>
    ) => Promise<ValidationError | null>,
    options?: { debounce?: number }
  ): SchemaBuilder<T>;

  // Cross-field validation
  validateTree(
    validator: (ctx: ValidationContext<T>) => ValidationError | null,
    options?: { targetField?: keyof T }
  ): SchemaBuilder<T>;

  // Conditional validation
  applyWhenValue<K extends keyof T>(
    path: FieldPath<T>[K],
    condition: (value: T[K]) => boolean,
    builder: (schema: SchemaBuilder<T>) => SchemaBuilder<T>
  ): SchemaBuilder<T>;

  // Update strategy
  updateOn<K extends keyof T>(
    path: FieldPath<T>[K],
    strategy: 'change' | 'blur' | 'submit'
  ): SchemaBuilder<T>;
}

// Функция для создания схемы
type FormValidationSchema<T extends Record<string, any>> = (
  path: FieldPath<T>,
  builder: SchemaBuilder<T>
) => void;
```

### Использование

```typescript
import { FormStore, formSchema } from './forms';

interface UserFormModel {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
  country: string;
  city: string;
  acceptTerms: boolean;
}

// Создаем схему валидации (Angular-стиль)
const userValidationSchema: FormValidationSchema<UserFormModel> = (
  path,
  schema
) => {
  // Required fields
  schema.required(path.username, { message: 'Имя пользователя обязательно' });
  schema.required(path.email, { message: 'Email обязателен' });
  schema.required(path.password, { message: 'Пароль обязателен' });
  schema.required(path.confirmPassword, { message: 'Подтвердите пароль' });
  schema.required(path.age, { message: 'Возраст обязателен' });
  schema.required(path.acceptTerms, { message: 'Примите условия' });

  // String validators
  schema.minLength(path.username, 3, { message: 'Минимум 3 символа' });
  schema.maxLength(path.username, 20, { message: 'Максимум 20 символов' });

  // Email validator
  schema.email(path.email);

  // Password validators
  schema.minLength(path.password, 8, { message: 'Минимум 8 символов' });
  schema.pattern(path.password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Должен содержать буквы и цифры',
  });

  // Number validators
  schema.min(path.age, 18, { message: 'Минимальный возраст: 18' });
  schema.max(path.age, 100, { message: 'Максимальный возраст: 100' });

  // Custom validator
  schema.validate(path.username, (ctx) => {
    const value = ctx.value();
    if (value.includes(' ')) {
      return {
        code: 'noSpaces',
        message: 'Имя пользователя не должно содержать пробелы',
      };
    }
    return null;
  });

  // Async validator (проверка уникальности)
  schema.validateAsync(
    path.username,
    async (ctx) => {
      const value = ctx.value();
      const exists = await checkUsernameExists(value);
      if (exists) {
        return {
          code: 'usernameExists',
          message: 'Это имя уже занято',
        };
      }
      return null;
    },
    { debounce: 500 }
  );

  // Update strategy
  schema.updateOn(path.email, 'blur'); // Проверять только при потере фокуса

  // Cross-field validation (проверка совпадения паролей)
  schema.validateTree(
    (ctx) => {
      const formValue = ctx.formValue();
      if (formValue.password !== formValue.confirmPassword) {
        return {
          code: 'passwordMismatch',
          message: 'Пароли не совпадают',
        };
      }
      return null;
    },
    { targetField: 'confirmPassword' } // Ошибка будет показана на поле confirmPassword
  );

  // Conditional validation (город обязателен только для России)
  schema.applyWhenValue(path.country, (value) => value === 'Russia', (schema) =>
    schema.required(path.city, { message: 'Укажите город для России' })
  );

  // Complex conditional validation
  schema.applyWhenValue(path.age, (age) => age < 18, (schema) => {
    schema.minLength(path.username, 5, {
      message: 'Для несовершеннолетних требуется имя не короче 5 символов',
    });
  });
};

// Создаем форму с валидацией
const form = new FormStore<UserFormModel>(
  {
    username: { value: '', component: InputText },
    email: { value: '', component: InputText },
    password: { value: '', component: InputPassword },
    confirmPassword: { value: '', component: InputPassword },
    age: { value: 18, component: InputNumber },
    country: { value: '', component: Select },
    city: { value: '', component: InputText },
    acceptTerms: { value: false, component: Checkbox },
  },
  userValidationSchema
);
```

### Альтернативный синтаксис (цепочки методов)

```typescript
const userValidationSchema = formSchema<UserFormModel>((path) => ({
  username: schema =>
    schema
      .required({ message: 'Имя пользователя обязательно' })
      .minLength(3)
      .maxLength(20)
      .custom((value) => !value.includes(' ') || 'Без пробелов')
      .asyncValidate(checkUsernameAvailability, { debounce: 500 }),

  email: schema =>
    schema
      .required()
      .email()
      .updateOn('blur')
      .asyncValidate(checkEmailAvailability),

  password: schema =>
    schema
      .required()
      .minLength(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Должен содержать буквы и цифры'),

  confirmPassword: schema =>
    schema
      .required()
      .matches('password', 'Пароли не совпадают'), // Helper для cross-field

  age: schema =>
    schema
      .required()
      .min(18)
      .max(100),

  acceptTerms: schema =>
    schema.required().custom((value) => value === true || 'Примите условия'),
}));
```

## Реализация

### SchemaBuilder класс

```typescript
class SchemaBuilderImpl<T extends Record<string, any>>
  implements SchemaBuilder<T>
{
  private rules: Map<keyof T, ValidationRule[]> = new Map();
  private treeRules: TreeValidationRule[] = [];
  private conditionalRules: ConditionalRule<T>[] = [];
  private updateStrategies: Map<keyof T, 'change' | 'blur' | 'submit'> =
    new Map();

  required<K extends keyof T>(
    path: FieldPath<T>[K],
    options?: { message?: string }
  ): SchemaBuilder<T> {
    this.addRule(path.key, {
      type: 'sync',
      validator: Validators.required(options?.message),
    });
    return this;
  }

  minLength<K extends keyof T>(
    path: FieldPath<T>[K],
    length: number,
    options?: { message?: string }
  ): SchemaBuilder<T> {
    this.addRule(path.key, {
      type: 'sync',
      validator: Validators.minLength(length, options?.message),
    });
    return this;
  }

  validate<K extends keyof T>(
    path: FieldPath<T>[K],
    validator: (ctx: ValidationContext<T[K]>) => ValidationError | null,
    options?: { message?: string }
  ): SchemaBuilder<T> {
    this.addRule(path.key, {
      type: 'sync',
      validator: (value: T[K], formValue: T) => {
        const ctx: ValidationContext<T[K]> = {
          value: () => value,
          formValue: () => formValue,
          getField: (key) => formValue[key],
        };
        return validator(ctx);
      },
    });
    return this;
  }

  validateAsync<K extends keyof T>(
    path: FieldPath<T>[K],
    validator: (
      ctx: ValidationContext<T[K]>
    ) => Promise<ValidationError | null>,
    options?: { debounce?: number }
  ): SchemaBuilder<T> {
    this.addRule(path.key, {
      type: 'async',
      validator: async (value: T[K], formValue: T) => {
        const ctx: ValidationContext<T[K]> = {
          value: () => value,
          formValue: () => formValue,
          getField: (key) => formValue[key],
        };
        return await validator(ctx);
      },
      debounce: options?.debounce,
    });
    return this;
  }

  validateTree(
    validator: (ctx: ValidationContext<T>) => ValidationError | null,
    options?: { targetField?: keyof T }
  ): SchemaBuilder<T> {
    this.treeRules.push({
      validator,
      targetField: options?.targetField,
    });
    return this;
  }

  applyWhenValue<K extends keyof T>(
    path: FieldPath<T>[K],
    condition: (value: T[K]) => boolean,
    builder: (schema: SchemaBuilder<T>) => SchemaBuilder<T>
  ): SchemaBuilder<T> {
    this.conditionalRules.push({
      field: path.key,
      condition,
      builder,
    });
    return this;
  }

  updateOn<K extends keyof T>(
    path: FieldPath<T>[K],
    strategy: 'change' | 'blur' | 'submit'
  ): SchemaBuilder<T> {
    this.updateStrategies.set(path.key, strategy);
    return this;
  }

  private addRule(field: keyof T, rule: ValidationRule): void {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(rule);
  }

  // Метод для получения скомпилированных правил
  compile(): CompiledSchema<T> {
    return {
      fieldRules: this.rules,
      treeRules: this.treeRules,
      conditionalRules: this.conditionalRules,
      updateStrategies: this.updateStrategies,
    };
  }
}
```

### Создание path proxy

```typescript
function createFieldPath<T extends Record<string, any>>(): FieldPath<T> {
  return new Proxy({} as FieldPath<T>, {
    get: (_, prop: string | symbol) => {
      if (typeof prop === 'string') {
        return { key: prop, _type: undefined };
      }
      return undefined;
    },
  });
}
```

### Интеграция с FormStore

```typescript
export class FormStore<T extends Record<string, any>> {
  private compiledSchema?: CompiledSchema<T>;

  constructor(
    schema: FormSchema<T>,
    validationSchema?: FormValidationSchema<T>
  ) {
    this.fields = new Map();
    this._submitting = signal(false);

    // Компилируем схему валидации
    if (validationSchema) {
      const builder = new SchemaBuilderImpl<T>();
      const path = createFieldPath<T>();
      validationSchema(path, builder);
      this.compiledSchema = builder.compile();
    }

    // Создаем контроллеры с примененной валидацией
    for (const [key, config] of Object.entries(schema)) {
      const fieldRules = this.compiledSchema?.fieldRules.get(key as keyof T) || [];
      const updateStrategy =
        this.compiledSchema?.updateStrategies.get(key as keyof T) || 'change';

      const fieldConfig: FieldConfig<any> = {
        ...config,
        validators: [
          ...(config.validators || []),
          ...fieldRules
            .filter((r) => r.type === 'sync')
            .map((r) => (value: any) => r.validator(value, this.getValue())),
        ],
        asyncValidators: [
          ...(config.asyncValidators || []),
          ...fieldRules
            .filter((r) => r.type === 'async')
            .map(
              (r) => async (value: any) =>
                await r.validator(value, this.getValue())
            ),
        ],
        updateOn: updateStrategy,
      };

      this.fields.set(key as keyof T, new FieldController(fieldConfig));
    }

    // Применяем tree validators
    this.applyTreeValidators();

    this.value = computed(() => {
      const result = {} as T;
      this.fields.forEach((field, key) => {
        result[key] = field.value;
      });
      return result;
    });
  }

  private applyTreeValidators(): void {
    if (!this.compiledSchema?.treeRules) return;

    for (const rule of this.compiledSchema.treeRules) {
      const targetField = rule.targetField
        ? this.fields.get(rule.targetField)
        : null;

      if (targetField) {
        targetField.addCrossFieldValidator(() => {
          const ctx: ValidationContext<T> = {
            value: () => this.getValue(),
            formValue: () => this.getValue(),
            getField: (key) => this.getValue()[key],
          };
          return rule.validator(ctx);
        });
      }
    }
  }
}
```

## Тестирование

### Unit-тесты схемы

```typescript
describe('Functional ValidationSchema', () => {
  it('должен компилировать схему валидации', () => {
    const schema: FormValidationSchema<UserFormModel> = (path, builder) => {
      builder.required(path.username);
      builder.email(path.email);
    };

    const compiled = compileSchema(schema);

    expect(compiled.fieldRules.get('username')).toBeDefined();
    expect(compiled.fieldRules.get('email')).toBeDefined();
  });

  it('должен применять условные правила', () => {
    const schema: FormValidationSchema<UserFormModel> = (path, builder) => {
      builder.applyWhenValue(path.age, (age) => age < 18, (schema) =>
        schema.minLength(path.username, 5)
      );
    };

    const compiled = compileSchema(schema);
    // Проверяем что правило добавлено
    expect(compiled.conditionalRules).toHaveLength(1);
  });
});
```

### Интеграционные тесты

```typescript
describe('FormStore with Functional Schema', () => {
  it('должен валидировать поля согласно схеме', async () => {
    const form = new FormStore<UserFormModel>(fieldSchema, validationSchema);

    form.controls.username.setValue('ab'); // Too short
    await form.validate();

    expect(form.controls.username.invalid).toBe(true);
  });

  it('должен применять условную валидацию', async () => {
    const form = new FormStore<UserFormModel>(fieldSchema, validationSchema);

    form.controls.age.setValue(17);
    form.controls.username.setValue('john'); // 4 символа, но нужно 5 для age < 18
    await form.validate();

    expect(form.controls.username.invalid).toBe(true);
  });
});
```

## Сравнение с Angular

### Angular Signal Forms

```typescript
// Angular
flightForm = form(this.flight, (path) => {
  required(path.from);
  minLength(path.from, 3);
  validate(path.from, (ctx) => {
    if (!allowed.includes(ctx.value())) {
      return customError({ kind: 'city', value: ctx.value() });
    }
    return null;
  });
});
```

### Наша реализация

```typescript
// React Forms
const flightValidation: FormValidationSchema<FlightModel> = (path, schema) => {
  schema.required(path.from);
  schema.minLength(path.from, 3);
  schema.validate(path.from, (ctx) => {
    if (!allowed.includes(ctx.value())) {
      return { code: 'city', message: 'Invalid city', params: { value: ctx.value() } };
    }
    return null;
  });
};
```

## Сложность реализации

- **Время**: 3-4 дня
- **Изменения**:
  - Новые типы: `FieldPath`, `ValidationContext`, `SchemaBuilder`
  - Новый класс: `SchemaBuilderImpl`
  - Функции: `createFieldPath`, `compileSchema`
  - Изменения в `FormStore`: интеграция с compiled schema
  - Изменения в `FieldController`: поддержка динамических валидаторов
- **Тестирование**: Средней сложности, требует тестирования компиляции схемы

## Рекомендации

Этот вариант подходит, если:
- ✅ Команда знакома с Angular Signal Forms
- ✅ Нужна мощная система условной валидации
- ✅ Важна выразительность и читаемость сложных схем
- ✅ Планируется много кросс-филд валидаций
- ✅ Можно выделить время на более сложную реализацию
