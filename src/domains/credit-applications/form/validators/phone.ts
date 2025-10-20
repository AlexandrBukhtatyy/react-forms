import type { ValidatorFn } from '@/lib/forms/types';
import { pattern } from './pattern';

/**
 * Валидатор: проверка телефона (российский формат)
 */
export function phone(message = 'Некорректный номер телефона'): ValidatorFn<string> {
  const phoneRegex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
  return pattern(phoneRegex, message);
}
