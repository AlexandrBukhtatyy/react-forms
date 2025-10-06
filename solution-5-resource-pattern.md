# Решение 5: Resource Pattern - Стратегии загрузки данных

## Концепция

Resource - это абстракция над источником данных. Он может:
- **Загружать данные частями** (Server-side pagination)
- **Загрузить все данные один раз** и работать локально (Client-side pagination)
- **Быть статичным** (Static data)
- **Lazy loading** (загрузка по требованию)
- **Infinite scroll** (бесконечная прокрутка)

## Архитектура

### Базовые интерфейсы

```typescript
// Параметры запроса данных
interface ResourceParams {
  page: number;
  pageSize: number;
  sortBy: string | null;
  sortDirection: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Результат запроса
interface ResourceResult<T> {
  items: T[];
  totalCount: number;
  hasMore?: boolean; // Для infinite scroll
}

// Базовый интерфейс Resource
interface TableResource<T> {
  type: 'server-paginated' | 'client-paginated' | 'static' | 'infinite';

  // Метод загрузки данных
  load: (params: ResourceParams) => Promise<ResourceResult<T>>;

  // Опциональные методы
  prefetch?: (params: ResourceParams) => Promise<void>;
  invalidate?: () => void;

  // Настройки кеширования
  cache?: {
    enabled: boolean;
    ttl?: number; // Time to live в миллисекундах
  };
}
```

---

## Вариант 1: Server-Side Pagination (Серверная пагинация)

Каждый раз загружает данные с сервера. Подходит для больших датасетов.

```typescript
interface ServerPaginatedResource<T> extends TableResource<T> {
  type: 'server-paginated';
  fetchFn: (params: ResourceParams) => Promise<{ items: T[]; total: number }>;
}

function createServerPaginatedResource<T>(
  fetchFn: (params: ResourceParams) => Promise<{ items: T[]; total: number }>
): ServerPaginatedResource<T> {
  return {
    type: 'server-paginated',
    fetchFn,

    load: async (params: ResourceParams) => {
      const result = await fetchFn(params);
      return {
        items: result.items,
        totalCount: result.total
      };
    }
  };
}

// Использование
const usersResource = createServerPaginatedResource<User>(async (params) => {
  const query = new URLSearchParams({
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
    ...(params.sortBy && { sortBy: params.sortBy, sortDirection: params.sortDirection })
  });

  const response = await fetch(`/api/users?${query}`);
  const data = await response.json();

  return {
    items: data.users,
    total: data.total
  };
});
```

---

## Вариант 2: Client-Side Pagination (Клиентская пагинация)

Загружает все данные один раз, затем работает локально.

```typescript
interface ClientPaginatedResource<T> extends TableResource<T> {
  type: 'client-paginated';
  fetchFn: () => Promise<T[]>;
  allData?: T[]; // Кеш всех данных
}

function createClientPaginatedResource<T>(
  fetchFn: () => Promise<T[]>
): ClientPaginatedResource<T> {
  let allData: T[] | null = null;

  return {
    type: 'client-paginated',
    fetchFn,

    load: async (params: ResourceParams) => {
      // Загружаем все данные один раз
      if (!allData) {
        allData = await fetchFn();
      }

      // Локальная фильтрация
      let filtered = allData;
      if (params.filters) {
        filtered = allData.filter(item => {
          return Object.entries(params.filters!).every(([key, value]) => {
            return item[key] === value;
          });
        });
      }

      // Локальная сортировка
      if (params.sortBy) {
        filtered = [...filtered].sort((a, b) => {
          const aVal = a[params.sortBy!];
          const bVal = b[params.sortBy!];
          const direction = params.sortDirection === 'asc' ? 1 : -1;

          if (aVal < bVal) return -1 * direction;
          if (aVal > bVal) return 1 * direction;
          return 0;
        });
      }

      // Локальная пагинация
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      const items = filtered.slice(start, end);

      return {
        items,
        totalCount: filtered.length
      };
    },

    invalidate: () => {
      allData = null;
    }
  };
}

// Использование
const usersResource = createClientPaginatedResource<User>(async () => {
  const response = await fetch('/api/users/all');
  const data = await response.json();
  return data.users;
});
```

---

## Вариант 3: Static Resource (Статичные данные)

Данные передаются напрямую, без загрузки.

```typescript
interface StaticResource<T> extends TableResource<T> {
  type: 'static';
  data: T[];
}

function createStaticResource<T>(data: T[]): StaticResource<T> {
  return {
    type: 'static',
    data,

    load: async (params: ResourceParams) => {
      let filtered = data;

      // Локальная фильтрация
      if (params.filters) {
        filtered = data.filter(item => {
          return Object.entries(params.filters!).every(([key, value]) => {
            return item[key] === value;
          });
        });
      }

      // Локальная сортировка
      if (params.sortBy) {
        filtered = [...filtered].sort((a, b) => {
          const aVal = a[params.sortBy!];
          const bVal = b[params.sortBy!];
          const direction = params.sortDirection === 'asc' ? 1 : -1;

          if (aVal < bVal) return -1 * direction;
          if (aVal > bVal) return 1 * direction;
          return 0;
        });
      }

      // Локальная пагинация
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      const items = filtered.slice(start, end);

      return {
        items,
        totalCount: filtered.length
      };
    }
  };
}

// Использование
const usersResource = createStaticResource<User>([
  { id: 1, name: 'John', email: 'john@example.com' },
  { id: 2, name: 'Jane', email: 'jane@example.com' },
  // ... больше данных
]);
```

---

## Вариант 4: Infinite Scroll Resource (Бесконечная прокрутка)

Подгружает данные по мере прокрутки.

```typescript
interface InfiniteScrollResource<T> extends TableResource<T> {
  type: 'infinite';
  fetchFn: (page: number, pageSize: number) => Promise<{ items: T[]; hasMore: boolean }>;
  accumulatedData: T[];
}

function createInfiniteScrollResource<T>(
  fetchFn: (page: number, pageSize: number) => Promise<{ items: T[]; hasMore: boolean }>
): InfiniteScrollResource<T> {
  let accumulatedData: T[] = [];
  let currentPage = 0;

  return {
    type: 'infinite',
    fetchFn,
    accumulatedData: [],

    load: async (params: ResourceParams) => {
      // Загружаем следующую страницу
      currentPage = params.page;
      const result = await fetchFn(currentPage, params.pageSize);

      // Добавляем к уже загруженным данным
      if (params.page === 1) {
        accumulatedData = result.items;
      } else {
        accumulatedData = [...accumulatedData, ...result.items];
      }

      return {
        items: accumulatedData,
        totalCount: accumulatedData.length,
        hasMore: result.hasMore
      };
    },

    invalidate: () => {
      accumulatedData = [];
      currentPage = 0;
    }
  };
}

// Использование
const usersResource = createInfiniteScrollResource<User>(async (page, pageSize) => {
  const response = await fetch(`/api/users?page=${page}&pageSize=${pageSize}`);
  const data = await response.json();

  return {
    items: data.users,
    hasMore: data.hasMore
  };
});
```

---

## Вариант 5: Cached Resource (С кешированием)

Оборачивает любой resource и добавляет кеширование.

```typescript
interface CachedResource<T> extends TableResource<T> {
  cache: Map<string, { data: ResourceResult<T>; timestamp: number }>;
  ttl: number;
}

function createCachedResource<T>(
  baseResource: TableResource<T>,
  ttl: number = 60000 // 1 минута
): CachedResource<T> {
  const cache = new Map<string, { data: ResourceResult<T>; timestamp: number }>();

  return {
    ...baseResource,
    cache,
    ttl,

    load: async (params: ResourceParams) => {
      // Создаем ключ кеша
      const cacheKey = JSON.stringify(params);
      const cached = cache.get(cacheKey);

      // Проверяем актуальность кеша
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }

      // Загружаем данные
      const result = await baseResource.load(params);

      // Сохраняем в кеш
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    },

    invalidate: () => {
      cache.clear();
      baseResource.invalidate?.();
    }
  };
}

// Использование
const usersResource = createCachedResource(
  createServerPaginatedResource<User>(fetchUsers),
  30000 // 30 секунд
);
```

---

## Вариант 6: Hybrid Resource (Гибридный)

Комбинирует разные стратегии.

```typescript
interface HybridResource<T> extends TableResource<T> {
  type: 'server-paginated' | 'client-paginated';
  threshold: number; // Порог переключения
  allData?: T[];
}

function createHybridResource<T>(
  fetchAll: () => Promise<T[]>,
  fetchPage: (params: ResourceParams) => Promise<{ items: T[]; total: number }>,
  threshold: number = 1000 // Если меньше 1000 записей - работаем локально
): HybridResource<T> {
  let allData: T[] | null = null;
  let totalCount: number | null = null;
  let mode: 'server-paginated' | 'client-paginated' | null = null;

  return {
    type: 'server-paginated',
    threshold,

    load: async (params: ResourceParams) => {
      // Определяем режим работы при первой загрузке
      if (mode === null) {
        // Пробуем загрузить первую страницу, чтобы узнать общее количество
        const firstPage = await fetchPage({ ...params, page: 1 });
        totalCount = firstPage.total;

        if (totalCount <= threshold) {
          // Загружаем все данные для локальной работы
          mode = 'client-paginated';
          allData = await fetchAll();
        } else {
          mode = 'server-paginated';
        }
      }

      // Работаем в зависимости от режима
      if (mode === 'client-paginated' && allData) {
        // Локальная обработка (как в Client-Side Pagination)
        let filtered = allData;

        if (params.filters) {
          filtered = allData.filter(item => {
            return Object.entries(params.filters!).every(([key, value]) => {
              return item[key] === value;
            });
          });
        }

        if (params.sortBy) {
          filtered = [...filtered].sort((a, b) => {
            const aVal = a[params.sortBy!];
            const bVal = b[params.sortBy!];
            const direction = params.sortDirection === 'asc' ? 1 : -1;

            if (aVal < bVal) return -1 * direction;
            if (aVal > bVal) return 1 * direction;
            return 0;
          });
        }

        const start = (params.page - 1) * params.pageSize;
        const end = start + params.pageSize;
        const items = filtered.slice(start, end);

        return {
          items,
          totalCount: filtered.length
        };
      } else {
        // Серверная обработка
        const result = await fetchPage(params);
        return {
          items: result.items,
          totalCount: result.total
        };
      }
    },

    invalidate: () => {
      allData = null;
      totalCount = null;
      mode = null;
    }
  };
}

// Использование
const usersResource = createHybridResource<User>(
  // Загрузить все
  async () => {
    const response = await fetch('/api/users/all');
    return response.json();
  },
  // Загрузить страницу
  async (params) => {
    const response = await fetch(`/api/users?page=${params.page}`);
    return response.json();
  },
  1000 // Порог
);
```

---

## Интеграция с TableStore

```typescript
interface TableOptions<T> {
  // ... другие поля

  // Заменяем loadData на resource
  resource: TableResource<T>;
}

class TableStore<T extends Record<string, any>> {
  // ...

  private createActions(): TableActions<T> {
    return {
      // ...

      loadData: async (filters?: Record<string, any>) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.ui.isLoading = true;
          draft.ui.error = null;
        });

        try {
          const params: ResourceParams = {
            page: this.signal.value.data.page,
            pageSize: this.signal.value.data.pageSize,
            sortBy: this.signal.value.ui.sortBy,
            sortDirection: this.signal.value.ui.sortDirection,
            filters
          };

          // Используем resource для загрузки
          const result = await this.options.resource.load(params);

          mutateSignal<TableState<T>>(this.signal, (draft) => {
            draft.data.items = result.items;
            draft.data.totalCount = result.totalCount;
            draft.ui.isLoading = false;
          });
        } catch (error) {
          mutateSignal<TableState<T>>(this.signal, (draft) => {
            draft.ui.error = error instanceof Error ? error.message : 'Unknown error';
            draft.ui.isLoading = false;
          });
        }
      },

      invalidateCache: () => {
        this.options.resource.invalidate?.();
      },

      // ...
    };
  }
}
```

---

## Примеры использования

### Server-Side Pagination

```typescript
const [state, actions] = createTable<User>({
  columns: [...],
  resource: createServerPaginatedResource(async (params) => {
    const response = await fetch(`/api/users?${buildQuery(params)}`);
    return response.json();
  })
});
```

### Client-Side Pagination

```typescript
const [state, actions] = createTable<User>({
  columns: [...],
  resource: createClientPaginatedResource(async () => {
    const response = await fetch('/api/users/all');
    return response.json();
  })
});
```

### Static Data

```typescript
const [state, actions] = createTable<User>({
  columns: [...],
  resource: createStaticResource(MOCK_USERS)
});
```

### With Caching

```typescript
const [state, actions] = createTable<User>({
  columns: [...],
  resource: createCachedResource(
    createServerPaginatedResource(fetchUsers),
    60000 // 1 минута
  )
});
```

### Hybrid

```typescript
const [state, actions] = createTable<User>({
  columns: [...],
  resource: createHybridResource(
    fetchAllUsers,
    fetchUsersPage,
    500 // Если меньше 500 - работаем локально
  )
});
```

---

## Преимущества Resource Pattern

1. **Гибкость**: Легко переключаться между стратегиями
2. **Переиспользование**: Один resource для разных таблиц
3. **Композиция**: Можно комбинировать (кеширование + серверная пагинация)
4. **Тестируемость**: Легко мокировать resource
5. **Оптимизация**: Каждая стратегия оптимизирована под свой use case

## Рекомендации

- **Server-paginated**: Большие датасеты (>1000 записей)
- **Client-paginated**: Средние датасеты (100-1000 записей), частая фильтрация
- **Static**: Маленькие датасеты (<100 записей), редко меняются
- **Infinite**: Мобильные приложения, ленты новостей
- **Cached**: Данные не меняются часто, много повторных запросов
- **Hybrid**: Универсальное решение, автоматический выбор стратегии
