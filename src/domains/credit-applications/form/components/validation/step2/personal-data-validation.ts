import type { FieldPath } from '@/lib/forms/types';
import type { CreditApplicationForm } from '../../../../_shared/types/credit-application';
import {
  validate,
  required,
  minLength,
  maxLength,
  pattern,
} from '@/lib/forms/validators';

/**
 * Схема валидации для Шага 2: Персональные данные
 */
export const personalDataValidation = (path: FieldPath<CreditApplicationForm>) => {
  // Валидация личных данных
  required(path.personalData_lastName, { message: 'Фамилия обязательна' });
  minLength(path.personalData_lastName, 2, { message: 'Минимум 2 символа' });
  maxLength(path.personalData_lastName, 50, { message: 'Максимум 50 символов' });
  pattern(path.personalData_lastName, /^[А-ЯЁа-яё\s-]+$/, {
    message: 'Только русские буквы, пробелы и дефис'
  });

  required(path.personalData_firstName, { message: 'Имя обязательно' });
  minLength(path.personalData_firstName, 2, { message: 'Минимум 2 символа' });
  maxLength(path.personalData_firstName, 50, { message: 'Максимум 50 символов' });
  pattern(path.personalData_firstName, /^[А-ЯЁа-яё\s-]+$/, {
    message: 'Только русские буквы, пробелы и дефис'
  });

  required(path.personalData_middleName, { message: 'Отчество обязательно' });
  minLength(path.personalData_middleName, 2, { message: 'Минимум 2 символа' });
  maxLength(path.personalData_middleName, 50, { message: 'Максимум 50 символов' });
  pattern(path.personalData_middleName, /^[А-ЯЁа-яё\s-]+$/, {
    message: 'Только русские буквы, пробелы и дефис'
  });

  required(path.personalData_birthDate, { message: 'Дата рождения обязательна' });

  // Валидация возраста
  validate(path.personalData_birthDate, (ctx) => {
    const birthDate = new Date(ctx.value());
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 18) {
      return {
        code: 'tooYoung',
        message: 'Заемщику должно быть не менее 18 лет',
      };
    }

    if (age > 75) {
      return {
        code: 'tooOld',
        message: 'Максимальный возраст заемщика: 75 лет',
      };
    }

    return null;
  });

  required(path.personalData_gender, { message: 'Выберите пол' });
  required(path.personalData_birthPlace, { message: 'Место рождения обязательно' });
  minLength(path.personalData_birthPlace, 5, { message: 'Минимум 5 символов' });

  // Валидация паспортных данных
  required(path.passportData_series, { message: 'Серия паспорта обязательна' });
  pattern(path.passportData_series, /^\d{2}\s\d{2}$/, {
    message: 'Формат: 00 00',
  });

  required(path.passportData_number, { message: 'Номер паспорта обязателен' });
  pattern(path.passportData_number, /^\d{6}$/, {
    message: 'Номер должен содержать 6 цифр',
  });

  required(path.passportData_issueDate, { message: 'Дата выдачи обязательна' });

  // Валидация даты выдачи паспорта
  validate(path.passportData_issueDate, (ctx) => {
    const issueDate = new Date(ctx.value());
    const today = new Date();

    if (issueDate > today) {
      return {
        code: 'issueDateInFuture',
        message: 'Дата выдачи не может быть в будущем',
      };
    }

    return null;
  });

  required(path.passportData_issuedBy, { message: 'Кем выдан обязательно' });
  minLength(path.passportData_issuedBy, 10, { message: 'Минимум 10 символов' });

  required(path.passportData_departmentCode, { message: 'Код подразделения обязателен' });
  pattern(path.passportData_departmentCode, /^\d{3}-\d{3}$/, {
    message: 'Формат: 000-000',
  });

  // Валидация ИНН
  required(path.inn, { message: 'ИНН обязателен' });
  pattern(path.inn, /^\d{12}$/, {
    message: 'ИНН должен содержать 12 цифр',
  });

  // Валидация СНИЛС
  required(path.snils, { message: 'СНИЛС обязателен' });
  pattern(path.snils, /^\d{3}-\d{3}-\d{3}\s\d{2}$/, {
    message: 'Формат СНИЛС: 000-000-000 00',
  });
};
