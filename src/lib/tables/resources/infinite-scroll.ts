import type { TableResource, ResourceParams } from '../types';

export interface InfiniteScrollResource<T> extends TableResource<T> {
  type: 'infinite';
  fetchFn: (page: number, pageSize: number) => Promise<{ items: T[]; hasMore: boolean }>;
  accumulatedData: T[];
}

export function createInfiniteScrollResource<T>(
  fetchFn: (page: number, pageSize: number) => Promise<{ items: T[]; hasMore: boolean }>
): InfiniteScrollResource<T> {
  let accumulatedData: T[] = [];
  let currentPage = 0;

  return {
    type: 'infinite',
    fetchFn,
    accumulatedData: [],

    load: async (params: ResourceParams) => {
      // Загружаем следующую страницу
      currentPage = params.page;
      const result = await fetchFn(currentPage, params.pageSize);

      // Добавляем к уже загруженным данным
      if (params.page === 1) {
        accumulatedData = result.items;
      } else {
        accumulatedData = [...accumulatedData, ...result.items];
      }

      return {
        items: accumulatedData,
        totalCount: accumulatedData.length,
        hasMore: result.hasMore
      };
    },

    invalidate: () => {
      accumulatedData = [];
      currentPage = 0;
    }
  };
}
