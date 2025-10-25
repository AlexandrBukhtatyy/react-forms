import { memo } from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/core/form-field';
import { Input, InputMask } from '@/lib/forms/components';


/**
 * Переиспользуемая схема формы
 */
export const addressFormSchema = {
      region: {
        value: undefined,
        component: Input,
        componentProps: {
          label: 'Регион',
          placeholder: 'Введите регион',
        },
      },

      city: {
        value: undefined,
        component: Input,
        componentProps: {
          label: 'Город',
          placeholder: 'Введите город',
        },
      },

      street: {
        value: undefined,
        component: Input,
        componentProps: {
          label: 'Улица',
          placeholder: 'Введите улицу',
        },
      },

      house: {
        value: undefined,
        component: Input,
        componentProps: {
          label: 'Дом',
          placeholder: '№',
        },
      },

      apartment: {
        value: undefined,
        component: Input,
        componentProps: {
          label: 'Квартира',
          placeholder: '№',
        },
      },

      postalCode: {
        value: undefined,
        component: InputMask,
        componentProps: {
          label: 'Индекс',
          placeholder: '000000',
          mask: '999999',
        },
      },
}

interface AddressFormProps {
  // GroupProxy для вложенной формы address (используем any для обхода ограничений TypeScript)
  control: any;
}

const AddressFormComponent = ({ control }: AddressFormProps) => {
  useSignals();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField control={control.region} />
        <FormField control={control.city} />
      </div>

      <FormField control={control.street} />

      <div className="grid grid-cols-3 gap-4">
        <FormField control={control.house} />
        <FormField control={control.apartment} />
        <FormField control={control.postalCode} />
      </div>
    </div>
  );
};

// Мемоизируем компонент, чтобы предотвратить ререндер при изменении других полей
export const AddressForm = memo(AddressFormComponent);
