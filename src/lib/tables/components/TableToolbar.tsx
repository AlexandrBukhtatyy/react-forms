import React from 'react';
import { Button } from '@/lib/ui/button';
import { useModal } from '@/context/ModalContext';
import UsersForm from '@/domains/users/form/components/UsersForm';

interface TableToolbarProps {
  className?: string;
}

const TableToolbar: React.FC<TableToolbarProps> = ({ className }) => {
  const { openModal } = useModal();

  const clickHandler = () => {
    const result = openModal(UsersForm).then(() => {
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
