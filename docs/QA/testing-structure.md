# Организация тестов в проекте

## Текущая структура и проблемы

**Текущая конфигурация** ([vite.config.ts:28](../vite.config.ts#L28)):
```typescript
include: ['./src/tests/*.{test,spec}.?(c|m)[jt]s?(x)']
```

**Проблема**: Все тесты в одной плоской папке `src/tests/` - это неудобно при росте проекта.

---

## Рекомендуемая структура

### 1. Разделение по типам тестов

```
src/
├── tests/                          # Корневая папка для всех тестов
│   ├── unit/                       # Unit тесты
│   │   ├── forms/                  # Группировка по модулям
│   │   │   ├── core/
│   │   │   │   ├── array-node.test.ts
│   │   │   │   ├── field-node.test.ts
│   │   │   │   └── group-node.test.ts
│   │   │   ├── validators/
│   │   │   │   ├── validation-context.test.ts
│   │   │   │   ├── validation-registry.test.ts
│   │   │   │   └── schema-validators.test.ts
│   │   │   └── behaviors/
│   │   │       ├── behavior-registry.test.ts
│   │   │       ├── behavior-context.test.ts
│   │   │       └── schema-behaviors.test.ts
│   │   ├── tables/
│   │   │   ├── table-store.test.ts
│   │   │   └── resources/
│   │   │       ├── server-paginated.test.ts
│   │   │       └── client-paginated.test.ts
│   │   └── utils/
│   │       └── helpers.test.ts
│   │
│   ├── integration/                # Integration тесты
│   │   ├── forms/
│   │   │   ├── form-validation.integration.test.ts
│   │   │   └── form-behavior.integration.test.ts
│   │   └── tables/
│   │       └── table-pagination.integration.test.ts
│   │
│   ├── e2e/                        # E2E тесты
│   │   ├── credit-application/
│   │   │   ├── fill-form.e2e.test.ts
│   │   │   ├── validation.e2e.test.ts
│   │   │   └── submit.e2e.test.ts
│   │   ├── users/
│   │   │   ├── table-pagination.e2e.test.ts
│   │   │   └── table-filters.e2e.test.ts
│   │   └── fixtures/               # Test data для E2E
│   │       ├── credit-application-data.ts
│   │       └── user-data.ts
│   │
│   ├── helpers/                    # Утилиты для тестов
│   │   ├── test-utils.ts           # Общие helper функции
│   │   ├── mock-data.ts            # Моковые данные
│   │   ├── custom-matchers.ts      # Кастомные Vitest matchers
│   │   └── setup/
│   │       ├── unit-setup.ts       # Setup для unit тестов
│   │       ├── integration-setup.ts
│   │       └── e2e-setup.ts
│   │
│   └── Setup.ts                    # Глобальный setup (текущий)
```

---

## 2. Конфигурация Vitest

### Обновленный `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import type { UserConfig } from 'vite';
import type { InlineConfig } from 'vitest/node';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

type ViteConfig = UserConfig & { test: InlineConfig };

const config: ViteConfig = {
  plugins: [
    react({
      babel: {
        plugins: [['module:@preact/signals-react-transform']],
      }
    }),
    tailwindcss()
  ],

  test: {
    environment: 'jsdom',
    globals: true,

    // Разные конфигурации для разных типов тестов
    include: [
      './src/tests/unit/**/*.test.{ts,tsx}',
      './src/tests/integration/**/*.integration.test.{ts,tsx}',
    ],

    // E2E тесты отдельно (запускаются через npm run test:e2e)
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      './src/tests/e2e/**',
    ],

    // Setup файлы
    setupFiles: [
      './src/tests/Setup.ts',
    ],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts', 'src/domains/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/**',
        '**/__tests__/**',
      ],
    },

    watch: false,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './src/tests'),
    },
    extensions: ['.js', '.mjs', '.json', '.ts', '.tsx'],
  },
};

export default defineConfig(config);
```

---

## 3. Отдельные скрипты в `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",

    "test": "vitest",
    "test:unit": "vitest --run ./src/tests/unit",
    "test:integration": "vitest --run ./src/tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui"
  }
}
```

---

## 4. Конфигурация E2E тестов (Playwright)

### `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e',
  testMatch: '**/*.e2e.test.ts',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 5. Примеры организации тестов

### Unit тест (`src/tests/unit/forms/core/array-node.test.ts`):

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ArrayNode } from '@/lib/forms/core/nodes/array-node';
import { createMockSchema } from '@tests/helpers/mock-data';

describe('ArrayNode', () => {
  let arrayNode: ArrayNode<ItemForm>;

  beforeEach(() => {
    arrayNode = new ArrayNode(createMockSchema());
  });

  describe('CRUD operations', () => {
    it('should push new item', () => {
      // ...
    });
  });
});
```

### Integration тест (`src/tests/integration/forms/form-validation.integration.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { required, email } from '@/lib/forms/validators';

describe('Form Validation Integration', () => {
  it('should validate entire form with nested fields', async () => {
    const form = new GroupNode({
      form: { /* ... */ },
      validation: (path) => {
        required(path.email);
        email(path.email);
      },
    });

    const isValid = await form.validate();
    expect(isValid).toBe(false);
  });
});
```

### E2E тест (`src/tests/e2e/credit-application/fill-form.e2e.test.ts`):

```typescript
import { test, expect } from '@playwright/test';
import { creditApplicationData } from '../fixtures/credit-application-data';

test.describe('Credit Application Form', () => {
  test('should fill and submit form', async ({ page }) => {
    await page.goto('/credit-application');

    // Fill personal info
    await page.fill('[name="lastName"]', creditApplicationData.lastName);
    await page.fill('[name="firstName"]', creditApplicationData.firstName);

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

---

## 6. Test Helpers

### `src/tests/helpers/test-utils.ts`:

```typescript
import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import type { DeepFormSchema } from '@/lib/forms/types';

/**
 * Создать тестовую форму с дефолтными значениями
 */
export function createTestForm<T>(schema: DeepFormSchema<T>): GroupNode<T> {
  return new GroupNode(schema);
}

/**
 * Дождаться выполнения всех async валидаторов
 */
export async function waitForValidation(ms: number = 10): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Создать mock component для тестов
 */
export const mockComponent = null as any;
```

### `src/tests/helpers/custom-matchers.ts`:

```typescript
import { expect } from 'vitest';
import type { GroupNode } from '@/lib/forms/core/nodes/group-node';

/**
 * Кастомный matcher для проверки валидности формы
 */
expect.extend({
  toBeValidForm(received: GroupNode<any>) {
    const isValid = received.valid.value;
    return {
      pass: isValid,
      message: () =>
        isValid
          ? 'Expected form to be invalid'
          : `Expected form to be valid, but got errors: ${JSON.stringify(received.errors.value)}`,
    };
  },
});
```

---

## 7. Преимущества новой структуры

✅ **Масштабируемость**: Легко добавлять новые тесты в соответствующие категории

✅ **Изоляция**: Unit, integration и E2E тесты не мешают друг другу

✅ **Скорость**: Можно запускать только нужный тип тестов
```bash
npm run test:unit       # Быстро (~2s)
npm run test:integration # Средне (~10s)
npm run test:e2e        # Медленно (~1min)
```

✅ **Переиспользование**: Shared helpers, fixtures, mock data

✅ **CI/CD**: Разные pipeline для разных типов тестов
```yaml
# .github/workflows/test.yml
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:unit

  integration:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:integration

  e2e:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:e2e
```

✅ **Документация**: Структура тестов = документация архитектуры проекта

---

## 8. Миграция существующих тестов

### Шаги:

1. **Создать новую структуру папок**:
```bash
mkdir -p src/tests/unit/forms/core
mkdir -p src/tests/unit/forms/validators
mkdir -p src/tests/unit/forms/behaviors
mkdir -p src/tests/integration/forms
mkdir -p src/tests/e2e
mkdir -p src/tests/helpers
```

2. **Переместить существующие тесты**:
```bash
mv src/tests/array-node.test.ts src/tests/unit/forms/core/
mv src/tests/validation-context.test.ts src/tests/unit/forms/validators/
mv src/tests/behavior-registry.test.ts src/tests/unit/forms/behaviors/
```

3. **Обновить конфигурацию** в `vite.config.ts`:
```typescript
include: [
  './src/tests/unit/**/*.test.{ts,tsx}',
  './src/tests/integration/**/*.integration.test.{ts,tsx}',
],
```

4. **Обновить scripts** в `package.json`

5. **Запустить тесты** для проверки:
```bash
npm run test:unit
```

---

## Статус миграции

- ✅ Структура документирована
- ⏳ Папки созданы
- ⏳ Тесты перемещены
- ⏳ Конфигурация обновлена
- ⏳ Helpers созданы

---

## Текущая структура (после миграции)

```
src/tests/
├── unit/                                    # Unit тесты
│   ├── forms/
│   │   ├── core/
│   │   │   └── array-node.test.ts          ✅ 41 тест
│   │   ├── validators/
│   │   │   └── validation-context.test.ts  ✅ 16 тестов
│   │   └── behaviors/
│   │       └── behavior-registry.test.ts   ✅ 11 тестов
│   ├── example.test.ts                     ✅ 1 тест
│   └──  CopyrightWarning.test.tsx          ✅ 1 тест
│
├── integration/                             # Integration тесты (пусто)
├── e2e/                                     # E2E тесты (пусто)
│
├── helpers/                                 # Утилиты для тестов
│   ├── test-utils.ts                        ✅ Helper функции
│   ├── mock-data.ts                         ✅ Mock schemas и данные
│   ├── custom-matchers.ts                   ✅ Кастомные matchers
│   └── index.ts                             ✅ Barrel export
│
├── Setup.ts                                 ✅ Глобальный setup
└── TestUtils.ts                             ✅ Existing test utils
```

## Статус миграции: ✅ ЗАВЕРШЕНА

- ✅ Структура документирована
- ✅ Папки созданы
- ✅ Тесты перемещены
- ✅ Конфигурация обновлена (vite.config.ts, package.json)
- ✅ Helpers созданы (test-utils.ts, mock-data.ts, custom-matchers.ts)
- ✅ Все 70 тестов проходят успешно

## Доступные команды

```bash
npm test                  # Запустить все тесты (70 тестов)
npm run test:unit         # Запустить только unit тесты (68 тестов)
npm run test:integration  # Запустить только integration тесты (пока 0)
npm run test:coverage     # Запустить с coverage репортом
npm run test:watch        # Watch mode для разработки
npm run test:ui           # Vitest UI для визуального просмотра тестов
```
