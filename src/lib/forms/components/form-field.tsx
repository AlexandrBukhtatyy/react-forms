import * as React from 'react';

import { FormFieldError } from './form-field-error';
import type { Field } from '../core/forms';

export interface FormFieldProps<TComponent extends React.ComponentType<any> = React.ComponentType<any>> {
  className?: string;
  control: Field<any>;
  type: TComponent;
}

export function FormField<TComponent extends React.ComponentType<any> = React.ComponentType<any>>({
  className,
  control,
  type: Component,
  ...props
}: FormFieldProps<TComponent> & Omit<React.ComponentProps<TComponent>, 'control' | 'type'>) {
  const componentProps = {
    control,
    type: 'text',
    ...props
  } as React.ComponentProps<TComponent>;

  return (
    <div className={className}>
      <Component {...componentProps} />
      <FormFieldError control={control} />
    </div>
  );
}
