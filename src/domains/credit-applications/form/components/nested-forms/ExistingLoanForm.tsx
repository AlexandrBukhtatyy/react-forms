import { useSignals } from '@preact/signals-react/runtime';
import { FieldController } from '@/lib/forms/core/field-controller';
import { FormField } from '@/lib/forms/components/form-field';
import type { ExistingLoan } from '../../../_shared/types/credit-application';

/**
 * Компонент для отдельного кредита
 * Используется с FormArrayManager в родительском компоненте
 */
export function ExistingLoanForm({ control }: { control: FieldController<ExistingLoan> }) {
  useSignals();

  return (
    <>
      <FormField control={control.bank as any} />
      <FormField control={control.type as any} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control.amount as any} />
        <FormField control={control.remainingAmount as any} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control.monthlyPayment as any} />
        <FormField control={control.maturityDate as any} />
      </div>
    </>
  );
}
