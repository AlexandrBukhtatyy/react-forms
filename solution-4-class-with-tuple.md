# Решение 4: Класс с возвратом кортежа [Signal, Actions]

## Описание
Класс принимает конфигурацию таблицы и возвращает кортеж: `[signal, actions]` - аналогично паттерну React hooks (`useState`, `useReducer`). Signal для чтения, actions для изменения состояния.

## Преимущества
- ✅ Знакомый паттерн (как хуки в React)
- ✅ Четкое разделение: чтение через signal, запись через actions
- ✅ Типобезопасные действия
- ✅ Инкапсуляция логики внутри класса
- ✅ Легко тестировать actions отдельно
- ✅ Предотвращение прямой мутации state

## Недостатки
- ❌ Нужно помнить про кортеж (хотя это привычно)
- ❌ Немного больше кода для setup

## Реализация

### Типы и интерфейсы

```typescript
// Конфигурация для создания таблицы
interface TableOptions<T> {
  // Настройки данных
  initialData?: T[];
  pageSize?: number;

  // Конфигурация колонок
  columns: ColumnConfig<T>[];

  // Сообщения
  messages?: {
    empty?: string;
    error?: (error: string) => string;
    loading?: string;
  };

  // Фичи
  features?: {
    selectable?: boolean;
    sortable?: boolean;
    expandable?: boolean;
    hoverable?: boolean;
  };

  // Стилизация
  styling?: {
    className?: string;
    rowClassName?: (item: T, index: number) => string;
    headerClassName?: string;
  };

  // Обработчики
  handlers?: {
    onRowClick?: (item: T, event: React.MouseEvent) => void;
    onRowSelect?: (item: T, selected: boolean) => void;
    onSort?: (column: string, direction: 'asc' | 'desc') => void;
  };

  // Скелетон
  skeleton?: {
    rows?: number;
    defaultWidth?: string;
  };
}

// Внутреннее состояние таблицы
interface TableState<T> {
  data: {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
  };
  ui: {
    isLoading: boolean;
    error: string | null;
    selectedRows: Set<string | number>;
    sortBy: string | null;
    sortDirection: 'asc' | 'desc';
    expandedRows: Set<string | number>;
  };
  config: TableConfig<T>;
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
  skeleton?: {
    width: string;
  };
  className?: string;
  headerClassName?: string;
  cellClassName?: (item: T) => string;
}

// Actions API
interface TableActions<T> {
  // Управление данными
  setData: (items: T[], totalCount?: number) => void;
  appendData: (items: T[]) => void;
  updateItem: (id: string | number, updates: Partial<T>) => void;
  removeItem: (id: string | number) => void;
  clearData: () => void;

  // Управление UI состоянием
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Пагинация
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;

  // Выбор строк
  selectRow: (id: string | number) => void;
  deselectRow: (id: string | number) => void;
  toggleRowSelection: (id: string | number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  getSelectedRows: () => T[];

  // Сортировка
  sortBy: (column: string, direction?: 'asc' | 'desc') => void;
  clearSort: () => void;

  // Расширяемые строки
  expandRow: (id: string | number) => void;
  collapseRow: (id: string | number) => void;
  toggleRowExpansion: (id: string | number) => void;

  // Конфигурация
  updateColumns: (columns: ColumnConfig<T>[]) => void;
  updateConfig: (config: Partial<TableConfig<T>>) => void;

  // Утилиты
  refresh: () => Promise<void>;
  reset: () => void;
}
```

### Класс TableStore

```typescript
import { mutateSignal } from '@/utils/mutate-signal';

class TableStore<T extends Record<string, any>> {
  private signal: Signal<TableState<T>>;
  private options: TableOptions<T>;
  private idKey: keyof T;

  constructor(options: TableOptions<T>, idKey: keyof T = 'id' as keyof T) {
    this.options = options;
    this.idKey = idKey;

    // Создаем начальное состояние
    const initialState = this.createInitialState(options);
    this.signal = signal(initialState);
  }

  private createInitialState(options: TableOptions<T>): TableState<T> {
    const pageSize = options.pageSize || 10;

    return {
      data: {
        items: options.initialData || [],
        totalCount: options.initialData?.length || 0,
        page: 1,
        pageSize
      },
      ui: {
        isLoading: false,
        error: null,
        selectedRows: new Set(),
        sortBy: null,
        sortDirection: 'asc',
        expandedRows: new Set()
      },
      config: {
        columns: options.columns,
        messages: {
          empty: options.messages?.empty || 'Нет данных',
          error: options.messages?.error || ((err) => `Ошибка: ${err}`),
          loading: options.messages?.loading
        },
        skeleton: {
          rows: options.skeleton?.rows || pageSize,
          defaultWidth: options.skeleton?.defaultWidth || 'w-20'
        },
        features: {
          selectable: options.features?.selectable || false,
          sortable: options.features?.sortable || false,
          expandable: options.features?.expandable || false,
          hoverable: options.features?.hoverable !== false
        },
        styling: {
          className: options.styling?.className,
          rowClassName: options.styling?.rowClassName,
          headerClassName: options.styling?.headerClassName
        },
        handlers: {
          onRowClick: options.handlers?.onRowClick,
          onRowSelect: options.handlers?.onRowSelect,
          onSort: options.handlers?.onSort
        }
      }
    };
  }

  // Создание Actions API
  private createActions(): TableActions<T> {
    return {
      // Управление данными
      setData: (items: T[], totalCount?: number) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.data.items = items;
          draft.data.totalCount = totalCount ?? items.length;
        });
      },

      appendData: (items: T[]) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.data.items.push(...items);
          draft.data.totalCount += items.length;
        });
      },

      updateItem: (id: string | number, updates: Partial<T>) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          const item = draft.data.items.find(item => item[this.idKey] === id);
          if (item) {
            Object.assign(item, updates);
          }
        });
      },

      removeItem: (id: string | number) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          const index = draft.data.items.findIndex(item => item[this.idKey] === id);
          if (index !== -1) {
            draft.data.items.splice(index, 1);
            draft.data.totalCount -= 1;
          }
        });
      },

      clearData: () => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.data.items = [];
          draft.data.totalCount = 0;
        });
      },

      // UI состояние
      setLoading: (loading: boolean) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.ui.isLoading = loading;
        });
      },

      setError: (error: string | null) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.ui.error = error;
          draft.ui.isLoading = false;
        });
      },

      // Пагинация
      setPage: (page: number) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.data.page = page;
        });
      },

      nextPage: () => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          const { page, totalCount, pageSize } = draft.data;
          const maxPage = Math.ceil(totalCount / pageSize);
          if (page < maxPage) {
            draft.data.page = page + 1;
          }
        });
      },

      prevPage: () => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          if (draft.data.page > 1) {
            draft.data.page -= 1;
          }
        });
      },

      setPageSize: (size: number) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.data.pageSize = size;
          draft.data.page = 1;
          draft.config.skeleton.rows = size;
        });
      },

      // Выбор строк
      selectRow: (id: string | number) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.ui.selectedRows.add(id);
        });
      },

      deselectRow: (id: string | number) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.ui.selectedRows.delete(id);
        });
      },

      toggleRowSelection: (id: string | number) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          if (draft.ui.selectedRows.has(id)) {
            draft.ui.selectedRows.delete(id);
          } else {
            draft.ui.selectedRows.add(id);
          }
        });
      },

      selectAll: () => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.ui.selectedRows.clear();
          draft.data.items.forEach(item => {
            draft.ui.selectedRows.add(item[this.idKey]);
          });
        });
      },

      deselectAll: () => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.ui.selectedRows.clear();
        });
      },

      getSelectedRows: () => {
        const selected = this.signal.value.ui.selectedRows;
        return this.signal.value.data.items.filter(item =>
          selected.has(item[this.idKey])
        );
      },

      // Сортировка
      sortBy: (column: string, direction?: 'asc' | 'desc') => {
        let newDirection: 'asc' | 'desc';

        mutateSignal<TableState<T>>(this.signal, (draft) => {
          const currentSort = draft.ui.sortBy;
          const currentDirection = draft.ui.sortDirection;

          if (direction) {
            newDirection = direction;
          } else if (currentSort === column) {
            newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
          } else {
            newDirection = 'asc';
          }

          draft.ui.sortBy = column;
          draft.ui.sortDirection = newDirection;
        });

        // Вызываем callback если есть
        this.signal.value.config.handlers.onSort?.(column, newDirection!);
      },

      clearSort: () => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.ui.sortBy = null;
          draft.ui.sortDirection = 'asc';
        });
      },

      // Расширяемые строки
      expandRow: (id: string | number) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.ui.expandedRows.add(id);
        });
      },

      collapseRow: (id: string | number) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.ui.expandedRows.delete(id);
        });
      },

      toggleRowExpansion: (id: string | number) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          if (draft.ui.expandedRows.has(id)) {
            draft.ui.expandedRows.delete(id);
          } else {
            draft.ui.expandedRows.add(id);
          }
        });
      },

      // Конфигурация
      updateColumns: (columns: ColumnConfig<T>[]) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          draft.config.columns = columns;
        });
      },

      updateConfig: (config: Partial<TableConfig<T>>) => {
        mutateSignal<TableState<T>>(this.signal, (draft) => {
          Object.assign(draft.config, config);
        });
      },

      // Утилиты
      refresh: async () => {
        // Placeholder для пользовательской логики загрузки
        console.log('Refresh table data');
      },

      reset: () => {
        this.signal.value = this.createInitialState(this.options);
      }
    };
  }

  // Публичный метод для получения кортежа
  public build(): [Signal<TableState<T>>, TableActions<T>] {
    return [this.signal, this.createActions()];
  }
}

// Фабричная функция для удобства
function createTable<T extends Record<string, any>>(
  options: TableOptions<T>,
  idKey?: keyof T
): [Signal<TableState<T>>, TableActions<T>] {
  const store = new TableStore(options, idKey);
  return store.build();
}
```

## Примеры использования

### Базовое использование

```typescript
interface User {
  id: number;
  login: string;
  email: string;
  status: string;
  role: string;
  registrationDate: string;
}

// Создаем таблицу
const [usersTableState, usersTableActions] = createTable<User>({
  pageSize: 20,
  columns: [
    { key: 'id', header: 'ID', value: (user) => user.id, skeleton: { width: 'w-8' } },
    { key: 'login', header: 'Логин', value: (user) => user.login, sortable: true },
    { key: 'email', header: 'Почта', value: (user) => user.email },
    { key: 'status', header: 'Статус', value: (user) => user.status },
    { key: 'role', header: 'Роль', value: (user) => user.role },
    {
      key: 'registrationDate',
      header: 'Дата регистрации',
      value: (user) => user.registrationDate
    }
  ],
  features: {
    selectable: true,
    sortable: true,
    hoverable: true
  },
  messages: {
    empty: 'Пользователей не найдено',
    error: (err) => `Не удалось загрузить пользователей: ${err}`
  },
  handlers: {
    onRowClick: (user) => {
      console.log('Clicked user:', user);
    },
    onSort: (column, direction) => {
      console.log('Sort by:', column, direction);
      // Загрузка данных с сортировкой
      loadUsers({ sortBy: column, sortDirection: direction });
    }
  }
});

// Использование в компоненте
<Table state={usersTableState} />
```

### Работа с actions

```typescript
// Загрузка данных
async function loadUsers() {
  usersTableActions.setLoading(true);
  usersTableActions.setError(null);

  try {
    const response = await fetch('/api/users');
    const data = await response.json();

    usersTableActions.setData(data.users, data.total);
  } catch (error) {
    usersTableActions.setError(error.message);
  } finally {
    usersTableActions.setLoading(false);
  }
}

// Обновление пользователя
function updateUser(id: number, updates: Partial<User>) {
  usersTableActions.updateItem(id, updates);
}

// Удаление пользователя
function deleteUser(id: number) {
  usersTableActions.removeItem(id);
}

// Работа с выбором
function handleBulkAction() {
  const selected = usersTableActions.getSelectedRows();
  console.log('Selected users:', selected);

  // Выполняем действие
  // ...

  // Очищаем выбор
  usersTableActions.deselectAll();
}

// Пагинация
function goToNextPage() {
  usersTableActions.nextPage();
  loadUsers();
}

// Изменение размера страницы
function changePageSize(size: number) {
  usersTableActions.setPageSize(size);
  loadUsers();
}

// Сортировка
function sortByColumn(column: string) {
  usersTableActions.sortBy(column);
  // onSort handler будет вызван автоматически
}
```

### Использование в React компоненте

```typescript
const UsersTable: React.FC = () => {
  // Создаем таблицу один раз
  const [state, actions] = React.useMemo(
    () => createTable<User>({
      columns: [...],
      features: { selectable: true, sortable: true }
    }),
    []
  );

  // Загружаем данные при монтировании
  React.useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    actions.setLoading(true);
    try {
      const data = await fetchUsers();
      actions.setData(data);
    } catch (error) {
      actions.setError(error.message);
    }
  }

  return (
    <div>
      <button onClick={() => actions.selectAll()}>Выбрать все</button>
      <button onClick={() => actions.deselectAll()}>Снять выбор</button>

      <Table state={state} />

      <div>
        <button onClick={() => actions.prevPage()}>Назад</button>
        <button onClick={() => actions.nextPage()}>Вперед</button>
      </div>
    </div>
  );
};
```

### Компонент Table

```typescript
interface TableProps<T> {
  state: Signal<TableState<T>>;
}

const Table = <T extends Record<string, any>>({ state }: TableProps<T>) => {
  const items = computed(() => state.value.data.items);
  const columns = computed(() => state.value.config.columns);
  const isLoading = computed(() => state.value.ui.isLoading);
  const error = computed(() => state.value.ui.error);
  const config = computed(() => state.value.config);

  // Рендеринг таблицы на основе state
  return (
    <div className={config.value.styling.className}>
      {/* Таблица */}
    </div>
  );
};
```

## Преимущества этого подхода

1. **Знакомый паттерн**: Как `useState` - `[state, setState]`
2. **Разделение ответственности**: Signal только для чтения, actions для изменений
3. **Типобезопасность**: TypeScript знает все доступные actions
4. **Инкапсуляция**: Вся логика внутри класса, чистый API снаружи
5. **Легко тестировать**: Actions можно тестировать независимо
6. **Расширяемость**: Легко добавлять новые actions

## Рекомендация
Это решение идеально сочетает удобство использования, типобезопасность и гибкость. Подходит для проектов любого размера и предоставляет чистый, понятный API для работы с таблицами.
