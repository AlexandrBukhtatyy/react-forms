# Решение 2: Композиция сигналов

## Описание
Разделение ответственности: данные, UI состояние и конфигурация хранятся в отдельных вложенных структурах, но все доступны через один главный сигнал. Используется композиция для гибкости.

## Преимущества
- ✅ Четкое разделение ответственности
- ✅ Можно обновлять части независимо (оптимизация реактивности)
- ✅ Легко переиспользовать конфигурацию
- ✅ Computed signals работают только с нужной частью данных
- ✅ Масштабируемость

## Недостатки
- ❌ Более сложная структура
- ❌ Нужно следить за согласованностью между частями
- ❌ Чуть больше кода для инициализации

## Структура сигнала

```typescript
interface TableStore<T> {
  data: Signal<TableData<T>>;
  ui: Signal<TableUI>;
  config: Signal<TableConfig<T>>;
}

interface TableData<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface TableUI {
  isLoading: boolean;
  error: string | null;
  selectedRows: Set<string | number>;
  sortBy: string | null;
  sortDirection: 'asc' | 'desc';
  expandedRows: Set<string | number>;
}

interface TableConfig<T> {
  columns: ColumnConfig<T>[];
  messages: {
    empty: string;
    error: (error: string) => string;
    loading?: string;
  };
  skeleton: {
    rows: number;
    defaultWidth: string;
  };
  features: {
    selectable: boolean;
    sortable: boolean;
    expandable: boolean;
    hoverable: boolean;
  };
  styling: {
    className?: string;
    rowClassName?: (item: T, index: number) => string;
    headerClassName?: string;
  };
  handlers: {
    onRowClick?: (item: T, event: React.MouseEvent) => void;
    onRowSelect?: (item: T, selected: boolean) => void;
    onSort?: (column: string, direction: 'asc' | 'desc') => void;
  };
}

interface ColumnConfig<T> {
  key: string;
  header: string | React.ReactNode;
  value: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  skeleton?: {
    width: string;
    variant?: 'text' | 'circle' | 'rect';
  };
  className?: string;
  headerClassName?: string;
  cellClassName?: (item: T) => string;
}
```

## Пример использования

```typescript
// Создание сигналов
const dataSignal = signal<TableData<User>>({
  items: [],
  totalCount: 0,
  page: 1,
  pageSize: 10
});

const uiSignal = signal<TableUI>({
  isLoading: false,
  error: null,
  selectedRows: new Set(),
  sortBy: null,
  sortDirection: 'asc',
  expandedRows: new Set()
});

const configSignal = signal<TableConfig<User>>({
  columns: [
    {
      key: 'id',
      header: 'ID',
      value: (user) => user.id,
      width: '60px',
      skeleton: { width: 'w-8' }
    },
    {
      key: 'login',
      header: 'Логин',
      value: (user) => user.login,
      sortable: true,
      cellClassName: (user) => user.isActive ? 'text-green-600' : 'text-gray-400'
    }
  ],
  messages: {
    empty: 'Нет данных для отображения',
    error: (err) => `Произошла ошибка: ${err}`,
    loading: 'Загрузка данных...'
  },
  skeleton: {
    rows: 10,
    defaultWidth: 'w-20'
  },
  features: {
    selectable: true,
    sortable: true,
    expandable: false,
    hoverable: true
  },
  styling: {
    className: 'custom-table',
    rowClassName: (user, index) => index % 2 === 0 ? 'bg-gray-50' : '',
    headerClassName: 'bg-blue-100'
  },
  handlers: {
    onRowClick: (user, event) => {
      if (!event.ctrlKey) {
        console.log('Single click:', user);
      }
    },
    onRowSelect: (user, selected) => {
      console.log('Row selected:', user.id, selected);
    },
    onSort: (column, direction) => {
      console.log('Sort:', column, direction);
    }
  }
});

// Главный store
const usersTableStore: TableStore<User> = {
  data: dataSignal,
  ui: uiSignal,
  config: configSignal
};

// Использование
<Table store={usersTableStore} />
```

## Компонент Table

```typescript
interface TableProps<T> {
  store: TableStore<T>;
}

const Table = <T extends { id: string | number }>({ store }: TableProps<T>) => {
  // Каждый computed работает только со своей частью
  const items = computed(() => store.data.value.items);
  const columns = computed(() => store.config.value.columns);
  const isLoading = computed(() => store.ui.value.isLoading);

  // Рендеринг
};
```

## Функции-хелперы для обновления

```typescript
// Обновление только данных (не триггерит реактивность на UI и config)
function updateTableData<T>(store: TableStore<T>, items: T[]) {
  store.data.value = {
    ...store.data.value,
    items
  };
}

// Обновление только UI
function setTableLoading<T>(store: TableStore<T>, loading: boolean) {
  store.ui.value = {
    ...store.ui.value,
    isLoading: loading
  };
}

// Обновление конфигурации
function updateTableColumns<T>(store: TableStore<T>, columns: ColumnConfig<T>[]) {
  store.config.value = {
    ...store.config.value,
    columns
  };
}
```

## Рекомендация
Подходит для средних и крупных проектов, где важна производительность и переиспользование. Идеально, когда конфигурация может меняться динамически или переиспользоваться между таблицами.
