import type { FieldPath } from '@/lib/forms/types';
import {
  applyWhen,
  validateTree,
  required,
  min,
  max,
  minLength,
  maxLength,
} from '@/lib/forms/validators';
import type { CreditApplicationForm } from '../types/credit-application';

/**
 * Схема валидации для Шага 1: Основная информация о кредите
 *
 * ✅ Чистая схема БЕЗ условия на currentStep
 * ✅ Содержит только бизнес-логику валидации полей шага 1
 */
export const basicInfoValidation = (path: FieldPath<CreditApplicationForm>) => {
  required(path.loanType, { message: 'Выберите тип кредита' });

  required(path.loanAmount, { message: 'Укажите сумму кредита' });
  min(path.loanAmount, 50000, { message: 'Минимальная сумма кредита: 50 000 ₽' });
  max(path.loanAmount, 10000000, { message: 'Максимальная сумма кредита: 10 000 000 ₽' });

  required(path.loanTerm, { message: 'Укажите срок кредита' });
  min(path.loanTerm, 6, { message: 'Минимальный срок: 6 месяцев' });
  max(path.loanTerm, 240, { message: 'Максимальный срок: 240 месяцев (20 лет)' });

  required(path.loanPurpose, { message: 'Укажите цель кредита' });
  minLength(path.loanPurpose, 10, { message: 'Опишите цель подробнее (минимум 10 символов)' });
  maxLength(path.loanPurpose, 500);

  // Условная валидация для ипотеки
  applyWhen(
    path.loanType,
    (type) => type === 'mortgage',
    (path) => {
      required(path.propertyValue, { message: 'Укажите стоимость недвижимости' });
      min(path.propertyValue, 1000000, { message: 'Минимальная стоимость: 1 000 000 ₽' });

      required(path.initialPayment, { message: 'Укажите первоначальный взнос' });
      min(path.initialPayment, 0);

      // Cross-field валидация
      validateTree(
        (ctx) => {
          const form = ctx.formValue();
          if (
            form.initialPayment &&
            form.propertyValue &&
            form.initialPayment > form.propertyValue
          ) {
            return {
              code: 'initialPaymentTooHigh',
              message: 'Первоначальный взнос не может превышать стоимость недвижимости',
            };
          }
          return null;
        },
        { targetField: 'initialPayment' }
      );
    }
  );

  // Условная валидация для автокредита
  applyWhen(
    path.loanType,
    (type) => type === 'car',
    (path) => {
      required(path.carBrand, { message: 'Укажите марку автомобиля' });
      required(path.carModel, { message: 'Укажите модель автомобиля' });
      required(path.carYear, { message: 'Укажите год выпуска' });
      min(path.carYear, 2000, { message: 'Год выпуска не ранее 2000' });

      required(path.carPrice, { message: 'Укажите стоимость автомобиля' });
      min(path.carPrice, 300000, { message: 'Минимальная стоимость: 300 000 ₽' });
    }
  );
};
