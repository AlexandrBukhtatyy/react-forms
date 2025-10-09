// ============================================================================
// Resource Types
// ============================================================================

export interface ResourceItem<T = any> {
  id: string | number;
  label: string;
  value: T;
  [key: string]: any;
}

export interface ResourceResult<T = any> {
  items: ResourceItem<T>[];
  totalCount: number;
}

export interface ResourceConfig<T = any> {
  type: 'static' | 'preload' | 'partial';
  load: (params?: ResourceLoadParams) => Promise<ResourceResult<T>>;
}

export interface ResourceLoadParams {
  search?: string;
  page?: number;
  pageSize?: number;
  [key: string]: any;
}

// ============================================================================
// Static Resource
// ============================================================================

export function staticResource<T = any>(
  items: ResourceItem<T>[]
): ResourceConfig<T> {
  return {
    type: 'static',
    load: async () => ({
      items,
      totalCount: items.length
    })
  };
}

// ============================================================================
// Preload Resource
// ============================================================================

export function preloadResource<T = any>(
  loader: (params?: ResourceLoadParams) => Promise<ResourceItem<T>[]>
): ResourceConfig<T> {
  let cache: ResourceResult<T> | null = null;

  return {
    type: 'preload',
    load: async (params) => {
      if (!cache) {
        const items = await loader(params);
        cache = {
          items,
          totalCount: items.length
        };
      }
      return cache;
    }
  };
}

// ============================================================================
// Partial Resource
// ============================================================================

export function partialResource<T = any>(
  loader: (params?: ResourceLoadParams) => Promise<ResourceItem<T>[]>
): ResourceConfig<T> {
  return {
    type: 'partial',
    load: async (params) => {
      const items = await loader(params);
      return {
        items,
        totalCount: items.length
      };
    }
  };
}

// ============================================================================
// Resources Object (alternative API)
// ============================================================================

export const Resources = {
  static: staticResource,
  preload: preloadResource,
  partial: partialResource
};
