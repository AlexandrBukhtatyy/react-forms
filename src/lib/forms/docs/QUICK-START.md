# Quick Start Guide

Быстрое руководство по использованию библиотеки форм.

## Установка

Библиотека уже включена в проект. Основные зависимости:
- `@preact/signals-react` - реактивное управление состоянием
- `immer` - иммутабельные обновления

## Простая форма

```typescript
import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { required, email } from '@/lib/forms/validators';
import { Input } from '@/components/ui/input';

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

if (isValid) {
  const values = form.getValue();
  console.log(values); // { email: '...', password: '...' }
}
```

## React компонент

```tsx
import { useSignals } from '@preact/signals-react/runtime';

function LoginForm() {
  useSignals();

  const handleSubmit = async () => {
    const isValid = await form.validate();
    if (isValid) {
      await api.login(form.getValue());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={form.email.value.value}
        onChange={(e) => form.email.setValue(e.target.value)}
        error={form.email.errors.value[0]?.message}
      />

      <Input
        type="password"
        value={form.password.value.value}
        onChange={(e) => form.password.setValue(e.target.value)}
        error={form.password.errors.value[0]?.message}
      />

      <button type="submit" disabled={form.invalid.value}>
        Войти
      </button>
    </form>
  );
}
```

## Вложенные формы

```typescript
interface UserForm {
  name: string;
  address: {
    city: string;
    street: string;
  };
}

const form = new GroupNode<UserForm>({
  form: {
    name: { value: '', component: Input },
    address: {
      city: { value: '', component: Input },
      street: { value: '', component: Input },
    },
  },
  validation: (path) => {
    required(path.name);
    required(path.address.city);
    required(path.address.street);
  },
});

// Прямой доступ к вложенным полям
form.address.city.setValue('Moscow');
```

## Массивы

```typescript
const form = new GroupNode({
  form: {
    items: [{
      title: { value: '', component: Input },
      price: { value: 0, component: Input },
    }],
  },
});

// CRUD
form.items.push({ title: 'Item 1', price: 100 });
form.items.at(0)?.title.setValue('Updated');
form.items.removeAt(0);

// Итерация
form.items.forEach((item, index) => {
  console.log(item.title.value.value);
});
```

## Условная валидация

```typescript
import { applyWhen } from '@/lib/forms/validators';

const form = new GroupNode({
  form: {
    loanType: { value: '', component: Select },
    propertyValue: { value: null, component: Input },
  },
  validation: (path) => {
    required(path.loanType);

    // Валидация только для mortgage
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

## Reactive behaviors

```typescript
import { enableWhen, computeFrom } from '@/lib/forms/behaviors';

const form = new GroupNode({
  form: {
    firstName: { value: '', component: Input },
    lastName: { value: '', component: Input },
    fullName: { value: '', component: Input },
  },
  behavior: (path) => {
    // Вычисляемое поле
    computeFrom(
      path.fullName,
      [path.firstName, path.lastName],
      ({ firstName, lastName }) => `${firstName} ${lastName}`.trim()
    );
  },
});
```

## Async валидация

```typescript
import { validateAsync } from '@/lib/forms/validators';

const form = new GroupNode({
  form: {
    email: { value: '', component: Input },
  },
  validation: (path) => {
    validateAsync(
      path.email,
      async (value) => {
        const exists = await api.checkEmail(value);
        return exists
          ? { code: 'exists', message: 'Email уже занят' }
          : null;
      },
      { debounce: 300 }
    );
  },
});
```

## Доступные валидаторы

```typescript
import {
  required,
  email,
  min,
  max,
  minLength,
  maxLength,
  pattern,
} from '@/lib/forms/validators';

// Использование
required(path.field, { message: 'Обязательно' });
email(path.email);
min(path.age, 18);
max(path.age, 100);
minLength(path.password, 8);
maxLength(path.bio, 500);
pattern(path.phone, /^\+7\d{10}$/);
```

## Доступные behaviors

```typescript
import {
  copyFrom,
  enableWhen,
  computeFrom,
  watchField,
} from '@/lib/forms/behaviors';

// Копирование
copyFrom(path.target, path.source, {
  when: (form) => form.copyEnabled === true
});

// Условное включение
enableWhen(path.field, path.condition, {
  condition: (value) => value === 'specific',
  resetOnDisable: true,
});

// Вычисляемое поле
computeFrom(path.result, [path.field1, path.field2],
  ({ field1, field2 }) => field1 + field2
);

// Callback при изменении
watchField(path.country, async (country, ctx) => {
  const regions = await fetchRegions(country);
  ctx.updateComponentProps(path.region, { options: regions });
});
```

## Полезные методы

```typescript
// Получение/установка значений
const value = form.getValue();
form.setValue({ email: '...', password: '...' });
form.patchValue({ email: '...' }); // Частичное обновление
form.reset(); // Сброс в начальное состояние

// Валидация
const isValid = await form.validate();
form.clearErrors();

// Состояние
form.markAsTouched();
form.markAsUntouched();
form.markAsDirty();
form.markAsPristine();

// Submit с автоматической валидацией
await form.submit(async (values) => {
  await api.save(values);
});
```

## Доступ к состоянию

```typescript
// Все signals - реактивные
form.value.value          // Текущее значение
form.valid.value          // Валидна ли форма
form.invalid.value        // Невалидна ли форма
form.touched.value        // Была ли затронута
form.dirty.value          // Была ли изменена
form.pending.value        // Идёт ли валидация
form.errors.value         // Массив ошибок
form.status.value         // 'valid' | 'invalid' | 'pending'

// Для отдельного поля
form.email.value.value
form.email.valid.value
form.email.errors.value
```

## Следующие шаги

- [Полная документация по архитектуре](ARCHITECTURE.md)
- [Примеры использования](../src/examples/)
- [Validation Schema API](../src/examples/validation-example.ts)
- [Behavior Schema API](../src/examples/behavior-schema-example.ts)
- [React Hooks](../src/examples/react-hooks-example.tsx)
