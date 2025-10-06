import type { TableResource, ResourceParams, ResourceResult } from '../types';

export interface HybridResource<T> extends TableResource<T> {
  type: 'server-paginated' | 'client-paginated';
  threshold: number;
  allData?: T[];
}

export function createHybridResource<T>(
  fetchAll: () => Promise<T[]>,
  fetchPage: (params: ResourceParams) => Promise<{ items: T[]; total: number }>,
  threshold: number = 1000 // Порог переключения
): HybridResource<T> {
  let allData: T[] | null = null;
  let totalCount: number | null = null;
  let mode: 'server-paginated' | 'client-paginated' | null = null;

  return {
    type: 'server-paginated',
    threshold,

    load: async (params: ResourceParams) => {
      // Определяем режим работы при первой загрузке
      if (mode === null) {
        // Пробуем загрузить первую страницу, чтобы узнать общее количество
        const firstPage = await fetchPage({ ...params, page: 1 });
        totalCount = firstPage.total;

        if (totalCount <= threshold) {
          // Загружаем все данные для локальной работы
          mode = 'client-paginated';
          allData = await fetchAll();
        } else {
          mode = 'server-paginated';
        }
      }

      // Работаем в зависимости от режима
      if (mode === 'client-paginated' && allData) {
        // Локальная обработка
        let filtered = allData;

        if (params.filters) {
          filtered = allData.filter(item => {
            return Object.entries(params.filters!).every(([key, value]) => {
              return (item as any)[key] === value;
            });
          });
        }

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

        const start = (params.page - 1) * params.pageSize;
        const end = start + params.pageSize;
        const items = filtered.slice(start, end);

        return {
          items,
          totalCount: filtered.length
        };
      } else {
        // Серверная обработка
        const result = await fetchPage(params);
        return {
          items: result.items,
          totalCount: result.total
        };
      }
    },

    invalidate: () => {
      allData = null;
      totalCount = null;
      mode = null;
    }
  };
}
