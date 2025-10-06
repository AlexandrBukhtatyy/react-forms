# Решение 3: Builder Pattern с фабрикой

## Описание
Использование паттерна Builder для создания сигнала таблицы с удобным API. Фабричная функция упрощает инициализацию, предоставляет дефолтные значения и валидацию.

## Преимущества
- ✅ Очень удобное и читаемое API для создания таблиц
- ✅ Встроенные дефолтные значения
- ✅ Валидация конфигурации при создании
- ✅ Типобезопасность на этапе создания
- ✅ Легко добавлять пресеты (например, "простая таблица", "таблица с сортировкой")
- ✅ Fluent API для цепочки вызовов

## Недостатки
- ❌ Больше кода для инфраструктуры
- ❌ Может быть избыточным для простых случаев
- ❌ Требует понимания паттерна Builder

## Структура сигнала

```typescript
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
  };
  config: TableConfig<T>;
}

interface TableConfig<T> {
  columns: ColumnConfig<T>[];
  messages: MessageConfig;
  skeleton: SkeletonConfig;
  features: FeatureConfig;
  styling: StylingConfig<T>;
  handlers: HandlerConfig<T>;
}

// ... другие интерфейсы аналогично решению 2
```

## Builder Class

```typescript
class TableStateBuilder<T> {
  private state: Partial<TableState<T>> = {};

  constructor(private idKey: keyof T = 'id' as keyof T) {
    // Инициализация дефолтными значениями
    this.state = {
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
        columns: [],
        messages: {
          empty: 'Нет данных',
          error: (err) => `Ошибка: ${err}`
        },
        skeleton: {
          rows: 10,
          defaultWidth: 'w-20'
        },
        features: {
          selectable: false,
          sortable: false,
          expandable: false,
          hoverable: true
        },
        styling: {},
        handlers: {}
      }
    };
  }

  // Fluent API методы
  withColumns(columns: ColumnConfig<T>[]): this {
    this.state.config!.columns = columns;
    return this;
  }

  addColumn(column: ColumnConfig<T>): this {
    this.state.config!.columns.push(column);
    return this;
  }

  withPageSize(size: number): this {
    this.state.data!.pageSize = size;
    this.state.config!.skeleton.rows = size;
    return this;
  }

  withMessages(messages: Partial<MessageConfig>): this {
    this.state.config!.messages = {
      ...this.state.config!.messages,
      ...messages
    };
    return this;
  }

  enableSelection(): this {
    this.state.config!.features.selectable = true;
    return this;
  }

  enableSorting(): this {
    this.state.config!.features.sortable = true;
    return this;
  }

  withRowClick(handler: (item: T, event: React.MouseEvent) => void): this {
    this.state.config!.handlers.onRowClick = handler;
    return this;
  }

  withRowClassName(fn: (item: T, index: number) => string): this {
    this.state.config!.styling.rowClassName = fn;
    return this;
  }

  withStyling(styling: Partial<StylingConfig<T>>): this {
    this.state.config!.styling = {
      ...this.state.config!.styling,
      ...styling
    };
    return this;
  }

  // Валидация и построение
  build(): Signal<TableState<T>> {
    // Валидация
    if (!this.state.config!.columns.length) {
      throw new Error('Table must have at least one column');
    }

    // Проверка уникальности ключей колонок
    const keys = new Set<string>();
    for (const col of this.state.config!.columns) {
      if (keys.has(col.key)) {
        throw new Error(`Duplicate column key: ${col.key}`);
      }
      keys.add(col.key);
    }

    return signal(this.state as TableState<T>);
  }
}
```

## Фабричные функции и пресеты

```typescript
// Основная фабрика
function createTableState<T>(idKey?: keyof T): TableStateBuilder<T> {
  return new TableStateBuilder<T>(idKey);
}

// Пресет: простая таблица
function createSimpleTable<T>(columns: ColumnConfig<T>[]): Signal<TableState<T>> {
  return createTableState<T>()
    .withColumns(columns)
    .build();
}

// Пресет: таблица с пагинацией и сортировкой
function createSortableTable<T>(
  columns: ColumnConfig<T>[],
  pageSize: number = 10
): Signal<TableState<T>> {
  return createTableState<T>()
    .withColumns(columns.map(col => ({ ...col, sortable: true })))
    .withPageSize(pageSize)
    .enableSorting()
    .build();
}

// Пресет: полнофункциональная таблица
function createFullFeaturedTable<T>(
  columns: ColumnConfig<T>[],
  options?: {
    pageSize?: number;
    onRowClick?: (item: T) => void;
    selectable?: boolean;
  }
): Signal<TableState<T>> {
  const builder = createTableState<T>()
    .withColumns(columns)
    .withPageSize(options?.pageSize || 10)
    .enableSorting();

  if (options?.selectable) {
    builder.enableSelection();
  }

  if (options?.onRowClick) {
    builder.withRowClick(options.onRowClick);
  }

  return builder.build();
}
```

## Пример использования

### Базовое использование с builder

```typescript
const usersTableState = createTableState<User>('id')
  .withColumns([
    {
      key: 'id',
      header: 'ID',
      value: (user) => user.id,
      skeleton: { width: 'w-8' }
    },
    {
      key: 'login',
      header: 'Логин',
      value: (user) => user.login,
      sortable: true
    },
    {
      key: 'email',
      header: 'Почта',
      value: (user) => <a href={`mailto:${user.email}`}>{user.email}</a>
    }
  ])
  .withPageSize(20)
  .enableSelection()
  .enableSorting()
  .withRowClick((user) => console.log('Clicked:', user))
  .withRowClassName((user, index) =>
    user.isActive ? 'bg-green-50' : 'bg-gray-50'
  )
  .withMessages({
    empty: 'Пользователей не найдено',
    error: (err) => `Не удалось загрузить: ${err}`
  })
  .build();

// Использование
<Table state={usersTableState} />
```

### Использование с пресетами

```typescript
// Простая таблица
const simpleTable = createSimpleTable<User>([
  { key: 'id', header: 'ID', value: (u) => u.id },
  { key: 'name', header: 'Имя', value: (u) => u.name }
]);

// Таблица с сортировкой
const sortableTable = createSortableTable<User>(
  [
    { key: 'id', header: 'ID', value: (u) => u.id },
    { key: 'name', header: 'Имя', value: (u) => u.name }
  ],
  15 // pageSize
);

// Полнофункциональная
const fullTable = createFullFeaturedTable<User>(
  [
    { key: 'id', header: 'ID', value: (u) => u.id },
    { key: 'name', header: 'Имя', value: (u) => u.name }
  ],
  {
    pageSize: 20,
    selectable: true,
    onRowClick: (user) => navigate(`/users/${user.id}`)
  }
);
```

### Расширение существующего состояния

```typescript
// Можно создать базовый state и затем модифицировать
const baseState = createTableState<User>()
  .withColumns(baseColumns)
  .build();

// Позже добавить функциональность
function enableTableFeatures(state: Signal<TableState<User>>) {
  state.value = {
    ...state.value,
    config: {
      ...state.value.config,
      features: {
        ...state.value.config.features,
        selectable: true,
        sortable: true
      }
    }
  };
}
```

## Компонент Table

```typescript
interface TableProps<T> {
  state: Signal<TableState<T>>;
}

const Table = <T extends Record<string, any>>({ state }: TableProps<T>) => {
  const items = computed(() => state.value.data.items);
  const config = computed(() => state.value.config);
  const ui = computed(() => state.value.ui);

  // Рендеринг
};
```

## Хелперы для работы с состоянием

```typescript
// Обновление данных
function updateTableData<T>(
  state: Signal<TableState<T>>,
  items: T[],
  totalCount?: number
) {
  state.value = {
    ...state.value,
    data: {
      ...state.value.data,
      items,
      totalCount: totalCount ?? items.length
    }
  };
}

// Установка загрузки
function setTableLoading<T>(state: Signal<TableState<T>>, loading: boolean) {
  state.value = {
    ...state.value,
    ui: {
      ...state.value.ui,
      isLoading: loading
    }
  };
}

// Установка ошибки
function setTableError<T>(state: Signal<TableState<T>>, error: string | null) {
  state.value = {
    ...state.value,
    ui: {
      ...state.value.ui,
      error,
      isLoading: false
    }
  };
}

// Выбор строки
function toggleRowSelection<T extends Record<string, any>>(
  state: Signal<TableState<T>>,
  item: T,
  idKey: keyof T = 'id'
) {
  const id = item[idKey];
  const selectedRows = new Set(state.value.ui.selectedRows);

  if (selectedRows.has(id)) {
    selectedRows.delete(id);
  } else {
    selectedRows.add(id);
  }

  state.value = {
    ...state.value,
    ui: {
      ...state.value.ui,
      selectedRows
    }
  };
}
```

## Рекомендация
Идеально подходит для крупных проектов с множеством таблиц, где нужна стандартизация и переиспользование. Отлично работает в design system или библиотеке компонентов. Обеспечивает лучший developer experience благодаря fluent API и пресетам.
