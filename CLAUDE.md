# CLAUDE.md

Этот файл содержит руководство для Claude Code (claude.ai/code) при работе с кодом в этом репозитории.

## Обзор проекта

Экспериментальный React-проект, исследующий "серебряную пулю" архитектуры, объединяющий DDD (Domain-Driven Design), Signals (@preact/signals-react) и Immer для управления состоянием. Основной фокус — создание надежной библиотеки форм и таблиц на основе сигналов с разделением представления и поведения.

**Язык кодовой базы**: Русский (комментарии, названия переменных, TODO).

## Команды

**Разработка**:
```bash
npm run dev          # Запуск dev-сервера Vite
npm run build        # Сборка проекта (TypeScript compiler + Vite build)
npm run lint         # Запуск ESLint
npm run preview      # Предпросмотр production-сборки
```

## Архитектура

### Ключевые концепции

**Управление состоянием на основе Signal**: Использует @preact/signals-react для реактивного состояния. Архитектура разделяет:
- **Stores**: Классовые хранилища с Signal-примитивами для реактивного состояния
- **Controllers**: Управляют состоянием отдельных полей/компонентов
- **Resources**: Стратегии загрузки данных (static, preload, partial, server-paginated и т.д.)

**Интеграция Immer**: Мутации состояния используют `produce` из Immer через утилиту `mutateSignal` для иммутабельных обновлений.

### Ключевые паттерны

**Архитектура форм** ([src/lib/forms/](src/lib/forms/)):

**Новая архитектура FormNode** (рекомендуется):
- **`FormNode<T>`**: Абстрактный базовый класс для всех узлов формы (аналог AbstractControl из Angular)
- **`FieldNode<T>`**: Узел для простого поля с валидацией, touched, dirty состояниями
- **`GroupNode<T>`**: Узел для группы полей (объект), поддерживает вложенность
- **`ArrayNode<T>`**: Узел для массива форм с CRUD операциями (push, remove, insert)

**Ключевые особенности**:
- Единый интерфейс для всех узлов через наследование от FormNode
- Computed signals вместо геттеров для производительности (O(1) вместо O(n))
- Прямой доступ к полям через Proxy: `form.email` вместо `form.controls.email`
- Параллельное выполнение async валидаторов
- Debounce для async валидации
- Поддержка вложенных форм и массивов
- Рекурсивная композиция: GroupNode может содержать FieldNode, GroupNode, ArrayNode

**Validation Schema** (вдохновлено Angular Signal Forms):
- Синхронные/асинхронные валидаторы с контекстом
- Кросс-полевая валидация (validateTree)
- Условная валидация (applyWhen)
- Композиция схем через toFieldPath
- Поддержка вложенных путей: `ctx.getField('address.city')`
- Три триггера валидации: `change`, `blur`, `submit`

**Legacy** (deprecated, для обратной совместимости):
- `FormStore<T>` → используйте `GroupNode<T>`
- `FieldController<T>` → используйте `FieldNode<T>`
- `DeepFormStore<T>` → используйте `GroupNode<T>`

**Архитектура таблиц** ([src/lib/tables/](src/lib/tables/)):
- `TableStore<T>`: Управляет состоянием таблицы (data, UI, config) через единый Signal
- Паттерны ресурсов для различных стратегий загрузки данных:
  - `server-paginated`: Серверная пагинация
  - `client-paginated`: Клиентская пагинация
  - `static`: Статические данные
  - `infinite-scroll`: Бесконечная прокрутка
  - `cached`: Кешированные данные с инвалидацией
  - `hybrid`: Смешанная клиент/сервер логика

**Domain-Driven структура** ([src/domains/](src/domains/)):
```
domains/
  users/
    _shared/services/    # Общие сервисы домена
    form/
      components/        # UI компоненты форм
      resources/         # Ресурсы для форм (select, search, file-uploader)
    table/
      components/        # UI компоненты таблиц
      resources/         # Ресурсы для таблиц (status, role)
      store/            # Доменно-специфичное хранилище таблицы
```

### Ключевые файлы

**Формы (новая архитектура)**:
- [src/lib/forms/core/nodes/form-node.ts](src/lib/forms/core/nodes/form-node.ts): Абстрактный базовый класс FormNode
- [src/lib/forms/core/nodes/field-node.ts](src/lib/forms/core/nodes/field-node.ts): FieldNode с валидацией и debounce
- [src/lib/forms/core/nodes/group-node.ts](src/lib/forms/core/nodes/group-node.ts): GroupNode с поддержкой вложенности
- [src/lib/forms/core/nodes/array-node.ts](src/lib/forms/core/nodes/array-node.ts): ArrayNode для массивов форм
- [src/lib/forms/validators/](src/lib/forms/validators/): Validation schema API
- [src/lib/forms/MIGRATION.md](src/lib/forms/MIGRATION.md): Руководство по миграции на новую архитектуру

**Формы (legacy, deprecated)**:
- [src/lib/forms/core/legacy/form-store.old.ts](src/lib/forms/core/legacy/form-store.old.ts): Старая реализация FormStore
- [src/lib/forms/core/legacy/field-controller.old.ts](src/lib/forms/core/legacy/field-controller.old.ts): Старая реализация FieldController

**Таблицы**:
- [src/lib/tables/store/TableStore.ts](src/lib/tables/store/TableStore.ts): TableStore с полным управлением состоянием таблицы

**Behavior Schema**:
- [src/lib/forms/behaviors/](src/lib/forms/behaviors/): Behavior Schema API
- [src/lib/forms/behaviors/schema-behaviors.ts](src/lib/forms/behaviors/schema-behaviors.ts): Декларативные функции (copyFrom, enableWhen, computeFrom и т.д.)
- [src/lib/forms/behaviors/behavior-registry.ts](src/lib/forms/behaviors/behavior-registry.ts): Регистрация и управление behaviors

**React Hooks**:
- [src/lib/forms/hooks/](src/lib/forms/hooks/): React хуки для форм
- [src/lib/forms/hooks/useFormEffect.ts](src/lib/forms/hooks/useFormEffect.ts): Базовый хук для реактивных эффектов
- [src/lib/forms/hooks/useComputedField.ts](src/lib/forms/hooks/useComputedField.ts): Вычисляемые поля
- [src/lib/forms/hooks/useCopyField.ts](src/lib/forms/hooks/useCopyField.ts): Копирование полей
- [src/lib/forms/hooks/useEnableWhen.ts](src/lib/forms/hooks/useEnableWhen.ts): Условное включение/выключение

**Примеры**:
- [src/examples/validation-example.ts](src/examples/validation-example.ts): Комплексные примеры API валидации
- [src/examples/behavior-schema-example.ts](src/examples/behavior-schema-example.ts): 8 примеров Behavior Schema API
- [src/examples/react-hooks-example.tsx](src/examples/react-hooks-example.tsx): 12 примеров React хуков
- [src/examples/group-node-config-example.ts](src/examples/group-node-config-example.ts): 7 примеров GroupNode с конфигурацией

### Path Aliases

Проект использует алиас `@/*` для `./src/*` (настроено в [tsconfig.json](tsconfig.json) и [vite.config.ts](vite.config.ts)).

### Примеры использования новой архитектуры форм

**Простая форма**:
```typescript
import { GroupNode, FieldNode } from '@/lib/forms';

const form = new GroupNode({
  email: {
    value: '',
    component: Input,
    validators: [Validators.required, Validators.email]
  },
  password: {
    value: '',
    component: Input,
    validators: [Validators.required, Validators.minLength(8)]
  },
});

// Прямой доступ к полям
form.email.setValue('test@mail.com');
console.log(form.email.value.value); // 'test@mail.com'

// Computed signals
console.log(form.valid.value); // false (если password пустой)

// Валидация
await form.validate();

// Submit
await form.submit(async (values) => {
  await api.login(values);
});
```

**Вложенные формы**:
```typescript
const form = new GroupNode({
  name: { value: '', component: Input },
  address: {
    city: { value: '', component: Input },
    street: { value: '', component: Input },
    zipCode: { value: '', component: Input },
  },
});

// Доступ к вложенным полям
form.address.city.setValue('Moscow');
console.log(form.address.city.value.value); // 'Moscow'
```

**Массивы форм**:
```typescript
const form = new GroupNode({
  items: [{
    title: { value: '', component: Input },
    price: { value: 0, component: Input },
  }],
});

// CRUD операции
form.items.push({ title: 'Item 1', price: 100 });
form.items.at(0)?.title.setValue('Updated Title');
form.items.removeAt(0);

// Итерация
form.items.forEach((item, index) => {
  console.log(item.title.value.value);
});

// Реактивность
console.log(form.items.length.value); // текущее количество
```

**Validation Schema**:
```typescript
import { createFieldPath, required, email, minLength } from '@/lib/forms/validators';

const validationSchema = (path: FieldPath<MyForm>) => {
  required(path.email, { message: 'Email обязателен' });
  email(path.email);
  minLength(path.password, 8);

  // Условная валидация
  applyWhen(path.loanType, (type) => type === 'mortgage', () => {
    required(path.propertyValue);
  });

  // Кросс-полевая валидация
  validateTree((ctx) => {
    const password = ctx.getField('password');
    const confirm = ctx.getField('confirmPassword');

    if (password !== confirm) {
      return { code: 'passwordMismatch', message: 'Пароли не совпадают' };
    }
    return null;
  }, { targetField: 'confirmPassword' });
};

form.applyValidationSchema(validationSchema);
```

**Behavior Schema**:
```typescript
import { copyFrom, enableWhen, computeFrom, watchField } from '@/lib/forms/behaviors';

const behaviorSchema = (path: FieldPath<MyForm>) => {
  // Копирование полей
  copyFrom(path.residenceAddress, path.registrationAddress, {
    when: (form) => form.sameAsRegistration === true
  });

  // Условное включение
  enableWhen(path.propertyValue, path.loanType, {
    condition: (type) => type === 'mortgage',
    resetOnDisable: true
  });

  // Вычисляемое поле
  computeFrom(
    path.initialPayment,
    [path.propertyValue],
    ({ propertyValue }) => propertyValue ? propertyValue * 0.2 : null
  );
};

form.applyBehaviorSchema(behaviorSchema);
```

**Новый API: GroupNode с автоматическим применением схем** (рекомендуется):
```typescript
// Способ 1: Старый API (обратная совместимость)
const simpleForm = new GroupNode({
  email: { value: '', component: Input },
  password: { value: '', component: Input },
});

// Способ 2: Новый API - все схемы в конструкторе
const fullForm = new GroupNode({
  form: {
    email: { value: '', component: Input },
    password: { value: '', component: Input },
    loanType: { value: '', component: Select },
    propertyValue: { value: null, component: Input },
  },
  behavior: (path) => {
    // Автоматически обрезаем пробелы
    computeFrom(path.email, [path.email], (values) => values[0]?.trim());

    // Условное включение поля
    enableWhen(path.propertyValue, path.loanType, {
      condition: (type) => type === 'mortgage',
      resetOnDisable: true
    });
  },
  validation: (path) => {
    required(path.email, { message: 'Email обязателен' });
    email(path.email);
    required(path.password);
    minLength(path.password, 8);

    // Условная валидация
    applyWhen(path.loanType, (type) => type === 'mortgage', () => {
      required(path.propertyValue, { message: 'Укажите стоимость' });
    });
  },
});

// Схемы применяются автоматически при создании формы!
```

**Преимущества нового API**:
- ✅ Все схемы (form, behavior, validation) в одном месте
- ✅ Автоматическое применение при создании формы
- ✅ Полная обратная совместимость (старый API работает)
- ✅ TypeScript автоматически определяет тип
- ✅ Декларативный стиль кода

**Примеры**:
- [src/examples/group-node-config-example.ts](src/examples/group-node-config-example.ts): 7 примеров использования нового API

## TODO List

**Завершено (2025-10-31)**:
- ✅ Архитектура FormNode (FormNode, FieldNode, GroupNode, ArrayNode)
- ✅ Вложенные формы и массивы
- ✅ Computed signals для производительности
- ✅ Параллельная async валидация с debounce
- ✅ Validation Schema API (вдохновлено Angular Signal Forms)
- ✅ Behavior Schema API - декларативное реактивное поведение
- ✅ React Hooks для форм (useFormEffect, useComputedField, useCopyField и т.д.)
- ✅ GroupNode с перегрузками конструктора (автоматическое применение схем)
- ✅ Прямой доступ к полям через Proxy
- ✅ Композиция validation схем
- ✅ Поддержка вложенных путей в ValidationContext

**Текущие приоритеты**:
- Мигрировать CreditApplicationForm на новую архитектуру
- Использовать ArrayNode для массивов (имущество, кредиты, созаемщики)
- Реализовать крупный пример с вложенными формами/массивами
- Добавить unit/integration тесты
- Исправить возвращаемые значения для компонентов Select, Search, Files
- Добавить базовые поля форм (DatePicker, period, Segment, Checkbox, Radio)
- Сделать компоненты таблицы независимыми
- Интеграция ресурсов в FieldNode (опционально)
