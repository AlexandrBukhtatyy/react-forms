// Главный экспорт модуля таблиц

// Store
export { TableStore, createTable } from './store/TableStore';

// Types
export type {
  TableState,
  TableConfig,
  TableOptions,
  TableActions,
  TableTuple,
  ColumnConfig,
  ResourceParams,
  ResourceResult,
  TableResource
} from './types';

// Resources
export {
  createServerPaginatedResource,
  createClientPaginatedResource,
  createStaticResource,
  createInfiniteScrollResource,
  createCachedResource,
  createHybridResource
} from './resources';

export type {
  ServerPaginatedResource,
  ClientPaginatedResource,
  StaticResource,
  InfiniteScrollResource,
  CachedResource,
  HybridResource
} from './resources';

// Components
export { default as Table } from './components/Table';
export { default as TablePagination } from './components/TablePagination';
export { default as TableToolbar } from './components/TableToolbar';
