import { useSignals } from '@preact/signals-react/runtime';
import type { FormStore } from '@/lib/forms/core/form-store';
import type { CreditApplicationForm } from '../../../../_shared/types/credit-application';
import { FormField } from '@/lib/forms/components';

interface BasicInfoFormProps {
  form: FormStore<CreditApplicationForm>;
}

export function BasicInfoForm({ form }: BasicInfoFormProps) {
  useSignals();

  const loanType = form.controls.loanType.value;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Основная информация о кредите</h2>

      <FormField control={form.controls.loanType} />
      <FormField control={form.controls.loanAmount} />
      <FormField control={form.controls.loanTerm} />
      <FormField control={form.controls.loanPurpose} />

      {/* Специфичные поля для ипотеки */}
      {loanType === 'mortgage' && (
        <>
          <h3 className="text-lg font-semibold mt-4">Информация о недвижимости</h3>
          <FormField control={form.controls.propertyValue!} />
          <FormField control={form.controls.initialPayment!} />
        </>
      )}

      {/* Специфичные поля для автокредита */}
      {loanType === 'car' && (
        <>
          <h3 className="text-lg font-semibold mt-4">Информация об автомобиле</h3>
          <FormField control={form.controls.carBrand!} />
          <FormField control={form.controls.carModel!} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.controls.carYear!} />
            <FormField control={form.controls.carPrice!} />
          </div>
        </>
      )}
    </div>
  );
}
