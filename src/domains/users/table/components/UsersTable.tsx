import React, { useEffect, useMemo, useRef } from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import UsersFilterForm, { createUsersFilterForm } from './UsersFilterForm';
import { usersTable } from '../store/usersTableStore';
import TableToolbar from '@/lib/tables/components/TableToolbar';
import Table from '@/lib/tables/components/Table';
import TablePagination from '@/lib/tables/components/TablePagination';

interface UsersTableProps {
  className?: string;
}

const UsersTable: React.FC<UsersTableProps> = ({ className: _className }) => {
  useSignals();
  const form = useMemo(createUsersFilterForm, []);
  const isInitializedRef = useRef(false);

  // Автоматическая фильтрация при изменении значений
  // Эффект сработает когда formValues изменится (так как это зависимость)
  useEffect(() => {
    // Пропускаем первый вызов (инициализацию)
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }
    // TODO: Масло масленное form.value.value
    usersTable.setFilters(form.value.value);
  }, [form.value.value]);

  useEffect(() => {
    // Загружаем данные при монтировании
    usersTable.loadData();
  }, []);

  return (
    <>
      <UsersFilterForm className="mb-6" control={form} />
      {/* TODO: Сделать тулбар унифицированным */}
      <TableToolbar className="mb-6" />
      <Table className="mb-6" control={usersTable} />
      <TablePagination control={usersTable} />
    </>
  );
};

export default UsersTable;
