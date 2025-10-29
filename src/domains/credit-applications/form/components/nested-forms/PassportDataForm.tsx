import { memo } from 'react';
import { FormField } from '@/lib/forms/components/core/form-field';
import { Input, InputMask, Textarea } from '@/lib/forms/components';
import type { DeepFormSchema } from '@/lib/forms';

/**
 * Паспортные данные (вложенная форма)
 */
export interface PassportData {
  series: string;
  number: string;
  issueDate: string;
  issuedBy: string;
  departmentCode: string;
}

export const passportDataSchema: DeepFormSchema<PassportData> = {
  series: {
    value: '',
    component: InputMask,
    componentProps: {
      label: 'Серия паспорта',
      placeholder: '00 00',
      mask: '99 99',
    },
  },

  number: {
    value: '',
    component: InputMask,
    componentProps: {
      label: 'Номер паспорта',
      placeholder: '000000',
      mask: '999999',
    },
  },

  issueDate: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Дата выдачи',
      type: 'date',
    },
  },

  issuedBy: {
    value: '',
    component: Textarea,
    componentProps: {
      label: 'Кем выдан',
      placeholder: 'Введите наименование органа',
      rows: 3,
    },
  },

  departmentCode: {
    value: '',
    component: InputMask,
    componentProps: {
      label: 'Код подразделения',
      placeholder: '000-000',
      mask: '999-999',
    },
  },
}


interface PassportDataFormProps {
  // GroupProxy для вложенной формы passportData (используем any для обхода ограничений TypeScript)
  control: any;
}

const PassportDataFormComponent = ({ control }: PassportDataFormProps) => {

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField control={control.series} />
        <FormField control={control.number} />
      </div>
      <FormField control={control.issueDate} />
      <FormField control={control.issuedBy} />
      <FormField control={control.departmentCode} />
    </div>
  );
};

// Мемоизируем компонент, чтобы предотвратить ререндер при изменении других полей
export const PassportDataForm = memo(PassportDataFormComponent);
