import { useSignals } from '@preact/signals-react/runtime';
import type { FormStore } from '@/lib/forms/core/form-store';
import type { CreditApplicationForm } from '../../../../_shared/types/credit-application';
import { FormField } from '@/lib/forms/components';

interface EmploymentFormProps {
  form: FormStore<CreditApplicationForm>;
}

export function EmploymentForm({ form }: EmploymentFormProps) {
  useSignals();

  const employmentStatus = form.controls.employmentStatus.value;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Информация о занятости</h2>

      {/* Статус занятости */}
      <div className="space-y-4">
        <FormField control={form.controls.employmentStatus} />
      </div>

      {/* Поля для работающих по найму */}
      {employmentStatus === 'employed' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mt-6">Информация о работодателе</h3>
          <FormField control={form.controls.companyName!} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.controls.companyInn!} />
            <FormField control={form.controls.companyPhone!} />
          </div>
          <FormField control={form.controls.companyAddress!} />

          <h3 className="text-lg font-semibold mt-6">Должность и стаж</h3>
          <FormField control={form.controls.position!} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.controls.workExperienceTotal!} />
            <FormField control={form.controls.workExperienceCurrent!} />
          </div>
        </div>
      )}

      {/* Поля для ИП */}
      {employmentStatus === 'selfEmployed' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mt-6">Информация о бизнесе</h3>
          <FormField control={form.controls.businessType!} />
          <FormField control={form.controls.businessInn!} />
          <FormField control={form.controls.businessActivity!} />
        </div>
      )}

      {/* Доход (для всех, кроме безработных) */}
      {employmentStatus !== 'unemployed' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mt-6">Доход</h3>
          <FormField control={form.controls.monthlyIncome} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.controls.additionalIncome!} />
            <FormField control={form.controls.additionalIncomeSource!} />
          </div>
        </div>
      )}

      {/* Сообщение для безработных */}
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
