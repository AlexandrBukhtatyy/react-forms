import { useSignals } from '@preact/signals-react/runtime';
import type { GroupNodeWithControls } from '@/lib/forms';
import { FormField } from '@/lib/forms/components';
import type { CreditApplicationForm } from '../../../types/credit-application';

interface EmploymentFormProps {
  form: GroupNodeWithControls<CreditApplicationForm>;
}

export function EmploymentForm({ form }: EmploymentFormProps) {
  useSignals();

  const employmentStatus = form.employmentStatus.value.value;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Информация о занятости</h2>

      <div className="space-y-4">
        <FormField control={form.employmentStatus} />
      </div>

      {employmentStatus === 'employed' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mt-6">Информация о работодателе</h3>
          <FormField control={form.companyName} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.companyInn} />
            <FormField control={form.companyPhone} />
          </div>
          <FormField control={form.companyAddress} />

          <h3 className="text-lg font-semibold mt-6">Должность и стаж</h3>
          <FormField control={form.position} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.workExperienceTotal} />
            <FormField control={form.workExperienceCurrent} />
          </div>
        </div>
      )}

      {employmentStatus === 'selfEmployed' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mt-6">Информация о бизнесе</h3>
          <FormField control={form.businessType} />
          <FormField control={form.businessInn} />
          <FormField control={form.businessActivity} />
        </div>
      )}

      {employmentStatus !== 'unemployed' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mt-6">Доход</h3>
          <FormField control={form.monthlyIncome} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.additionalIncome} />
            <FormField control={form.additionalIncomeSource} />
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
