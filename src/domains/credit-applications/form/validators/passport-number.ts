import type { ValidatorFn } from '@/lib/forms/types';

/**
 * Валидатор: номер паспорта (6 цифр)
 */
export function passportNumber(message = 'Номер паспорта должен содержать 6 цифр'): ValidatorFn<string> {
  return (value) => {
    if (!value) return null;

    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length !== 6) {
      return { passportNumber: message };
    }
    return null;
  };
}
