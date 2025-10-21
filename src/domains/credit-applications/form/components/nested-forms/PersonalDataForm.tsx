/**
 * PersonalDataForm
 *
 * Переиспользуемый компонент для ввода личных данных.
 * Работает с DeepFormStore через GroupProxy.
 *
 * Использование:
 * <PersonalDataForm control={form.controls.personalData} />
 */

import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/form-field';

interface PersonalDataFormProps {
  // GroupProxy для вложенной формы personalData (используем any для обхода ограничений TypeScript)
  control: any;
}

export function PersonalDataForm({ control }: PersonalDataFormProps) {
  useSignals();

  return (
    <div className="space-y-4">
      {/* ФИО */}
      <div className="grid grid-cols-3 gap-4">
        <FormField control={control.lastName} />
        <FormField control={control.firstName} />
        <FormField control={control.middleName} />
      </div>

      {/* Дата рождения и пол */}
      <div className="grid grid-cols-2 gap-4">
        <FormField control={control.birthDate} />
        <FormField control={control.gender} />
      </div>

      {/* Место рождения */}
      <FormField control={control.birthPlace} />
    </div>
  );
}
