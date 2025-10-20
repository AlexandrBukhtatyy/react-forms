import type { FieldPath } from '@/lib/forms/types';
import type { CreditApplicationForm } from '../../../../_shared/types/credit-application';
import {
  applyWhen,
  validateTree,
  required,
  min,
  minLength,
  pattern,
} from '@/lib/forms/validators';

/**
 * Схема валидации для Шага 4: Информация о занятости
 */
export const employmentValidation = (path: FieldPath<CreditApplicationForm>) => {
  required(path.employmentStatus, { message: 'Укажите статус занятости' });

  // Условная валидация для работающих
  applyWhen(
    path.employmentStatus,
    (status) => status === 'employed',
    (path) => {
      required(path.companyName, { message: 'Укажите название компании' });
      minLength(path.companyName as any, 3, { message: 'Минимум 3 символа' });

      required(path.companyInn, { message: 'ИНН компании обязателен' });
      pattern(path.companyInn as any, /^\d{10}$/, {
        message: 'ИНН компании должен содержать 10 цифр',
      });

      required(path.companyPhone, { message: 'Телефон компании обязателен' });
      pattern(path.companyPhone as any, /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/);

      required(path.companyAddress, { message: 'Адрес компании обязателен' });
      minLength(path.companyAddress as any, 10, { message: 'Минимум 10 символов' });

      required(path.position, { message: 'Укажите должность' });
      minLength(path.position as any, 3, { message: 'Минимум 3 символа' });

      required(path.workExperienceTotal, { message: 'Укажите общий стаж работы' });
      min(path.workExperienceTotal as any, 0, { message: 'Стаж не может быть отрицательным' });

      required(path.workExperienceCurrent, { message: 'Укажите стаж на текущем месте' });
      min(path.workExperienceCurrent as any, 0, { message: 'Стаж не может быть отрицательным' });

      // Cross-field: стаж на текущем месте не больше общего стажа
      validateTree(
        (ctx) => {
          const form = ctx.formValue();
          if (
            form.workExperienceCurrent &&
            form.workExperienceTotal &&
            form.workExperienceCurrent > form.workExperienceTotal
          ) {
            return {
              code: 'currentExperienceExceedsTotal',
              message: 'Стаж на текущем месте не может превышать общий стаж',
            };
          }
          return null;
        },
        { targetField: 'workExperienceCurrent' }
      );
    }
  );

  // Условная валидация для ИП
  applyWhen(
    path.employmentStatus,
    (status) => status === 'selfEmployed',
    (path) => {
      required(path.businessType, { message: 'Укажите тип бизнеса' });

      required(path.businessInn, { message: 'ИНН ИП обязателен' });
      pattern(path.businessInn as any, /^\d{12}$/, {
        message: 'ИНН ИП должен содержать 12 цифр',
      });

      required(path.businessActivity, { message: 'Укажите вид деятельности' });
      minLength(path.businessActivity as any, 10, { message: 'Минимум 10 символов' });
    }
  );

  // Валидация дохода (для всех статусов)
  required(path.monthlyIncome, { message: 'Укажите ежемесячный доход' });
  min(path.monthlyIncome, 10000, { message: 'Минимальный доход: 10 000 ₽' });
};
