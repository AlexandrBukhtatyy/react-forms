import React from 'react';
import { tableStore } from '../signals/tableSignals';
import { updateFilters } from '../logic/tableLogic';

interface FilterFormProps {
  className?: string;
}

const FilterForm: React.FC<FilterFormProps> = ({ className }) => {
  const handleChange = (): void => {
    updateFilters();
  };

  const updateFilter = <K extends keyof typeof tableStore.value.filters>(
    key: K,
    value: typeof tableStore.value.filters[K]
  ) => {
    tableStore.value = {
      ...tableStore.value,
      filters: { ...tableStore.value.filters, [key]: value }
    };
    handleChange();
  };

  return (
    <div className={className}>
      <label>
        Логин:
        <input
          type="text"
          value={tableStore.value.filters.login}
          onChange={e => updateFilter('login', e.target.value)}
        />
      </label>{' '}
      <label>
        Почта:
        <input
          type="text"
          value={tableStore.value.filters.email}
          onChange={e => updateFilter('email', e.target.value)}
        />
      </label>{' '}
      <label>
        Статус:
        <select
          value={tableStore.value.filters.status}
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
          value={tableStore.value.filters.role}
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
          value={tableStore.value.filters.registrationDate}
          onChange={e => updateFilter('registrationDate', e.target.value)}
        />
      </label>
    </div>
  );
};

export default FilterForm;
