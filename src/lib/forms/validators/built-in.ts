import type { ValidatorFn, ValidationError } from "../types";

export class Validators {
  static required(message = 'Поле обязательно для заполнения'): ValidatorFn {
    return (value: any): ValidationError | null => {
      if (value === null || value === undefined || value === '') {
        return { code: 'required', message };
      }
      return null;
    };
  }

  static minLength(min: number, message?: string): ValidatorFn<string> {
    return (value: string): ValidationError | null => {
      if (value && value.length < min) {
        return {
          code: 'minLength',
          message: message || `Минимальная длина: ${min}`,
          params: { min, actual: value.length }
        };
      }
      return null;
    };
  }

  static maxLength(max: number, message?: string): ValidatorFn<string> {
    return (value: string): ValidationError | null => {
      if (value && value.length > max) {
        return {
          code: 'maxLength',
          message: message || `Максимальная длина: ${max}`,
          params: { max, actual: value.length }
        };
      }
      return null;
    };
  }

  static email(message = 'Некорректный email'): ValidatorFn<string> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (value: string): ValidationError | null => {
      if (value && !emailRegex.test(value)) {
        return { code: 'email', message };
      }
      return null;
    };
  }

  static pattern(pattern: RegExp, message = 'Некорректный формат'): ValidatorFn<string> {
    return (value: string): ValidationError | null => {
      if (value && !pattern.test(value)) {
        return { code: 'pattern', message };
      }
      return null;
    };
  }

  static min(min: number, message?: string): ValidatorFn<number> {
    return (value: number): ValidationError | null => {
      if (value != null && value < min) {
        return {
          code: 'min',
          message: message || `Минимальное значение: ${min}`,
          params: { min, actual: value }
        };
      }
      return null;
    };
  }

  static max(max: number, message?: string): ValidatorFn<number> {
    return (value: number): ValidationError | null => {
      if (value != null && value > max) {
        return {
          code: 'max',
          message: message || `Максимальное значение: ${max}`,
          params: { max, actual: value }
        };
      }
      return null;
    };
  }

  // Композиция валидаторов
  static compose(...validators: ValidatorFn[]): ValidatorFn {
    return (value: any): ValidationError | null => {
      for (const validator of validators) {
        const error = validator(value);
        if (error) return error;
      }
      return null;
    };
  }
}
