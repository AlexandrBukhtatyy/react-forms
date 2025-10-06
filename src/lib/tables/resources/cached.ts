import type { TableResource, ResourceParams, ResourceResult } from '../types';

export interface CachedResource<T> extends TableResource<T> {
  cache: Map<string, { data: ResourceResult<T>; timestamp: number }>;
  ttl: number;
}

export function createCachedResource<T>(
  baseResource: TableResource<T>,
  ttl: number = 60000 // 1 минута по умолчанию
): CachedResource<T> {
  const cache = new Map<string, { data: ResourceResult<T>; timestamp: number }>();

  return {
    ...baseResource,
    cache,
    ttl,

    load: async (params: ResourceParams) => {
      // Создаем ключ кеша
      const cacheKey = JSON.stringify(params);
      const cached = cache.get(cacheKey);

      // Проверяем актуальность кеша
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }

      // Загружаем данные
      const result = await baseResource.load(params);

      // Сохраняем в кеш
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    },

    invalidate: () => {
      cache.clear();
      baseResource.invalidate?.();
    }
  };
}
