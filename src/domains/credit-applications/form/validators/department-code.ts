import type { ValidatorFn } from '@/lib/forms/types';
import { pattern } from './pattern';

/**
 * Валидатор: код подразделения паспорта
 */
export function departmentCode(message = 'Код подразделения должен быть в формате 000-000'): ValidatorFn<string> {
  const codeRegex = /^\d{3}-\d{3}$/;
  return pattern(codeRegex, message);
}
