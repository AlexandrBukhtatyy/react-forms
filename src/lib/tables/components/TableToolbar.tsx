import React from 'react';
import { Button } from '@/lib/ui/button';

interface TableToolbarProps {
  className?: string;
}

const TableToolbar: React.FC<TableToolbarProps> = ({ className }) => {
  return (
    <div className={className}>
      <Button onClick={() => alert('Добавить пользователя')}>Добавить пользователя</Button>
    </div>
  );
};

export default TableToolbar;
