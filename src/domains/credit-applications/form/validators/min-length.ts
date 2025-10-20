import type { ValidatorFn } from '@/lib/forms/types';

/**
 * Валидатор: минимальная длина строки
 */
export function minLength(length: number, message?: string): ValidatorFn<string> {
  return (value) => {
    if (value && value.length < length) {
      return { minLength: message || `Минимальная длина: ${length} символов` };
    }
    return null;
  };
}
