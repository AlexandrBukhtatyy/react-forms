import type { FieldPath, ValidationSchemaFn } from '@/lib/forms/types';
import type { CreditApplicationForm } from '../types/credit-application';

// Импортируем все схемы шагов
import { basicInfoValidation } from './basic-info-validation';
import { personalDataValidation } from './personal-data-validation';
import { contactInfoValidation } from './contact-info-validation';
import { employmentValidation } from './employment-validation';
import { additionalValidation } from './additional-validation';
import { confirmationValidation } from './confirmation-validation';

/**
 * Главная схема валидации формы заявки на кредит
 *
 * ✅ Валидирует ВСЮ форму целиком (все шаги)
 * ✅ Централизованное управление валидацией
 * ✅ Модульные схемы шагов (каждый в отдельном файле)
 *
 * Использование:
 * 1. При создании формы: form.applyValidationSchema(creditApplicationValidation)
 * 2. При переходе между шагами: используй STEP_VALIDATIONS[step] для валидации конкретного шага
 * 3. При финальной отправке: form.validate() проверит все поля
 */
const creditApplicationValidation: ValidationSchemaFn<CreditApplicationForm> = (
  path: FieldPath<CreditApplicationForm>
) => {
  // Применяем валидацию всех шагов
  basicInfoValidation(path);
  personalDataValidation(path);
  contactInfoValidation(path);
  employmentValidation(path);
  additionalValidation(path);
  confirmationValidation(path);
};

export default creditApplicationValidation;

// Экспортируем также отдельные схемы для переиспользования
export {
  basicInfoValidation,
  personalDataValidation,
  contactInfoValidation,
  employmentValidation,
  additionalValidation,
  confirmationValidation,
};

// Мапа для удобного доступа (если понадобится валидировать конкретный шаг отдельно)
export const STEP_VALIDATIONS = {
  1: basicInfoValidation,
  2: personalDataValidation,
  3: contactInfoValidation,
  4: employmentValidation,
  5: additionalValidation,
  6: confirmationValidation,
} as const;
