import type { TableResource, ResourceParams, ResourceResult } from '../types';

export interface ServerPaginatedResource<T> extends TableResource<T> {
  type: 'server-paginated';
  fetchFn: (params: ResourceParams) => Promise<{ items: T[]; total: number }>;
}

export function createServerPaginatedResource<T>(
  fetchFn: (params: ResourceParams) => Promise<{ items: T[]; total: number }>
): ServerPaginatedResource<T> {
  return {
    type: 'server-paginated',
    fetchFn,

    load: async (params: ResourceParams) => {
      const result = await fetchFn(params);
      return {
        items: result.items,
        totalCount: result.total
      };
    }
  };
}
