import React from 'react';
import { Form } from '@/lib/forms/components/core/form';
import { cn } from '@/lib/utils';
import { statusResource } from '../resources/status.resource';
import { roleResource } from '../resources/role.resource';
import { FormField, GroupNode, type GroupNodeWithControls } from '@/lib/forms';
import { Input, InputSearch, Select } from '@/lib/forms/components';

interface UsersFilterModel {
  login: string | null;
  email: string | null;
  userStatus: string | null; // TODO: из за того что это название зарезервировано выдает ошибку при использовании status
  role: string | null;
  registrationDate: string | null;
}

interface FilterFormProps {
  className?: string;
  control: GroupNodeWithControls<UsersFilterModel>;
}

export const createUsersFilterForm = (): GroupNodeWithControls<UsersFilterModel> => {
  const formSchema = {
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
      userStatus: {
        value: null,
        component: Select,
        componentProps: {
          placeholder: 'Статус',
          resource: statusResource,
          clearable: true
        }
      },
      role: {
        value: null,
        component: Select,
        componentProps: {
          placeholder: 'Роль',
          resource: roleResource,
          clearable: true
        }
      },
      registrationDate: {
        value: null,
        component: Input, // TODO: Реализовать дату
        componentProps: { placeholder: 'Дата регистрации' }
      },
    }
  return new GroupNode(formSchema) as GroupNodeWithControls<UsersFilterModel>;
}

const UsersFilterForm: React.FC<FilterFormProps> = ({ className, control }) => {
  return (
    <Form className={cn(className, "flex gap-4")}>
      <FormField control={control.login}/>
      <FormField control={control.email}/>
      <FormField control={control.userStatus}/>
      <FormField control={control.role}/>
      <FormField control={control.registrationDate}/>
    </Form>
  );
};

export default UsersFilterForm;
