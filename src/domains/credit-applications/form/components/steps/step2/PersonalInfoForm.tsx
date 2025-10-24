/**
 * PersonalInfoForm (Step 2)
 *
 * Демонстрирует переиспользование вложенных форм:
 * - PersonalDataForm (личные данные)
 * - PassportDataForm (паспортные данные)
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { DeepFormStore } from '@/lib/forms/core/deep-form-store';
import { FormField } from '@/lib/forms/components';
import { PersonalDataForm } from '../../nested-forms/PersonalDataForm';
import { PassportDataForm } from '../../nested-forms/PassportDataForm';

interface PersonalInfoFormProps {
  form: DeepFormStore<any>;
}

export function PersonalInfoForm({ form }: PersonalInfoFormProps) {
  useSignals();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Персональные данные</h2>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Личные данные</h3>
        <PersonalDataForm control={form.controls.personalData} />
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Паспортные данные</h3>
        <PassportDataForm control={form.controls.passportData} />
      </div>
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
