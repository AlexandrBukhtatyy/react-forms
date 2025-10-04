import React from 'react';
import { tableStore, currentUsers, isLoading } from '../signals/tableSignals';
import { cn } from '@/lib/utils';

interface TableProps {
  className?: string;
}

const Table: React.FC<TableProps> = ({ className }) => {
  if (currentUsers.value.length === 0 && !isLoading.value) {
    return <p>Нет данных</p>;
  }

  if (tableStore.value.ui.error) {
    return <p className="text-red-500">Ошибка: {tableStore.value.ui.error}</p>;
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
          Array.from({ length: tableStore.value.data.pageSize }).map((_, index) => (
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