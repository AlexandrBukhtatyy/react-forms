/**
 * Примеры использования модуля таблиц с разными ресурсами
 */

import { createTable, createServerPaginatedResource, createClientPaginatedResource, createStaticResource, createCachedResource, createHybridResource } from '../index';
import type { ResourceParams } from '../types';

// ============================================================================
// Типы данных
// ============================================================================

interface User {
  id: number;
  login: string;
  email: string;
  status: string;
  role: string;
  registrationDate: string;
}

// ============================================================================
// Пример 1: Server-Side Pagination
// ============================================================================

async function fetchUsersFromServer(params: ResourceParams) {
  const query = new URLSearchParams({
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
    ...(params.sortBy && { sortBy: params.sortBy, sortDirection: params.sortDirection }),
    ...(params.filters && Object.entries(params.filters).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: String(value)
    }), {}))
  });

  const response = await fetch(`/api/users?${query}`);
  const data = await response.json();

  return {
    items: data.users as User[],
    total: data.total as number
  };
}

export const [usersTableState, usersTableActions] = createTable<User>({
  pageSize: 20,
  columns: [
    { key: 'id', header: 'ID', value: (user) => user.id, skeleton: { width: 'w-8' } },
    { key: 'login', header: 'Логин', value: (user) => user.login, sortable: true },
    { key: 'email', header: 'Почта', value: (user) => user.email },
    { key: 'status', header: 'Статус', value: (user) => user.status },
    { key: 'role', header: 'Роль', value: (user) => user.role }
  ],
  resource: createServerPaginatedResource(fetchUsersFromServer),
  features: {
    selectable: true,
    sortable: true
  },
  handlers: {
    onSort: async () => {
      await usersTableActions.loadData();
    }
  }
});

// ============================================================================
// Пример 2: Client-Side Pagination
// ============================================================================

async function fetchAllUsers() {
  const response = await fetch('/api/users/all');
  const data = await response.json();
  return data.users as User[];
}

export const [clientTableState, clientTableActions] = createTable<User>({
  pageSize: 10,
  columns: [
    { key: 'id', header: 'ID', value: (user) => user.id },
    { key: 'login', header: 'Логин', value: (user) => user.login, sortable: true },
    { key: 'email', header: 'Почта', value: (user) => user.email }
  ],
  resource: createClientPaginatedResource(fetchAllUsers),
  features: {
    sortable: true
  }
});

// ============================================================================
// Пример 3: Static Resource
// ============================================================================

const MOCK_USERS: User[] = [
  { id: 1, login: 'john', email: 'john@example.com', status: 'active', role: 'admin', registrationDate: '2024-01-01' },
  { id: 2, login: 'jane', email: 'jane@example.com', status: 'active', role: 'user', registrationDate: '2024-01-02' },
  { id: 3, login: 'bob', email: 'bob@example.com', status: 'inactive', role: 'user', registrationDate: '2024-01-03' }
];

export const [staticTableState, staticTableActions] = createTable<User>({
  pageSize: 10,
  columns: [
    { key: 'id', header: 'ID', value: (user) => user.id },
    { key: 'login', header: 'Логин', value: (user) => user.login },
    { key: 'email', header: 'Почта', value: (user) => user.email }
  ],
  resource: createStaticResource(MOCK_USERS)
});

// ============================================================================
// Пример 4: Cached Resource
// ============================================================================

export const [cachedTableState, cachedTableActions] = createTable<User>({
  pageSize: 20,
  columns: [
    { key: 'id', header: 'ID', value: (user) => user.id },
    { key: 'login', header: 'Логин', value: (user) => user.login }
  ],
  resource: createCachedResource(
    createServerPaginatedResource(fetchUsersFromServer),
    30000 // 30 секунд TTL
  ),
  features: {
    sortable: true
  }
});

// ============================================================================
// Пример 5: Hybrid Resource
// ============================================================================

export const [hybridTableState, hybridTableActions] = createTable<User>({
  pageSize: 20,
  columns: [
    { key: 'id', header: 'ID', value: (user) => user.id },
    { key: 'login', header: 'Логин', value: (user) => user.login, sortable: true },
    { key: 'email', header: 'Почта', value: (user) => user.email }
  ],
  resource: createHybridResource(
    fetchAllUsers,
    fetchUsersFromServer,
    500 // Если меньше 500 записей - работаем локально
  ),
  features: {
    sortable: true,
    selectable: true
  }
});

// ============================================================================
// Пример использования в компоненте
// ============================================================================

/*
import React from 'react';
import { Table } from '@/lib/tables';
import { usersTableState, usersTableActions } from './examples/usage-examples';

const UsersPage: React.FC = () => {
  React.useEffect(() => {
    // Загружаем данные при монтировании
    usersTableActions.loadData();
  }, []);

  const handleFilter = async (filters: Record<string, any>) => {
    usersTableActions.setPage(1);
    await usersTableActions.loadData(filters);
  };

  const handleNextPage = async () => {
    usersTableActions.nextPage();
    await usersTableActions.loadData();
  };

  const handlePrevPage = async () => {
    usersTableActions.prevPage();
    await usersTableActions.loadData();
  };

  return (
    <div>
      <h1>Пользователи</h1>

      <div>
        <button onClick={() => usersTableActions.refresh()}>Обновить</button>
        <button onClick={() => usersTableActions.invalidateCache()}>Очистить кеш</button>
      </div>

      <Table state={usersTableState} />

      <div>
        <button onClick={handlePrevPage}>Назад</button>
        <button onClick={handleNextPage}>Вперед</button>
      </div>
    </div>
  );
};
*/
