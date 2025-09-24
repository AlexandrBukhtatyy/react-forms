import * as React from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Field } from '@/forms/core/forms';

export interface InputPasswordProps {
  className?: string;
  control: Field<string>;
  placeholder?: string;
  disabled?: boolean;
  showToggle?: boolean;
}

const InputPassword = React.forwardRef<
  HTMLInputElement,
  InputPasswordProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof InputPasswordProps>
>(({ className, control, placeholder = "Password", disabled, showToggle = true, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    control.value.value = event.target.value;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative">
      <input
        ref={ref}
        type={showPassword ? "text" : "password"}
        value={control.value.value || ''}
        disabled={disabled}
        placeholder={placeholder}
        data-slot="input"
        className={cn(
          'h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
          showToggle && 'pr-10',
          className
        )}
        onChange={handleInputChange}
        {...props}
      />
      {showToggle && (
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors bg-transparent border-none p-0 cursor-pointer focus:outline-none"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          aria-label={showPassword ? "Hide password" : "Show password"}
          style={{ background: 'transparent', border: 'none', padding: 0 }}
        >
          {showPassword ? (
            <EyeOffIcon className="size-4" />
          ) : (
            <EyeIcon className="size-4" />
          )}
        </button>
      )}
    </div>
  );
});

InputPassword.displayName = 'InputPassword';

export { InputPassword };
