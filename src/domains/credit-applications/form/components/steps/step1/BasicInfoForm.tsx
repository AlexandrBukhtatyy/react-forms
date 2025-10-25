import { useSignals } from '@preact/signals-react/runtime';
import type { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { FormField } from '@/lib/forms/components';

interface BasicInfoFormProps {
  form: GroupNode<any>;
}

export function BasicInfoForm({ form }: BasicInfoFormProps) {
  useSignals();

  const loanType = (form as any).loanType.value.value;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Основная информация о кредите</h2>
      <FormField control={(form as any).loanType} />
      <FormField control={(form as any).loanAmount} />
      <FormField control={(form as any).loanTerm} />
      <FormField control={(form as any).loanPurpose} />

      {loanType === 'mortgage' && (
        <>
          <h3 className="text-lg font-semibold mt-4">Информация о недвижимости</h3>
          <FormField control={(form as any).propertyValue!} />
          <FormField control={(form as any).initialPayment!} />
        </>
      )}

      {loanType === 'car' && (
        <>
          <h3 className="text-lg font-semibold mt-4">Информация об автомобиле</h3>
          <FormField control={(form as any).carBrand!} />
          <FormField control={(form as any).carModel!} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={(form as any).carYear!} />
            <FormField control={(form as any).carPrice!} />
          </div>
        </>
      )}
    </div>
  );
}
