import type { ValidatorFn } from '@/lib/forms/types';

/**
 * Валидатор: проверка по регулярному выражению
 */
export function pattern(regex: RegExp, message: string): ValidatorFn<string> {
  return (value) => {
    if (value && !regex.test(value)) {
      return { pattern: message };
    }
    return null;
  };
}
