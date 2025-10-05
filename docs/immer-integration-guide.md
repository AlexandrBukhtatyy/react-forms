# Использование Immer.js с Preact Signals

## Текущий код (без Immer)

```typescript
// src/pages/table/logic/tableLogic.ts
import { fetchUsers } from '../services/users';
import { tableStore } from '../signals/tableSignals';

export const loadUsers = async (): Promise<void> => {
  tableStore.value = {
    ...tableStore.value,
    ui: { ...tableStore.value.ui, isLoading: true, error: null }
  };

  try {
    const { currentPage, pageSize } = tableStore.value.data;
    const { users, totalCount, totalPages } = await fetchUsers(
      tableStore.value.filters,
      currentPage,
      pageSize
    );

    tableStore.value = {
      ...tableStore.value,
      data: {
        ...tableStore.value.data,
        users,
        totalCount,
        totalPages
      },
      ui: { ...tableStore.value.ui, isLoading: false }
    };
  } catch (error) {
    tableStore.value = {
      ...tableStore.value,
      ui: {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Ошибка загрузки данных'
      }
    };
  }
};

export const updateFilters = async (): Promise<void> => {
  tableStore.value = {
    ...tableStore.value,
    data: { ...tableStore.value.data, currentPage: 1 }
  };
  await loadUsers();
};

export const changePage = async (page: number): Promise<void> => {
  if (page < 1 || page > tableStore.value.data.totalPages) return;
  tableStore.value = {
    ...tableStore.value,
    data: { ...tableStore.value.data, currentPage: page }
  };
  await loadUsers();
};
```

---

## Вариант 1: Прямое использование `produce`

```typescript
import { produce } from 'immer';
import { fetchUsers } from '../services/users';
import { tableStore } from '../signals/tableSignals';

export const loadUsers = async (): Promise<void> => {
  // Устанавливаем loading state
  tableStore.value = produce(tableStore.value, draft => {
    draft.ui.isLoading = true;
    draft.ui.error = null;
  });

  try {
    const { currentPage, pageSize } = tableStore.value.data;
    const { users, totalCount, totalPages } = await fetchUsers(
      tableStore.value.filters,
      currentPage,
      pageSize
    );

    // Обновляем данные
    tableStore.value = produce(tableStore.value, draft => {
      draft.data.users = users;
      draft.data.totalCount = totalCount;
      draft.data.totalPages = totalPages;
      draft.ui.isLoading = false;
    });
  } catch (error) {
    tableStore.value = produce(tableStore.value, draft => {
      draft.ui.isLoading = false;
      draft.ui.error = error instanceof Error ? error.message : 'Ошибка загрузки данных';
    });
  }
};

export const updateFilters = async (): Promise<void> => {
  tableStore.value = produce(tableStore.value, draft => {
    draft.data.currentPage = 1;
  });
  await loadUsers();
};

export const changePage = async (page: number): Promise<void> => {
  if (page < 1 || page > tableStore.value.data.totalPages) return;

  tableStore.value = produce(tableStore.value, draft => {
    draft.data.currentPage = page;
  });

  await loadUsers();
};
```

---

## Вариант 2: С хелпером `updateStore`

```typescript
import { produce } from 'immer';
import { fetchUsers } from '../services/users';
import { tableStore, TableStore } from '../signals/tableSignals';

// Хелпер для обновления store
const updateStore = (updater: (draft: TableStore) => void) => {
  tableStore.value = produce(tableStore.value, updater);
};

export const loadUsers = async (): Promise<void> => {
  // Устанавливаем loading
  updateStore(draft => {
    draft.ui.isLoading = true;
    draft.ui.error = null;
  });

  try {
    const { currentPage, pageSize } = tableStore.value.data;
    const { users, totalCount, totalPages } = await fetchUsers(
      tableStore.value.filters,
      currentPage,
      pageSize
    );

    // Обновляем данные
    updateStore(draft => {
      draft.data.users = users;
      draft.data.totalCount = totalCount;
      draft.data.totalPages = totalPages;
      draft.ui.isLoading = false;
    });
  } catch (error) {
    updateStore(draft => {
      draft.ui.isLoading = false;
      draft.ui.error = error instanceof Error ? error.message : 'Ошибка загрузки данных';
    });
  }
};

export const updateFilters = async (): Promise<void> => {
  updateStore(draft => {
    draft.data.currentPage = 1;
  });
  await loadUsers();
};

export const changePage = async (page: number): Promise<void> => {
  if (page < 1 || page > tableStore.value.data.totalPages) return;

  updateStore(draft => {
    draft.data.currentPage = page;
  });

  await loadUsers();
};
```

---

## Вариант 3: Интеграция Immer непосредственно в Signal

### signals/tableSignals.ts

```typescript
import { signal, computed } from '@preact/signals-react';
import { produce, Draft } from 'immer';

export interface Filters {
  login: string;
  email: string;
  status: '' | 'active' | 'inactive';
  role: '' | 'admin' | 'user' | 'moderator';
  registrationDate: string;
}

export interface User {
  id: number;
  login: string;
  email: string;
  status: 'active' | 'inactive';
  role: 'admin' | 'user' | 'moderator';
  registrationDate: string;
}

export interface TableStore {
  filters: Filters;
  data: {
    users: User[];
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  ui: {
    isLoading: boolean;
    error: string | null;
  };
}

export const tableStore = signal<TableStore>({
  filters: {
    login: '',
    email: '',
    status: '',
    role: '',
    registrationDate: '',
  },
  data: {
    users: [],
    currentPage: 1,
    pageSize: 5,
    totalCount: 0,
    totalPages: 0,
  },
  ui: {
    isLoading: false,
    error: null,
  },
});

// Хелпер для мутаций через Immer
export const mutateStore = (updater: (draft: Draft<TableStore>) => void) => {
  tableStore.value = produce(tableStore.value, updater);
};

// Computed сигналы
export const currentUsers = computed(() => tableStore.value.data.users);
export const isLoading = computed(() => tableStore.value.ui.isLoading);
export const currentPage = computed(() => tableStore.value.data.currentPage);
export const totalPages = computed(() => tableStore.value.data.totalPages);
export const filters = computed(() => tableStore.value.filters);
export const hasError = computed(() => tableStore.value.ui.error !== null);
```

### logic/tableLogic.ts

```typescript
import { mutateStore, tableStore } from '../signals/tableSignals';
import { fetchUsers } from '../services/users';

export const loadUsers = async (): Promise<void> => {
  mutateStore(draft => {
    draft.ui.isLoading = true;
    draft.ui.error = null;
  });

  try {
    const { currentPage, pageSize } = tableStore.value.data;
    const { users, totalCount, totalPages } = await fetchUsers(
      tableStore.value.filters,
      currentPage,
      pageSize
    );

    mutateStore(draft => {
      draft.data.users = users;
      draft.data.totalCount = totalCount;
      draft.data.totalPages = totalPages;
      draft.ui.isLoading = false;
    });
  } catch (error) {
    mutateStore(draft => {
      draft.ui.isLoading = false;
      draft.ui.error = error instanceof Error ? error.message : 'Ошибка загрузки данных';
    });
  }
};

export const updateFilters = async (): Promise<void> => {
  mutateStore(draft => {
    draft.data.currentPage = 1;
  });
  await loadUsers();
};

export const changePage = async (page: number): Promise<void> => {
  if (page < 1 || page > tableStore.value.data.totalPages) return;

  mutateStore(draft => {
    draft.data.currentPage = page;
  });

  await loadUsers();
};
```

---

## Вариант 4: С actions (Redux-style)

### signals/tableActions.ts

```typescript
import { produce } from 'immer';
import { tableStore } from './tableSignals';
import type { User } from './tableSignals';

// Actions для UI
export const setLoading = (isLoading: boolean) => {
  tableStore.value = produce(tableStore.value, draft => {
    draft.ui.isLoading = isLoading;
  });
};

export const setError = (error: string | null) => {
  tableStore.value = produce(tableStore.value, draft => {
    draft.ui.error = error;
  });
};

// Actions для данных
export const setUsers = (users: User[], totalCount: number, totalPages: number) => {
  tableStore.value = produce(tableStore.value, draft => {
    draft.data.users = users;
    draft.data.totalCount = totalCount;
    draft.data.totalPages = totalPages;
  });
};

export const setCurrentPage = (page: number) => {
  tableStore.value = produce(tableStore.value, draft => {
    draft.data.currentPage = page;
  });
};

export const updateFilter = <K extends keyof typeof tableStore.value.filters>(
  key: K,
  value: typeof tableStore.value.filters[K]
) => {
  tableStore.value = produce(tableStore.value, draft => {
    draft.filters[key] = value;
  });
};

export const resetFilters = () => {
  tableStore.value = produce(tableStore.value, draft => {
    draft.filters = {
      login: '',
      email: '',
      status: '',
      role: '',
      registrationDate: '',
    };
    draft.data.currentPage = 1;
  });
};
```

### logic/tableLogic.ts (упрощенная версия)

```typescript
import * as actions from '../signals/tableActions';
import { tableStore } from '../signals/tableSignals';
import { fetchUsers } from '../services/users';

export const loadUsers = async (): Promise<void> => {
  actions.setLoading(true);
  actions.setError(null);

  try {
    const { currentPage, pageSize } = tableStore.value.data;
    const { users, totalCount, totalPages } = await fetchUsers(
      tableStore.value.filters,
      currentPage,
      pageSize
    );

    actions.setUsers(users, totalCount, totalPages);
    actions.setLoading(false);
  } catch (error) {
    actions.setLoading(false);
    actions.setError(error instanceof Error ? error.message : 'Ошибка загрузки данных');
  }
};

export const updateFilters = async (): Promise<void> => {
  actions.setCurrentPage(1);
  await loadUsers();
};

export const changePage = async (page: number): Promise<void> => {
  if (page < 1 || page > tableStore.value.data.totalPages) return;
  actions.setCurrentPage(page);
  await loadUsers();
};
```

---

## Сравнение подходов

### До (текущий код):
```typescript
tableStore.value = {
  ...tableStore.value,
  data: {
    ...tableStore.value.data,
    users,
    totalCount,
    totalPages
  },
  ui: { ...tableStore.value.ui, isLoading: false }
};
```

### После (с Immer):
```typescript
mutateStore(draft => {
  draft.data.users = users;
  draft.data.totalCount = totalCount;
  draft.data.totalPages = totalPages;
  draft.ui.isLoading = false;
});
```

### Или с actions:
```typescript
actions.setUsers(users, totalCount, totalPages);
actions.setLoading(false);
```

---

## Преимущества Immer

✅ **Читабельность** - код выглядит как обычные мутации
✅ **Меньше ошибок** - не нужно помнить про spread операторы на каждом уровне вложенности
✅ **Производительность** - Immer оптимизирует structural sharing
✅ **Безопасность** - иммутабельность гарантирована автоматически
✅ **Вложенность** - легко работать с глубоко вложенными объектами
✅ **Меньше кода** - особенно при глубоких обновлениях

---

## Недостатки Immer

⚠️ **Размер** - дополнительная зависимость (~14kb gzipped)
⚠️ **Overhead** - небольшой overhead для простых обновлений
⚠️ **Отладка** - сложнее отслеживать изменения в DevTools
⚠️ **Learning curve** - нужно понимать концепцию draft

---

## Примеры сложных обновлений

### Без Immer (неудобно):
```typescript
tableStore.value = {
  ...tableStore.value,
  data: {
    ...tableStore.value.data,
    users: tableStore.value.data.users.map(user =>
      user.id === userId
        ? {
            ...user,
            status: 'inactive',
            metadata: {
              ...user.metadata,
              lastUpdate: Date.now()
            }
          }
        : user
    )
  }
};
```

### С Immer (удобно):
```typescript
mutateStore(draft => {
  const user = draft.data.users.find(u => u.id === userId);
  if (user) {
    user.status = 'inactive';
    user.metadata.lastUpdate = Date.now();
  }
});
```

---

## Установка

```bash
npm install immer
# или
yarn add immer
# или
pnpm add immer
```

---

## 🏆 Рекомендация

Использовать **Вариант 3** (интеграция в signals) для большинства случаев:

1. Создать `mutateStore` хелпер в `tableSignals.ts`
2. Использовать его для всех обновлений store
3. Для сложной логики можно добавить **Вариант 4** (actions)

### Когда использовать каждый вариант:

- **Вариант 1** - если нужно быстро начать, минимальные изменения
- **Вариант 2** - если хотите локальный хелпер в одном файле
- **Вариант 3** ⭐ - лучший баланс удобства и структуры
- **Вариант 4** - для больших приложений с множеством действий

---

## Интеграция с FilterForm

### Было:
```typescript
const updateFilter = <K extends keyof typeof tableStore.value.filters>(
  key: K,
  value: typeof tableStore.value.filters[K]
) => {
  tableStore.value = {
    ...tableStore.value,
    filters: { ...tableStore.value.filters, [key]: value }
  };
  handleChange();
};
```

### Стало (с Immer):
```typescript
const updateFilter = <K extends keyof typeof tableStore.value.filters>(
  key: K,
  value: typeof tableStore.value.filters[K]
) => {
  mutateStore(draft => {
    draft.filters[key] = value;
  });
  handleChange();
};
```

### Или с actions:
```typescript
const updateFilterValue = <K extends keyof typeof tableStore.value.filters>(
  key: K,
  value: typeof tableStore.value.filters[K]
) => {
  actions.updateFilter(key, value);
  handleChange();
};
```

---

## TypeScript типизация

Immer полностью поддерживает TypeScript и сохраняет все типы:

```typescript
import { Draft } from 'immer';

// Draft<T> - это тип для черновика в Immer
export const mutateStore = (updater: (draft: Draft<TableStore>) => void) => {
  tableStore.value = produce(tableStore.value, updater);
};

// TypeScript знает все поля draft
mutateStore(draft => {
  draft.data.users; // User[]
  draft.ui.isLoading; // boolean
  draft.filters.status; // '' | 'active' | 'inactive'
});
```

---

## Заключение

Immer значительно упрощает работу с иммутабельными обновлениями в сложных структурах данных. Для вашего проекта с вложенной структурой `tableStore` (filters, data, ui) это будет особенно полезно.
