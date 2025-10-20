import type { ValidatorFn } from '@/lib/forms/types';

/**
 * Валидатор: серия паспорта (4 цифры)
 */
export function passportSeries(message = 'Серия паспорта должна содержать 4 цифры'): ValidatorFn<string> {
  return (value) => {
    if (!value) return null;

    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length !== 4) {
      return { passportSeries: message };
    }
    return null;
  };
}
