import { memo } from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/form-field';
import { Input, RadioGroup } from '@/lib/forms/components';
import { GENDERS } from '../../constants/credit-application';

export const personalDataSchema = {
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

  gender: {
    value: 'male',
    component: RadioGroup,
    componentProps: {
      label: 'Пол',
      options: GENDERS,
    },
  },

  birthPlace: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Место рождения',
      placeholder: 'Введите место рождения',
    },
  },
}

interface PersonalDataFormProps {
  // GroupProxy для вложенной формы personalData (используем any для обхода ограничений TypeScript)
  control: any;
}

const PersonalDataFormComponent = ({ control }: PersonalDataFormProps) => {
  useSignals();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <FormField control={control.lastName} />
        <FormField control={control.firstName} />
        <FormField control={control.middleName} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField control={control.birthDate} />
        <FormField control={control.gender} />
      </div>
      <FormField control={control.birthPlace} />
    </div>
  );
};

// Мемоизируем компонент, чтобы предотвратить ререндер при изменении других полей
export const PersonalDataForm = memo(PersonalDataFormComponent);
