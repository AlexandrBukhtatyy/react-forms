import React from 'react';
import { Button } from '@/lib/ui/button';
import { useDialog } from '@/context/DialogContext';
import UsersForm from '@/domains/users/form/components/UsersForm';

interface TableToolbarProps {
  className?: string;
}

const TableToolbar: React.FC<TableToolbarProps> = ({ className }) => {
  const { openDialog } = useDialog();

  const clickHandler = () => {
    const result = openDialog('Таблица пользователей',UsersForm).then(() => {
      console.log("Ответ из модального окна:", result);
    });
  }

  return (
    <div className={className}>
      <Button onClick={() => clickHandler()}>Добавить пользователя</Button>
    </div>
  );
};

export default TableToolbar;
