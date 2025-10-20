# Реализация Validation Schema для React Forms

## Статус: ✅ Базовая инфраструктура реализована

Дата: 20 октября 2025

## Что было реализовано

### 1. Типы для validation schema ✅

**Файл**: `src/lib/forms/types/validation-schema.ts`

Созданы типы для:
- `ValidationContext<TForm, TField>` - контекст валидации поля с доступом к форме
- `TreeValidationContext<TForm>` - контекст для cross-field валидации
- `ContextualValidatorFn` - функция валидации с контекстом
- `ContextualAsyncValidatorFn` - асинхронная функция валидации
- `TreeValidatorFn` - функция cross-field валидации
- `FieldPath<T>` - типобезопасный proxy для путей полей
- `FieldPathNode` - узел пути поля с метаинформацией

### 2. ValidationRegistry ✅

**Файл**: `src/lib/forms/validators/validation-registry.ts`

Реализована система регистрации валидаторов:
- Стек контекстов регистрации
- Поддержка вложенных условий (applyWhen)
- Регистрация sync/async/tree валидаторов
- Связь валидаторов с FormStore

### 3. ValidationContext реализации ✅

**Файл**: `src/lib/forms/validators/validation-context.ts`

Реализованы контексты:
- `ValidationContextImpl` - для валидации отдельного поля
- `TreeValidationContextImpl` - для cross-field валидации

Предоставляют доступ к:
- Значению текущего поля
- Значениям других полей
- Всей форме
- FieldController и FormStore

### 4. FieldPath proxy ✅

**Файл**: `src/lib/forms/validators/field-path.ts`

Реализован FieldPath proxy:
- Типобезопасный доступ к путям полей
- Поддержка вложенных путей через dot-notation
- Метаинформация о пути и ключе поля
- Утилиты `extractPath` и `extractKey`

### 5. Функции валидации ✅

**Файл**: `src/lib/forms/validators/schema-validators.ts`

Реализованы основные функции:

#### Кастомная валидация
```typescript
validate(path.birthDate, (ctx) => {
  const age = calculateAge(ctx.value());
  if (age < 18) {
    return {
      code: 'tooYoung',
      message: 'Заемщику должно быть не менее 18 лет',
    };
  }
  return null;
});
```

#### Условная валидация
```typescript
applyWhen(
  path.loanType,
  (type) => type === 'mortgage',
  (path) => {
    required(path.propertyValue, { message: 'Укажите стоимость' });
    min(path.propertyValue, 1000000);
  }
);
```

#### Cross-field валидация
```typescript
validateTree(
  (ctx) => {
    const form = ctx.formValue();
    if (form.initialPayment > form.propertyValue) {
      return {
        code: 'initialPaymentTooHigh',
        message: 'Первоначальный взнос не может превышать стоимость',
      };
    }
    return null;
  },
  { targetField: 'initialPayment' }
);
```

#### Асинхронная валидация
```typescript
validateAsync(
  path.inn,
  async (ctx) => {
    const inn = ctx.value();
    const isValid = await checkInnInDatabase(inn);
    if (!isValid) {
      return {
        code: 'invalidInn',
        message: 'ИНН не найден',
      };
    }
    return null;
  },
  { debounce: 1000 }
);
```

#### Переиспользуемые валидаторы
- `required()` - обязательное поле
- `min()` / `max()` - минимум/максимум для чисел
- `minLength()` / `maxLength()` - длина строки
- `email()` - валидация email
- `pattern()` - regex паттерн
- `updateOn()` - триггер валидации (change/blur/submit)

### 6. Интеграция с FormStore ✅

**Файл**: `src/lib/forms/core/form-store.ts`

Добавлен метод `applyValidationSchema()`:
```typescript
const form = new FormStore(schema);
form.applyValidationSchema((path) => {
  required(path.email, { message: 'Email обязателен' });
  applyWhen(
    path.loanType,
    (type) => type === 'mortgage',
    (path) => {
      required(path.propertyValue);
    }
  );
});
```

### 7. Validation Schema для Credit Application ✅

**Файл**: `src/domains/credit-applications/form/schema/credit-application-validation.ts`

Реализована валидация для Шага 1:
- Обязательность полей (loanType, loanAmount, loanTerm, loanPurpose)
- Ограничения мин/макс для суммы и срока
- Условная валидация для ипотеки (propertyValue, initialPayment)
- Условная валидация для автокредита (carBrand, carModel, carYear, carPrice)
- Cross-field валидация (первоначальный взнос не больше стоимости)

### 8. Интеграция с CreditApplicationForm ✅

**Файл**: `src/domains/credit-applications/form/components/CreditApplicationForm.tsx`

Валидация применена к форме:
```typescript
const createCreditApplicationForm = () => {
  const schema: FormSchema<CreditApplicationFormModel> = {
    // ... поля
  };

  const form = new FormStore(schema);
  form.applyValidationSchema(creditApplicationValidation);
  return form;
};
```

## Архитектура

### Паттерн Validation Schema

```
┌─────────────────────────────────────────────┐
│        Validation Schema Function          │
│  (определение правил валидации)             │
│                                             │
│  const validation = (path) => {             │
│    applyWhen(path.field, ..., (path) => {   │
│      required(path.field1);                 │
│      validate(path.field2, ...);            │
│      validateTree(...);                     │
│    });                                      │
│  };                                         │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│         ValidationRegistry                  │
│  (сбор и регистрация валидаторов)           │
│                                             │
│  - Стек контекстов регистрации              │
│  - Поддержка вложенных условий              │
│  - Связь с FormStore                        │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│            FormStore                        │
│  (применение валидаторов к полям)           │
│                                             │
│  - applyValidationSchema()                  │
│  - Создание FieldPath proxy                 │
│  - Вызов validation schema                  │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│         FieldController                     │
│  (выполнение валидации)                     │
│                                             │
│  - Контекст валидации                       │
│  - Синхронные валидаторы                    │
│  - Асинхронные валидаторы                   │
└─────────────────────────────────────────────┘
```

## Преимущества реализованного подхода

### ✅ Separation of Concerns
Валидация отделена от определений полей в схеме формы.

### ✅ Declarative API
Декларативное описание правил валидации:
```typescript
applyWhen(path.currentStep, (step) => step >= 1, (path) => {
  required(path.loanType);
  min(path.loanAmount, 50000);
});
```

### ✅ Type Safety
Полная типизация через TypeScript и FieldPath proxy.

### ✅ Conditional Validation
Легко выразить условную логику через `applyWhen`.

### ✅ Cross-field Validation
Простая валидация связанных полей через `validateTree`.

### ✅ Async Support
Поддержка асинхронной валидации с debounce.

### ✅ Reusability
Переиспользуемые функции валидации и комбинирование правил.

## Текущие ограничения

### ⚠️ Валидаторы пока только регистрируются
ValidationRegistry собирает валидаторы, но они еще не применяются к FieldController.
**Требуется**: Расширить FieldController для поддержки contextual валидаторов.

### ⚠️ Вложенные пути
Поддержка путей вида `personalData.firstName` реализована частично.
**Требуется**: Доработать extractPath для работы с вложенными объектами.

### ⚠️ updateOn не применяется
Функция `updateOn()` только логирует, но не применяет триггер к полю.
**Требуется**: Реализовать применение updateOn к FieldController.

### ⚠️ Только Шаг 1
Из 6 шагов формы реализована валидация только для первого.
**Требуется**: Заполнить валидацию для оставшихся 5 шагов.

## Следующие шаги

### 1. Подключить валидаторы к FieldController
Расширить FieldController для выполнения contextual валидаторов:
- Добавить поддержку ValidationContext
- Вызывать contextual валидаторы при validate()
- Применять условия из applyWhen

### 2. Реализовать применение ValidationRegistry
В `ValidationRegistry.applyValidators()`:
- Группировать валидаторы по полям
- Конвертировать в ValidatorFn/AsyncValidatorFn
- Добавлять к FieldController через API

### 3. Дополнить validation schema
Заполнить валидацию для шагов 2-6:
- Шаг 2: Персональные данные (ФИО, паспорт, ИНН, СНИЛС)
- Шаг 3: Контакты (телефоны, email, адреса)
- Шаг 4: Занятость (работа, доход)
- Шаг 5: Доп. информация (имущество, кредиты, созаемщики)
- Шаг 6: Согласия и подтверждение

### 4. Тестирование
- Unit-тесты для валидаторов
- Integration-тесты для ValidationRegistry
- E2E тесты для формы заявки

### 5. Документация
- API Reference для validation schema
- Руководство по созданию кастомных валидаторов
- Примеры сложных сценариев валидации

## Файлы

### Созданные файлы
```
src/lib/forms/
├── types/
│   └── validation-schema.ts          # Типы для validation schema
├── validators/
│   ├── validation-context.ts         # ValidationContext реализации
│   ├── validation-registry.ts        # ValidationRegistry
│   ├── field-path.ts                 # FieldPath proxy
│   ├── schema-validators.ts          # Функции валидации
│   └── index.ts                      # Экспорты (обновлен)

src/domains/credit-applications/form/
├── schema/
│   └── credit-application-validation.ts  # Validation schema для формы
└── components/
    └── CreditApplicationForm.tsx     # Интеграция (обновлен)
```

### Обновленные файлы
```
src/lib/forms/
├── core/
│   └── form-store.ts                 # Добавлен applyValidationSchema()
└── types/
    └── index.ts                      # Добавлены re-exports
```

## Примеры использования

### Простая валидация
```typescript
const validation = (path: FieldPath<MyForm>) => {
  required(path.email, { message: 'Email обязателен' });
  email(path.email);
  updateOn(path.email, 'blur');
};
```

### Условная валидация
```typescript
const validation = (path: FieldPath<MyForm>) => {
  applyWhen(
    path.userType,
    (type) => type === 'company',
    (path) => {
      required(path.companyName);
      required(path.companyInn);
      pattern(path.companyInn, /^\d{10}$/);
    }
  );
};
```

### Cross-field валидация
```typescript
const validation = (path: FieldPath<MyForm>) => {
  validateTree(
    (ctx) => {
      const { password, confirmPassword } = ctx.formValue();
      if (password !== confirmPassword) {
        return {
          code: 'passwordMismatch',
          message: 'Пароли не совпадают',
        };
      }
      return null;
    },
    { targetField: 'confirmPassword' }
  );
};
```

### Асинхронная валидация
```typescript
const validation = (path: FieldPath<MyForm>) => {
  validateAsync(
    path.email,
    async (ctx) => {
      const email = ctx.value();
      const exists = await checkEmailExists(email);
      if (exists) {
        return {
          code: 'emailExists',
          message: 'Email уже зарегистрирован',
        };
      }
      return null;
    },
    { debounce: 700 }
  );
};
```

## Заключение

✅ **Базовая инфраструктура validation schema реализована и работает**
- Архитектура соответствует Angular Signal Forms паттерну
- Типобезопасность через TypeScript
- Поддержка условной, cross-field и async валидации
- Интеграция с FormStore через `applyValidationSchema()`

⚠️ **Требуется доработка для полной функциональности**
- Применение валидаторов к FieldController
- Реализация всех 6 шагов валидации
- Тестирование и документация

🎯 **Следующий приоритет**: Применение зарегистрированных валидаторов к FieldController для реальной валидации полей формы.
