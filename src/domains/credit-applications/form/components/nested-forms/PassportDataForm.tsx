/**
 * PassportDataForm
 *
 * Переиспользуемый компонент для ввода паспортных данных.
 * Работает с DeepFormStore через GroupProxy.
 *
 * Использование:
 * <PassportDataForm control={form.controls.passportData} />
 */

import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/form-field';

interface PassportDataFormProps {
  // GroupProxy для вложенной формы passportData (используем any для обхода ограничений TypeScript)
  control: any;
}

export function PassportDataForm({ control }: PassportDataFormProps) {
  useSignals();

  return (
    <div className="space-y-4">
      {/* Серия и номер */}
      <div className="grid grid-cols-2 gap-4">
        <FormField control={control.series} />
        <FormField control={control.number} />
      </div>

      {/* Дата выдачи */}
      <FormField control={control.issueDate} />

      {/* Кем выдан */}
      <FormField control={control.issuedBy} />

      {/* Код подразделения */}
      <FormField control={control.departmentCode} />
    </div>
  );
}
