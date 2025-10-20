import type { ValidatorFn } from '@/lib/forms/types';

/**
 * Валидатор: минимальное значение для числа
 */
export function min(minValue: number, message?: string): ValidatorFn<number> {
  return (value) => {
    if (value !== null && value !== undefined && value < minValue) {
      return { min: message || `Минимальное значение: ${minValue}` };
    }
    return null;
  };
}
