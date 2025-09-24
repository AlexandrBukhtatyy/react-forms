import * as React from 'react';
import { AlertCircleIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { computed } from '@preact/signals-react';
import type { Field } from '../core/forms';

export interface FormFieldErrorProps {
  className?: string;
  control: Field<any>;
  showIcon?: boolean;
}

const FormFieldError = React.forwardRef<
  HTMLDivElement,
  FormFieldErrorProps & Omit<React.HTMLAttributes<HTMLDivElement>, keyof FormFieldErrorProps>
>(({ className, control, showIcon = true, ...props }, ref) => {
  const errors = computed(() => {
    return control.errors || [];
  });

  if (!errors.value || errors.value.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn('space-y-1', className)}
      {...props}
    >
      {errors.value.map((error: any, index: number) => (
        <div
          key={index}
          className="flex items-start gap-2 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {showIcon && (
            <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
          )}
          <span>{error.message}</span>
        </div>
      ))}
    </div>
  );
});

FormFieldError.displayName = 'FormFieldError';

export { FormFieldError };
