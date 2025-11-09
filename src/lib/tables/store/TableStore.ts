import { signal, type Signal } from "@preact/signals-react";
import { mutateSignal } from "@/lib/utils/mutate-signal";
import type {
  TableState,
  TableOptions,
  TableConfig,
  StateUpdater,
  DeepPartial,
  ColumnConfig
} from "../types";

export class TableStore<T extends Record<string, any>> {
  public signal: Signal<TableState<T>>;
  private options: TableOptions<T>;
  private idKey: keyof T;
  private filters: Record<string, any> = {};

  constructor(options: TableOptions<T>, idKey: keyof T = 'id' as keyof T) {
    this.options = options;
    this.idKey = idKey;

    const initialState = this.createInitialState(options);
    this.signal = signal(initialState);
  }

  // Вспомогательный метод для сокращения повторяющихся вызовов mutateSignal
  private mutate = (updater: StateUpdater<TableState<T>>) => {
    mutateSignal<TableState<T>>(this.signal, updater as any);
  };

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

  // ============================================================================
  // Управление данными
  // ============================================================================

  public setData = (items: T[], totalCount?: number) => {
    this.mutate((draft) => {
      draft.data.items = items;
      draft.data.totalCount = totalCount ?? items.length;
    });
  };

  public appendData = (items: T[]) => {
    this.mutate((draft) => {
      draft.data.items.push(...items);
      draft.data.totalCount += items.length;
    });
  };

  public updateItem = (id: string | number, updates: DeepPartial<T>) => {
    this.mutate((draft) => {
      const item = draft.data.items.find(item => item[this.idKey] === id);
      if (item) Object.assign(item, updates);
    });
  };

  public removeItem = (id: string | number) => {
    this.mutate((draft) => {
      const index = draft.data.items.findIndex(item => item[this.idKey] === id);
      if (index !== -1) {
        draft.data.items.splice(index, 1);
        draft.data.totalCount -= 1;
      }
    });
  };

  public clearData = () => {
    this.mutate((draft) => {
      draft.data.items = [];
      draft.data.totalCount = 0;
    });
  };

  // ============================================================================
  // UI состояние
  // ============================================================================

  public setLoading = (loading: boolean) => {
    this.mutate((draft) => { draft.ui.isLoading = loading; });
  };

  public setError = (error: string | null) => {
    this.mutate((draft) => {
      draft.ui.error = error;
      draft.ui.isLoading = false;
    });
  };

  // ============================================================================
  // Пагинация
  // ============================================================================

  public setPage = (page: number) => {
    this.mutate((draft) => { draft.data.page = page; });
  };

  public nextPage = () => {
    this.mutate((draft) => {
      const { page, totalCount, pageSize } = draft.data;
      const maxPage = Math.ceil(totalCount / pageSize);
      if (page < maxPage) draft.data.page = page + 1;
    });
  };

  public prevPage = () => {
    this.mutate((draft) => {
      if (draft.data.page > 1) draft.data.page -= 1;
    });
  };

  public setPageSize = (size: number) => {
    this.mutate((draft) => {
      draft.data.pageSize = size;
      draft.data.page = 1;
      draft.config.skeleton.rows = size;
    });
  };

  // ============================================================================
  // Выбор строк
  // ============================================================================

  public selectRow = (id: string | number) => {
    this.mutate((draft) => { draft.ui.selectedRows.add(id); });
  };

  public deselectRow = (id: string | number) => {
    this.mutate((draft) => { draft.ui.selectedRows.delete(id); });
  };

  public toggleRowSelection = (id: string | number) => {
    this.mutate((draft) => {
      draft.ui.selectedRows.has(id)
        ? draft.ui.selectedRows.delete(id)
        : draft.ui.selectedRows.add(id);
    });
  };

  public selectAll = () => {
    this.mutate((draft) => {
      draft.ui.selectedRows.clear();
      draft.data.items.forEach(item => draft.ui.selectedRows.add(item[this.idKey]));
    });
  };

  public deselectAll = () => {
    this.mutate((draft) => { draft.ui.selectedRows.clear(); });
  };

  public getSelectedRows = () => {
    const { selectedRows } = this.signal.value.ui;
    return this.signal.value.data.items.filter(item => selectedRows.has(item[this.idKey]));
  };

  // ============================================================================
  // Сортировка
  // ============================================================================

  public sortBy = (column: string, direction?: 'asc' | 'desc') => {
    let newDirection: 'asc' | 'desc' = 'asc';

    this.mutate((draft) => {
      if (direction) {
        newDirection = direction;
      } else if (draft.ui.sortBy === column) {
        newDirection = draft.ui.sortDirection === 'asc' ? 'desc' : 'asc';
      }

      draft.ui.sortBy = column;
      draft.ui.sortDirection = newDirection;
    });

    this.signal.value.config.handlers.onSort?.(column, newDirection);
  };

  public clearSort = () => {
    this.mutate((draft) => {
      draft.ui.sortBy = null;
      draft.ui.sortDirection = 'asc';
    });
  };

  // ============================================================================
  // Расширяемые строки
  // ============================================================================

  public expandRow = (id: string | number) => {
    this.mutate((draft) => { draft.ui.expandedRows.add(id); });
  };

  public collapseRow = (id: string | number) => {
    this.mutate((draft) => { draft.ui.expandedRows.delete(id); });
  };

  public toggleRowExpansion = (id: string | number) => {
    this.mutate((draft) => {
      draft.ui.expandedRows.has(id)
        ? draft.ui.expandedRows.delete(id)
        : draft.ui.expandedRows.add(id);
    });
  };

  // ============================================================================
  // Конфигурация
  // ============================================================================

  public updateColumns = (columns: ColumnConfig<T>[]) => {
    this.mutate((draft) => { draft.config.columns = columns; });
  };

  public updateConfig = (config: Partial<TableConfig<T>>) => {
    this.mutate((draft) => { Object.assign(draft.config, config); });
  };

  // ============================================================================
  // Фильтрация
  // ============================================================================

  public setFilters = (filters: Record<string, any>) => {
    this.filters = filters;
    this.mutate((draft) => { draft.data.page = 1; }); // Сброс на первую страницу при изменении фильтров
    this.loadData(filters);
  };

  public getFilters = () => {
    return this.filters;
  };

  public clearFilters = () => {
    this.filters = {};
    this.mutate((draft) => { draft.data.page = 1; });
    this.loadData({});
  };

  // ============================================================================
  // Утилиты
  // ============================================================================

  public loadData = async (filters?: Record<string, any>) => {
    const filtersToUse = filters ?? this.filters;

    this.mutate((draft) => {
      draft.ui.isLoading = true;
      draft.ui.error = null;
    });

    try {
      const { data, ui } = this.signal.value;
      const result = await this.options.resource.load({
        page: data.page,
        pageSize: data.pageSize,
        sortBy: ui.sortBy,
        sortDirection: ui.sortDirection,
        filters: filtersToUse
      });

      this.mutate((draft) => {
        draft.data.items = result.items;
        draft.data.totalCount = result.totalCount;
        draft.ui.isLoading = false;
      });
    } catch (error) {
      this.mutate((draft) => {
        draft.ui.error = error instanceof Error ? error.message : 'Unknown error';
        draft.ui.isLoading = false;
      });
    }
  };

  public refresh = async () => {
    await this.loadData();
  };

  public invalidateCache = () => {
    this.options.resource.invalidate?.();
  };

  public reset = () => {
    this.signal.value = this.createInitialState(this.options);
  };
}

export function createTable<T extends Record<string, any>>(
  options: TableOptions<T>,
  idKey?: keyof T
): TableStore<T> {
  return new TableStore(options, idKey);
}
