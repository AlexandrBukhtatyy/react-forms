import { useSignals } from '@preact/signals-react/runtime';
import { FieldController } from '@/lib/forms/core/field-controller';
import { FormField } from '@/lib/forms/components/form-field';
import type { PropertyItem } from '../../../_shared/types/credit-application';

/**
 * Компонент для отдельного элемента имущества
 * Используется с FormArrayManager в родительском компоненте
 */
export function PropertyForm({ control }: { control: FieldController<PropertyItem> }) {
  useSignals();

  return (
    <>
      <FormField control={control.type as any} />
      <FormField control={control.description as any} />
      <FormField control={control.estimatedValue as any} />
      <FormField control={control.hasEncumbrance as any} />
    </>
  );
}
