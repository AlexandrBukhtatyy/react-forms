/**
 * Создание формы кредитной заявки
 *
 * Функция создаёт GroupNode с автоматическим применением всех схем:
 * - Form Schema: Структура полей (все 6 шагов + вычисляемые поля)
 * - Behavior Schema: Реактивное поведение (30 behaviors)
 * - Validation Schema: Валидация (базовая + условная + кросс-полевая)
 *
 * Архитектура:
 * - Схемы вынесены в отдельные модули для переиспользования
 * - Применяются автоматически через новый GroupNode конструктор
 * - Поддержка вложенных форм и массивов
 */

import type { GroupNodeWithControls } from '@/lib/forms';
import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import type { CreditApplicationForm } from '../types/credit-application';

// Импортируем все схемы
import { creditApplicationSchema } from './credit-application-schema';
import { creditApplicationBehavior } from './credit-application-behavior';
import creditApplicationValidation from './credit-application-validation';

// Импортируем validation схемы для массивов
import { propertyValidation } from './validation/property-validation';
import { existingLoanValidation } from './validation/existing-loan-validation';
import { coBorrowerValidation } from './validation/co-borrower-validation';

/**
 * Создаёт форму кредитной заявки с полной реактивностью
 *
 * @returns GroupNode с применёнными схемами form, behavior и validation
 */
export const createCreditApplicationForm = (): GroupNodeWithControls<CreditApplicationForm> => {
  const form = new GroupNode<CreditApplicationForm>({
    form: creditApplicationSchema,
    behavior: creditApplicationBehavior,
    validation: creditApplicationValidation,
  });

  // ✅ Применяем validation схемы к ArrayNode элементам
  // Эти схемы будут применяться к каждому элементу массива автоматически
  form.properties.applyValidationSchema(propertyValidation);
  form.existingLoans.applyValidationSchema(existingLoanValidation);
  form.coBorrowers.applyValidationSchema(coBorrowerValidation);

  return form;
};
