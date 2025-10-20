import type { ValidatorFn } from '@/lib/forms/types';

/**
 * Валидатор: максимальное значение для числа
 */
export function max(maxValue: number, message?: string): ValidatorFn<number> {
  return (value) => {
    if (value !== null && value !== undefined && value > maxValue) {
      return { max: message || `Максимальное значение: ${maxValue}` };
    }
    return null;
  };
}
