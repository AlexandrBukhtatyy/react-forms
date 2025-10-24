import { memo } from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/form-field';
import { Input, InputMask } from '@/lib/forms/components';
import { Select } from '@radix-ui/react-select';
import { RELATIONSHIPS } from '../../constants/credit-application';

    export const coBorrowersFormSchema = {
      personalData: {
        lastName: {
          value: '',
          component: Input,
          componentProps: {
            label: 'Фамилия',
            placeholder: 'Введите фамилию',
          },
        },
        firstName: {
          value: '',
          component: Input,
          componentProps: {
            label: 'Имя',
            placeholder: 'Введите имя',
          },
        },
        middleName: {
          value: '',
          component: Input,
          componentProps: {
            label: 'Отчество',
            placeholder: 'Введите отчество',
          },
        },
        birthDate: {
          value: '',
          component: Input,
          componentProps: {
            label: 'Дата рождения',
            type: 'date',
          },
        },
      },
      phone: {
        value: '',
        component: InputMask,
        componentProps: {
          label: 'Телефон',
          placeholder: '+7 (___) ___-__-__',
          mask: '+7 (999) 999-99-99',
        },
      },
      email: {
        value: '',
        component: Input,
        componentProps: {
          label: 'Email',
          placeholder: 'example@mail.com',
          type: 'email',
        },
      },
      relationship: {
        value: 'spouse',
        component: Select,
        componentProps: {
          label: 'Отношение к заемщику',
          placeholder: 'Выберите отношение',
          options: RELATIONSHIPS,
        },
      },
      monthlyIncome: {
        value: 0,
        component: Input,
        componentProps: {
          label: 'Ежемесячный доход (₽)',
          placeholder: '0',
          type: 'number',
          min: 0,
          step: 1000,
        },
      },
    };

interface CoBorrowerFormProps {
  // GroupProxy для элемента массива coBorrowers
  control: any;
}

const CoBorrowerFormComponent = ({ control }: CoBorrowerFormProps) => {
  useSignals();

  return (
    <div className="space-y-4">
      <div className="p-3 bg-gray-50 rounded">
        <h5 className="text-sm font-medium mb-3">Личные данные</h5>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <FormField control={control.personalData.lastName} />
            <FormField control={control.personalData.firstName} />
            <FormField control={control.personalData.middleName} />
          </div>

          <FormField control={control.personalData.birthDate} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField control={control.phone} />
        <FormField control={control.email} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField control={control.relationship} />
        <FormField control={control.monthlyIncome} />
      </div>
    </div>
  );
};

// Мемоизируем компонент, чтобы предотвратить ререндер при изменении других полей
export const CoBorrowerForm = memo(CoBorrowerFormComponent);
