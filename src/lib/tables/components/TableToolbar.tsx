import React from 'react';
import { Button } from '@/lib/ui/button';
import { useDialog } from '@/context/DialogContext';
import UsersForm from '@/domains/users/form/components/UsersForm';
import { usersTable } from '@/domains/users/table/store/usersTableStore';

interface TableToolbarProps {
  className?: string;
}

const TableToolbar: React.FC<TableToolbarProps> = ({ className }) => {
  const { openDialog } = useDialog();

  const clickHandler = () => {
    openDialog('Таблица пользователей', UsersForm).then((result) => {
      usersTable.loadData();
    });
  }

  return (
    <div className={className}>
      <Button onClick={() => clickHandler()}>Добавить пользователя</Button>
    </div>
  );
};

export default TableToolbar;
