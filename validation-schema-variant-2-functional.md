# Вариант 2: Functional Schema (Angular Signal Forms style)

## Концепция

Схема валидации задается через **отдельные функции** (без билдера), похожие на Angular Signal Forms. Использует паттерн "path" для доступа к полям.

## Преимущества

- ✅ Максимально похож на Angular Signal Forms
- ✅ Простой и понятный API - только функции, без классов и билдеров
- ✅ Отличная поддержка условной валидации
- ✅ Легко добавлять новые правила валидации
- ✅ Хорошая читаемость для сложных схем
- ✅ Type-safe благодаря TypeScript

## Недостатки

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

// Функция для создания схемы (просто получает path, без билдера!)
type FormValidationSchema<T extends Record<string, any>> = (
  path: FieldPath<T>
) => void;
```

### Функции валидации

```typescript
// Built-in validators
function required<T, K extends keyof T>(
  field: FieldPath<T>[K],
  options?: { message?: string }
): void;

function minLength<T, K extends keyof T>(
  field: FieldPath<T>[K],
  length: number,
  options?: { message?: string }
): void;

function maxLength<T, K extends keyof T>(
  field: FieldPath<T>[K],
  length: number,
  options?: { message?: string }
): void;

function email<T, K extends keyof T>(
  field: FieldPath<T>[K],
  options?: { message?: string }
): void;

function pattern<T, K extends keyof T>(
  field: FieldPath<T>[K],
  regex: RegExp,
  options?: { message?: string }
): void;

function min<T, K extends keyof T>(
  field: FieldPath<T>[K],
  value: number,
  options?: { message?: string }
): void;

function max<T, K extends keyof T>(
  field: FieldPath<T>[K],
  value: number,
  options?: { message?: string }
): void;

// Custom validator
function validate<T, K extends keyof T>(
  field: FieldPath<T>[K],
  validator: (ctx: ValidationContext<T[K]>) => ValidationError | null
): void;

// Async validator
function validateAsync<T, K extends keyof T>(
  field: FieldPath<T>[K],
  validator: (ctx: ValidationContext<T[K]>) => Promise<ValidationError | null>,
  options?: { debounce?: number }
): void;

// Cross-field validation
function validateTree<T>(
  validator: (ctx: ValidationContext<T>) => ValidationError | null,
  options?: { targetField?: keyof T }
): void;

// Conditional validation
function applyWhen<T, K extends keyof T>(
  field: FieldPath<T>[K],
  condition: (value: T[K]) => boolean,
  schemaFn: (path: FieldPath<T>) => void
): void;

// Update strategy
function updateOn<T, K extends keyof T>(
  field: FieldPath<T>[K],
  strategy: 'change' | 'blur' | 'submit'
): void;
```

## Использование

### Пример: Форма регистрации пользователя

```typescript
import { FormStore } from './forms';
import {
  required,
  minLength,
  maxLength,
  email,
  pattern,
  min,
  max,
  validate,
  validateAsync,
  validateTree,
  applyWhen,
  updateOn,
} from './forms/validators';

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

// Создаем схему валидации (чистые функции, как в Angular!)
const userValidationSchema = (path: FieldPath<UserFormModel>) => {
  // Required fields
  required(path.username, { message: 'Имя пользователя обязательно' });
  required(path.email, { message: 'Email обязателен' });
  required(path.password, { message: 'Пароль обязателен' });
  required(path.confirmPassword, { message: 'Подтвердите пароль' });
  required(path.age, { message: 'Возраст обязателен' });
  required(path.acceptTerms, { message: 'Примите условия' });

  // String validators
  minLength(path.username, 3, { message: 'Минимум 3 символа' });
  maxLength(path.username, 20, { message: 'Максимум 20 символов' });

  // Email validator
  email(path.email);

  // Password validators
  minLength(path.password, 8, { message: 'Минимум 8 символов' });
  pattern(path.password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Должен содержать буквы и цифры',
  });

  // Number validators
  min(path.age, 18, { message: 'Минимальный возраст: 18' });
  max(path.age, 100, { message: 'Максимальный возраст: 100' });

  // Custom validator
  validate(path.username, (ctx) => {
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
  validateAsync(
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
  updateOn(path.email, 'blur'); // Проверять только при потере фокуса

  // Cross-field validation (проверка совпадения паролей)
  validateTree(
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
  applyWhen(path.country, (value) => value === 'Russia', (path) => {
    required(path.city, { message: 'Укажите город для России' });
  });

  // Complex conditional validation
  applyWhen(path.age, (age) => age < 18, (path) => {
    minLength(path.username, 5, {
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

### Наша реализация (идентично!)

```typescript
// React Forms
const flightValidation = (path: FieldPath<FlightModel>) => {
  required(path.from);
  minLength(path.from, 3);
  validate(path.from, (ctx) => {
    if (!allowed.includes(ctx.value())) {
      return { code: 'city', message: 'Invalid city', params: { value: ctx.value() } };
    }
    return null;
  });
};

const form = new FormStore<FlightModel>(fieldSchema, flightValidation);
```

## Реализация

### Внутренний механизм сбора правил

```typescript
// ValidationSchemaBuilder - используется внутри для сбора правил
class ValidationSchemaBuilder<T extends Record<string, any>> {
  private fieldRules: Map<keyof T, ValidationRule[]> = new Map();
  private treeRules: TreeValidationRule[] = [];
  private conditionalRules: ConditionalRule<T>[] = [];
  private updateStrategies: Map<keyof T, 'change' | 'blur' | 'submit'> = new Map();

  addFieldRule<K extends keyof T>(field: K, rule: ValidationRule): void {
    if (!this.fieldRules.has(field)) {
      this.fieldRules.set(field, []);
    }
    this.fieldRules.get(field)!.push(rule);
  }

  // ... другие методы
}

// Глобальный стек билдеров (скрытый от пользователя!)
const builderStack: ValidationSchemaBuilder<any>[] = [];
```

### Функции валидации (публичный API)

```typescript
/**
 * Поле обязательно для заполнения
 */
export function required<T, K extends keyof T>(
  field: FieldPath<T>[K],
  options?: { message?: string }
): void {
  const builder = getCurrentBuilder<T>();
  builder.addFieldRule(field.key, {
    type: 'sync',
    validator: (value: any): ValidationError | null => {
      if (value === null || value === undefined || value === '') {
        return {
          code: 'required',
          message: options?.message || 'Поле обязательно для заполнения',
        };
      }
      return null;
    },
  });
}

/**
 * Минимальная длина строки
 */
export function minLength<T, K extends keyof T>(
  field: FieldPath<T>[K],
  length: number,
  options?: { message?: string }
): void {
  const builder = getCurrentBuilder<T>();
  builder.addFieldRule(field.key, {
    type: 'sync',
    validator: (value: string): ValidationError | null => {
      if (value && value.length < length) {
        return {
          code: 'minLength',
          message: options?.message || `Минимальная длина: ${length}`,
          params: { min: length, actual: value.length },
        };
      }
      return null;
    },
  });
}

// ... остальные функции аналогично
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

### Компиляция схемы

```typescript
/**
 * Компилирует схему валидации в объект с правилами
 */
export function compileValidationSchema<T extends Record<string, any>>(
  schemaFn: (path: FieldPath<T>) => void
): CompiledSchema<T> {
  const builder = new ValidationSchemaBuilder<T>();
  builderStack.push(builder);

  try {
    const path = createFieldPath<T>();
    schemaFn(path); // Пользователь вызывает функции напрямую!
    return builder.compile();
  } finally {
    builderStack.pop();
  }
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
      this.compiledSchema = compileValidationSchema(validationSchema);
    }

    // Создаем контроллеры с примененной валидацией
    for (const [key, config] of Object.entries(schema)) {
      const fieldKey = key as keyof T;
      const fieldRules = this.compiledSchema?.fieldRules.get(fieldKey) || [];
      const updateStrategy =
        this.compiledSchema?.updateStrategies.get(fieldKey) || 'change';

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
            .map((r) => async (value: any) => await r.validator(value, this.getValue())),
        ],
        updateOn: updateStrategy,
      };

      this.fields.set(fieldKey, new FieldController(fieldConfig));
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
    const schema = (path: FieldPath<UserFormModel>) => {
      required(path.username);
      email(path.email);
    };

    const compiled = compileValidationSchema(schema);

    expect(compiled.fieldRules.get('username')).toBeDefined();
    expect(compiled.fieldRules.get('email')).toBeDefined();
  });

  it('должен применять условные правила', () => {
    const schema = (path: FieldPath<UserFormModel>) => {
      applyWhen(path.age, (age) => age < 18, (path) => {
        minLength(path.username, 5);
      });
    };

    const compiled = compileValidationSchema(schema);
    expect(compiled.conditionalRules).toHaveLength(1);
  });
});
```

### Интеграционные тесты

```typescript
describe('FormStore with Functional Schema', () => {
  it('должен валидировать поля согласно схеме', async () => {
    const validationSchema = (path: FieldPath<UserFormModel>) => {
      required(path.username);
      minLength(path.username, 3);
    };

    const form = new FormStore<UserFormModel>(fieldSchema, validationSchema);

    form.controls.username.setValue('ab'); // Too short
    await form.validate();

    expect(form.controls.username.invalid).toBe(true);
  });

  it('должен применять cross-field валидацию', async () => {
    const validationSchema = (path: FieldPath<UserFormModel>) => {
      validateTree(
        (ctx) => {
          const form = ctx.formValue();
          if (form.password !== form.confirmPassword) {
            return { code: 'mismatch', message: 'Пароли не совпадают' };
          }
          return null;
        },
        { targetField: 'confirmPassword' }
      );
    };

    const form = new FormStore<UserFormModel>(fieldSchema, validationSchema);

    form.controls.password.setValue('password123');
    form.controls.confirmPassword.setValue('different');
    await form.validate();

    expect(form.controls.confirmPassword.invalid).toBe(true);
  });
});
```

## Ключевые отличия от варианта с билдером

### Было (с билдером):

```typescript
const schema = (path: FieldPath<UserForm>, builder: SchemaBuilder<UserForm>) => {
  builder.required(path.username);
  builder.email(path.email);
};
```

### Стало (чистые функции):

```typescript
const schema = (path: FieldPath<UserForm>) => {
  required(path.username);
  email(path.email);
};
```

## Рекомендации

Этот вариант подходит, если:
- ✅ Команда знакома с Angular Signal Forms
- ✅ Нужна мощная система условной валидации
- ✅ Важна выразительность и читаемость сложных схем
- ✅ Планируется много кросс-филд валидаций
- ✅ Хочется максимально чистый API без лишних абстракций
