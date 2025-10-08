import React from 'react';
import { Form } from '@/lib/forms/components/form';
import { cn } from '@/lib/utils';
import { Input } from '@/lib/forms/components/input';
import { InputSearch } from '@/lib/forms/components/input-search';
import { Select } from '@/lib/forms/components/select';
import { statusResource } from '../resources/status.resource';
import { roleResource } from '../resources/role.resource';
import { FormField, FormStore } from '@/lib/forms';

interface UsersFilterModel {
  login: string | null;
  email: string | null;
  status: string | null;
  role: string | null;
  registrationDate: string | null;
}

interface FilterFormProps {
  className?: string;
  onFilter?: (values: UsersFilterModel) => void;
}

const makeUsersFilterForm = (): FormStore<UsersFilterModel> => {
  return new FormStore({
      login: {
        value: null,
        component: InputSearch,
        componentProps: {
          placeholder: 'Поиск по логину...',
          debounce: 300
        }
      },
      email: {
        value: null,
        component: InputSearch,
        componentProps: {
          placeholder: 'Поиск по email...',
          debounce: 300
        }
      },
      status: {
        value: null,
        component: Select,
        componentProps: {
          placeholder: 'Статус',
          resource: statusResource
        }
      },
      role: {
        value: null,
        component: Select,
        componentProps: {
          placeholder: 'Роль',
          resource: roleResource
        }
      },
      registrationDate: {
        value: null,
        component: Input, // TODO: Реализовать дату
        componentProps: { placeholder: 'Дата регистрации' }
      },
    });
}

const UsersFilterForm: React.FC<FilterFormProps> = ({ className, onFilter }) => {
  const form = React.useMemo(makeUsersFilterForm, []);

  // Автоматическая фильтрация при изменении значений
  React.useEffect(() => {
    if (onFilter && form.valid) {
      onFilter(form.getValue());
    }
  }, [form.dirty, onFilter]);

  return (
    <Form className={cn(className, "flex gap-4")}>
      <FormField control={form.controls.login}/>
      <FormField control={form.controls.email}/>
      <FormField control={form.controls.status}/>
      <FormField control={form.controls.role}/>
      <FormField control={form.controls.registrationDate}/>
    </Form>
  );
};

export default UsersFilterForm;
