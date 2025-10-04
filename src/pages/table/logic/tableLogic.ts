import { fetchUsers } from '../services/users';
import { tableStore } from '../signals/tableSignals';

export const loadUsers = async (): Promise<void> => {
  tableStore.value = {
    ...tableStore.value,
    ui: { ...tableStore.value.ui, isLoading: true, error: null }
  };

  try {
    const { currentPage, pageSize } = tableStore.value.data;
    const { users, totalCount, totalPages } = await fetchUsers(
      tableStore.value.filters,
      currentPage,
      pageSize
    );

    tableStore.value = {
      ...tableStore.value,
      data: {
        ...tableStore.value.data,
        users,
        totalCount,
        totalPages
      },
      ui: { ...tableStore.value.ui, isLoading: false }
    };
  } catch (error) {
    tableStore.value = {
      ...tableStore.value,
      ui: {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Ошибка загрузки данных'
      }
    };
  }
};

export const updateFilters = async (): Promise<void> => {
  tableStore.value = {
    ...tableStore.value,
    data: { ...tableStore.value.data, currentPage: 1 }
  };
  await loadUsers();
};

export const changePage = async (page: number): Promise<void> => {
  if (page < 1 || page > tableStore.value.data.totalPages) return;
  tableStore.value = {
    ...tableStore.value,
    data: { ...tableStore.value.data, currentPage: page }
  };
  await loadUsers();
};
