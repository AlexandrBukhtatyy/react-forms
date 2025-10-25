import { useSignals } from '@preact/signals-react/runtime';
import type { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { FormField } from '@/lib/forms/components';

interface EmploymentFormProps {
  form: GroupNode<any>;
}

export function EmploymentForm({ form }: EmploymentFormProps) {
  useSignals();

  const employmentStatus = (form as any).employmentStatus.value.value;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Информация о занятости</h2>

      <div className="space-y-4">
        <FormField control={(form as any).employmentStatus} />
      </div>

      {employmentStatus === 'employed' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mt-6">Информация о работодателе</h3>
          <FormField control={(form as any).companyName!} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={(form as any).companyInn!} />
            <FormField control={(form as any).companyPhone!} />
          </div>
          <FormField control={(form as any).companyAddress!} />

          <h3 className="text-lg font-semibold mt-6">Должность и стаж</h3>
          <FormField control={(form as any).position!} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={(form as any).workExperienceTotal!} />
            <FormField control={(form as any).workExperienceCurrent!} />
          </div>
        </div>
      )}

      {employmentStatus === 'selfEmployed' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mt-6">Информация о бизнесе</h3>
          <FormField control={(form as any).businessType!} />
          <FormField control={(form as any).businessInn!} />
          <FormField control={(form as any).businessActivity!} />
        </div>
      )}

      {employmentStatus !== 'unemployed' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mt-6">Доход</h3>
          <FormField control={(form as any).monthlyIncome} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={(form as any).additionalIncome!} />
            <FormField control={(form as any).additionalIncomeSource!} />
          </div>
        </div>
      )}

      {employmentStatus === 'unemployed' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mt-6">
          <p className="text-sm text-yellow-800">
            Обратите внимание: для получения кредита без подтвержденного дохода могут потребоваться дополнительные документы и поручители.
          </p>
        </div>
      )}
    </div>
  );
}
