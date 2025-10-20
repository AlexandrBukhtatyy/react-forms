import type { ValidatorFn } from '@/lib/forms/types';

/**
 * Валидатор: проверка СНИЛС
 */
export function snils(message = 'Некорректный СНИЛС'): ValidatorFn<string> {
  return (value) => {
    if (!value) return null;

    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length !== 11) {
      return { snils: message };
    }
    return null;
  };
}
