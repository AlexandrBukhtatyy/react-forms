import * as React from 'react';

import { Input } from './input';
import { FormFieldError } from './form-field-error';

export function FormField({
  className,
  control,
  type: Component,
  ...props
}: React.ComponentProps<any>) {
  return (
    <div className={className}>
      <Component control={control} type={'text'} {...props} />
      <FormFieldError control={control} />
    </div>
  );
}
