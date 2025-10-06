import type { Signal } from "@preact/signals-react";
import type React from "react";

// ============================================================================
// Resource Types
// ============================================================================

export interface ResourceParams {
  page: number;
  pageSize: number;
  sortBy: string | null;
  sortDirection: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface ResourceResult<T> {
  items: T[];
  totalCount: number;
  hasMore?: boolean;
}

export interface TableResource<T> {
  type: 'server-paginated' | 'client-paginated' | 'static' | 'infinite';
  load: (params: ResourceParams) => Promise<ResourceResult<T>>;
  prefetch?: (params: ResourceParams) => Promise<void>;
  invalidate?: () => void;
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
}

// ============================================================================
// Column Configuration
// ============================================================================

export interface ColumnConfig<T = any> {
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

// ============================================================================
// Table State
// ============================================================================

export interface TableState<T> {
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

export interface TableConfig<T> {
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

// ============================================================================
// Table Options
// ============================================================================

export interface TableOptions<T> {
  initialData?: T[];
  pageSize?: number;
  columns: ColumnConfig<T>[];
  resource: TableResource<T>;
  messages?: {
    empty?: string;
    error?: (error: string) => string;
    loading?: string;
  };
  features?: {
    selectable?: boolean;
    sortable?: boolean;
    expandable?: boolean;
    hoverable?: boolean;
  };
  styling?: {
    className?: string;
    rowClassName?: (item: T, index: number) => string;
    headerClassName?: string;
  };
  handlers?: {
    onRowClick?: (item: T, event: React.MouseEvent) => void;
    onRowSelect?: (item: T, selected: boolean) => void;
    onSort?: (column: string, direction: 'asc' | 'desc') => void;
  };
  skeleton?: {
    rows?: number;
    defaultWidth?: string;
  };
}

// ============================================================================
// Table Actions
// ============================================================================

export interface TableActions<T> {
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
  loadData: (filters?: Record<string, any>) => Promise<void>;
  refresh: () => Promise<void>;
  invalidateCache: () => void;
  reset: () => void;
}

export type TableTuple<T> = [Signal<TableState<T>>, TableActions<T>];
