import * as React from 'react';

import { cn } from '@/lib/utils';
import type { Field } from '@/forms/core/forms';
import type { FileUploader } from '@/forms/core/make-file-uploader';
import type { Resource } from '@/forms/core/make-resource';

export interface InputFilesProps {
  className?: string;
  control: Field<File[] | FileList | null>;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  placeholder?: string;
  resource?: Resource;
  uploader?: FileUploader;
}

const InputFiles = React.forwardRef<
  HTMLInputElement,
  InputFilesProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof InputFilesProps>
>(({ className, control, multiple = false, accept, disabled, placeholder, ...props }, ref) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    control.value.value = multiple ? files : files?.[0] || null;
  };

  return (
    <div className="space-y-2">
      {placeholder && (
        <label className="text-sm font-medium text-foreground">
          {placeholder}
        </label>
      )}
      <input
        ref={ref}
        type="file"
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        data-slot="input"
        className={cn(
          'file:text-foreground file:bg-muted file:border-0 file:rounded-sm file:px-3 file:py-1 file:text-sm file:font-medium',
          'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50',
          'h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors',
          'focus-visible:outline-none focus-visible:ring-[3px]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
          className
        )}
        onChange={handleFileChange}
        {...props}
      />
    </div>
  );
});

InputFiles.displayName = 'InputFiles';

export { InputFiles };
