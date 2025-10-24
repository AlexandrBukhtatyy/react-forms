import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/form-field';
import { Input, Select } from '@/lib/forms/components';
import { EXISTING_LOAN_TYPES } from '../../constants/credit-application';

export const existingLoansFormSchema = {
  bank: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Банк',
      placeholder: 'Название банка',
    },
  },
  type: {
    value: 'consumer',
    component: Select,
    componentProps: {
      label: 'Тип кредита',
      placeholder: 'Выберите тип',
      options: EXISTING_LOAN_TYPES,
    },
  },
  amount: {
    value: 0,
    component: Input,
    componentProps: {
      label: 'Сумма кредита (₽)',
      placeholder: '0',
      type: 'number',
      min: 0,
      step: 1000,
    },
  },
  remainingAmount: {
    value: 0,
    component: Input,
    componentProps: {
      label: 'Остаток долга (₽)',
      placeholder: '0',
      type: 'number',
      min: 0,
      step: 1000,
    },
  },
  monthlyPayment: {
    value: 0,
    component: Input,
    componentProps: {
      label: 'Ежемесячный платеж (₽)',
      placeholder: '0',
      type: 'number',
      min: 0,
      step: 100,
    },
  },
  maturityDate: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Дата погашения',
      type: 'date',
    },
  },
};

interface ExistingLoanFormProps {
  // GroupProxy для элемента массива existingLoans
  control: any;
  // Индекс элемента в массиве
  index: number;
  // Функция для удаления элемента
  onRemove: () => void;
}

export function ExistingLoanForm({ control, index, onRemove }: ExistingLoanFormProps) {
  useSignals();

  return (
    <div className="mb-4 p-4 bg-white rounded border">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium">Кредит #{index + 1}</h4>
        <button
          type="button"
          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          onClick={onRemove}
        >
          Удалить
        </button>
      </div>

      <div className="space-y-3">
        <FormField control={control.bank} />
        <FormField control={control.type} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={control.amount} />
          <FormField control={control.remainingAmount} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={control.monthlyPayment} />
          <FormField control={control.maturityDate} />
        </div>
      </div>
    </div>
  );
}
