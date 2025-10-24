import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/form-field';
import { Checkbox, Input, Select, Textarea } from '@/lib/forms/components';

export const propertyFormSchema = {
  type: {
    value: 'apartment',
    component: Select,
    componentProps: {
      label: 'Тип имущества',
      placeholder: 'Выберите тип',
      options: [
        { value: 'apartment', label: 'Квартира' },
        { value: 'house', label: 'Дом' },
        { value: 'land', label: 'Земельный участок' },
        { value: 'commercial', label: 'Коммерческая недвижимость' },
        { value: 'car', label: 'Автомобиль' },
        { value: 'other', label: 'Другое' },
      ],
    },
  },
  description: {
    value: '',
    component: Textarea,
    componentProps: {
      label: 'Описание',
      placeholder: 'Опишите имущество',
      rows: 2,
    },
  },
  estimatedValue: {
    value: 0,
    component: Input,
    componentProps: {
      label: 'Оценочная стоимость',
      placeholder: '0',
      type: 'number',
      min: 0,
      step: 1000,
    },
  },
  hasEncumbrance: {
    value: false,
    component: Checkbox,
    componentProps: {
      label: 'Имеется обременение (залог)',
    },
  },
};

interface PropertyFormProps {
  // GroupProxy для элемента массива properties
  control: any;
}

export function PropertyForm({ control }: PropertyFormProps) {
  useSignals();

  return (
    <div className="space-y-3">
      <FormField control={control.type} />
      <FormField control={control.description} />
      <FormField control={control.estimatedValue} />
      <FormField control={control.hasEncumbrance} />
    </div>
  );
}
