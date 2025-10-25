# Вариант 3: Integration Schema (Zod/Yup/Vest)

## Концепция

Интеграция с популярными библиотеками валидации схем (Zod, Yup, Vest). Позволяет использовать стандартные инструменты экосистемы вместо создания собственной системы валидации.

## Преимущества

- ✅ Использование проверенных решений из экосистемы
- ✅ Богатый набор встроенных валидаторов
- ✅ Отличная TypeScript типизация (особенно Zod)
- ✅ Большое комьюнити и документация
- ✅ Готовые решения для сложных сценариев
- ✅ Простая миграция если проект уже использует Zod/Yup

## Недостатки

- ⚠️ Дополнительная зависимость (~15-50kb)
- ⚠️ Может быть избыточным для простых случаев
- ⚠️ Требует адаптера для интеграции с FormStore
- ⚠️ Синтаксис отличается от Angular Signal Forms

## API Design

### С использованием Zod

```typescript
import { z } from 'zod';

// Zod схема автоматически определяет тип
const userSchema = z.object({
  username: z
    .string()
    .min(3, 'Минимум 3 символа')
    .max(20, 'Максимум 20 символов')
    .regex(/^[a-zA-Z0-9_]+$/, 'Только буквы, цифры и подчеркивание'),

  email: z
    .string()
    .email('Некорректный email')
    .min(1, 'Email обязателен'),

  password: z
    .string()
    .min(8, 'Минимум 8 символов')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Должен содержать буквы и цифры'
    ),

  confirmPassword: z.string(),

  age: z
    .number()
    .min(18, 'Минимальный возраст: 18')
    .max(100, 'Максимальный возраст: 100'),

  country: z.string().optional(),

  city: z.string().optional(),

  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'Необходимо принять условия'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  }
).refine(
  (data) => {
    // Условная валидация: город обязателен для России
    if (data.country === 'Russia' && !data.city) {
      return false;
    }
    return true;
  },
  {
    message: 'Укажите город для России',
    path: ['city'],
  }
);

// TypeScript автоматически выведет тип из схемы
type UserFormModel = z.infer<typeof userSchema>;
```

### С использованием Yup

```typescript
import * as yup from 'yup';

const userSchema = yup.object({
  username: yup
    .string()
    .required('Имя пользователя обязательно')
    .min(3, 'Минимум 3 символа')
    .max(20, 'Максимум 20 символов')
    .matches(/^[a-zA-Z0-9_]+$/, 'Только буквы, цифры и подчеркивание'),

  email: yup
    .string()
    .required('Email обязателен')
    .email('Некорректный email'),

  password: yup
    .string()
    .required('Пароль обязателен')
    .min(8, 'Минимум 8 символов')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Должен содержать буквы и цифры'
    ),

  confirmPassword: yup
    .string()
    .required('Подтвердите пароль')
    .oneOf([yup.ref('password')], 'Пароли не совпадают'),

  age: yup
    .number()
    .required('Возраст обязателен')
    .min(18, 'Минимальный возраст: 18')
    .max(100, 'Максимальный возраст: 100'),

  country: yup.string().optional(),

  city: yup.string().when('country', {
    is: 'Russia',
    then: (schema) => schema.required('Укажите город для России'),
    otherwise: (schema) => schema.optional(),
  }),

  acceptTerms: yup
    .boolean()
    .required('Необходимо принять условия')
    .oneOf([true], 'Необходимо принять условия'),
});

type UserFormModel = yup.InferType<typeof userSchema>;
```

### С использованием Vest

```typescript
import { create, test, enforce } from 'vest';

const userValidationSuite = create((data = {}) => {
  test('username', 'Имя пользователя обязательно', () => {
    enforce(data.username).isNotEmpty();
  });

  test('username', 'Минимум 3 символа', () => {
    enforce(data.username).longerThanOrEquals(3);
  });

  test('username', 'Максимум 20 символов', () => {
    enforce(data.username).shorterThanOrEquals(20);
  });

  test('email', 'Email обязателен', () => {
    enforce(data.email).isNotEmpty();
  });

  test('email', 'Некорректный email', () => {
    enforce(data.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  test('password', 'Пароль обязателен', () => {
    enforce(data.password).isNotEmpty();
  });

  test('password', 'Минимум 8 символов', () => {
    enforce(data.password).longerThanOrEquals(8);
  });

  test('confirmPassword', 'Пароли не совпадают', () => {
    enforce(data.confirmPassword).equals(data.password);
  });

  test('age', 'Минимальный возраст: 18', () => {
    enforce(data.age).greaterThanOrEquals(18);
  });

  test('acceptTerms', 'Необходимо принять условия', () => {
    enforce(data.acceptTerms).isTruthy();
  });
});
```

## Использование с FormStore

### Вариант 1: Адаптер для Zod

```typescript
import { z, ZodSchema } from 'zod';

// Адаптер для преобразования Zod схемы в наш формат
function createZodAdapter<T extends Record<string, any>>(
  zodSchema: ZodSchema<T>
): FormValidationSchema<T> {
  return {
    // Синхронная валидация всей формы
    _form: {
      validators: [
        (values: T) => {
          const result = zodSchema.safeParse(values);
          if (!result.success) {
            // Возвращаем первую ошибку (можно настроить)
            const firstError = result.error.errors[0];
            return {
              code: firstError.code,
              message: firstError.message,
              params: { path: firstError.path },
            };
          }
          return null;
        },
      ],
    },

    // Создаем валидаторы для каждого поля
    ...Object.keys(zodSchema.shape).reduce((acc, key) => {
      const fieldSchema = zodSchema.shape[key as keyof typeof zodSchema.shape];

      acc[key as keyof T] = {
        validators: [
          (value: any) => {
            const result = fieldSchema.safeParse(value);
            if (!result.success) {
              const error = result.error.errors[0];
              return {
                code: error.code,
                message: error.message,
              };
            }
            return null;
          },
        ],
      };

      return acc;
    }, {} as any),
  };
}

// Использование
const form = new FormStore<UserFormModel>(
  fieldConfigSchema,
  createZodAdapter(userSchema)
);
```

### Вариант 2: Интеграция на уровне поля (Zod)

```typescript
// Хелпер для создания валидатора из Zod схемы
function zodValidator<T>(schema: ZodSchema<T>): ValidatorFn<T> {
  return (value: T): ValidationError | null => {
    const result = schema.safeParse(value);
    if (!result.success) {
      const error = result.error.errors[0];
      return {
        code: error.code,
        message: error.message,
      };
    }
    return null;
  };
}

// Использование с текущим API
const form = new FormStore<UserFormModel>({
  username: {
    value: '',
    component: InputText,
    validators: [
      zodValidator(
        z.string()
          .min(3, 'Минимум 3 символа')
          .max(20, 'Максимум 20 символов')
      ),
    ],
  },
  email: {
    value: '',
    component: InputText,
    validators: [
      zodValidator(
        z.string().email('Некорректный email')
      ),
    ],
  },
  // ...
});
```

### Вариант 3: Гибридный подход

```typescript
// Комбинируем декларативную схему с Zod
const userValidationSchema: FormValidationSchema<UserFormModel> = {
  username: {
    validators: [
      zodValidator(z.string().min(3).max(20)),
    ],
    asyncValidators: [checkUsernameAvailability],
  },

  email: {
    validators: [
      zodValidator(z.string().email()),
    ],
    updateOn: 'blur',
  },

  password: {
    validators: [
      zodValidator(
        z.string()
          .min(8)
          .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      ),
    ],
  },

  confirmPassword: {
    validators: [zodValidator(z.string())],
    crossFieldValidators: [
      (value, formValues) => {
        if (value !== formValues.password) {
          return {
            code: 'passwordMismatch',
            message: 'Пароли не совпадают',
          };
        }
        return null;
      },
    ],
  },
};

const form = new FormStore<UserFormModel>(
  fieldConfigSchema,
  userValidationSchema
);
```

## Расширенные возможности Zod

### Async валидация с Zod

```typescript
const userSchema = z.object({
  username: z.string().refine(
    async (username) => {
      const exists = await checkUsernameExists(username);
      return !exists;
    },
    { message: 'Это имя уже занято' }
  ),
});

// Адаптер поддерживает async
function createZodAsyncAdapter<T extends Record<string, any>>(
  zodSchema: ZodSchema<T>
): FormValidationSchema<T> {
  return {
    ...Object.keys(zodSchema.shape).reduce((acc, key) => {
      acc[key as keyof T] = {
        asyncValidators: [
          async (value: any) => {
            const fieldSchema = zodSchema.shape[key];
            const result = await fieldSchema.safeParseAsync(value);
            if (!result.success) {
              const error = result.error.errors[0];
              return {
                code: error.code,
                message: error.message,
              };
            }
            return null;
          },
        ],
      };
      return acc;
    }, {} as any),
  };
}
```

### Условная валидация с Zod

```typescript
const addressSchema = z.object({
  country: z.string(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
}).superRefine((data, ctx) => {
  // Условная валидация
  if (data.country === 'Russia' && !data.city) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Укажите город для России',
      path: ['city'],
    });
  }

  if (data.country === 'USA' && !data.zipCode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ZIP код обязателен для США',
      path: ['zipCode'],
    });
  }
});
```

### Трансформация данных с Zod

```typescript
const userSchema = z.object({
  email: z
    .string()
    .email()
    .transform((email) => email.toLowerCase()), // Автоматически приводим к нижнему регистру

  age: z
    .string()
    .transform((val) => parseInt(val, 10)) // Преобразуем строку в число
    .pipe(z.number().min(18)),

  acceptTerms: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .pipe(z.boolean()),
});
```

## Реализация адаптера

### Полный Zod адаптер

```typescript
interface ZodAdapterOptions {
  // Валидировать каждое поле отдельно или всю форму
  mode: 'field' | 'form';
  // Показывать все ошибки или только первую
  errorMode: 'first' | 'all';
  // Кастомизация сообщений об ошибках
  customErrorMap?: z.ZodErrorMap;
}

class ZodFormAdapter<T extends Record<string, any>> {
  constructor(
    private schema: ZodSchema<T>,
    private options: ZodAdapterOptions = {
      mode: 'field',
      errorMode: 'first',
    }
  ) {}

  // Создает валидатор для конкретного поля
  createFieldValidator<K extends keyof T>(field: K): ValidatorFn<T[K]> {
    return (value: T[K]) => {
      if (this.options.mode === 'field') {
        // Валидируем только это поле
        const fieldSchema = this.getFieldSchema(field);
        const result = fieldSchema.safeParse(value);

        if (!result.success) {
          const error = result.error.errors[0];
          return {
            code: error.code,
            message: error.message,
            params: error,
          };
        }
      }

      return null;
    };
  }

  // Создает валидатор для всей формы
  createFormValidator(): (values: T) => ValidationError | null {
    return (values: T) => {
      const result = this.schema.safeParse(values);

      if (!result.success) {
        const errors = result.error.errors;

        if (this.options.errorMode === 'first') {
          const error = errors[0];
          return {
            code: error.code,
            message: error.message,
            params: { path: error.path, errors },
          };
        }

        // Возвращаем все ошибки
        return {
          code: 'validation_error',
          message: 'Форма содержит ошибки',
          params: { errors },
        };
      }

      return null;
    };
  }

  // Получает схему для конкретного поля
  private getFieldSchema<K extends keyof T>(field: K): ZodSchema {
    if ('shape' in this.schema) {
      return (this.schema as any).shape[field];
    }
    throw new Error(`Cannot extract field schema for ${String(field)}`);
  }

  // Преобразует в FormValidationSchema
  toFormValidationSchema(): FormValidationSchema<T> {
    const schema: any = {};

    // Создаем валидаторы для каждого поля
    if ('shape' in this.schema) {
      const shape = (this.schema as any).shape;
      for (const key of Object.keys(shape)) {
        schema[key] = {
          validators: [this.createFieldValidator(key as keyof T)],
        };
      }
    }

    // Добавляем глобальный валидатор формы
    schema._form = {
      validators: [this.createFormValidator()],
    };

    return schema;
  }
}

// Использование
const adapter = new ZodFormAdapter(userSchema, {
  mode: 'field',
  errorMode: 'first',
});

const form = new FormStore<UserFormModel>(
  fieldConfigSchema,
  adapter.toFormValidationSchema()
);
```

## Тестирование

### Тесты Zod схемы

```typescript
describe('Zod ValidationSchema', () => {
  it('должен валидировать username', () => {
    const result = userSchema.safeParse({
      username: 'ab', // Too short
      email: 'test@example.com',
      password: 'Test1234',
      confirmPassword: 'Test1234',
      age: 25,
      acceptTerms: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toEqual(['username']);
      expect(result.error.errors[0].message).toContain('Минимум 3 символа');
    }
  });

  it('должен проверять совпадение паролей', () => {
    const result = userSchema.safeParse({
      username: 'john',
      email: 'test@example.com',
      password: 'Test1234',
      confirmPassword: 'Different123',
      age: 25,
      acceptTerms: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.errors.find(
        (e) => e.path[0] === 'confirmPassword'
      );
      expect(passwordError).toBeDefined();
    }
  });
});
```

### Тесты интеграции

```typescript
describe('FormStore with Zod', () => {
  it('должен использовать Zod валидацию', async () => {
    const adapter = new ZodFormAdapter(userSchema);
    const form = new FormStore<UserFormModel>(
      fieldConfigSchema,
      adapter.toFormValidationSchema()
    );

    form.controls.username.setValue('ab');
    await form.validate();

    expect(form.controls.username.invalid).toBe(true);
  });
});
```

## Сравнение библиотек

| Особенность | Zod | Yup | Vest |
|------------|-----|-----|------|
| Размер (min+gzip) | ~12kb | ~45kb | ~5kb |
| TypeScript First | ✅ | ⚠️ | ⚠️ |
| Type Inference | ✅ Отличный | ⚠️ Хороший | ❌ Нет |
| Async | ✅ | ✅ | ✅ |
| Трансформация | ✅ | ✅ | ❌ |
| Условная валидация | ✅ | ✅ | ✅ |
| Популярность | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Синтаксис | Fluent API | Fluent API | Test-based |

## Сложность реализации

- **Время**: 2-3 дня
- **Изменения**:
  - Новый модуль: адаптеры для Zod/Yup/Vest
  - Хелперы: `zodValidator`, `yupValidator`, `vestValidator`
  - Опционально: расширение `FormStore` для прямой поддержки
  - Документация по интеграции
- **Тестирование**: Простое, используем тесты библиотек + тесты адаптеров

## Рекомендации

Этот вариант подходит, если:
- ✅ Проект уже использует Zod/Yup для других целей
- ✅ Нужна мощная система валидации с минимальным кодом
- ✅ Важна строгая типизация TypeScript
- ✅ Команда знакома с этими библиотеками
- ✅ Требуется трансформация данных при валидации
- ✅ Нужны готовые решения для сложных сценариев

**Рекомендуется Zod** для новых проектов благодаря лучшей TypeScript поддержке и меньшему размеру.
