# Решение 1: Плоская структура сигнала

## Описание
Все данные, конфигурация и UI состояние хранятся в одном плоском сигнале. Компонент Table полностью универсален и работает с generic типами.

## Преимущества
- ✅ Простая структура, легко понять
- ✅ Один источник истины для всего состояния
- ✅ Минимальное количество пропсов (только signal)
- ✅ Легко добавлять новые поля конфигурации

## Недостатки
- ❌ Может стать громоздким при большом количестве настроек
- ❌ Сложнее переиспользовать отдельные части конфигурации
- ❌ Все изменения вызывают полный реактивный пересчет

## Структура сигнала

```typescript
interface TableState<T> {
  // Данные
  data: {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
  };

  // UI состояние
  ui: {
    isLoading: boolean;
    error: string | null;
    selectedRows: Set<string | number>;
    sortBy: string | null;
    sortDirection: 'asc' | 'desc';
  };

  // Конфигурация
  config: {
    columns: ColumnConfig<T>[];
    emptyText: string;
    errorText: (error: string) => string;
    skeletonRows: number;
    className?: string;
    rowClassName?: (item: T) => string;
    onRowClick?: (item: T) => void;
    selectable?: boolean;
    sortable?: boolean;
  };
}

interface ColumnConfig<T> {
  key: string;
  header: string;
  value: (item: T) => React.ReactNode;
  sortable?: boolean;
  skeletonWidth?: string;
  headerClassName?: string;
  cellClassName?: string;
}
```

## Пример использования

```typescript
// Создание сигнала
const usersTableState = signal<TableState<User>>({
  data: {
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 10
  },
  ui: {
    isLoading: false,
    error: null,
    selectedRows: new Set(),
    sortBy: null,
    sortDirection: 'asc'
  },
  config: {
    columns: [
      { key: 'id', header: 'ID', value: (user) => user.id, skeletonWidth: 'w-8' },
      { key: 'login', header: 'Логин', value: (user) => user.login, sortable: true },
      { key: 'email', header: 'Почта', value: (user) => user.email }
    ],
    emptyText: 'Нет данных',
    errorText: (err) => `Ошибка: ${err}`,
    skeletonRows: 10,
    selectable: true,
    sortable: true,
    onRowClick: (user) => console.log('Clicked:', user)
  }
});

// Использование
<Table state={usersTableState} />
```

## Компонент Table

```typescript
interface TableProps<T> {
  state: Signal<TableState<T>>;
}

const Table = <T extends { id: string | number }>({ state }: TableProps<T>) => {
  const items = computed(() => state.value.data.items);
  const config = computed(() => state.value.config);
  const ui = computed(() => state.value.ui);

  // Рендеринг на основе state
};
```

## Рекомендация
Подходит для небольших и средних таблиц, где конфигурация не слишком сложная и не требуется частое переиспользование настроек между разными таблицами.
