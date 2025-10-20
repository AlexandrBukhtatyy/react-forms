import type { ValidatorFn } from '@/lib/forms/types';

/**
 * Валидатор: дата в будущем
 */
export function futureDate(message = 'Дата не может быть в будущем'): ValidatorFn<string> {
  return (value) => {
    if (!value) return null;

    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      return { futureDate: message };
    }
    return null;
  };
}
