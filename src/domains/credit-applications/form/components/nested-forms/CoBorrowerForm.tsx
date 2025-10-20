import { useSignals } from '@preact/signals-react/runtime';
import { FieldController } from '@/lib/forms/core/field-controller';
import { FormField } from '@/lib/forms/components/form-field';
import type { CoBorrower } from '../../../_shared/types/credit-application';

/**
 * Компонент для отдельного созаемщика
 * Используется с FormArrayManager в родительском компоненте
 */
export function CoBorrowerForm({ control }: { control: FieldController<CoBorrower> }) {
  useSignals();

  return (
    <>
      {/* ФИО */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control.lastName as any} />
        <FormField control={control.firstName as any} />
      </div>
      <FormField control={control.middleName as any} />

      {/* Контактные данные */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control.birthDate as any} />
        <FormField control={control.phone as any} />
      </div>

      {/* Дополнительная информация */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control.relationship as any} />
        <FormField control={control.monthlyIncome as any} />
      </div>
    </>
  );
}
