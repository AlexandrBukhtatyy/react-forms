import * as React from 'react';

import { cn } from '@/lib/utils';
import { computed } from '@preact/signals-react';

export function FormFieldError({
  className,
  control,
  ...props
}: React.ComponentProps<any>) {
  console.log('FormFieldError:', control.value);
  const errors = computed(() => {
    return control.errors;
  });

  return errors?.value?.map((error: any, index: number) => (
    <div key={index}>{error.message}</div>
  ));
}
