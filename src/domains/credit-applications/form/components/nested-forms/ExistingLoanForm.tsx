/**
 * ExistingLoanForm
 *
 * Компонент для отдельного кредита.
 * Работает с DeepFormStore через GroupProxy (элемент массива).
 *
 * Используется с ArrayProxy в родительском компоненте:
 * {form.controls.existingLoans.map((loan, index) => (
 *   <ExistingLoanForm key={index} control={loan} />
 * ))}
 */

import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/form-field';

interface ExistingLoanFormProps {
  // GroupProxy для элемента массива existingLoans (используем any для обхода ограничений TypeScript)
  control: any;
}

export function ExistingLoanForm({ control }: ExistingLoanFormProps) {
  useSignals();

  return (
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
  );
}
