import { useSignals } from '@preact/signals-react/runtime';
import type { FormStore } from '@/lib/forms/core/form-store';
import type { CreditApplicationForm } from '../../_shared/types/credit-application';
import { FormField } from '@/lib/forms/components';
import { PersonalDataForm, PassportDataForm } from '../nested-forms';

interface Step2Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step2PersonalData({ form }: Step2Props) {
  useSignals();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Персональные данные</h2>

      {/* Вложенная форма: Личные данные */}
      <PersonalDataForm form={form} />

      {/* Вложенная форма: Паспортные данные */}
      <PassportDataForm form={form} />

      {/* Дополнительные документы */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Дополнительные документы</h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.controls.inn} />
          <FormField control={form.controls.snils} />
        </div>
      </div>
    </div>
  );
}
