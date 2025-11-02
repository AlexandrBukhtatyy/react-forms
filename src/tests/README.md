# Тесты проекта

Этот проект использует [Vitest](https://vitest.dev/) для unit и integration тестов.

## Структура тестов

```
src/tests/
├── unit/           # Unit тесты - изолированное тестирование отдельных модулей
├── integration/    # Integration тесты - тестирование взаимодействия модулей
├── e2e/            # E2E тесты - end-to-end тестирование (Playwright)
└── helpers/        # Общие утилиты для тестов
```

## Запуск тестов

```bash
# Запустить все тесты
npm test

# Запустить только unit тесты
npm run test:unit

# Запустить только integration тесты
npm run test:integration

# Запустить с coverage репортом
npm run test:coverage

# Watch mode для разработки
npm run test:watch

# Vitest UI
npm run test:ui
```

## Написание тестов

### Unit тест

Создайте файл в `src/tests/unit/` с расширением `.test.ts` или `.test.tsx`:

```typescript
// src/tests/unit/forms/core/example.test.ts
import { describe, it, expect } from 'vitest';
import { createTestForm, mockComponent } from '@tests/helpers';

describe('ExampleComponent', () => {
  it('should work correctly', () => {
    const form = createTestForm({
      email: { value: '', component: mockComponent },
    });

    expect(form.email.value.value).toBe('');
  });
});
```

### Integration тест

Создайте файл в `src/tests/integration/` с расширением `.integration.test.ts`:

```typescript
// src/tests/integration/forms/example.integration.test.ts
import { describe, it, expect } from 'vitest';
import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { required } from '@/lib/forms/validators';

describe('Form Validation Integration', () => {
  it('should validate entire form', async () => {
    const form = new GroupNode({
      form: {
        email: { value: '', component: null as any },
      },
      validation: (path) => {
        required(path.email);
      },
    });

    const isValid = await form.validate();
    expect(isValid).toBe(false);
  });
});
```

## Test Helpers

Доступны готовые утилиты для тестов:

```typescript
import {
  // Создание форм
  createTestForm,
  createTestArray,

  // Утилиты
  waitForValidation,
  waitForDebounce,
  mockComponent,

  // Проверки
  isFormValid,
  hasFormErrors,
  getErrorCount,

  // Mock данные
  createLoginSchema,
  validLoginData,
  invalidLoginData,

  // Custom matchers
} from '@tests/helpers';

// Использование
const form = createTestForm(createLoginSchema());
expect(form).toBeValidForm();
expect(form).toHaveErrors(2);
```

## Кастомные Matchers

Доступны специальные matchers для форм:

```typescript
// Проверка валидности
expect(form).toBeValidForm();
expect(form).toBeInvalidForm();

// Проверка ошибок
expect(form).toHaveErrors();        // Любое количество > 0
expect(form).toHaveErrors(2);       // Ровно 2 ошибки
expect(form).toHaveFieldError('email');

// Проверка состояния
expect(form).toBeTouched();
expect(form).toBeDirty();
```

## Best Practices

1. **Используйте helpers**: Не создавайте формы вручную, используйте `createTestForm()` и `createTestArray()`

2. **Mock component**: Всегда используйте `mockComponent` для поля `component` в тестах

3. **Async валидация**: Используйте `waitForValidation()` после вызова async валидаторов

4. **Группировка**: Используйте `describe` блоки для группировки связанных тестов

5. **Чистота**: Используйте `beforeEach` для создания чистого состояния перед каждым тестом

6. **Читаемость**: Используйте понятные имена тестов в формате "should do something"

## Примеры

Смотрите примеры в:
- [src/tests/unit/forms/core/array-node.test.ts](unit/forms/core/array-node.test.ts) - 41 тест для ArrayNode
- [src/tests/unit/forms/validators/validation-context.test.ts](unit/forms/validators/validation-context.test.ts) - 16 тестов для ValidationContext
- [src/tests/unit/forms/behaviors/behavior-registry.test.ts](unit/forms/behaviors/behavior-registry.test.ts) - 11 тестов для BehaviorRegistry

## Coverage

Для генерации coverage репорта:

```bash
npm run test:coverage
```

Репорт будет доступен в `coverage/index.html`

## Отладка тестов

### VS Code

Добавьте в `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Current Test File",
  "autoAttachChildProcesses": true,
  "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
  "program": "${workspaceRoot}/node_modules/vitest/vitest.mjs",
  "args": ["run", "${relativeFile}"],
  "smartStep": true,
  "console": "integratedTerminal"
}
```

### Browser UI

Используйте Vitest UI для визуальной отладки:

```bash
npm run test:ui
```

Откроется браузер с интерактивным интерфейсом для запуска и отладки тестов.

## CI/CD

В CI рекомендуется запускать тесты в таком порядке:

```bash
# 1. Unit тесты (быстро)
npm run test:unit

# 2. Integration тесты (средне)
npm run test:integration

# 3. Coverage (для отчетности)
npm run test:coverage
```

## Дополнительная информация

- [Документация по организации тестов](../../docs/testing-structure.md)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
