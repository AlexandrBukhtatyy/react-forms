# Вариант 1: Declarative Object Schema

## Концепция

Простой и декларативный подход, где схема валидации задается как объект с правилами для каждого поля. Схема валидации отделена от конфигурации полей формы.

## Преимущества

- ✅ Простая реализация (1-2 дня)
- ✅ Интуитивно понятный синтаксис
- ✅ Легко тестировать (unit-тесты на схему отдельно от формы)
- ✅ Хорошая TypeScript типизация
- ✅ Минимальные изменения в существующей архитектуре
- ✅ Декларативный подход (как в Angular)

## Недостатки

- ⚠️ Менее гибкий для сложных кросс-филд валидаций
- ⚠️ Дублирование ключей полей в schema и validationSchema

## API Design

### Типы

```typescript
// Правило валидации для поля
interface FieldValidationRule<T = any> {
  validators?: ValidatorFn<T>[];
  asyncValidators?: AsyncValidatorFn<T>[];
  crossFieldValidators?: CrossFieldValidator<T>[];
  updateOn?: 'change' | 'blur' | 'submit';
  messages?: {
    [errorCode: string]: string;
  };
}

// Кросс-филд валидатор
type CrossFieldValidator<T = any> = (
  value: T,
  formValues: Record<string, any>
) => ValidationError | null;

// Схема валидации формы
type FormValidationSchema<T extends Record<string, any>> = {
  [K in keyof T]?: FieldValidationRule<T[K]>;
} & {
  // Глобальные правила для всей формы
  _form?: {
    validators?: ((values: T) => ValidationError | null)[];
    asyncValidators?: ((values: T) => Promise<ValidationError | null>)[];
  };
};
```

### Использование

```typescript
import { FormStore, Validators } from './forms';

// Определяем модель формы
interface UserFormModel {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
  acceptTerms: boolean;
}

// Определяем схему валидации (отдельно от конфигурации полей)
const userValidationSchema: FormValidationSchema<UserFormModel> = {
  username: {
    validators: [
      Validators.required('Имя пользователя обязательно'),
      Validators.minLength(3, 'Минимум 3 символа'),
      Validators.maxLength(20, 'Максимум 20 символов'),
    ],
    asyncValidators: [checkUsernameAvailability],
    updateOn: 'blur',
  },

  email: {
    validators: [
      Validators.required('Email обязателен'),
      Validators.email('Некорректный email'),
    ],
    asyncValidators: [checkEmailAvailability],
  },

  password: {
    validators: [
      Validators.required('Пароль обязателен'),
      Validators.minLength(8, 'Минимум 8 символов'),
      Validators.pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Должен содержать буквы и цифры'
      ),
    ],
  },

  confirmPassword: {
    validators: [Validators.required('Подтвердите пароль')],
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

  age: {
    validators: [
      Validators.required('Возраст обязателен'),
      Validators.min(18, 'Минимальный возраст: 18'),
      Validators.max(100, 'Максимальный возраст: 100'),
    ],
  },

  acceptTerms: {
    validators: [
      (value) => {
        if (!value) {
          return {
            code: 'termsRequired',
            message: 'Необходимо принять условия',
          };
        }
        return null;
      },
    ],
  },

  // Глобальная валидация формы
  _form: {
    validators: [
      (values) => {
        // Пример: проверка общей валидности данных
        if (values.age < 18 && values.username.length < 5) {
          return {
            code: 'invalidCombination',
            message: 'Несовершеннолетние должны иметь более длинное имя',
          };
        }
        return null;
      },
    ],
  },
};

// Создаем форму с валидацией
const form = new FormStore<UserFormModel>(
  {
    username: {
      value: '',
      component: InputText,
    },
    email: {
      value: '',
      component: InputText,
    },
    password: {
      value: '',
      component: InputPassword,
    },
    confirmPassword: {
      value: '',
      component: InputPassword,
    },
    age: {
      value: 18,
      component: InputNumber,
    },
    acceptTerms: {
      value: false,
      component: Checkbox,
    },
  },
  userValidationSchema // Передаем схему валидации
);
```

## Изменения в FormStore

```typescript
export class FormStore<T extends Record<string, any>> {
  private validationSchema?: FormValidationSchema<T>;

  constructor(
    schema: FormSchema<T>,
    validationSchema?: FormValidationSchema<T>
  ) {
    this.validationSchema = validationSchema;
    this.fields = new Map();
    this._submitting = signal(false);

    // Применяем валидацию из схемы к полям
    for (const [key, config] of Object.entries(schema)) {
      const validation = validationSchema?.[key as keyof T];

      const fieldConfig = {
        ...config,
        validators: validation?.validators || config.validators || [],
        asyncValidators: validation?.asyncValidators || config.asyncValidators || [],
        updateOn: validation?.updateOn || config.updateOn || 'change',
      };

      this.fields.set(key as keyof T, new FieldController(fieldConfig));
    }

    // Сохраняем кросс-филд валидаторы
    this.applyCrossFieldValidators();

    this.value = computed(() => {
      const result = {} as T;
      this.fields.forEach((field, key) => {
        result[key] = field.value;
      });
      return result;
    });
  }

  private applyCrossFieldValidators(): void {
    if (!this.validationSchema) return;

    for (const [key, rule] of Object.entries(this.validationSchema)) {
      if (key === '_form') continue;

      const crossValidators = (rule as FieldValidationRule).crossFieldValidators;
      if (crossValidators && crossValidators.length > 0) {
        const field = this.fields.get(key as keyof T);
        if (field) {
          field.setCrossFieldValidators(
            crossValidators.map(validator =>
              () => validator(field.value, this.getValue())
            )
          );
        }
      }
    }
  }

  async validate(): Promise<boolean> {
    // Валидация полей
    const fieldsValid = await super.validate();

    // Глобальная валидация формы
    const formValidators = this.validationSchema?._form?.validators || [];
    const formAsyncValidators = this.validationSchema?._form?.asyncValidators || [];

    const formValues = this.getValue();

    for (const validator of formValidators) {
      const error = validator(formValues);
      if (error) {
        this._formErrors.value = [error];
        return false;
      }
    }

    for (const validator of formAsyncValidators) {
      const error = await validator(formValues);
      if (error) {
        this._formErrors.value = [error];
        return false;
      }
    }

    return fieldsValid;
  }
}
```

## Изменения в FieldController

```typescript
export class FieldController<T = any> {
  private crossFieldValidators: ValidatorFn<T>[] = [];

  setCrossFieldValidators(validators: ValidatorFn<T>[]): void {
    this.crossFieldValidators = validators;
  }

  async validate(): Promise<boolean> {
    // Существующая валидация
    const syncValid = await this.runSyncValidators();
    if (!syncValid) return false;

    // Кросс-филд валидация
    const crossFieldErrors: ValidationError[] = [];
    for (const validator of this.crossFieldValidators) {
      const error = validator(this.value);
      if (error) crossFieldErrors.push(error);
    }

    if (crossFieldErrors.length > 0) {
      this._errors.value = [...this._errors.value, ...crossFieldErrors];
      this._status.value = 'invalid';
      return false;
    }

    // Асинхронная валидация
    return await this.runAsyncValidators();
  }
}
```

## Тестирование

### Unit-тесты схемы валидации

```typescript
describe('UserValidationSchema', () => {
  describe('username validation', () => {
    it('должен требовать имя пользователя', () => {
      const rule = userValidationSchema.username!;
      const validator = rule.validators![0];

      expect(validator('')).toEqual({
        code: 'required',
        message: 'Имя пользователя обязательно',
      });
      expect(validator('john')).toBeNull();
    });

    it('должен проверять минимальную длину', () => {
      const rule = userValidationSchema.username!;
      const validator = rule.validators![1];

      expect(validator('ab')).toEqual({
        code: 'minLength',
        message: 'Минимум 3 символа',
        params: { min: 3, actual: 2 },
      });
      expect(validator('abc')).toBeNull();
    });
  });

  describe('confirmPassword cross-field validation', () => {
    it('должен проверять совпадение паролей', () => {
      const rule = userValidationSchema.confirmPassword!;
      const crossValidator = rule.crossFieldValidators![0];

      const formValues = { password: 'test123', confirmPassword: 'test456' };
      expect(crossValidator('test456', formValues)).toEqual({
        code: 'passwordMismatch',
        message: 'Пароли не совпадают',
      });

      expect(crossValidator('test123', { ...formValues, password: 'test123' })).toBeNull();
    });
  });
});
```

### Интеграционные тесты

```typescript
describe('FormStore with ValidationSchema', () => {
  it('должен применять валидацию из схемы', async () => {
    const form = new FormStore<UserFormModel>(schema, userValidationSchema);

    form.controls.username.setValue('ab'); // Слишком короткое
    await form.validate();

    expect(form.controls.username.invalid).toBe(true);
    expect(form.controls.username.errors[0].code).toBe('minLength');
  });

  it('должен выполнять кросс-филд валидацию', async () => {
    const form = new FormStore<UserFormModel>(schema, userValidationSchema);

    form.controls.password.setValue('test123');
    form.controls.confirmPassword.setValue('test456');
    await form.validate();

    expect(form.controls.confirmPassword.invalid).toBe(true);
    expect(form.controls.confirmPassword.errors[0].code).toBe('passwordMismatch');
  });

  it('должен выполнять глобальную валидацию формы', async () => {
    const form = new FormStore<UserFormModel>(schema, userValidationSchema);

    form.controls.age.setValue(17);
    form.controls.username.setValue('john');

    const isValid = await form.validate();
    expect(isValid).toBe(false);
  });
});
```

## Миграция с текущего подхода

### Было (валидаторы в FieldConfig)

```typescript
const schema: FormSchema<UserModel> = {
  username: {
    value: '',
    component: InputText,
    validators: [Validators.required(), Validators.minLength(3)],
  },
};

const form = new FormStore(schema);
```

### Стало (схема валидации отдельно)

```typescript
const schema: FormSchema<UserModel> = {
  username: {
    value: '',
    component: InputText,
  },
};

const validationSchema: FormValidationSchema<UserModel> = {
  username: {
    validators: [Validators.required(), Validators.minLength(3)],
  },
};

const form = new FormStore(schema, validationSchema);
```

### Совместимость

Можно оставить оба подхода работающими одновременно:

```typescript
// Старый подход (для обратной совместимости)
const form1 = new FormStore({
  username: {
    value: '',
    component: InputText,
    validators: [Validators.required()],
  },
});

// Новый подход (рекомендуется)
const form2 = new FormStore(
  {
    username: { value: '', component: InputText },
  },
  {
    username: { validators: [Validators.required()] },
  }
);
```

## Сложность реализации

- **Время**: 1-2 дня
- **Изменения**:
  - Новые типы: `FormValidationSchema`, `FieldValidationRule`, `CrossFieldValidator`
  - Изменения в `FormStore`: добавить конструктор параметр, применение схемы
  - Изменения в `FieldController`: добавить поддержку кросс-филд валидаторов
- **Тестирование**: Простое, схема легко тестируется изолированно

## Рекомендации

Этот вариант подходит, если:
- ✅ Нужна простая и понятная схема валидации
- ✅ Валидация преимущественно на уровне полей
- ✅ Нужна быстрая реализация
- ✅ Важна легкость тестирования
- ✅ Команда предпочитает декларативный подход
