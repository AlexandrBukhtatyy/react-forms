import { signal, computed } from '@preact/signals-react';

export interface Filters {
  login: string;
  email: string;
  status: '' | 'active' | 'inactive';
  role: '' | 'admin' | 'user' | 'moderator';
  registrationDate: string; // ISO date string or empty
}

export interface User {
  id: number;
  login: string;
  email: string;
  status: 'active' | 'inactive';
  role: 'admin' | 'user' | 'moderator';
  registrationDate: string; // ISO date string
}

export interface TableStore {
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

export const tableStore = signal<TableStore>({
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
export const currentUsers = computed(() => tableStore.value.data.users);
export const isLoading = computed(() => tableStore.value.ui.isLoading);
export const currentPage = computed(() => tableStore.value.data.currentPage);
export const totalPages = computed(() => tableStore.value.data.totalPages);
export const filters = computed(() => tableStore.value.filters);
export const hasError = computed(() => tableStore.value.ui.error !== null);
