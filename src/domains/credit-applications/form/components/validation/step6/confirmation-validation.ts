import type { FieldPath } from '@/lib/forms/types';
import type { CreditApplicationForm } from '../../../types/credit-application';
import {
  validate,
  validateAsync,
  required,
  minLength,
  maxLength,
  pattern,
} from '@/lib/forms/validators';

/**
 * Схема валидации для Шага 6: Согласия и подтверждение
 */
export const confirmationValidation = (path: FieldPath<CreditApplicationForm>) => {
  // Согласие на обработку персональных данных (обязательно)
  required(path.agreePersonalData, { message: 'Необходимо согласие на обработку персональных данных' });
  validate(path.agreePersonalData, (ctx) => {
    if (ctx.value() !== true) {
      return {
        code: 'mustAgreePersonalData',
        message: 'Согласие на обработку персональных данных обязательно',
      };
    }
    return null;
  });

  // Согласие на получение кредитной истории (обязательно)
  required(path.agreeCreditHistory, { message: 'Необходимо согласие на получение кредитной истории' });
  validate(path.agreeCreditHistory, (ctx) => {
    if (ctx.value() !== true) {
      return {
        code: 'mustAgreeCreditHistory',
        message: 'Согласие на получение кредитной истории обязательно',
      };
    }
    return null;
  });

  // Согласие с условиями кредитования (обязательно)
  required(path.agreeTerms, { message: 'Необходимо согласие с условиями кредитования' });
  validate(path.agreeTerms, (ctx) => {
    if (ctx.value() !== true) {
      return {
        code: 'mustAgreeTerms',
        message: 'Согласие с условиями кредитования обязательно',
      };
    }
    return null;
  });

  // Подтверждение точности данных (обязательно)
  required(path.confirmAccuracy, { message: 'Необходимо подтвердить точность введенных данных' });
  validate(path.confirmAccuracy, (ctx) => {
    if (ctx.value() !== true) {
      return {
        code: 'mustConfirmAccuracy',
        message: 'Подтверждение точности данных обязательно',
      };
    }
    return null;
  });

  // Согласие на маркетинговые рассылки (опциональное)
  // Это согласие не требует обязательного true, пользователь может отказаться

  // Электронная подпись (код из СМС)
  required(path.electronicSignature, { message: 'Введите код из СМС' });
  minLength(path.electronicSignature, 6, { message: 'Код должен содержать 6 символов' });
  maxLength(path.electronicSignature, 6, { message: 'Код должен содержать 6 символов' });
  pattern(path.electronicSignature, /^\d{6}$/, {
    message: 'Код должен содержать только цифры',
  });

  // Асинхронная проверка кода подписи
  validateAsync(
    path.electronicSignature,
    async (ctx) => {
      const code = ctx.value();

      // Проверяем только если код полностью введен
      if (!code || code.length !== 6) return null;

      // Для демонстрации: симулируем задержку API
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Пример валидации: код должен быть "123456" для демо
      // В продакшене это должна быть реальная проверка на сервере
      if (code !== '123456') {
        return {
          code: 'invalidSmsCode',
          message: 'Неверный код подтверждения. Для демо используйте: 123456',
        };
      }

      return null;
    },
    { debounce: 500 }
  );
};
