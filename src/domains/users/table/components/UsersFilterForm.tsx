import React, { useState } from 'react';
import { usersTableActions } from '../store/usersTableStore';
import type { Filters } from '../services/users';

interface FilterFormProps {
  className?: string;
}

const UsersFilterForm: React.FC<FilterFormProps> = ({ className }) => {
  const [filters, setFilters] = useState<Filters>({
    login: '',
    email: '',
    status: '',
    role: '',
    registrationDate: ''
  });

  const handleChange = async () => {
    // Сбрасываем на первую страницу и загружаем с новыми фильтрами
    usersTableActions.setPage(1);
    await usersTableActions.loadData(filters);
  };

  const updateFilter = <K extends keyof Filters>(
    key: K,
    value: Filters[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Обновляем фильтры и перезагружаем данные
    usersTableActions.setPage(1);
    usersTableActions.loadData(newFilters);
  };

  return (
    <div className={className}>
      <label>
        Логин:
        <input
          type="text"
          value={filters.login}
          onChange={e => updateFilter('login', e.target.value)}
        />
      </label>{' '}
      <label>
        Почта:
        <input
          type="text"
          value={filters.email}
          onChange={e => updateFilter('email', e.target.value)}
        />
      </label>{' '}
      <label>
        Статус:
        <select
          value={filters.status}
          onChange={e => updateFilter('status', e.target.value as '' | 'active' | 'inactive')}
        >
          <option value="">Все</option>
          <option value="active">Активный</option>
          <option value="inactive">Неактивный</option>
        </select>
      </label>{' '}
      <label>
        Роль:
        <select
          value={filters.role}
          onChange={e => updateFilter('role', e.target.value as '' | 'admin' | 'user' | 'moderator')}
        >
          <option value="">Все</option>
          <option value="admin">Администратор</option>
          <option value="user">Пользователь</option>
          <option value="moderator">Модератор</option>
        </select>
      </label>{' '}
      <label>
        Дата регистрации:
        <input
          type="date"
          value={filters.registrationDate}
          onChange={e => updateFilter('registrationDate', e.target.value)}
        />
      </label>
    </div>
  );
};

export default UsersFilterForm;
