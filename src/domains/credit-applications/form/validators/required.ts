import type { ValidatorFn } from '@/lib/forms/types';

/**
 * Валидатор: поле обязательно для заполнения
 */
export function required(message = 'Поле обязательно для заполнения'): ValidatorFn<any> {
  return (value) => {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      return { required: message };
    }
    return null;
  };
}
