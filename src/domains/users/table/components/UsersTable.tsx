import React, { useEffect } from 'react';
import UsersFilterForm from "./UsersFilterForm";
import { usersTable } from '../store/usersTableStore';
import TableToolbar from '@/lib/tables/components/TableToolbar';
import Table from '@/lib/tables/components/Table';
import TablePagination from '@/lib/tables/components/TablePagination';

interface UsersTableProps {
  className?: string;
}

const UsersTable: React.FC<UsersTableProps> = ({ className }) => {
  useEffect(() => {
    // Загружаем данные при монтировании
    usersTable.loadData();
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Таблица пользователей</h1>
      <UsersFilterForm className="mb-6"/>
      <TableToolbar className="mb-6"/>
      <Table className="mb-6" control={usersTable} />
      <TablePagination control={usersTable} />
    </>
  );
};

export default UsersTable;
