import type { ValidatorFn } from '@/lib/forms/types';

/**
 * Условный валидатор: применяется только если условие истинно
 */
export function conditionalValidator<T>(
  condition: () => boolean,
  validator: ValidatorFn<T>
): ValidatorFn<T> {
  return (value) => {
    if (condition()) {
      return validator(value);
    }
    return null;
  };
}
