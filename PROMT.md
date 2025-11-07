# Задача: Реализовать метод getErrors() с фильтрацией

## Контекст

Ты опытный Senior Frontend Architect, специализирующийся на TypeScript, React и архитектуре библиотек форм.

Работаешь с библиотекой форм на основе `@preact/signals-react`, которая использует архитектуру `FormNode` → `FieldNode`, `GroupNode`, `ArrayNode`.

## Текущая архитектура

### Иерархия классов

```
FormNode (abstract base class)
├── FieldNode<T> - одно поле
├── GroupNode<T> - группа полей (объект)
└── ArrayNode<T> - массив форм
```

### Существующий API ошибок в GroupNode

**Файл**: `src/lib/forms/core/nodes/group-node.ts`

```typescript
export class GroupNode<T> extends FormNode<T> {
  // Computed signal - собирает ошибки со всех дочерних полей
  public readonly errors: ReadonlySignal<ValidationError[]> = computed(() => {
    const allErrors: ValidationError[] = [];
    this.fields.forEach((field) => {
      allErrors.push(...field.errors.value);
    });
    return allErrors;
  });

  // Метод для установки ошибок (пока не реализован)
  setErrors(errors: ValidationError[]): void {
    // GroupNode errors - можно реализовать позже для form-level ошибок
  }

  // Очистка ошибок
  clearErrors(): void {
    this.fields.forEach((field) => field.clearErrors());
  }
}
```

### Интерфейс ValidationError

**Файл**: `src/lib/forms/types/index.ts`

```typescript
export interface ValidationError {
  code: string;           // Код ошибки (например: 'required', 'email', 'minLength')
  message: string;        // Сообщение для пользователя
  params?: Record<string, any>;  // Дополнительные параметры (например: minLength: 8)
}
```

## Задача

Реализовать метод `getErrors()` в классе `GroupNode` согласно описанию из [docs/CODE_REVIEW.md](docs/CODE_REVIEW.md#14-добавить-метод-geterrors-с-фильтрацией).

### Требования к методу

**Сигнатура**:
```typescript
getErrors(filter?: {
  fields?: Array<keyof T>;
  codes?: string[];
}): ValidationError[]
```

**Функциональность**:

1. **Без фильтра** - возвращает все ошибки формы (аналогично `errors.value`)
2. **Фильтр по полям** - возвращает только ошибки указанных полей
3. **Фильтр по кодам** - возвращает только ошибки с указанными кодами
4. **Комбинированный фильтр** - оба фильтра работают одновременно (AND логика)

### Проблема: Определение поля по ошибке

**Текущая проблема**: ValidationError не содержит информацию о том, к какому полю относится ошибка.

**Решения** (выбери одно):

**Вариант 1**: Расширить ValidationError (Breaking change):
```typescript
export interface ValidationError {
  code: string;
  message: string;
  params?: Record<string, any>;
  field?: string;  // ✅ Добавить опциональное поле
}
```

**Вариант 2**: Собирать ошибки с метаданными в getErrors():
```typescript
interface ErrorWithField extends ValidationError {
  fieldKey: keyof T;
  fieldPath: string;
}
```

**Вариант 3**: Использовать params для хранения field:
```typescript
// При создании ошибки
{
  code: 'required',
  message: 'Email is required',
  params: { field: 'email' }  // ✅ Использовать params
}
```

**Рекомендация**: Вариант 3 (обратная совместимость, не требует изменений существующих валидаторов)

## Примеры использования

### Пример 1: Получить все ошибки
```typescript
const form = new GroupNode<UserForm>({ /* ... */ });

// Все ошибки
const allErrors = form.getErrors();
// Результат: [{ code: 'required', message: 'Email is required' }, ...]
```

### Пример 2: Фильтр по полям
```typescript
// Ошибки только для email и password
const loginErrors = form.getErrors({
  fields: ['email', 'password']
});
// Результат: только ошибки этих двух полей
```

### Пример 3: Фильтр по кодам
```typescript
// Только критичные ошибки
const criticalErrors = form.getErrors({
  codes: ['required', 'invalid_format']
});
// Результат: только ошибки с этими кодами
```

### Пример 4: Комбинированный фильтр
```typescript
// Ошибки 'required' только для email и password
const requiredLoginErrors = form.getErrors({
  fields: ['email', 'password'],
  codes: ['required']
});
```

### Пример 5: Вложенные формы
```typescript
interface Form {
  user: {
    email: string;
    password: string;
  };
  terms: boolean;
}

// ❓ Как фильтровать ошибки вложенных полей?
// Вариант 1: Только top-level keys
form.getErrors({ fields: ['user', 'terms'] });

// Вариант 2: Поддержка path notation
form.getErrors({ fields: ['user.email'] as any });

// Рекомендация: Начать с Варианта 1 (проще), добавить Вариант 2 позже
```

## План реализации

### Шаг 1: Добавить метод getErrors() в GroupNode

**Файл**: `src/lib/forms/core/nodes/group-node.ts`

```typescript
/**
 * Получить ошибки с опциональной фильтрацией
 *
 * @param filter - Параметры фильтрации
 * @param filter.fields - Список полей для фильтрации
 * @param filter.codes - Список кодов ошибок для фильтрации
 * @returns Массив ошибок валидации
 *
 * @example
 * ```typescript
 * // Все ошибки
 * const allErrors = form.getErrors();
 *
 * // Ошибки конкретных полей
 * const loginErrors = form.getErrors({ fields: ['email', 'password'] });
 *
 * // Ошибки по кодам
 * const requiredErrors = form.getErrors({ codes: ['required'] });
 *
 * // Комбинированный фильтр
 * const errors = form.getErrors({
 *   fields: ['email'],
 *   codes: ['required', 'email']
 * });
 * ```
 */
getErrors(filter?: {
  fields?: Array<keyof T>;
  codes?: string[];
}): ValidationError[] {
  // TODO: Реализовать
}
```

### Шаг 2: Реализовать логику фильтрации

**Подзадачи**:
1. Если filter отсутствует → вернуть `this.errors.value`
2. Собрать ошибки с информацией о полях
3. Применить фильтр по полям (если указан)
4. Применить фильтр по кодам (если указан)
5. Вернуть отфильтрованный массив

### Шаг 3: Добавить unit тесты

**Файл**: `src/tests/unit/forms/group-node.test.ts` (или создать новый файл)

**Сценарии тестирования**:
1. getErrors() без фильтра возвращает все ошибки
2. getErrors({ fields: [...] }) возвращает только ошибки указанных полей
3. getErrors({ codes: [...] }) возвращает только ошибки с указанными кодами
4. getErrors({ fields: [...], codes: [...] }) комбинированный фильтр (AND)
5. getErrors() возвращает пустой массив если нет ошибок
6. getErrors({ fields: ['nonexistent'] }) возвращает пустой массив

### Шаг 4: Добавить JSDoc с примерами

Убедись, что JSDoc комментарий содержит:
- Описание метода
- Описание параметров
- Примеры использования (минимум 3)
- @returns описание

## Критерии приемки

### Функциональные требования

✅ Метод getErrors() реализован в GroupNode
✅ Работает фильтрация по полям (fields)
✅ Работает фильтрация по кодам (codes)
✅ Комбинированная фильтрация работает корректно (AND логика)
✅ Без фильтра возвращает все ошибки
✅ Возвращает пустой массив если нет ошибок или нет совпадений

### Технические требования

✅ TypeScript компилируется без ошибок
✅ Type-safe: TypeScript проверяет типы полей в filter.fields
✅ Нет использования `any` (кроме обоснованных случаев)
✅ Код соответствует стилю проекта
✅ JSDoc комментарий с примерами

### Тестирование

✅ Минимум 6 unit тестов для всех сценариев
✅ Все тесты проходят (`npm test`)
✅ Test coverage для нового метода: 100%

## Дополнительные материалы

**Ссылки на файлы**:
- [group-node.ts](src/lib/forms/core/nodes/group-node.ts) - класс для модификации
- [types/index.ts](src/lib/forms/types/index.ts) - интерфейс ValidationError
- [CODE_REVIEW.md](docs/CODE_REVIEW.md#14) - оригинальное описание задачи

**Примеры валидаторов** (для понимания структуры ошибок):
- [validators/common-validators.ts](src/lib/forms/validators/common-validators.ts)

## Вопросы для уточнения

Перед началом реализации ответь на эти вопросы:

1. Какой вариант для определения поля по ошибке выбрать? (Рекомендация: Вариант 3 через params)
2. Поддерживать ли вложенные пути в filter.fields? (Рекомендация: Начать без поддержки, добавить позже)
3. Нужно ли добавлять аналогичный метод в FieldNode и ArrayNode? (Рекомендация: Да, для консистентности API)

## Примечания

- Используй русские комментарии в коде (стиль проекта)
- Следуй существующим паттернам кодирования в group-node.ts
- Не забудь обновить exports если добавляешь новые типы