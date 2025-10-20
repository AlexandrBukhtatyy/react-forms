import type { ValidatorFn } from '@/lib/forms/types';

/**
 * Валидатор: максимальная длина строки
 */
export function maxLength(length: number, message?: string): ValidatorFn<string> {
  return (value) => {
    if (value && value.length > length) {
      return { maxLength: message || `Максимальная длина: ${length} символов` };
    }
    return null;
  };
}
