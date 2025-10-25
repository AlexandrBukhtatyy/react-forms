import React from 'react';
import { Form } from '@/lib/forms/components/core/form';
import { cn } from '@/lib/utils';
import { statusResource } from '../resources/status.resource';
import { roleResource } from '../resources/role.resource';
import { FormField, GroupNode } from '@/lib/forms';
import { Input, InputSearch, Select } from '@/lib/forms/components';

interface UsersFilterModel {
  login: string | null;
  email: string | null;
  status: string | null;
  role: string | null;
  registrationDate: string | null;
}

interface FilterFormProps {
  className?: string;
  control: GroupNode<UsersFilterModel>;
}

export const makeUsersFilterForm = (): GroupNode<UsersFilterModel> => {
  return new GroupNode({
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
    });
}

const UsersFilterForm: React.FC<FilterFormProps> = ({ className, control }) => {
  return (
    <Form className={cn(className, "flex gap-4")}>
      <FormField control={(control as any).login}/>
      <FormField control={(control as any).email}/>
      <FormField control={(control as any).status}/>
      <FormField control={(control as any).role}/>
      <FormField control={(control as any).registrationDate}/>
    </Form>
  );
};

export default UsersFilterForm;
