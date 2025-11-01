import type { FieldPath } from '@/lib/forms/types';
import {
  applyWhen,
  validate,
  required,
  min,
  max,
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
  // ✅ Валидация элементов массива перенесена в property-validation.ts
  // ArrayNode автоматически применяет validation schema к каждому элементу
  applyWhen(
    path.hasProperty,
    (value) => value === true,
    (path) => {
      // Проверка что массив не пустой
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
    }
  );

  // Валидация существующих кредитов
  // ✅ Валидация элементов массива перенесена в existing-loan-validation.ts
  // ArrayNode автоматически применяет validation schema к каждому элементу
  applyWhen(
    path.hasExistingLoans,
    (value) => value === true,
    (path) => {
      // Проверка что массив не пустой
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
    }
  );

  // Валидация созаемщиков
  // ✅ Валидация элементов массива перенесена в co-borrower-validation.ts
  // ArrayNode автоматически применяет validation schema к каждому элементу
  applyWhen(
    path.hasCoBorrower,
    (value) => value === true,
    (path) => {
      // Проверка что массив не пустой
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
    }
  );
};
