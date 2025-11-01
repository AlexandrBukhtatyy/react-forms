import type { FieldPath } from '@/lib/forms/types';
import {
  applyWhen,
  validateTree,
  required,
  minLength,
  maxLength,
  pattern,
  email,
} from '@/lib/forms/validators';
import type { CreditApplicationForm } from '../../types/credit-application';

/**
 * Схема валидации для Шага 3: Контактная информация
 */
export const contactInfoValidation = (path: FieldPath<CreditApplicationForm>) => {
  // Основной телефон
  required(path.phoneMain, { message: 'Телефон обязателен' });
  pattern(path.phoneMain, /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/, {
    message: 'Формат: +7 (___) ___-__-__',
  });

  // Дополнительный телефон (опциональный)
  // Если указан, должен быть в правильном формате и отличаться от основного
  pattern(path.phoneAdditional, /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/, {
    message: 'Формат: +7 (___) ___-__-__',
  });

  // Email
  required(path.email, { message: 'Email обязателен' });
  email(path.email);

  // Дополнительный email (опциональный)
  // Если указан, должен быть в правильном формате и отличаться от основного
  email(path.emailAdditional);

  // Кросс-полевая валидация: дополнительный телефон должен отличаться от основного
  validateTree(
    (ctx) => {
      const form = ctx.formValue();
      if (!form.phoneAdditional) return null;

      if (form.phoneMain === form.phoneAdditional) {
        return {
          code: 'phoneDuplicate',
          message: 'Дополнительный телефон должен отличаться от основного',
        };
      }
      return null;
    },
    { targetField: 'phoneAdditional' }
  );

  // Кросс-полевая валидация: дополнительный email должен отличаться от основного
  validateTree(
    (ctx) => {
      const form = ctx.formValue();
      if (!form.emailAdditional) return null;

      if (form.email.toLowerCase() === form.emailAdditional.toLowerCase()) {
        return {
          code: 'emailDuplicate',
          message: 'Дополнительный email должен отличаться от основного',
        };
      }
      return null;
    },
    { targetField: 'emailAdditional' }
  );

  // Валидация адреса регистрации
  required(path.registrationAddress.region, { message: 'Регион обязателен' });
  minLength(path.registrationAddress.region, 2, { message: 'Минимум 2 символа' });
  maxLength(path.registrationAddress.region, 100, { message: 'Максимум 100 символов' });

  required(path.registrationAddress.city, { message: 'Город обязателен' });
  minLength(path.registrationAddress.city, 2, { message: 'Минимум 2 символа' });
  maxLength(path.registrationAddress.city, 100, { message: 'Максимум 100 символов' });

  required(path.registrationAddress.street, { message: 'Улица обязательна' });
  minLength(path.registrationAddress.street, 3, { message: 'Минимум 3 символа' });
  maxLength(path.registrationAddress.street, 150, { message: 'Максимум 150 символов' });

  required(path.registrationAddress.house, { message: 'Дом обязателен' });
  pattern(path.registrationAddress.house, /^[\dА-Яа-я/-]+$/, {
    message: 'Допустимы только буквы, цифры, дефис и слэш',
  });

  required(path.registrationAddress.postalCode, { message: 'Индекс обязателен' });
  pattern(path.registrationAddress.postalCode, /^\d{6}$/, {
    message: 'Индекс должен содержать 6 цифр',
  });

  // Условная валидация адреса проживания
  applyWhen(
    path.sameAsRegistration,
    (value) => value === false,
    (path) => {
      required(path.residenceAddress?.region, { message: 'Регион обязателен' });
      minLength(path.residenceAddress?.region, 2, { message: 'Минимум 2 символа' });

      required(path.residenceAddress?.city, { message: 'Город обязателен' });
      minLength(path.residenceAddress?.city, 2, { message: 'Минимум 2 символа' });

      required(path.residenceAddress?.street, { message: 'Улица обязательна' });
      minLength(path.residenceAddress?.street, 3, { message: 'Минимум 3 символа' });

      required(path.residenceAddress?.house, { message: 'Дом обязателен' });
      pattern(path.residenceAddress?.house, /^[\dА-Яа-я/-]+$/, {
        message: 'Допустимы только буквы, цифры, дефис и слэш',
      });

      required(path.residenceAddress?.postalCode, { message: 'Индекс обязателен' });
      pattern(path.residenceAddress?.postalCode, /^\d{6}$/, {
        message: 'Индекс должен содержать 6 цифр',
      });
    }
  );
};
