export interface ResourceRequest {
  query?: string;
  filters?: Record<string, any>;
  pagination?: {
    page: number;
    limit: number;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export interface ResourceResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  success: boolean;
  error?: string;
}

export interface ResourceState<T = any> {
  data: T[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Resource<T = any> {
  fetch: (params?: ResourceRequest) => Promise<ResourceResponse<T>>;
  refetch: () => Promise<ResourceResponse<T>>;
  state: ResourceState<T>;
  isLoading: boolean;
  error: string | null;
}

export function makeResource<T = any>(
  callback: (params: ResourceRequest) => Promise<ResourceResponse<T>>
): Resource<T> {
  let state: ResourceState<T> = {
    data: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    hasNext: false,
    hasPrev: false
  };

  let lastParams: ResourceRequest = {};

  const fetch = async (params: ResourceRequest = {}): Promise<ResourceResponse<T>> => {
    state.loading = true;
    state.error = null;
    lastParams = params;

    try {
      const response = await callback(params);

      state.data = response.data;
      state.total = response.total;
      state.page = response.page;
      state.hasNext = response.hasNext;
      state.hasPrev = response.hasPrev;
      state.loading = false;

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch resource';
      state.error = errorMessage;
      state.loading = false;

      return {
        data: [],
        total: 0,
        page: 1,
        limit: params.pagination?.limit || 10,
        hasNext: false,
        hasPrev: false,
        success: false,
        error: errorMessage
      };
    }
  };

  const refetch = () => fetch(lastParams);

  return {
    fetch,
    refetch,
    get state() {
      return { ...state };
    },
    get isLoading() {
      return state.loading;
    },
    get error() {
      return state.error;
    }
  };
}
