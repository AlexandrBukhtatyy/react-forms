import { signal, type Signal } from "@preact/signals-react";
import { mutateSignal } from "@/utils/mutate-signal";
import type {
  TableState,
  TableOptions,
  TableActions,
  TableConfig,
  ResourceParams,
  TableTuple
} from "../types";

export class TableStore<T extends Record<string, any>> {
  private signal: Signal<TableState<T>>;
  private options: TableOptions<T>;
  private idKey: keyof T;

  constructor(options: TableOptions<T>, idKey: keyof T = 'id' as keyof T) {
    this.options = options;
    this.idKey = idKey;

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
      updateColumns: (columns) => {
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

      refresh: async () => {
        await this.createActions().loadData();
      },

      invalidateCache: () => {
        this.options.resource.invalidate?.();
      },

      reset: () => {
        this.signal.value = this.createInitialState(this.options);
      }
    };
  }

  public build(): TableTuple<T> {
    return [this.signal, this.createActions()];
  }
}

export function createTable<T extends Record<string, any>>(
  options: TableOptions<T>,
  idKey?: keyof T
): TableTuple<T> {
  const store = new TableStore(options, idKey);
  return store.build();
}
