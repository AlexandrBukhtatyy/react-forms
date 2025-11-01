import type { FieldPath } from '@/lib/forms/types';
import {
  applyWhen,
  validate,
  validateTree,
  required,
  min,
  max,
  minLength,
  maxLength,
  pattern,
  email,
} from '@/lib/forms/validators';
import type { CreditApplicationForm } from '../../types/credit-application';

/**
 * Схема валидации для Шага 5: Дополнительная информация
 */
export const additionalValidation = (path: FieldPath<CreditApplicationForm>) => {
  required(path.maritalStatus, { message: 'Укажите семейное положение' });

  required(path.dependents, { message: 'Укажите количество иждивенцев' });
  min(path.dependents, 0, { message: 'Количество не может быть отрицательным' });
  max(path.dependents, 10, { message: 'Максимальное количество иждивенцев: 10' });

  required(path.education, { message: 'Укажите уровень образования' });

  // Валидация имущества
  applyWhen(
    path.hasProperty,
    (value) => value === true,
    (path) => {
      validate(path.properties, (ctx) => {
        const properties = ctx.value();
        if (!properties || properties.length === 0) {
          return {
            code: 'noProperties',
            message: 'Добавьте хотя бы один объект имущества',
          };
        }
        return null;
      });

      // Валидация каждого элемента имущества
      // TODO: Когда форма будет мигрирована на ArrayNode, эту валидацию нужно перенести в отдельную схему
      validateTree((ctx) => {
        const form = ctx.formValue();
        if (!form.properties || form.properties.length === 0) return null;

        const errors: string[] = [];
        form.properties.forEach((property: any, index: number) => {
          if (!property.type) {
            errors.push(`Имущество ${index + 1}: укажите тип`);
          }
          if (!property.description || property.description.length < 10) {
            errors.push(`Имущество ${index + 1}: описание должно содержать минимум 10 символов`);
          }
          if (property.description && property.description.length > 500) {
            errors.push(`Имущество ${index + 1}: описание не должно превышать 500 символов`);
          }
          if (!property.estimatedValue || property.estimatedValue <= 0) {
            errors.push(`Имущество ${index + 1}: укажите корректную оценочную стоимость`);
          }
          if (property.estimatedValue && property.estimatedValue < 10000) {
            errors.push(`Имущество ${index + 1}: минимальная стоимость 10 000 ₽`);
          }
        });

        if (errors.length > 0) {
          return {
            code: 'propertiesValidationFailed',
            message: errors.join('; '),
          };
        }
        return null;
      }, { targetField: 'properties' });
    }
  );

  // Валидация существующих кредитов
  applyWhen(
    path.hasExistingLoans,
    (value) => value === true,
    (path) => {
      validate(path.existingLoans, (ctx) => {
        const loans = ctx.value();
        if (!loans || loans.length === 0) {
          return {
            code: 'noExistingLoans',
            message: 'Добавьте информацию о существующих кредитах',
          };
        }
        return null;
      });

      // Валидация каждого элемента кредита
      // TODO: Когда форма будет мигрирована на ArrayNode, эту валидацию нужно перенести в отдельную схему
      validateTree((ctx) => {
        const form = ctx.formValue();
        if (!form.existingLoans || form.existingLoans.length === 0) return null;

        const errors: string[] = [];
        form.existingLoans.forEach((loan: any, index: number) => {
          if (!loan.bank || loan.bank.length < 3) {
            errors.push(`Кредит ${index + 1}: укажите название банка (минимум 3 символа)`);
          }
          if (loan.bank && loan.bank.length > 100) {
            errors.push(`Кредит ${index + 1}: название банка не должно превышать 100 символов`);
          }
          if (!loan.type) {
            errors.push(`Кредит ${index + 1}: укажите тип кредита`);
          }
          if (!loan.amount || loan.amount <= 0) {
            errors.push(`Кредит ${index + 1}: укажите сумму кредита`);
          }
          if (!loan.remainingAmount || loan.remainingAmount < 0) {
            errors.push(`Кредит ${index + 1}: укажите остаток долга`);
          }
          if (loan.remainingAmount > loan.amount) {
            errors.push(`Кредит ${index + 1}: остаток долга не может превышать сумму кредита`);
          }
          if (!loan.monthlyPayment || loan.monthlyPayment <= 0) {
            errors.push(`Кредит ${index + 1}: укажите ежемесячный платеж`);
          }
          if (!loan.maturityDate) {
            errors.push(`Кредит ${index + 1}: укажите дату погашения`);
          }
          if (loan.maturityDate) {
            const maturityDate = new Date(loan.maturityDate);
            const today = new Date();
            if (maturityDate < today) {
              errors.push(`Кредит ${index + 1}: дата погашения не может быть в прошлом`);
            }
          }
        });

        if (errors.length > 0) {
          return {
            code: 'existingLoansValidationFailed',
            message: errors.join('; '),
          };
        }
        return null;
      }, { targetField: 'existingLoans' });
    }
  );

  // Валидация созаемщиков
  applyWhen(
    path.hasCoBorrower,
    (value) => value === true,
    (path) => {
      validate(path.coBorrowers, (ctx) => {
        const coBorrowers = ctx.value();
        if (!coBorrowers || coBorrowers.length === 0) {
          return {
            code: 'noCoBorrowers',
            message: 'Добавьте информацию о созаемщике',
          };
        }
        return null;
      });

      // Валидация каждого созаемщика
      // TODO: Когда форма будет мигрирована на ArrayNode, эту валидацию нужно перенести в отдельную схему
      validateTree((ctx) => {
        const form = ctx.formValue();
        if (!form.coBorrowers || form.coBorrowers.length === 0) return null;

        const errors: string[] = [];
        form.coBorrowers.forEach((coBorrower: any, index: number) => {
          const prefix = `Созаемщик ${index + 1}`;

          // Валидация ФИО
          if (!coBorrower.personalData?.lastName || coBorrower.personalData.lastName.length < 2) {
            errors.push(`${prefix}: укажите фамилию (минимум 2 символа)`);
          }
          if (coBorrower.personalData?.lastName && coBorrower.personalData.lastName.length > 50) {
            errors.push(`${prefix}: фамилия не должна превышать 50 символов`);
          }
          if (coBorrower.personalData?.lastName && !/^[А-ЯЁа-яё\s-]+$/.test(coBorrower.personalData.lastName)) {
            errors.push(`${prefix}: фамилия должна содержать только русские буквы`);
          }

          if (!coBorrower.personalData?.firstName || coBorrower.personalData.firstName.length < 2) {
            errors.push(`${prefix}: укажите имя (минимум 2 символа)`);
          }
          if (coBorrower.personalData?.firstName && coBorrower.personalData.firstName.length > 50) {
            errors.push(`${prefix}: имя не должно превышать 50 символов`);
          }

          if (!coBorrower.personalData?.middleName || coBorrower.personalData.middleName.length < 2) {
            errors.push(`${prefix}: укажите отчество (минимум 2 символа)`);
          }
          if (coBorrower.personalData?.middleName && coBorrower.personalData.middleName.length > 50) {
            errors.push(`${prefix}: отчество не должно превышать 50 символов`);
          }

          // Валидация даты рождения
          if (!coBorrower.personalData?.birthDate) {
            errors.push(`${prefix}: укажите дату рождения`);
          } else {
            const birthDate = new Date(coBorrower.personalData.birthDate);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 18) {
              errors.push(`${prefix}: возраст должен быть не менее 18 лет`);
            }
            if (age > 75) {
              errors.push(`${prefix}: максимальный возраст 75 лет`);
            }
          }

          // Валидация телефона
          if (!coBorrower.phone) {
            errors.push(`${prefix}: укажите телефон`);
          } else if (!/^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/.test(coBorrower.phone)) {
            errors.push(`${prefix}: неверный формат телефона`);
          }

          // Валидация email
          if (!coBorrower.email) {
            errors.push(`${prefix}: укажите email`);
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coBorrower.email)) {
            errors.push(`${prefix}: неверный формат email`);
          }

          // Валидация отношения к заемщику
          if (!coBorrower.relationship) {
            errors.push(`${prefix}: укажите отношение к заемщику`);
          }

          // Валидация дохода
          if (!coBorrower.monthlyIncome || coBorrower.monthlyIncome < 10000) {
            errors.push(`${prefix}: минимальный доход 10 000 ₽`);
          }
          if (coBorrower.monthlyIncome && coBorrower.monthlyIncome > 10000000) {
            errors.push(`${prefix}: максимальный доход 10 000 000 ₽`);
          }
        });

        if (errors.length > 0) {
          return {
            code: 'coBorrowersValidationFailed',
            message: errors.join('; '),
          };
        }
        return null;
      }, { targetField: 'coBorrowers' });
    }
  );
};
