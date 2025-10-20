import { useSignals } from '@preact/signals-react/runtime';
import { FieldController } from '@/lib/forms/core/field-controller';
import { FormField } from '@/lib/forms/components/form-field';
import type { PersonalData } from '../../../_shared/types/credit-application';

interface PersonalDataFormProps {
  // Контроллер всей вложенной формы PersonalData
  control: FieldController<PersonalData>;
}

/**
 * Отдельный компонент для вложенной формы PersonalData
 * Переиспользуемый компонент, который можно использовать в любых формах,
 * где требуется ввод личных данных
 */
export function PersonalDataForm({ control }: PersonalDataFormProps) {
  useSignals();

  return (
    <>
      {/* ФИО */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control.lastName as any} />
        <FormField control={control.firstName as any} />
      </div>
      <FormField control={control.middleName as any} />

      {/* Дата рождения и пол */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control.birthDate as any} />
        <FormField control={control.gender as any} />
      </div>

      {/* Место рождения */}
      <FormField control={control.birthPlace as any} />
    </>
  );
}
