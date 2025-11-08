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

## Правила разработки

### Документирование кода

**Обязательно документировать**:
- ✅ Все публичные классы, методы, функции
- ✅ Сложная бизнес-логика
- ✅ Нетривиальные алгоритмы
- ✅ Примеры использования (`@example` в JSDoc)

**Формат**: JSDoc с комментариями на **русском языке**

**Зачем**: Хорошая документация улучшает качество работы ИИ-ассистентов (Claude, Copilot) и упрощает понимание кода разработчиками.

**Пример**:
```typescript
/**
 * Узел формы для группы полей (объект)
 *
 * Поддерживает вложенность: может содержать FieldNode, GroupNode, ArrayNode.
 * Каждый экземпляр имеет собственные реестры валидации и поведения.
 *
 * @template T Тип значения группы (объект)
 *
 * @example
 * ```typescript
 * const form = new GroupNode({
 *   email: { value: '', component: Input },
 *   password: { value: '', component: Input }
 * });
 *
 * form.email.setValue('test@mail.com');
 * await form.validate();
 * ```
 */
export class GroupNode<T extends object> extends FormNode<T> {
  /**
   * Применяет validation схему к форме
   *
   * @param schemaFn Функция-схема валидации
   *
   * @example
   * ```typescript
   * form.applyValidationSchema((path) => {
   *   required(path.email, { message: 'Email обязателен' });
   *   email(path.email);
   * });
   * ```
   */
  applyValidationSchema(schemaFn: ValidationSchemaFn<T>): void {
    // ...
  }
}
```

### Принципы SOLID

При разработке следовать принципам:
- **SRP**: Один класс = одна ответственность (< 200 строк)
- **OCP**: Открыт для расширения, закрыт для изменения
- **LSP**: Подтипы должны быть взаимозаменяемы
- **ISP**: Интерфейсы разделены по ответственностям
- **DIP**: Зависимость от абстракций, не от конкретных классов

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

**Документация и планы**:
- [architecture-analysis.md](architecture-analysis.md): Анализ архитектурных проблем и рекомендации по рефакторингу
- [REFACTORING_PLAN.md](REFACTORING_PLAN.md): Детальный план рефакторинга в 4 фазы
- [class-diagram-clean.md](class-diagram-clean.md): Описание диаграммы классов библиотеки форм
- [class-diagram-clean.mmd](class-diagram-clean.mmd): Mermaid диаграмма классов (для draw.io)

**Формы (новая архитектура)**:
- [src/lib/forms/core/nodes/form-node.ts](src/lib/forms/core/nodes/form-node.ts): Абстрактный базовый класс FormNode
- [src/lib/forms/core/nodes/field-node.ts](src/lib/forms/core/nodes/field-node.ts): FieldNode с валидацией и debounce
- [src/lib/forms/core/nodes/group-node.ts](src/lib/forms/core/nodes/group-node.ts): GroupNode с поддержкой вложенности
- [src/lib/forms/core/nodes/array-node.ts](src/lib/forms/core/nodes/array-node.ts): ArrayNode для массивов форм
- [src/lib/forms/validators/](src/lib/forms/validators/): Validation schema API
- [src/lib/forms/MIGRATION.md](src/lib/forms/MIGRATION.md): Руководство по миграции на новую архитектуру

**Формы (реестры)**:
- [src/lib/forms/core/validators/validation-registry.ts](src/lib/forms/core/validators/validation-registry.ts): ValidationRegistry (Singleton → будет заменён на композицию)
- [src/lib/forms/core/behaviors/behavior-registry.ts](src/lib/forms/core/behaviors/behavior-registry.ts): BehaviorRegistry (Singleton → будет заменён на композицию)

**Таблицы**:
- [src/lib/tables/store/TableStore.ts](src/lib/tables/store/TableStore.ts): TableStore с полным управлением состоянием таблицы

**Behavior Schema**:
- [src/lib/forms/behaviors/](src/lib/forms/behaviors/): Behavior Schema API
- [src/lib/forms/behaviors/schema-behaviors.ts](src/lib/forms/behaviors/schema-behaviors.ts): Декларативные функции (copyFrom, enableWhen, computeFrom и т.д.)

**React Hooks**:
- [src/lib/forms/hooks/](src/lib/forms/hooks/): React хуки для форм
- [src/lib/forms/hooks/useFormEffect.ts](src/lib/forms/hooks/useFormEffect.ts): Базовый хук для реактивных эффектов
- [src/lib/forms/hooks/useComputedField.ts](src/lib/forms/hooks/useComputedField.ts): Вычисляемые поля
- [src/lib/forms/hooks/useCopyField.ts](src/lib/forms/hooks/useCopyField.ts): Копирование полей
- [src/lib/forms/hooks/useEnableWhen.ts](src/lib/forms/hooks/useEnableWhen.ts): Условное включение/выключение

**Примеры**:
- [src/examples/validation-example.ts](src/examples/validation-example.ts): Комплексные примеры Validation Schema API
- [src/examples/behavior-schema-example.ts](src/examples/behavior-schema-example.ts): Примеры Behavior Schema API
- [src/examples/react-hooks-example.tsx](src/examples/react-hooks-example.tsx): Примеры React хуков
- [src/examples/group-node-config-example.ts](src/examples/group-node-config-example.ts): Примеры GroupNode с конфигурацией

### Статус рефакторинга библиотеки форм

**Текущее состояние** (2025-01): Библиотека форм находится в процессе архитектурного рефакторинга.

**Проблемы текущей архитектуры** (см. [architecture-analysis.md](architecture-analysis.md)):

🔴 **Критичные**:
1. **God Class**: GroupNode имеет 30+ методов, смешивает 7+ ответственностей
2. **Singleton анти-паттерн**: ValidationRegistry/BehaviorRegistry — глобальное состояние, race conditions
3. **Дублирование**: парсинг путей в 4 местах, каждый узел дублирует disable/enable/markAs*

🟡 **Средние**:
4. **Ручное кеширование**: O(n) вместо computed signals
5. **7 методов behaviors**: без абстракции (нужен Strategy паттерн)
6. **Парсинг путей**: дублируется в 4 классах

🟢 **Желательные**:
7. **ISP нарушен**: FormNode имеет optional методы
8. **Управление подписками**: просто массив функций
9. **FieldNode перегружен**: смешивает валидацию, UI, состояние

**План рефакторинга** (см. [REFACTORING_PLAN.md](REFACTORING_PLAN.md)):

**Фаза 1** (в процессе): Централизация и инфраструктура
- ✅ Создать FieldPathNavigator (централизация парсинга путей)
- ⏳ Создать SubscriptionManager (управление подписками)
- ⏳ Перенести общую логику в FormNode (Template Method)

**Фаза 2**: Декомпозиция GroupNode
- NodeFactory (фабрика узлов)
- Заменить ручное кеширование на computed signals
- Интегрировать FieldPathNavigator

**Фаза 3**: Устранение Singleton → Композиция
- ValidationRegistry/BehaviorRegistry: убрать глобальное состояние
- GroupNode владеет собственными реестрами
- Полная изоляция форм

**Фаза 4**: Strategy паттерн и рефайнмент
- Strategy паттерн для BehaviorRegistry (7 стратегий)
- Разделение интерфейсов по ISP (опционально)
- Декомпозиция FieldNode (опционально)

**Ожидаемый результат**:
- GroupNode: ~500 строк → ~200 строк (**-60%**)
- Методов в GroupNode: 30+ → ~15 (**-50%**)
- Дублирование парсинга: 4 места → 1 место (**-75%**)
- BehaviorRegistry: ~500 строк → ~150 строк (**-70%**)
- Изоляция форм: ❌ → ✅ (**100%**)
- Покрытие тестами: ~30% → 100% (**+233%**)

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
import { apply, createFieldPath, required, email, minLength } from '@/lib/forms/core/validators';

const validationSchema = (path: FieldPath<MyForm>) => {
  required(path.email, { message: 'Email обязателен' });
  email(path.email);
  minLength(path.password, 8);

  // ✅ Композиция: применение одной схемы к нескольким полям
  apply([path.homeAddress, path.workAddress], addressValidation);

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
import { copyFrom, enableWhen, computeFrom, watchField } from '@/lib/forms/core/behaviors';

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

**Композиция behavior схем** (аналог toFieldPath из validation API):
```typescript
// address-behavior.ts - модульная схема
export const addressBehavior: BehaviorSchemaFn<Address> = (path) => {
  watchField(path.region, async (region, ctx) => {
    if (region) {
      const cities = await fetchCities(region);
      ctx.updateComponentProps(path.city, { options: cities });
    }
  }, { debounce: 300 });

  watchField(path.region, (region, ctx) => {
    ctx.setField('city', '');
  });
};

// user-behavior.ts - применение через композицию
import { apply, applyWhen, toBehaviorFieldPath } from '@/lib/forms/core/behaviors';

export const userBehavior: BehaviorSchemaFn<UserForm> = (path) => {
  // ✅ Применить одну схему к нескольким полям
  apply([path.homeAddress, path.workAddress, path.billingAddress], addressBehavior);

  // ✅ Применить несколько схем к одному полю
  apply(path.metadata, [slugBehavior, searchTermsBehavior]);

  // ✅ Условное применение
  applyWhen(
    path.hasShipping,
    (value) => value === true,
    (path) => {
      apply(path.shippingAddress, addressBehavior);
    }
  );

  // ✅ Вложенная композиция
  addressBehavior(toBehaviorFieldPath(path.headquarters.address));
};
```

**Преимущества композиции behavior схем**:
- ✅ **DRY**: Переиспользование behavior схем (например, addressBehavior для всех адресов)
- ✅ **Модульность**: Разделение логики по файлам (address-behavior.ts, metadata-behavior.ts)
- ✅ **Консистентность**: API аналогичен validation API (apply ↔ validate, applyWhen ↔ applyWhen)
- ✅ **Type-safe**: TypeScript проверяет совместимость типов
- ✅ **Масштабируемость**: Легко добавлять новые behavior схемы

**Примеры**:
- [src/examples/behavior-composition-example.ts](src/examples/behavior-composition-example.ts): 5 примеров композиции behavior схем
- [src/domains/credit-applications/form/schemas/behaviors/address-behavior.ts](src/domains/credit-applications/form/schemas/behaviors/address-behavior.ts): Реальный пример модульной схемы

**Композиция validation схем** (полный паритет с behavior API):
```typescript
// address-validation.ts - модульная схема
export const addressValidation: ValidationSchemaFn<Address> = (path) => {
  required(path.region, { message: 'Укажите регион' });
  required(path.city, { message: 'Укажите город' });
  required(path.street, { message: 'Укажите улицу' });
  required(path.house, { message: 'Укажите дом' });
  required(path.postalCode, { message: 'Укажите индекс' });
  pattern(path.postalCode, /^\d{6}$/, { message: '6 цифр' });
};

// user-validation.ts - применение через композицию
import { apply, applyWhen } from '@/lib/forms/core/validators';

export const userValidation: ValidationSchemaFn<UserForm> = (path) => {
  // ✅ Применить одну схему к нескольким полям
  apply([path.homeAddress, path.workAddress, path.billingAddress], addressValidation);

  // ✅ Применить несколько схем к одному полю
  apply(path.email, [emailBasicValidation, emailDomainValidation]);

  // ✅ Условное применение
  applyWhen(
    path.hasShipping,
    (value) => value === true,
    (path) => {
      apply(path.shippingAddress, addressValidation);
    }
  );
};
```

**Преимущества композиции validation схем**:
- ✅ **DRY**: Переиспользование validation схем (addressValidation для всех адресов)
- ✅ **Модульность**: Разделение логики по файлам (address-validation.ts, email-validation.ts)
- ✅ **Консистентность**: API идентичен behavior API (`apply`, `applyWhen`)
- ✅ **Type-safe**: TypeScript проверяет совместимость типов
- ✅ **Масштабируемость**: Легко добавлять новые validation схемы

**Сравнение До/После**:
```typescript
// До: ~50 строк дублирующегося кода
required(path.homeAddress.region, { message: '...' });
required(path.homeAddress.city, { message: '...' });
// ... ещё 20 строк для homeAddress
required(path.workAddress.region, { message: '...' });
required(path.workAddress.city, { message: '...' });
// ... ещё 20 строк для workAddress

// После: 1 строка
apply([path.homeAddress, path.workAddress], addressValidation);
```

**Примеры**:
- [src/examples/validation-composition-example.ts](src/examples/validation-composition-example.ts): 5 примеров композиции validation схем
- [src/domains/credit-applications/form/schemas/validation-modules/address-validation.ts](src/domains/credit-applications/form/schemas/validation-modules/address-validation.ts): Реальный пример модульной схемы
- [src/domains/credit-applications/form/schemas/validation/contact-info-validation.ts](src/domains/credit-applications/form/schemas/validation/contact-info-validation.ts): Использование apply в реальной форме

## TODO List

### Завершено (2025-10-31)

**Базовая архитектура**:
- ✅ Архитектура FormNode (FormNode, FieldNode, GroupNode, ArrayNode)
- ✅ Вложенные формы и массивы
- ✅ Computed signals для производительности
- ✅ Параллельная async валидация с debounce
- ✅ Прямой доступ к полям через Proxy

**Validation Schema API**:
- ✅ Validation Schema API (вдохновлено Angular Signal Forms)
- ✅ Синхронные/асинхронные валидаторы с контекстом
- ✅ Кросс-полевая валидация (validateTree)
- ✅ Условная валидация (applyWhen)
- ✅ Композиция схем (apply, toFieldPath, applyWhen)
- ✅ Поддержка вложенных путей в ValidationContext

**Behavior Schema API**:
- ✅ Behavior Schema API - декларативное реактивное поведение
- ✅ Декларативные функции (copyFrom, enableWhen, computeFrom и т.д.)
- ✅ Композиция behavior схем (apply, applyWhen, toBehaviorFieldPath)
- ✅ Полный паритет API между validation и behavior схемами

**React Integration**:
- ✅ React Hooks для форм (useFormEffect, useComputedField, useCopyField и т.д.)
- ✅ GroupNode с перегрузками конструктора (автоматическое применение схем)

**Документация**:
- ✅ Анализ архитектуры ([architecture-analysis.md](architecture-analysis.md))
- ✅ План рефакторинга ([REFACTORING_PLAN.md](REFACTORING_PLAN.md))
- ✅ Диаграмма классов ([class-diagram-clean.md](class-diagram-clean.md), [class-diagram-clean.mmd](class-diagram-clean.mmd))
- ✅ Примеры использования ([src/examples/](src/examples/))

---

### Рефакторинг (в процессе, 2025-01)

**Фаза 1: Централизация и инфраструктура** (в процессе):
- ✅ Создать FieldPathNavigator (централизация парсинга путей)
- ⏳ Создать SubscriptionManager (управление подписками)
- ⏳ Перенести общую логику в FormNode (Template Method паттерн)

**Фаза 2: Декомпозиция GroupNode**:
- ⏳ Создать NodeFactory (фабрика узлов)
- ⏳ Заменить ручное кеширование на computed signals
- ⏳ Интегрировать FieldPathNavigator в GroupNode/ValidationContext/BehaviorContext
- ⏳ Использовать SubscriptionManager во всех узлах

**Фаза 3: Устранение Singleton → Композиция**:
- ⏳ ValidationRegistry: убрать глобальное состояние (WeakMap, contextStack)
- ⏳ BehaviorRegistry: убрать глобальное состояние
- ⏳ GroupNode владеет собственными реестрами (композиция)
- ⏳ Обновить validation/behavior API

**Фаза 4: Strategy паттерн и рефайнмент**:
- ⏳ Strategy паттерн для BehaviorRegistry (7 стратегий)
- ⏳ Разделение интерфейсов FormNode по ISP (опционально)
- ⏳ Декомпозиция FieldNode (опционально)

**Критерии завершения рефакторинга**:
- [ ] GroupNode: ~500 строк → ~200 строк (-60%)
- [ ] Методов в GroupNode: 30+ → ~15 (-50%)
- [ ] Дублирование парсинга: 4 места → 1 место (-75%)
- [ ] BehaviorRegistry: ~500 строк → ~150 строк (-70%)
- [ ] Изоляция форм: ❌ → ✅ (100%)
- [ ] Покрытие тестами: ~30% → 100% (+233%)
- [ ] Все примеры работают
- [ ] npm run build проходит без ошибок
- [ ] Документация обновлена (JSDoc на русском)

---

### Бэклог (после рефакторинга)

**Формы**:
- Мигрировать CreditApplicationForm на новую архитектуру (использовать рефакторенный код)
- Использовать ArrayNode для массивов (имущество, кредиты, созаемщики)
- Реализовать крупный пример с вложенными формами/массивами
- Исправить возвращаемые значения для компонентов Select, Search, Files
- Добавить базовые поля форм (DatePicker, period, Segment, Checkbox, Radio)
- Интеграция ресурсов в FieldNode (опционально)

**Таблицы**:
- Сделать компоненты таблицы независимыми
- Рефакторинг TableStore (если потребуется)
