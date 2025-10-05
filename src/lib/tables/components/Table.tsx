import React from 'react';
import { type UsersTableStore } from '../../domains/users/table/signals/tableSignals';
import { cn } from '@/lib/utils';
import { computed, type Signal } from '@preact/signals-react';

interface TableProps {
  className?: string;
  state: Signal<UsersTableStore>;
  setting?: any;
}

const Table: React.FC<TableProps> = ({ className, state }) => {
  const currentUsers = computed(() => state.value.data.users);
  const isLoading = computed(() => state.value.ui.isLoading);
  const error = computed(() => state.value.ui.error);
  const pageSize = computed(() => state.value.data.pageSize);

  if (currentUsers.value.length === 0 && !isLoading.value) {
    return <p>Нет данных</p>;
  }

  if (error.value) {
    return <p className="text-red-500">Ошибка: {error.value}</p>;
  }

  return (
    <table className={cn("w-full border-collapse border", className)}>
      <thead>
        <tr>
          <th className="border p-2">ID</th>
          <th className="border p-2">Логин</th>
          <th className="border p-2">Почта</th>
          <th className="border p-2">Статус</th>
          <th className="border p-2">Роль</th>
          <th className="border p-2">Дата регистрации</th>
        </tr>
      </thead>
      <tbody>
        {isLoading.value ? (
          Array.from({ length: pageSize.value }).map((_, index) => (
            <tr key={index}>
              <td className="border p-2"><div className="h-4 w-8 bg-gray-200 rounded animate-pulse" /></td>
              <td className="border p-2"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></td>
              <td className="border p-2"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse" /></td>
              <td className="border p-2"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
              <td className="border p-2"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></td>
              <td className="border p-2"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
            </tr>
          ))
        ) : (
          currentUsers.value.map(user => (
            <tr key={user.id}>
              <td className="border p-2">{user.id}</td>
              <td className="border p-2">{user.login}</td>
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">{user.status}</td>
              <td className="border p-2">{user.role}</td>
              <td className="border p-2">{user.registrationDate}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default Table;