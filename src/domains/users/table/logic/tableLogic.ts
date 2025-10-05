import { mutateSignal } from '@/utils/mutate-signal';
import { fetchUsers } from '../services/users';
import { tableStore, type TableStore } from '../signals/tableSignals';

export const loadUsers = async (): Promise<void> => {
  // TODO
  // mutateSignal<TableStore>(tableStore, (draft) => {
  //   draft.data.currentPage = 1;
  // });

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
  mutateSignal<TableStore>(tableStore, (draft) => {
    draft.data.currentPage = 1;
  });
  await loadUsers();
};

export const changePage = async (page: number): Promise<void> => {
  if (page < 1 || page > tableStore.value.data.totalPages) return;
  mutateSignal<TableStore>(tableStore, (draft) => {
    draft.data.currentPage = page;
  })
  await loadUsers();
};
