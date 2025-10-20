import type { ValidatorFn } from '@/lib/forms/types';

/**
 * Валидатор: проверка ИНН (12 цифр для физ. лиц)
 */
export function inn(message = 'ИНН должен содержать 12 цифр'): ValidatorFn<string> {
  return (value) => {
    if (!value) return null;

    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length !== 12) {
      return { inn: message };
    }
    return null;
  };
}
