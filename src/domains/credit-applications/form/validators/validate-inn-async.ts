import type { AsyncValidatorFn } from '@/lib/forms/types';

/**
 * Асинхронный валидатор: проверка ИНН через API (имитация)
 */
export function validateInnAsync(message = 'ИНН не найден в базе данных'): AsyncValidatorFn<string> {
  return async (value) => {
    if (!value) return null;

    // Имитация запроса к API
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Простая проверка: ИНН не должен начинаться с "000"
    if (value.startsWith('000')) {
      return { innNotFound: message };
    }

    return null;
  };
}
