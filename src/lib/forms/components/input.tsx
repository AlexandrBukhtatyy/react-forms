import * as React from 'react';

import { cn } from '@/lib/utils';
import type { Field } from '@/forms/core/forms';

export interface InputProps {
  className?: string;
  control: Field<string | number>;
  type?: 'text' | 'email' | 'number' | 'tel' | 'url';
  placeholder?: string;
  disabled?: boolean;
}

const Input = React.forwardRef<
  HTMLInputElement,
  InputProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof InputProps>
>(({ className, control, type = 'text', placeholder, disabled, ...props }, ref) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (type === 'number') {
      const numValue = value === '' ? '' : Number(value);
      control.value.value = numValue;
    } else {
      control.value.value = value;
    }
  };

  const inputValue = React.useMemo(() => {
    const value = control.value.value;
    if (type === 'number' && typeof value === 'number') {
      return value.toString();
    }
    return value || '';
  }, [control.value.value, type]);

  return (
    <input
      ref={ref}
      type={type}
      value={inputValue}
      disabled={disabled}
      placeholder={placeholder}
      data-slot="input"
      className={cn(
        'h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className
      )}
      onChange={handleInputChange}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
