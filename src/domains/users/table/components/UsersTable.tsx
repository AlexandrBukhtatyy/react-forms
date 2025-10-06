import React, { useEffect } from 'react';
import UsersFilterForm from "./UsersFilterForm";
import { usersTableState, usersTableActions } from '../store/usersTableStore';
import TableToolbar from '@/lib/tables/components/TableToolbar';
import Table from '@/lib/tables/components/Table';
import TablePagination from '@/lib/tables/components/TablePagination';

interface UsersTableProps {
  className?: string;
}

const UsersTable: React.FC<UsersTableProps> = ({ className }) => {
  useEffect(() => {
    // Загружаем данные при монтировании
    usersTableActions.loadData();
  }, []);

  return (
    <>
      <UsersFilterForm className="mb-6"/>
      <TableToolbar className="mb-6"/>
      <Table className="mb-6" state={usersTableState} />
      <TablePagination state={usersTableState} actions={usersTableActions} />
    </>
  );
};

export default UsersTable;
