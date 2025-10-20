import type { ValidatorFn, AsyncValidatorFn } from '@/lib/forms/types';

// ============================================================================
// Синхронные валидаторы
// ============================================================================

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

/**
 * Валидатор: минимальное значение для числа
 */
export function min(minValue: number, message?: string): ValidatorFn<number> {
  return (value) => {
    if (value !== null && value !== undefined && value < minValue) {
      return { min: message || `Минимальное значение: ${minValue}` };
    }
    return null;
  };
}

/**
 * Валидатор: максимальное значение для числа
 */
export function max(maxValue: number, message?: string): ValidatorFn<number> {
  return (value) => {
    if (value !== null && value !== undefined && value > maxValue) {
      return { max: message || `Максимальное значение: ${maxValue}` };
    }
    return null;
  };
}

/**
 * Валидатор: минимальная длина строки
 */
export function minLength(length: number, message?: string): ValidatorFn<string> {
  return (value) => {
    if (value && value.length < length) {
      return { minLength: message || `Минимальная длина: ${length} символов` };
    }
    return null;
  };
}

/**
 * Валидатор: максимальная длина строки
 */
export function maxLength(length: number, message?: string): ValidatorFn<string> {
  return (value) => {
    if (value && value.length > length) {
      return { maxLength: message || `Максимальная длина: ${length} символов` };
    }
    return null;
  };
}

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

/**
 * Валидатор: проверка email
 */
export function email(message = 'Некорректный email'): ValidatorFn<string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern(emailRegex, message);
}

/**
 * Валидатор: проверка телефона (российский формат)
 */
export function phone(message = 'Некорректный номер телефона'): ValidatorFn<string> {
  const phoneRegex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
  return pattern(phoneRegex, message);
}

/**
 * Валидатор: проверка ИНН (12 цифр для физ. лиц)
 */
export function inn(message = 'ИНН должен содержать 12 цифр'): ValidatorFn<string> {
  return (value) => {
    if (!value) return null;

    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length !== 12) {
      return { inn: message };
    }
    return null;
  };
}

/**
 * Валидатор: проверка СНИЛС
 */
export function snils(message = 'Некорректный СНИЛС'): ValidatorFn<string> {
  return (value) => {
    if (!value) return null;

    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length !== 11) {
      return { snils: message };
    }
    return null;
  };
}

/**
 * Валидатор: серия паспорта (4 цифры)
 */
export function passportSeries(message = 'Серия паспорта должна содержать 4 цифры'): ValidatorFn<string> {
  return (value) => {
    if (!value) return null;

    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length !== 4) {
      return { passportSeries: message };
    }
    return null;
  };
}

/**
 * Валидатор: номер паспорта (6 цифр)
 */
export function passportNumber(message = 'Номер паспорта должен содержать 6 цифр'): ValidatorFn<string> {
  return (value) => {
    if (!value) return null;

    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length !== 6) {
      return { passportNumber: message };
    }
    return null;
  };
}

/**
 * Валидатор: код подразделения паспорта
 */
export function departmentCode(message = 'Код подразделения должен быть в формате 000-000'): ValidatorFn<string> {
  const codeRegex = /^\d{3}-\d{3}$/;
  return pattern(codeRegex, message);
}

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

/**
 * Валидатор: дата в прошлом
 */
export function pastDate(message = 'Дата должна быть в будущем'): ValidatorFn<string> {
  return (value) => {
    if (!value) return null;

    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { pastDate: message };
    }
    return null;
  };
}

// ============================================================================
// Асинхронные валидаторы
// ============================================================================

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

// ============================================================================
// Условные валидаторы
// ============================================================================

/**
 * Условный валидатор: применяется только если условие истинно
 */
export function conditionalValidator<T>(
  condition: () => boolean,
  validator: ValidatorFn<T>
): ValidatorFn<T> {
  return (value) => {
    if (condition()) {
      return validator(value);
    }
    return null;
  };
}

// ============================================================================
// Композиция валидаторов
// ============================================================================

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
