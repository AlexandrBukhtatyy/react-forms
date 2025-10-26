import { useSignals } from '@preact/signals-react/runtime';
import type { GroupNodeWithControls } from '@/lib/forms';
import { FormField } from '@/lib/forms/components';
import type { CreditApplicationForm } from '../../../types/credit-application';

interface BasicInfoFormProps {
  form: GroupNodeWithControls<CreditApplicationForm>;
}

export function BasicInfoForm({ form }: BasicInfoFormProps) {
  useSignals();

  const loanType = form.loanType.value.value;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Основная информация о кредите</h2>
      <FormField control={form.loanType} />
      <FormField control={form.loanAmount} />
      <FormField control={form.loanTerm} />
      <FormField control={form.loanPurpose} />

      {loanType === 'mortgage' && (
        <>
          <h3 className="text-lg font-semibold mt-4">Информация о недвижимости</h3>
          <FormField control={form.propertyValue} />
          <FormField control={form.initialPayment} />
        </>
      )}

      {loanType === 'car' && (
        <>
          <h3 className="text-lg font-semibold mt-4">Информация об автомобиле</h3>
          <FormField control={form.carBrand} />
          <FormField control={form.carModel} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.carYear} />
            <FormField control={form.carPrice} />
          </div>
        </>
      )}
    </div>
  );
}
