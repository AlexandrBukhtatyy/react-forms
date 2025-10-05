import { signal, computed } from '@preact/signals-react';
import type { User, Filters } from '../services/users';

export interface UsersTableStore {
  filters: Filters;
  data: {
    users: User[];
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  ui: {
    isLoading: boolean;
    error: string | null;
  };
}

export const tableStore = signal<UsersTableStore>({
  filters: {
    login: '',
    email: '',
    status: '',
    role: '',
    registrationDate: '',
  },
  data: {
    users: [],
    currentPage: 1,
    pageSize: 5,
    totalCount: 0,
    totalPages: 0,
  },
  ui: {
    isLoading: false,
    error: null,
  },
});

// Computed сигналы для удобного доступа
export const filters = computed(() => tableStore.value.filters);
