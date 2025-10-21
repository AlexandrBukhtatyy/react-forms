/**
 * PropertyForm
 *
 * Компонент для отдельного элемента имущества.
 * Работает с DeepFormStore через GroupProxy (элемент массива).
 *
 * Используется с ArrayProxy в родительском компоненте:
 * {form.controls.properties.map((property, index) => (
 *   <PropertyForm key={index} control={property} />
 * ))}
 */

import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/form-field';

interface PropertyFormProps {
  // GroupProxy для элемента массива properties (используем any для обхода ограничений TypeScript)
  control: any;
}

export function PropertyForm({ control }: PropertyFormProps) {
  useSignals();

  return (
    <div className="space-y-3">
      <FormField control={control.type} />
      <FormField control={control.description} />
      <FormField control={control.estimatedValue} />
      <FormField control={control.hasEncumbrance} />
    </div>
  );
}
