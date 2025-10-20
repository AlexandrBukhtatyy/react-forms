import type { ValidatorFn } from '@/lib/forms/types';

/**
 * Валидатор: возраст (минимум 18 лет)
 */
export function minAge(age: number, message?: string): ValidatorFn<string> {
  return (value) => {
    if (!value) return null;

    const birthDate = new Date(value);
    const today = new Date();
    const yearsDiff = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    let actualAge = yearsDiff;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      actualAge--;
    }

    if (actualAge < age) {
      return { minAge: message || `Минимальный возраст: ${age} лет` };
    }
    return null;
  };
}
