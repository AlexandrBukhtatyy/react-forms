# Forms Library

Signal-based forms library для React с TypeScript поддержкой и Angular-inspired API.

## Особенности

- ✅ **Signal-based** - Использует Preact Signals для реактивности
- ✅ **Type-safe** - Полная поддержка TypeScript с generic типами
- ✅ **Declarative** - Декларативное описание схемы формы
- ✅ **Валидация** - Синхронная и асинхронная валидация
- ✅ **Resources** - Встроенная поддержка ресурсов (static/preload/partial)
- ✅ **Flexible** - Работает с любыми React компонентами

## Быстрый старт

```typescript
import { FormStore, FormField, staticResource } from '@/lib/forms';
import type { FormSchema } from '@/lib/forms';

// 1. Определите модель формы
interface UserFormModel {
  username: string;
  email: string;
  role: string | null;
}

// 2. Создайте ресурсы
const roleResource = staticResource([
  { id: '1', label: 'Admin', value: 'admin' },
  { id: '2', label: 'User', value: 'user' }
]);

// 3. Опишите схему
const createUserForm = () => {
  const schema: FormSchema<UserFormModel> = {
    username: {
      value: '',
      component: Input,
      componentProps: { placeholder: 'Enter username' }
    },
    email: {
      value: '',
      component: Input,
      componentProps: { type: 'email' }
    },
    role: {
      value: null,
      component: Select,
      componentProps: {
        placeholder: 'Select role',
        resource: roleResource
      }
    }
  };

  return new FormStore(schema);
};

// 4. Используйте в компоненте
function UserForm() {
  const form = React.useMemo(() => createUserForm(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await form.submit(async (values) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(values)
      });
      return response.json();
    });

    if (result) {
      console.log('Success:', result);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormField control={form.controls.username} label="Username" />
      <FormField control={form.controls.email} label="Email" />
      <FormField control={form.controls.role} label="Role" />

      <Button type="submit" disabled={form.invalid || form.submitting}>
        {form.submitting ? 'Saving...' : 'Save'}
      </Button>
    </Form>
  );
}
```

## Архитектура

```
src/lib/forms/
├── components/       # React компоненты
│   ├── form.tsx
│   ├── form-field.tsx
│   └── input-*.tsx
├── core/            # Основная логика
│   ├── field-controller.ts
│   └── form-store.ts
├── resources/       # API для ресурсов
│   └── index.ts
├── validators/      # Встроенные валидаторы
│   └── built-in.ts
├── types.ts         # TypeScript типы
└── index.ts         # Главный экспорт
```

## API Reference

### FormStore

Главный класс для управления формой.

```typescript
class FormStore<T extends Record<string, any>> {
  // Доступ к контроллерам полей
  controls: Record<keyof T, FieldController>;

  // Состояние формы
  valid: boolean;
  invalid: boolean;
  dirty: boolean;
  pristine: boolean;
  touched: boolean;
  submitting: boolean;
  pending: boolean;

  // Методы
  getValue(): T;
  setValue(values: Partial<T>): void;
  reset(): void;
  markAllAsTouched(): void;
  validate(): Promise<boolean>;
  submit<R>(onSubmit: (values: T) => Promise<R> | R): Promise<R | null>;
}
```

### FieldController

Контроллер отдельного поля формы.

```typescript
class FieldController<T = any> {
  // Значение
  value: T;

  // Компонент
  component: ComponentType<any>;
  componentProps: Record<string, any>;

  // Состояние
  status: 'valid' | 'invalid' | 'pending' | 'disabled';
  errors: ValidationError[];
  touched: boolean;
  dirty: boolean;
  valid: boolean;
  invalid: boolean;
  pending: boolean;
  shouldShowError: boolean;

  // Методы
  markAsTouched(): void;
  validate(): Promise<boolean>;
  setErrors(errors: ValidationError[]): void;
}
```

### Validators

Встроенные валидаторы.

```typescript
import { Validators } from '@/lib/forms';

const schema: FormSchema<Model> = {
  email: {
    value: '',
    component: Input,
    validators: [
      Validators.required('Email is required'),
      Validators.email('Invalid email')
    ]
  },
  password: {
    value: '',
    component: InputPassword,
    validators: [
      Validators.required(),
      Validators.minLength(8, 'Min 8 characters'),
      Validators.pattern(/[A-Z]/, 'Must contain uppercase')
    ]
  }
};
```

Доступные валидаторы:
- `required(message?)` - Обязательное поле
- `email(message?)` - Валидация email
- `minLength(min, message?)` - Минимальная длина
- `maxLength(max, message?)` - Максимальная длина
- `min(min, message?)` - Минимальное значение
- `max(max, message?)` - Максимальное значение
- `pattern(regex, message?)` - Регулярное выражение

### Resources

API для создания ресурсов данных.

```typescript
import { staticResource, preloadResource, partialResource } from '@/lib/forms';

// Статические данные (загружаются сразу)
const statusResource = staticResource([
  { id: '1', label: 'Active', value: 'active' },
  { id: '2', label: 'Inactive', value: 'inactive' }
]);

// Предзагрузка (загружается один раз при первом обращении)
const countriesResource = preloadResource(async () => {
  const response = await fetch('/api/countries');
  return response.json();
});

// Парциальная загрузка (загружается при каждом запросе с параметрами)
const usersResource = partialResource(async (params) => {
  const search = params?.search || '';
  const response = await fetch(`/api/users?search=${search}`);
  return response.json();
});
```

## Примеры

### Форма с валидацией

```typescript
const schema: FormSchema<Model> = {
  username: {
    value: '',
    component: Input,
    validators: [
      Validators.required(),
      Validators.minLength(3)
    ],
    asyncValidators: [
      async (value) => {
        const available = await checkUsername(value);
        return available ? null : {
          code: 'taken',
          message: 'Username already taken'
        };
      }
    ]
  }
};
```

### Форма фильтрации (без валидации)

```typescript
const schema: FormSchema<FilterModel> = {
  search: {
    value: null,
    component: InputSearch,
    componentProps: {
      placeholder: 'Search...',
      debounce: 300
    }
  },
  status: {
    value: null,
    component: Select,
    componentProps: {
      resource: statusResource
    }
  }
};
```

### Программное управление

```typescript
// Установить значения
form.setValue({ username: 'john', email: 'john@example.com' });

// Получить значения
const values = form.getValue();

// Сбросить форму
form.reset();

// Валидация вручную
const isValid = await form.validate();

// Пометить все поля как touched
form.markAllAsTouched();

// Проверка состояния
if (form.dirty && form.valid) {
  // Форма изменена и валидна
}
```

## Лучшие практики

### 1. Выносите ресурсы в отдельные файлы

```
src/domains/users/
├── form/
│   ├── resources/
│   │   ├── role.resource.ts
│   │   └── country.resource.ts
│   └── UsersForm.tsx
```

### 2. Создавайте фабрики форм

```typescript
// Bad
const MyComponent = () => {
  const form = new FormStore(schema); // ❌ Пересоздается при каждом рендере
};

// Good
const MyComponent = () => {
  const form = React.useMemo(() => new FormStore(schema), []); // ✅
};

// Better
const createMyForm = () => new FormStore(schema);

const MyComponent = () => {
  const form = React.useMemo(createMyForm, []); // ✅✅
};
```

### 3. Используйте типизацию

```typescript
// Типизированная модель
interface UserFormModel {
  username: string;
  email: string;
  age: number;
}

// TypeScript проверит все поля
const schema: FormSchema<UserFormModel> = {
  username: { ... },
  email: { ... },
  age: { ... }
  // TypeScript ошибка, если забудете поле
};
```

### 4. Переиспользуйте валидаторы

```typescript
// validators/email.validator.ts
export const emailValidators = [
  Validators.required('Email is required'),
  Validators.email('Invalid email format')
];

// В форме
const schema: FormSchema<Model> = {
  email: {
    value: '',
    component: Input,
    validators: emailValidators
  }
};
```

## Migration Guide

Если вы использовали старый API (form-field.tsx, forms.ts), смотрите [Migration Guide](./docs/migration-guide.md).

## License

MIT
