# React Forms Library - Experimental Project

Экспериментальный React-проект для исследования "серебряной пули" в архитектуре приложений.

## 🎯 Цель проекта

Найти оптимальную архитектуру React приложения, объединяющую:
- **Signals** (@preact/signals-react) - реактивное управление состоянием
- **DDD** (Domain-Driven Design) - доменная структура
- **Immer** - иммутабельные обновления
- **TypeScript** - полная типизация

## ✨ Ключевые особенности

### 📝 FormNode Architecture

Новая архитектура форм с иерархией классов:

```typescript
FormNode<T>                      # Базовый класс
├── FieldNode<T>                 # Поле с валидацией
├── GroupNode<T>                 # Группа полей
└── ArrayNode<T>                 # Массив форм
```

**Преимущества**:
- ✅ **Type-safe** - полная типизация TypeScript
- ✅ **Reactive** - автоматические обновления через signals
- ✅ **Performance** - computed signals вместо рекурсивного обхода (O(1) vs O(n))
- ✅ **Composable** - рекурсивная композиция форм
- ✅ **Declarative** - декларативная валидация и поведение

### 🔍 Validation Schema API

Декларативная валидация форм:

```typescript
const form = new GroupNode<UserForm>({
  form: {
    email: { value: '', component: Input },
    password: { value: '', component: Input },
  },
  validation: (path) => {
    required(path.email, { message: 'Email обязателен' });
    email(path.email);
    minLength(path.password, 8);
  },
});
```

**Возможности**:
- ✅ Синхронные и async валидаторы
- ✅ Кросс-полевая валидация
- ✅ Условная валидация (applyWhen)
- ✅ Композиция и переиспользование схем
- ✅ Debounce для async валидации
- ✅ Доступ к контексту формы

### ⚡ Behavior Schema API

Декларативное реактивное поведение:

```typescript
const form = new GroupNode<UserForm>({
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

**Возможности**:
- ✅ Вычисляемые поля (computeFrom)
- ✅ Копирование полей (copyFrom)
- ✅ Условное включение (enableWhen)
- ✅ Reactive callbacks (watchField)
- ✅ Композиция поведений

### 📊 Table Store

Управление состоянием таблиц с различными стратегиями загрузки данных:
- Server-paginated
- Client-paginated
- Static
- Infinite-scroll
- Cached
- Hybrid

## 🚀 Quick Start

### Установка

```bash
npm install
```

### Разработка

```bash
npm run dev          # Запуск dev-сервера
npm run build        # Production build
npm run lint         # Линтер
npm test             # Запуск тестов
```

### Простой пример

```typescript
import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { required, email } from '@/lib/forms/validators';

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

// Прямой доступ к полям через proxy
form.email.setValue('test@mail.com');
form.password.setValue('secret123');

// Валидация
const isValid = await form.validate();

// Submit
if (isValid) {
  await form.submit(async (values) => {
    await api.login(values);
  });
}
```

## 📚 Документация

### Основная документация
- **[Quick Start Guide](docs/QUICK-START.md)** - начните здесь!
- **[Architecture](docs/ARCHITECTURE.md)** - полное описание архитектуры
- **[Migration Guide](src/lib/forms/MIGRATION.md)** - миграция на новую архитектуру

### Тестирование
- **[Testing Structure](docs/testing-structure.md)** - организация тестов (unit/integration/e2e)
- **[Tests Guide](src/tests/README.md)** - как писать тесты

### Примеры кода
- **[Validation Examples](src/examples/validation-example.ts)** - примеры валидации
- **[Behavior Schema Examples](src/examples/behavior-schema-example.ts)** - примеры behaviors
- **[React Hooks Examples](src/examples/react-hooks-example.tsx)** - React hooks
- **[GroupNode Config Examples](src/examples/group-node-config-example.ts)** - конфигурация форм

## 🧪 Тестирование

### Команды

```bash
npm test                  # Все тесты (70 тестов)
npm run test:unit         # Unit тесты
npm run test:integration  # Integration тесты
npm run test:coverage     # С coverage репортом
npm run test:watch        # Watch mode
npm run test:ui           # Vitest UI
```

### Текущий статус

- ✅ **70/70 тестов проходят**
- ✅ Unit тесты для FormNode архитектуры
- ✅ ValidationContext тесты
- ✅ BehaviorRegistry тесты
- ✅ ArrayNode тесты

### Структура тестов

```
src/tests/
├── unit/                        # Unit тесты
│   ├── forms/
│   │   ├── core/               # ArrayNode, FieldNode, GroupNode
│   │   ├── validators/         # ValidationContext
│   │   └── behaviors/          # BehaviorRegistry
│   └── ...
├── integration/                 # Integration тесты (TODO)
├── e2e/                         # E2E тесты (TODO)
└── helpers/                     # Test utilities
    ├── test-utils.ts
    ├── mock-data.ts
    └── custom-matchers.ts
```

## 🏗️ Архитектура проекта

### Структура

```
src/
├── lib/                         # Библиотеки
│   ├── forms/                   # FormNode архитектура
│   │   ├── core/nodes/         # FormNode, FieldNode, GroupNode, ArrayNode
│   │   ├── validators/         # Validation Schema API
│   │   ├── behaviors/          # Behavior Schema API
│   │   └── hooks/              # React hooks
│   └── tables/                  # Table Store
│       └── store/
│
├── domains/                     # DDD структура
│   ├── credit-applications/    # Домен заявок
│   │   ├── form/
│   │   └── table/
│   └── users/                   # Домен пользователей
│       ├── form/
│       └── table/
│
├── examples/                    # Примеры использования
├── tests/                       # Тесты
└── components/                  # UI компоненты
```

### Domain-Driven структура

```
domains/
  {domain}/
    _shared/services/            # Общие сервисы домена
    form/
      components/                # UI компоненты форм
      resources/                 # Ресурсы для форм
      schemas/                   # Validation/Behavior схемы
    table/
      components/                # UI компоненты таблиц
      resources/                 # Ресурсы для таблиц
      store/                     # Доменно-специфичное хранилище
```

## 🔧 Технологии

- **React 19** - UI библиотека
- **TypeScript** - типизация
- **@preact/signals-react** - реактивное состояние
- **Immer** - иммутабельные обновления
- **Vite** - build tool
- **Vitest** - unit/integration тесты
- **Playwright** - E2E тесты (TODO)
- **TailwindCSS** - стилизация
- **Radix UI** - UI компоненты
- **TanStack Table** - таблицы

## 📋 TODO

### Приоритеты

- [ ] Мигрировать CreditApplicationForm на новую архитектуру
- [ ] Использовать ArrayNode для массивов (имущество, кредиты, созаемщики)
- [ ] Добавить integration тесты
- [ ] Добавить E2E тесты (Playwright)
- [ ] Исправить возвращаемые значения для компонентов Select, Search, Files
- [ ] Добавить базовые поля форм (DatePicker, period, Segment, Checkbox, Radio)
- [ ] Сделать компоненты таблицы независимыми (headless pattern)

### Валидация

- [ ] Валидация чекбоксов на последнем шаге
- [ ] Обновление динамических справочников
- [ ] Стратегии валидации при изменении (change/blur/submit)
- [ ] Маппер для конвертации ошибок валидатора

### Тестирование

- ✅ Unit тесты для core форм (70 тестов)
- [ ] Integration тесты для форм
- [ ] E2E тесты для конкретных форм
- [ ] E2E тесты для таблиц

### Документация

- ✅ ARCHITECTURE.md
- ✅ QUICK-START.md
- ✅ Testing structure
- ✅ Migration guide
- [ ] Видео туториалы
- [ ] API reference

## 🎓 Примеры использования

### Вложенные формы

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
});

// Прямой доступ к вложенным полям
form.address.city.setValue('Moscow');
```

### Массивы форм

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

// Итерация
form.items.forEach((item) => {
  console.log(item.title.value.value);
});
```

### Условная валидация

```typescript
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
        min(path.propertyValue, 100000);
      }
    );
  },
  behavior: (path) => {
    // Условное включение поля
    enableWhen(
      path.propertyValue,
      path.loanType,
      {
        condition: (type) => type === 'mortgage',
        resetOnDisable: true,
      }
    );
  },
});
```

## 📞 Контакты

Вопросы и предложения - создавайте issue в репозитории!

## 📄 Лицензия

MIT
