# Статус реализации валидации для Credit Application Form

## Выполнено ✓

### 1. Исправлен неправильный подход
- ❌ **Удален неправильный подход**: Валидаторы были удалены из определений полей в схеме
- ✓ **Создана правильная структура**: Validation schema в отдельном файле

### 2. Файлы

**Исправленный файл:**
- `src/domains/credit-applications/form/components/CreditApplicationForm.tsx`
  - Удалены импорты валидаторов
  - Удалены массивы `validators` из всех полей (loanType, loanAmount, loanTerm, loanPurpose)

**Созданные файлы:**
- `src/domains/credit-applications/form/schema/credit-application-validation.ts`
  - Skeleton validation schema следуя паттерну из примера
  - Структура готова для реализации
  - Содержит TODO комментарии с примерами использования

**Существующие файлы (не изменены):**
- `src/domains/credit-applications/form/validators/credit-validators.ts`
  - Библиотека переиспользуемых валидаторов
  - Готова к использованию

## Требуется реализация ⏸️

### Инфраструктура валидации в библиотеке форм

Для полноценной реализации validation schema паттерна необходимо добавить в `src/lib/forms/`:

#### 1. Функции условной валидации

```typescript
// src/lib/forms/validators/applyWhen.ts
export function applyWhen<T, K extends keyof T>(
  fieldPath: FieldPath<T>[K],
  condition: (value: T[K]) => boolean,
  validationFn: (path: FieldPath<T>) => void
): void;
```

**Назначение**: Применяет валидацию только при выполнении условия
**Пример использования**: Валидация полей ипотеки только когда `loanType === 'mortgage'`

#### 2. Cross-field валидация

```typescript
// src/lib/forms/validators/validateTree.ts
export function validateTree<T>(
  validatorFn: (ctx: ValidationContext<T>) => ValidationError | null,
  options?: { targetField?: string }
): void;
```

**Назначение**: Валидация с доступом ко всем полям формы
**Пример использования**: Проверка что `workExperienceCurrent <= workExperienceTotal`

#### 3. Асинхронная валидация

```typescript
// src/lib/forms/validators/validateAsync.ts
export function validateAsync<T, K extends keyof T>(
  fieldPath: FieldPath<T>[K],
  asyncValidatorFn: (ctx: AsyncValidationContext<T>) => Promise<ValidationError | null>,
  options?: { debounce?: number }
): void;
```

**Назначение**: Валидация с асинхронными проверками (API calls)
**Пример использования**: Проверка существования email в базе данных

#### 4. Кастомная валидация

```typescript
// src/lib/forms/validators/validate.ts
export function validate<T, K extends keyof T>(
  fieldPath: FieldPath<T>[K],
  validatorFn: (ctx: ValidationContext<T>) => ValidationError | null
): void;
```

**Назначение**: Произвольная логика валидации поля
**Пример использования**: Проверка возраста на основе даты рождения

#### 5. Update triggers

```typescript
// src/lib/forms/validators/updateOn.ts
export function updateOn<T, K extends keyof T>(
  fieldPath: FieldPath<T>[K],
  trigger: 'change' | 'blur' | 'submit'
): void;
```

**Назначение**: Управление триггерами валидации поля
**Пример использования**: `updateOn(path.email, 'blur')` - валидировать email только при потере фокуса

#### 6. Контекст валидации

```typescript
// src/lib/forms/validators/types.ts
export interface ValidationContext<T> {
  value(): any;
  getField(path: string): any;
  formValue(): T;
}

export interface AsyncValidationContext<T> extends ValidationContext<T> {
  // Дополнительные методы для async валидации
}

export interface ValidationError {
  code: string;
  message: string;
  params?: Record<string, any>;
}
```

### Интеграция validation schema с FormStore

После реализации инфраструктуры, нужно интегрировать schema с FormStore:

```typescript
// В CreditApplicationForm.tsx
import creditApplicationValidation from '../schema/credit-application-validation';

const createCreditApplicationForm = () => {
  const schema: FormSchema<CreditApplicationFormModel> = {
    // ... определения полей
  };

  const form = new FormStore(schema);

  // Применяем validation schema
  creditApplicationValidation(form.fieldPath);

  return form;
};
```

## Следующие шаги

1. **Изучить архитектуру Angular Signal Forms** для понимания полной картины
2. **Реализовать базовую инфраструктуру валидации**:
   - `applyWhen` для условной валидации
   - `validate` для кастомных валидаторов
   - `validateTree` для cross-field валидации
   - `validateAsync` для асинхронных проверок
   - `updateOn` для управления триггерами

3. **Добавить поддержку в FormStore**:
   - FieldPath proxy для доступа к путям полей
   - ValidationContext для валидаторов
   - Метод для применения validation schema

4. **Реализовать validation schema**:
   - Заполнить TODO в `credit-application-validation.ts`
   - Добавить все 6 шагов валидации
   - Протестировать условную и cross-field валидацию

5. **Тестирование**:
   - Unit-тесты для валидаторов
   - Integration-тесты для validation schema
   - E2E тесты для всего процесса заявки

## Преимущества нового подхода

✅ **Separation of Concerns**: Валидация отделена от определения полей
✅ **Reusability**: Переиспользуемые валидаторы и validation functions
✅ **Conditional Logic**: Легко выразить сложную условную логику
✅ **Cross-field Validation**: Простая валидация связанных полей
✅ **Testability**: Validation schema легко тестировать изолированно
✅ **Maintainability**: Вся бизнес-логика валидации в одном месте

## Ссылки

- **Пример реализации**: `docs/signals-in-angular/CREDIT_APPLICATION_EXAMPLE.md`
- **Validation schema**: `src/domains/credit-applications/form/schema/credit-application-validation.ts`
- **Валидаторы**: `src/domains/credit-applications/form/validators/credit-validators.ts`
- **Форма**: `src/domains/credit-applications/form/components/CreditApplicationForm.tsx`
