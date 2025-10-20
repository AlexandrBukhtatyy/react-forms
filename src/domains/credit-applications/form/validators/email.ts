import type { ValidatorFn } from '@/lib/forms/types';
import { pattern } from './pattern';

/**
 * Валидатор: проверка email
 */
export function email(message = 'Некорректный email'): ValidatorFn<string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern(emailRegex, message);
}
