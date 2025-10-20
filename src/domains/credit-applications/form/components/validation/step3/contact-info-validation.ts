import type { FieldPath } from '@/lib/forms/types';
import type { CreditApplicationForm } from '../../../../_shared/types/credit-application';
import {
  applyWhen,
  required,
  minLength,
  pattern,
  email,
  updateOn,
} from '@/lib/forms/validators';

/**
 * Схема валидации для Шага 3: Контактная информация
 */
export const contactInfoValidation = (path: FieldPath<CreditApplicationForm>) => {
  // Основной телефон
  required(path.phoneMain, { message: 'Телефон обязателен' });
  pattern(path.phoneMain, /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/, {
    message: 'Формат: +7 (___) ___-__-__',
  });

  // Email
  required(path.email, { message: 'Email обязателен' });
  email(path.email);
  updateOn(path.email, 'blur');

  // Валидация адреса регистрации
  required(path.registrationAddress_region, { message: 'Регион обязателен' });
  minLength(path.registrationAddress_region, 2, { message: 'Минимум 2 символа' });

  required(path.registrationAddress_city, { message: 'Город обязателен' });
  minLength(path.registrationAddress_city, 2, { message: 'Минимум 2 символа' });

  required(path.registrationAddress_street, { message: 'Улица обязательна' });
  minLength(path.registrationAddress_street, 3, { message: 'Минимум 3 символа' });

  required(path.registrationAddress_house, { message: 'Дом обязателен' });
  pattern(path.registrationAddress_house, /^[\dА-Яа-я/-]+$/, {
    message: 'Допустимы только буквы, цифры, дефис и слэш',
  });

  required(path.registrationAddress_postalCode, { message: 'Индекс обязателен' });
  pattern(path.registrationAddress_postalCode, /^\d{6}$/, {
    message: 'Индекс должен содержать 6 цифр',
  });

  // Условная валидация адреса проживания
  applyWhen(
    path.sameAsRegistration,
    (value) => value === false,
    (path) => {
      required(path.residenceAddress_region as any, { message: 'Регион обязателен' });
      minLength(path.residenceAddress_region as any, 2, { message: 'Минимум 2 символа' });

      required(path.residenceAddress_city as any, { message: 'Город обязателен' });
      minLength(path.residenceAddress_city as any, 2, { message: 'Минимум 2 символа' });

      required(path.residenceAddress_street as any, { message: 'Улица обязательна' });
      minLength(path.residenceAddress_street as any, 3, { message: 'Минимум 3 символа' });

      required(path.residenceAddress_house as any, { message: 'Дом обязателен' });
      pattern(path.residenceAddress_house as any, /^[\dА-Яа-я/-]+$/, {
        message: 'Допустимы только буквы, цифры, дефис и слэш',
      });

      required(path.residenceAddress_postalCode as any, { message: 'Индекс обязателен' });
      pattern(path.residenceAddress_postalCode as any, /^\d{6}$/, {
        message: 'Индекс должен содержать 6 цифр',
      });
    }
  );
};
