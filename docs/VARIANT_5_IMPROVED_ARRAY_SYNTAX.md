# Вариант 5: Улучшенный синтаксис массивов (без type: 'array')

> **Автоматическое определение массивов на основе TypeScript типов**
> **Дата**: 2025-10-21

---

## Концепция

Убираем необходимость явно указывать `type: 'array'` и `factory`. Вместо этого используем **автоматическое определение** на основе TypeScript типов:

- Если тип поля `T[]` (массив), то это FormArray
- Если тип поля `object`, то это FormGroup
- Иначе это обычное поле

---

## Синтаксис: До и После

### ❌ Старый синтаксис (с type)

```typescript
const schema = {
  properties: {
    type: 'array',  // ❌ Избыточно
    factory: {      // ❌ Лишний уровень вложенности
      type: { value: 'apartment', component: Select },
      description: { value: '', component: Textarea },
    },
    initial: [],
  },
};
```

### ✅ Новый синтаксис (автоматический)

```typescript
const schema = {
  // Просто массив с одним элементом - схемой для элементов!
  properties: [{
    type: { value: 'apartment', component: Select },
    description: { value: '', component: Textarea },
  }],
};
```

---

## Полная схема формы с новым синтаксисом

```typescript
// src/domains/credit-applications/form/schema/credit-form-schema-v5-improved.ts

import type { DeepFormSchema } from '@/lib/forms/types';
import type { CreditApplicationForm } from '../_shared/types/credit-application';
import { Input, Select, Textarea, Checkbox } from '@/lib/forms/components';
import {
  LOAN_TYPES,
  EMPLOYMENT_STATUSES,
  PROPERTY_TYPES,
  GENDERS,
} from '../_shared/constants/credit-application';

export const creditApplicationSchema: DeepFormSchema<CreditApplicationForm> = {
  // Метаданные
  currentStep: {
    value: 1,
    component: () => null,
  },
  completedSteps: {
    value: [],
    component: () => null,
  },

  // ========================================================================
  // Step 1: Основная информация
  // ========================================================================

  loanType: {
    value: 'consumer',
    component: Select,
    componentProps: { label: 'Тип кредита', options: LOAN_TYPES },
  },

  loanAmount: {
    value: 0,
    component: Input,
    componentProps: {
      label: 'Сумма кредита (₽)',
      type: 'number',
      min: 50000,
    },
  },

  loanTerm: {
    value: 12,
    component: Input,
    componentProps: { label: 'Срок (месяцев)', type: 'number' },
  },

  loanPurpose: {
    value: '',
    component: Textarea,
    componentProps: { label: 'Цель кредита', rows: 4 },
  },

  // ========================================================================
  // Step 2: Персональные данные (вложенные объекты)
  // ========================================================================

  // Вложенная форма - просто объект
  personalData: {
    firstName: {
      value: '',
      component: Input,
      componentProps: { label: 'Имя' },
    },
    lastName: {
      value: '',
      component: Input,
      componentProps: { label: 'Фамилия' },
    },
    middleName: {
      value: '',
      component: Input,
      componentProps: { label: 'Отчество' },
    },
    birthDate: {
      value: '',
      component: Input,
      componentProps: { label: 'Дата рождения', type: 'date' },
    },
    gender: {
      value: 'male',
      component: Select,
      componentProps: { label: 'Пол', options: GENDERS },
    },
  },

  // Еще одна вложенная форма
  passportData: {
    series: {
      value: '',
      component: Input,
      componentProps: { label: 'Серия', maxLength: 4 },
    },
    number: {
      value: '',
      component: Input,
      componentProps: { label: 'Номер', maxLength: 6 },
    },
    issueDate: {
      value: '',
      component: Input,
      componentProps: { label: 'Дата выдачи', type: 'date' },
    },
    issuedBy: {
      value: '',
      component: Textarea,
      componentProps: { label: 'Кем выдан', rows: 3 },
    },
    departmentCode: {
      value: '',
      component: Input,
      componentProps: { label: 'Код подразделения' },
    },
  },

  inn: {
    value: '',
    component: Input,
    componentProps: { label: 'ИНН', maxLength: 12 },
  },

  snils: {
    value: '',
    component: Input,
    componentProps: { label: 'СНИЛС' },
  },

  // ========================================================================
  // Step 3: Контактная информация
  // ========================================================================

  phoneMain: {
    value: '',
    component: Input,
    componentProps: { label: 'Телефон', type: 'tel' },
  },

  email: {
    value: '',
    component: Input,
    componentProps: { label: 'Email', type: 'email' },
  },

  // Вложенная форма для адреса
  registrationAddress: {
    region: {
      value: '',
      component: Input,
      componentProps: { label: 'Регион' },
    },
    city: {
      value: '',
      component: Input,
      componentProps: { label: 'Город' },
    },
    street: {
      value: '',
      component: Input,
      componentProps: { label: 'Улица' },
    },
    house: {
      value: '',
      component: Input,
      componentProps: { label: 'Дом' },
    },
    apartment: {
      value: '',
      component: Input,
      componentProps: { label: 'Квартира' },
    },
    postalCode: {
      value: '',
      component: Input,
      componentProps: { label: 'Индекс', maxLength: 6 },
    },
  },

  // ========================================================================
  // Step 4: Занятость
  // ========================================================================

  employmentStatus: {
    value: 'employed',
    component: Select,
    componentProps: { label: 'Статус занятости', options: EMPLOYMENT_STATUSES },
  },

  companyName: {
    value: '',
    component: Input,
    componentProps: { label: 'Название компании' },
  },

  position: {
    value: '',
    component: Input,
    componentProps: { label: 'Должность' },
  },

  monthlyIncome: {
    value: 0,
    component: Input,
    componentProps: { label: 'Ежемесячный доход (₽)', type: 'number' },
  },

  // ========================================================================
  // Step 5: Дополнительная информация (МАССИВЫ!)
  // ========================================================================

  hasProperty: {
    value: false,
    component: Checkbox,
    componentProps: { label: 'Имеется имущество' },
  },

  // ✅ МАССИВ - просто оборачиваем схему элемента в []
  properties: [{
    type: {
      value: 'apartment',
      component: Select,
      componentProps: { label: 'Тип имущества', options: PROPERTY_TYPES },
    },
    description: {
      value: '',
      component: Textarea,
      componentProps: { label: 'Описание', rows: 3 },
    },
    estimatedValue: {
      value: 0,
      component: Input,
      componentProps: { label: 'Оценочная стоимость (₽)', type: 'number' },
    },
    hasEncumbrance: {
      value: false,
      component: Checkbox,
      componentProps: { label: 'Имеется обременение' },
    },
  }],

  hasExistingLoans: {
    value: false,
    component: Checkbox,
    componentProps: { label: 'Имеются существующие кредиты' },
  },

  // ✅ Еще один массив
  existingLoans: [{
    bank: {
      value: '',
      component: Input,
      componentProps: { label: 'Банк' },
    },
    type: {
      value: '',
      component: Input,
      componentProps: { label: 'Тип кредита' },
    },
    amount: {
      value: 0,
      component: Input,
      componentProps: { label: 'Сумма кредита (₽)', type: 'number' },
    },
    remainingAmount: {
      value: 0,
      component: Input,
      componentProps: { label: 'Остаток долга (₽)', type: 'number' },
    },
    monthlyPayment: {
      value: 0,
      component: Input,
      componentProps: { label: 'Ежемесячный платеж (₽)', type: 'number' },
    },
    maturityDate: {
      value: '',
      component: Input,
      componentProps: { label: 'Дата погашения', type: 'date' },
    },
  }],

  hasCoBorrower: {
    value: false,
    component: Checkbox,
    componentProps: { label: 'Добавить созаемщика' },
  },

  // ✅ МАССИВ С ВЛОЖЕННЫМИ ФОРМАМИ!
  // Внутри массива есть вложенная форма personalData
  coBorrowers: [{
    // Вложенная форма внутри массива
    personalData: {
      firstName: {
        value: '',
        component: Input,
        componentProps: { label: 'Имя' },
      },
      lastName: {
        value: '',
        component: Input,
        componentProps: { label: 'Фамилия' },
      },
      middleName: {
        value: '',
        component: Input,
        componentProps: { label: 'Отчество' },
      },
      birthDate: {
        value: '',
        component: Input,
        componentProps: { label: 'Дата рождения', type: 'date' },
      },
      gender: {
        value: 'male',
        component: Select,
        componentProps: { label: 'Пол', options: GENDERS },
      },
    },
    relationship: {
      value: '',
      component: Input,
      componentProps: { label: 'Степень родства' },
    },
    monthlyIncome: {
      value: 0,
      component: Input,
      componentProps: { label: 'Ежемесячный доход (₽)', type: 'number' },
    },
  }],

  // ========================================================================
  // Step 6: Согласия
  // ========================================================================

  agreePersonalData: {
    value: false,
    component: Checkbox,
    componentProps: { label: 'Согласие на обработку персональных данных' },
  },

  agreeCreditHistory: {
    value: false,
    component: Checkbox,
    componentProps: { label: 'Согласие на проверку кредитной истории' },
  },

  agreeTerms: {
    value: false,
    component: Checkbox,
    componentProps: { label: 'Согласие с условиями кредитования' },
  },

  confirmAccuracy: {
    value: false,
    component: Checkbox,
    componentProps: { label: 'Подтверждаю достоверность введенных данных' },
  },
};
```

---

## Обновленные типы

```typescript
// src/lib/forms/types/deep-schema.ts

import type { ComponentType } from 'react';

// ============================================================================
// Определение типа схемы на основе типа данных
// ============================================================================

/**
 * Автоматически определяет тип схемы:
 * - Если T[] -> ArraySchema
 * - Если object -> GroupSchema
 * - Иначе -> FieldConfig
 */
export type DeepFormSchema<T> = {
  [K in keyof T]: T[K] extends Array<infer U>
    ? U extends Record<string, any>
      ? [DeepFormSchema<U>] // Массив с одним элементом - схемой
      : FieldConfig<T[K]>
    : T[K] extends Record<string, any>
    ? DeepFormSchema<T[K]> | FieldConfig<T[K]> // Объект или поле с объектным значением
    : FieldConfig<T[K]>;
};

/**
 * Конфигурация поля
 */
export interface FieldConfig<T = any> {
  value: T;
  component: ComponentType<any>;
  componentProps?: Record<string, any>;
  validators?: ValidatorFn<T>[];
  asyncValidators?: AsyncValidatorFn<T>[];
  disabled?: boolean;
  updateOn?: 'change' | 'blur' | 'submit';
}

// ============================================================================
// Вспомогательные типы для определения типа конфигурации
// ============================================================================

/**
 * Проверка, является ли конфигурация полем
 */
export type IsFieldConfig<T> = T extends { value: any; component: ComponentType<any> }
  ? true
  : false;

/**
 * Проверка, является ли конфигурация массивом
 */
export type IsArraySchema<T> = T extends [infer U] ? true : false;

/**
 * Получить тип элемента массива из схемы
 */
export type ArrayItemSchema<T> = T extends [infer U] ? U : never;
```

---

## Обновленная реализация FormStore

```typescript
// src/lib/forms/core/form-store.ts (обновленная flattenSchema)

export class FormStore<T extends Record<string, any>> {
  private fields: Map<string, FieldController<any>>;
  private arrayConfigs: Map<string, ArrayConfig<any>>;
  private arrayProxies: Map<string, ArrayProxy<any>>;
  private controlsProxy: any;

  constructor(schema: DeepFormSchema<T>) {
    this.fields = new Map();
    this.arrayConfigs = new Map();
    this.arrayProxies = new Map();

    // Разворачиваем схему
    this.flattenSchema(schema, []);

    // Создаем Proxy для доступа
    this.controlsProxy = this.createControlsProxy([]);
  }

  /**
   * Разворачивает вложенную схему в плоскую структуру
   * Автоматически определяет массивы, группы и поля
   */
  private flattenSchema(schema: any, path: string[]): void {
    for (const [key, config] of Object.entries(schema)) {
      const currentPath = [...path, key];
      const flatKey = currentPath.join('.');

      // ====================================================================
      // Проверка 1: Это массив? (массив с одним элементом - схемой)
      // ====================================================================
      if (Array.isArray(config) && config.length === 1) {
        // Это массив! Схема элемента в config[0]
        this.arrayConfigs.set(flatKey, {
          itemSchema: config[0],
          initial: [],
        });
        continue;
      }

      // ====================================================================
      // Проверка 2: Это поле? (имеет value и component)
      // ====================================================================
      if (this.isFieldConfig(config)) {
        // Это поле
        this.fields.set(flatKey, new FieldController(config));
        continue;
      }

      // ====================================================================
      // Проверка 3: Это группа (вложенный объект)
      // ====================================================================
      if (this.isPlainObject(config)) {
        // Это группа - рекурсивно разворачиваем
        this.flattenSchema(config, currentPath);
        continue;
      }

      console.warn(`Unknown schema type for ${flatKey}:`, config);
    }
  }

  /**
   * Проверка, является ли конфигурация полем
   */
  private isFieldConfig(config: any): boolean {
    return (
      config &&
      typeof config === 'object' &&
      'value' in config &&
      'component' in config
    );
  }

  /**
   * Проверка, является ли объект простым (не массив, не null, не FieldConfig)
   */
  private isPlainObject(obj: any): boolean {
    return (
      obj !== null &&
      typeof obj === 'object' &&
      !Array.isArray(obj) &&
      !this.isFieldConfig(obj)
    );
  }

  // ... остальные методы без изменений
}
```

---

## Примеры использования

### Простой массив

```typescript
interface TodoForm {
  todos: TodoItem[];
}

interface TodoItem {
  title: string;
  completed: boolean;
}

// ✅ Новый синтаксис - массив с одним элементом
const schema: DeepFormSchema<TodoForm> = {
  todos: [{
    title: {
      value: '',
      component: Input,
      componentProps: { label: 'Задача' },
    },
    completed: {
      value: false,
      component: Checkbox,
      componentProps: { label: 'Выполнено' },
    },
  }],
};

// Использование
const form = new FormStore(schema);

// Добавление элемента
form.controls.todos.push();

// Доступ к элементу
form.controls.todos[0].title.value = 'Купить молоко';
form.controls.todos[0].completed.value = true;

// Удаление
form.controls.todos.remove(0);
```

### Массив с вложенными формами

```typescript
interface TeamForm {
  members: TeamMember[];
}

interface TeamMember {
  personalInfo: PersonalInfo;
  role: string;
}

interface PersonalInfo {
  name: string;
  email: string;
}

// ✅ Массив с вложенной формой
const schema: DeepFormSchema<TeamForm> = {
  members: [{
    // Вложенная форма внутри массива
    personalInfo: {
      name: {
        value: '',
        component: Input,
        componentProps: { label: 'Имя' },
      },
      email: {
        value: '',
        component: Input,
        componentProps: { label: 'Email', type: 'email' },
      },
    },
    role: {
      value: '',
      component: Select,
      componentProps: {
        label: 'Роль',
        options: [
          { value: 'dev', label: 'Developer' },
          { value: 'designer', label: 'Designer' },
        ],
      },
    },
  }],
};

// Использование
const form = new FormStore(schema);

// Доступ к вложенной форме внутри массива
form.controls.members[0].personalInfo.name.value = 'John';
form.controls.members[0].personalInfo.email.value = 'john@example.com';
form.controls.members[0].role.value = 'dev';
```

### Массив внутри массива

```typescript
interface ProjectForm {
  teams: Team[];
}

interface Team {
  name: string;
  members: Member[];
}

interface Member {
  name: string;
  role: string;
}

// ✅ Вложенные массивы
const schema: DeepFormSchema<ProjectForm> = {
  teams: [{
    name: {
      value: '',
      component: Input,
      componentProps: { label: 'Название команды' },
    },
    // Массив внутри массива!
    members: [{
      name: {
        value: '',
        component: Input,
        componentProps: { label: 'Имя участника' },
      },
      role: {
        value: '',
        component: Input,
        componentProps: { label: 'Роль' },
      },
    }],
  }],
};

// Использование - глубокий доступ
const form = new FormStore(schema);

form.controls.teams[0].name.value = 'Backend Team';
form.controls.teams[0].members[0].name.value = 'Alice';
form.controls.teams[0].members[0].role.value = 'Tech Lead';

// Управление вложенным массивом
form.controls.teams[0].members.push();
form.controls.teams[0].members.remove(1);
```

---

## React компонент с новым синтаксисом

```typescript
import { useSignals } from '@preact/signals-react/runtime';
import { FormStore } from '@/lib/forms/core/form-store';
import { FormField } from '@/lib/forms/components/form-field';

function TodoListForm() {
  useSignals();

  const [form] = useState(() => {
    return new FormStore<TodoForm>({
      todos: [{
        title: {
          value: '',
          component: Input,
          componentProps: { label: 'Задача' },
        },
        completed: {
          value: false,
          component: Checkbox,
          componentProps: { label: 'Выполнено' },
        },
      }],
    });
  });

  const todos = form.controls.todos;

  return (
    <div>
      <h2>Список задач</h2>

      {todos.items.value.map((_, index) => (
        <div key={index} className="todo-item">
          {/* Элегантный доступ через [index] */}
          <FormField control={todos[index].title} />
          <FormField control={todos[index].completed} />

          <button onClick={() => todos.remove(index)}>
            Удалить
          </button>
        </div>
      ))}

      <button onClick={() => todos.push()}>
        + Добавить задачу
      </button>

      <div>Всего задач: {todos.length.value}</div>
    </div>
  );
}
```

---

## Сравнение синтаксисов

### Простой массив

```typescript
// ❌ Старый синтаксис
properties: {
  type: 'array',
  factory: {
    type: { value: 'apartment', component: Select },
    description: { value: '', component: Textarea },
  },
  initial: [],
}

// ✅ Новый синтаксис
properties: [{
  type: { value: 'apartment', component: Select },
  description: { value: '', component: Textarea },
}]
```

### Массив с вложенной формой

```typescript
// ❌ Старый синтаксис
coBorrowers: {
  type: 'array',
  factory: {
    personalData: {
      type: 'group',
      schema: {
        firstName: { value: '', component: Input },
        lastName: { value: '', component: Input },
      },
    },
    relationship: { value: '', component: Input },
  },
  initial: [],
}

// ✅ Новый синтаксис
coBorrowers: [{
  personalData: {
    firstName: { value: '', component: Input },
    lastName: { value: '', component: Input },
  },
  relationship: { value: '', component: Input },
}]
```

---

## Определение типа на основе TypeScript

### Автоматическое определение

FormStore автоматически определяет тип конфигурации:

```typescript
// Если схема = [{ ... }] -> это массив (FormArray)
properties: [{ type: ..., description: ... }]
// -> Создаст ArrayProxy

// Если схема = { field1: ..., field2: ... } -> это группа (FormGroup)
personalData: { firstName: ..., lastName: ... }
// -> Создаст GroupProxy

// Если схема = { value: ..., component: ... } -> это поле (FieldController)
loanAmount: { value: 0, component: Input }
// -> Создаст FieldController
```

### Type inference

TypeScript автоматически выводит правильные типы:

```typescript
interface MyForm {
  name: string;
  items: Item[];
  address: Address;
}

const schema: DeepFormSchema<MyForm> = {
  name: { value: '', component: Input }, // -> FieldConfig<string>
  items: [{ ... }],                       // -> [DeepFormSchema<Item>]
  address: { city: ..., street: ... },   // -> DeepFormSchema<Address>
};

// TypeScript знает типы:
form.controls.name.value;              // string
form.controls.items[0].title.value;    // string (если Item.title: string)
form.controls.address.city.value;      // string (если Address.city: string)
```

---

## Преимущества нового синтаксиса

### ✅ Меньше boilerplate

```typescript
// Было: 5 строк
properties: {
  type: 'array',
  factory: {
    type: { ... },
  },
  initial: [],
}

// Стало: 3 строки
properties: [{
  type: { ... },
}]
```

### ✅ Естественнее для JavaScript/TypeScript

```typescript
// Выглядит как обычная TypeScript схема
interface Form {
  items: Item[]; // массив
}

const schema = {
  items: [{ ... }], // массив в схеме
};
```

### ✅ Меньше вложенности

```typescript
// Было
coBorrowers.type === 'array'
coBorrowers.factory.personalData

// Стало
coBorrowers[0].personalData
```

### ✅ Визуально понятнее

```typescript
const schema = {
  // Поле
  name: { value: '', component: Input },

  // Группа
  address: {
    city: { value: '', component: Input },
    street: { value: '', component: Input },
  },

  // Массив
  items: [{
    title: { value: '', component: Input },
  }],
};

// Сразу видно: поле, группа, массив
```

---

## Миграция со старого синтаксиса

### Шаг 1: Найти все массивы

```typescript
// Найти в коде
type: 'array'
```

### Шаг 2: Заменить синтаксис

```typescript
// Было
properties: {
  type: 'array',
  factory: {
    type: { value: 'apartment', component: Select },
    description: { value: '', component: Textarea },
  },
  initial: [],
}

// Стало
properties: [{
  type: { value: 'apartment', component: Select },
  description: { value: '', component: Textarea },
}]
```

### Шаг 3: Удалить initial если пусто

```typescript
// initial: [] можно не указывать - по умолчанию пустой массив
```

### Шаг 4: Обновить типы

```typescript
// Было
import type { FormArrayConfig } from '@/lib/forms/types';

// Стало
import type { DeepFormSchema } from '@/lib/forms/types';
```

---

## Итоговое сравнение API

### Определение схемы

| Аспект | Старый синтаксис | Новый синтаксис |
|--------|-----------------|-----------------|
| **Массив** | `{ type: 'array', factory: {...}, initial: [] }` | `[{...}]` |
| **Группа** | `{ type: 'group', schema: {...} }` | `{...}` |
| **Поле** | `{ value: ..., component: ... }` | `{ value: ..., component: ... }` |
| **Строк кода** | ~5 на массив | ~2 на массив |
| **Читаемость** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### Использование в коде

| Операция | API (одинаковый для обоих) |
|----------|---------------------------|
| Доступ к элементу | `form.controls.items[0].title.value` |
| Добавление | `form.controls.items.push()` |
| Удаление | `form.controls.items.remove(0)` |
| Длина | `form.controls.items.length.value` |

---

## Заключение

### Новый синтаксис массивов:

✅ **Проще** - меньше кода и вложенности
✅ **Естественнее** - выглядит как обычные JS/TS типы
✅ **Понятнее** - сразу видно структуру формы
✅ **Меньше ошибок** - меньше мест где можно ошибиться
✅ **Автоматический** - не нужно явно указывать `type: 'array'`

### Рекомендация:

**Используйте новый синтаксис** для всех новых проектов с Вариантом 5.

Старый синтаксис с `type: 'array'` можно оставить для обратной совместимости, но **новый синтаксис предпочтительнее** во всех случаях.
