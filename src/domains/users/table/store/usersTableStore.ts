import { createTable, createServerPaginatedResource } from '@/lib/tables';
import { fetchUsersResource, type User } from '../services/users';

// Создаем resource для загрузки пользователей
const usersResource = createServerPaginatedResource(fetchUsersResource);

// Создаем table store с полной конфигурацией
export const usersTable = createTable<User>({
  pageSize: 5,
  columns: [
    {
      key: 'id',
      header: 'ID',
      value: (user) => user.id,
      skeleton: { width: 'w-8' }
    },
    {
      key: 'login',
      header: 'Логин',
      value: (user) => user.login,
      sortable: true,
      skeleton: { width: 'w-20' }
    },
    {
      key: 'email',
      header: 'Почта',
      value: (user) => user.email,
      skeleton: { width: 'w-40' }
    },
    {
      key: 'status',
      header: 'Статус',
      value: (user) => user.status,
      skeleton: { width: 'w-16' }
    },
    {
      key: 'role',
      header: 'Роль',
      value: (user) => user.role,
      skeleton: { width: 'w-20' }
    },
    {
      key: 'registrationDate',
      header: 'Дата регистрации',
      value: (user) => user.registrationDate,
      skeleton: { width: 'w-24' }
    }
  ],
  resource: usersResource,
  features: {
    selectable: false,
    sortable: true,
    expandable: false,
    hoverable: true
  },
  messages: {
    empty: 'Пользователей не найдено',
    error: (err) => `Ошибка загрузки: ${err}`
  },
  handlers: {
    onSort: async (column, direction) => {
      // При сортировке перезагружаем данные с сохранением фильтров
      await usersTable.loadData();
    }
  }
});
