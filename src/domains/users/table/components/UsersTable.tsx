import React, { useEffect } from 'react';
import UsersFilterForm from "./UsersFilterForm";
import { loadUsers } from '../logic/tableLogic';
import { tableStore } from '../signals/tableSignals';
import TableToolbar from '@/lib/tables/components/TableToolbar';
import Table, { type ColumnConfig } from '@/lib/tables/components/Table';
import TablePagination from '@/lib/tables/components/TablePagination';


interface UsersTableProps {
  className?: string;
}

const columns: ColumnConfig[] = [
  { key: 'id', header: 'ID', value: (user) => user.id, skeletonWidth: 'w-8' },
  { key: 'login', header: 'Логин', value: (user) => user.login, skeletonWidth: 'w-20' },
  { key: 'email', header: 'Почта', value: (user) => user.email, skeletonWidth: 'w-40' },
  { key: 'status', header: 'Статус', value: (user) => user.status, skeletonWidth: 'w-16' },
  { key: 'role', header: 'Роль', value: (user) => user.role, skeletonWidth: 'w-20' },
  { key: 'registrationDate', header: 'Дата регистрации', value: (user) => user.registrationDate, skeletonWidth: 'w-24' }
];

const UsersTable: React.FC<UsersTableProps> = ({ className }) => {
  useEffect(() => {
    loadUsers();
  }, []);

  return (
  <>
    <UsersFilterForm className="mb-6"/>
    <TableToolbar className="mb-6"/>
    <Table className="mb-6" state={tableStore} columns={columns}/>
    <TablePagination state={tableStore}/>
  </>
  );
};

export default UsersTable;
