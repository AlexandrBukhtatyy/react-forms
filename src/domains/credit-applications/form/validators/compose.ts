import type { ValidatorFn } from '@/lib/forms/types';

/**
 * Объединение нескольких валидаторов
 */
export function compose<T>(...validators: ValidatorFn<T>[]): ValidatorFn<T> {
  return (value) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        return error;
      }
    }
    return null;
  };
}
