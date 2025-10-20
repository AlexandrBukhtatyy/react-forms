import type { AsyncValidatorFn } from '@/lib/forms/types';

/**
 * Асинхронный валидатор: проверка email через API (имитация)
 */
export function validateEmailAsync(message = 'Email уже используется'): AsyncValidatorFn<string> {
  return async (value) => {
    if (!value) return null;

    // Имитация запроса к API
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Простая проверка: email не должен содержать "test@test"
    if (value.includes('test@test')) {
      return { emailTaken: message };
    }

    return null;
  };
}
