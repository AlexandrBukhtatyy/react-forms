import * as React from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import type { FieldNode } from '../../core/nodes/field-node';
import { Checkbox } from '../fields/checkbox';

export interface FormFieldProps {
  control: FieldNode | any; // Поддержка любых узлов (FieldNode, GroupNode fields)
  className?: string;
  label?: string;
}

const FormFieldComponent: React.FC<FormFieldProps> = ({
  control,
  className
}) => {
  useSignals();

  const Component = control.component;

  // Конвертируем null в пустую строку для избежания React warning
  const safeValue = control.value.value ?? '';

  return (
    <div className={className}>
      {control.componentProps.label && control.component !== Checkbox && <label className="block mb-1 text-sm font-medium">{control.componentProps.label}</label>}

      <Component
        value={safeValue}
        onChange={(e: any) => {
          control.setValue(e?.target?.value ?? e);
        }}
        onBlur={() => {
          control.markAsTouched();
          // Запускаем валидацию при blur (для updateOn: 'blur' и 'submit')
          if (control.updateOn === 'blur' || control.updateOn === 'submit') {
            control.validate();
          }
        }}
        disabled={control.status.value === 'disabled'}
        aria-invalid={control.invalid.value}
        {...control.componentProps}
      />

      {control.shouldShowError.value && (
        <span className="text-red-500 text-sm mt-1 block">
          {control.errors.value[0]?.message}
        </span>
      )}

      {control.pending.value && (
        <span className="text-gray-500 text-sm mt-1 block">
          Проверка...
        </span>
      )}
    </div>
  );
};

// Мемоизируем компонент, чтобы предотвратить ререндер при изменении других полей
// Компонент ререндерится только если изменился control или className
export const FormField = React.memo(FormFieldComponent, (prevProps, nextProps) => {
  // Возвращаем true, если пропсы НЕ изменились (пропустить ререндер)
  return prevProps.control === nextProps.control && prevProps.className === nextProps.className;
});
