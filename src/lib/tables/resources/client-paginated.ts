import type { TableResource, ResourceParams } from '../types';

export interface ClientPaginatedResource<T> extends TableResource<T> {
  type: 'client-paginated';
  fetchFn: () => Promise<T[]>;
  allData?: T[];
}

export function createClientPaginatedResource<T>(
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
    },

    invalidate: () => {
      allData = null;
    }
  };
}
