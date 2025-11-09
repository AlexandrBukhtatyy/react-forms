import type { TableResource, ResourceParams } from '../types';

export interface StaticResource<T> extends TableResource<T> {
  type: 'static';
  data: T[];
}

export function createStaticResource<T>(data: T[]): StaticResource<T> {
  return {
    type: 'static',
    data,

    load: async (params: ResourceParams) => {
      let filtered = data;

      // Локальная фильтрация
      if (params.filters) {
        filtered = data.filter(item => {
          return Object.entries(params.filters!).every(([key, value]) => {
            return (item as any)[key] === value;
          });
        });
      }

      // Локальная сортировка
      if (params.sortBy) {
        filtered = [...filtered].sort((a, b) => {
          const aVal = (a as any)[params.sortBy!];
          const bVal = (b as any)[params.sortBy!];
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
