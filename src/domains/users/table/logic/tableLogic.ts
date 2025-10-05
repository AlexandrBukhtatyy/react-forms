import { mutateSignal } from '@/utils/mutate-signal';
import { fetchUsers } from '../services/users';
import { tableStore, type UsersTableStore } from '../signals/tableSignals';

export const loadUsers = async (): Promise<void> => {
  mutateSignal<UsersTableStore>(tableStore, (draft) => {
    draft.ui.isLoading = true;
  });

  try {
    const { currentPage, pageSize } = tableStore.value.data;
    const { users, totalCount, totalPages } = await fetchUsers(
      tableStore.value.filters,
      currentPage,
      pageSize
    );
    mutateSignal<UsersTableStore>(tableStore, (draft) => {
      draft.data.users = users;
      draft.data.totalCount = totalCount;
      draft.data.totalPages = totalPages;
      draft.ui.isLoading = false;
    });
  } catch (error) {
    mutateSignal<UsersTableStore>(tableStore, (draft) => {
      draft.ui.isLoading = false;
      draft.ui.error = error instanceof Error ? error.message : 'Ошибка загрузки данных';
    });
  }
};

export const updateFilters = async (): Promise<void> => {
  mutateSignal<UsersTableStore>(tableStore, (draft) => {
    draft.data.currentPage = 1;
  });
  await loadUsers();
};

export const changePage = async (page: number): Promise<void> => {
  if (page < 1 || page > tableStore.value.data.totalPages) return;
  mutateSignal<UsersTableStore>(tableStore, (draft) => {
    draft.data.currentPage = page;
  })
  await loadUsers();
};
