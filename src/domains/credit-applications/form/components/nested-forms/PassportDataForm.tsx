import { useSignals } from '@preact/signals-react/runtime';
import { FieldController } from '@/lib/forms/core/field-controller';
import { FormField } from '@/lib/forms/components/form-field';
import type { PassportData } from '../../../_shared/types/credit-application';

interface PassportDataFormProps {
  // Контроллер всей вложенной формы PassportData
  control: FieldController<PassportData>;
}

/**
 * Отдельный компонент для вложенной формы PassportData
 * Переиспользуемый компонент для ввода паспортных данных
 */
export function PassportDataForm({ control }: PassportDataFormProps) {
  useSignals();

  return (
    <>
      {/* Серия и номер */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control.series as any} />
        <FormField control={control.number as any} />
      </div>

      {/* Дата выдачи */}
      <FormField control={control.issueDate as any} />

      {/* Кем выдан */}
      <FormField control={control.issuedBy as any} />

      {/* Код подразделения */}
      <FormField control={control.departmentCode as any} />
    </>
  );
}
