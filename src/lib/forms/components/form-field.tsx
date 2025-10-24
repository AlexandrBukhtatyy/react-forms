import * as React from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import type { FieldController } from '../core/field-controller';
import { Checkbox } from './checkbox';

export interface FormFieldProps {
  control: FieldController | any; // Поддержка DeepFormStore controls
  className?: string;
  label?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  control,
  className
}) => {
  useSignals();

  const Component = control.component;

  // Конвертируем null в пустую строку для избежания React warning
  const safeValue = control.value ?? '';

  return (
    <div className={className}>
      {control.componentProps.label && control.component !== Checkbox && <label className="block mb-1 text-sm font-medium">{control.componentProps.label}</label>}

      <Component
        value={safeValue}
        onChange={(e: any) => {
          control.value = e?.target?.value ?? e;
        }}
        onBlur={() => control.markAsTouched()}
        disabled={control.status === 'disabled'}
        aria-invalid={control.invalid}
        {...control.componentProps}
      />

      {control.shouldShowError && (
        <span className="text-red-500 text-sm mt-1 block">
          {control.errors[0]?.message}
        </span>
      )}

      {control.pending && (
        <span className="text-gray-500 text-sm mt-1 block">
          Проверка...
        </span>
      )}
    </div>
  );
};
