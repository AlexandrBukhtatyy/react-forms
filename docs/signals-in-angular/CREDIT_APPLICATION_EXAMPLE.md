# Пример: Сложная пошаговая форма заявки на кредит

> **Комплексный пример использования всех возможностей Signal Forms**
> Демонстрирует: пошаговую форму, условную валидацию, cross-field валидацию, асинхронную валидацию, динамические поля

## Содержание

1. [Структура формы](#структура-формы)
2. [Типы данных](#типы-данных)
3. [Схема валидации](#схема-валидации)
4. [Использование](#использование)
5. [React компоненты](#react-компоненты)

---

## Структура формы

### Шаги формы

1. **Шаг 1: Основная информация**
   - Тип кредита
   - Сумма кредита
   - Срок кредита
   - Цель кредита

2. **Шаг 2: Персональные данные**
   - ФИО
   - Дата рождения
   - Паспортные данные
   - ИНН / СНИЛС

3. **Шаг 3: Контактная информация**
   - Телефон
   - Email
   - Адрес регистрации
   - Адрес проживания

4. **Шаг 4: Информация о занятости**
   - Статус занятости
   - Место работы
   - Должность
   - Доход

5. **Шаг 5: Дополнительная информация**
   - Семейное положение
   - Иждивенцы
   - Имущество
   - Другие кредиты

6. **Шаг 6: Подтверждение и согласия**
   - Проверка данных
   - Согласия на обработку
   - Отправка заявки

---

## Типы данных

```typescript
// ============================================================================
// Основные типы
// ============================================================================

type LoanType = 'consumer' | 'mortgage' | 'car' | 'business' | 'refinancing';
type EmploymentStatus = 'employed' | 'selfEmployed' | 'unemployed' | 'retired' | 'student';
type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
type PropertyType = 'apartment' | 'house' | 'car' | 'land' | 'none';
type EducationLevel = 'secondary' | 'specialized' | 'higher' | 'postgraduate';

// ============================================================================
// Интерфейсы данных
// ============================================================================

interface CreditApplicationForm {
  // Метаданные формы
  currentStep: number;
  completedSteps: number[];

  // ============================================================================
  // Шаг 1: Основная информация
  // ============================================================================

  loanType: LoanType;
  loanAmount: number;
  loanTerm: number; // в месяцах
  loanPurpose: string;

  // Специфичные поля для ипотеки
  propertyValue?: number;
  initialPayment?: number;

  // Специфичные поля для автокредита
  carBrand?: string;
  carModel?: string;
  carYear?: number;
  carPrice?: number;

  // ============================================================================
  // Шаг 2: Персональные данные
  // ============================================================================

  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  birthPlace: string;
  gender: 'male' | 'female';

  // Паспорт
  passportSeries: string;
  passportNumber: string;
  passportIssueDate: string;
  passportIssuedBy: string;
  passportDepartmentCode: string;

  // Другие документы
  inn: string;
  snils: string;

  // ============================================================================
  // Шаг 3: Контактная информация
  // ============================================================================

  phoneMain: string;
  phoneAdditional?: string;
  email: string;
  emailAdditional?: string;

  // Адрес регистрации
  registrationRegion: string;
  registrationCity: string;
  registrationStreet: string;
  registrationHouse: string;
  registrationApartment?: string;
  registrationPostalCode: string;

  // Адрес проживания
  sameAsRegistration: boolean;
  residenceRegion?: string;
  residenceCity?: string;
  residenceStreet?: string;
  residenceHouse?: string;
  residenceApartment?: string;
  residencePostalCode?: string;

  // ============================================================================
  // Шаг 4: Информация о занятости
  // ============================================================================

  employmentStatus: EmploymentStatus;

  // Для работающих
  companyName?: string;
  companyInn?: string;
  companyPhone?: string;
  companyAddress?: string;
  position?: string;
  workExperienceTotal?: number; // в месяцах
  workExperienceCurrent?: number; // в месяцах

  // Доход
  monthlyIncome: number;
  additionalIncome?: number;
  additionalIncomeSource?: string;

  // Для ИП
  businessType?: string;
  businessInn?: string;
  businessActivity?: string;

  // ============================================================================
  // Шаг 5: Дополнительная информация
  // ============================================================================

  maritalStatus: MaritalStatus;
  dependents: number;
  education: EducationLevel;

  // Имущество
  hasProperty: boolean;
  properties?: PropertyItem[];

  // Существующие кредиты
  hasExistingLoans: boolean;
  existingLoans?: ExistingLoan[];

  // Созаемщики
  hasCoBorrower: boolean;
  coBorrowers?: CoBorrower[];

  // ============================================================================
  // Шаг 6: Согласия
  // ============================================================================

  agreePersonalData: boolean;
  agreeCreditHistory: boolean;
  agreeMarketing: boolean;
  agreeTerms: boolean;

  // Подпись
  confirmAccuracy: boolean;
  electronicSignature: string;
}

// ============================================================================
// Вложенные структуры
// ============================================================================

interface PropertyItem {
  id: string;
  type: PropertyType;
  description: string;
  estimatedValue: number;
  hasEncumbrance: boolean;
}

interface ExistingLoan {
  id: string;
  bank: string;
  type: string;
  amount: number;
  remainingAmount: number;
  monthlyPayment: number;
  maturityDate: string;
}

interface CoBorrower {
  id: string;
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  phone: string;
  relationship: string;
  monthlyIncome: number;
}
```

---

## Схема валидации

```typescript
import { FormStore } from './lib/forms';
import type { FieldPath } from './lib/forms';
import {
  required,
  minLength,
  maxLength,
  email,
  pattern,
  min,
  max,
  validate,
  validateAsync,
  validateTree,
  applyWhen,
  updateOn,
} from './lib/forms/validators';

// ============================================================================
// Переиспользуемые валидаторы
// ============================================================================

/**
 * Валидация ФИО
 */
function validateFullName<T>(
  fieldPath: FieldPath<T>[keyof T],
  fieldLabel: string
) {
  required(fieldPath, { message: `${fieldLabel} обязательно` });
  minLength(fieldPath, 2, { message: 'Минимум 2 символа' });
  maxLength(fieldPath, 50, { message: 'Максимум 50 символов' });
  pattern(fieldPath, /^[А-ЯЁа-яё\s-]+$/, {
    message: 'Только русские буквы, пробелы и дефис',
  });
}

/**
 * Валидация номера паспорта
 */
function validatePassport<T>(path: FieldPath<T>) {
  required(path.passportSeries as any, { message: 'Серия паспорта обязательна' });
  pattern(path.passportSeries as any, /^\d{4}$/, {
    message: 'Серия должна содержать 4 цифры',
  });

  required(path.passportNumber as any, { message: 'Номер паспорта обязателен' });
  pattern(path.passportNumber as any, /^\d{6}$/, {
    message: 'Номер должен содержать 6 цифр',
  });

  required(path.passportIssueDate as any, { message: 'Дата выдачи обязательна' });
  required(path.passportIssuedBy as any, { message: 'Кем выдан обязательно' });
  minLength(path.passportIssuedBy as any, 10);

  required(path.passportDepartmentCode as any, { message: 'Код подразделения обязателен' });
  pattern(path.passportDepartmentCode as any, /^\d{3}-\d{3}$/, {
    message: 'Формат: 123-456',
  });
}

/**
 * Валидация адреса
 */
function validateAddress<T>(
  path: FieldPath<T>,
  prefix: 'registration' | 'residence'
) {
  const fields = path as any;

  required(fields[`${prefix}Region`], { message: 'Регион обязателен' });
  required(fields[`${prefix}City`], { message: 'Город обязателен' });
  required(fields[`${prefix}Street`], { message: 'Улица обязательна' });
  required(fields[`${prefix}House`], { message: 'Дом обязателен' });
  required(fields[`${prefix}PostalCode`], { message: 'Индекс обязателен' });

  pattern(fields[`${prefix}PostalCode`], /^\d{6}$/, {
    message: 'Индекс должен содержать 6 цифр',
  });
}

// ============================================================================
// Основная схема валидации
// ============================================================================

const creditApplicationValidation = (path: FieldPath<CreditApplicationForm>) => {
  // ============================================================================
  // ШАГ 1: Основная информация
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step >= 1,
    (path) => {
      // Тип кредита
      required(path.loanType, { message: 'Выберите тип кредита' });

      // Сумма кредита
      required(path.loanAmount, { message: 'Укажите сумму кредита' });
      min(path.loanAmount, 50000, {
        message: 'Минимальная сумма кредита: 50 000 ₽',
      });
      max(path.loanAmount, 10000000, {
        message: 'Максимальная сумма кредита: 10 000 000 ₽',
      });

      // Срок кредита
      required(path.loanTerm, { message: 'Укажите срок кредита' });
      min(path.loanTerm, 6, { message: 'Минимальный срок: 6 месяцев' });
      max(path.loanTerm, 240, { message: 'Максимальный срок: 240 месяцев (20 лет)' });

      // Цель кредита
      required(path.loanPurpose, { message: 'Укажите цель кредита' });
      minLength(path.loanPurpose, 10, {
        message: 'Опишите цель подробнее (минимум 10 символов)',
      });
      maxLength(path.loanPurpose, 500);

      // ========================================================================
      // Специфичная валидация для ипотеки
      // ========================================================================

      applyWhen(
        path.loanType,
        (type) => type === 'mortgage',
        (path) => {
          required(path.propertyValue, {
            message: 'Укажите стоимость недвижимости',
          });
          min(path.propertyValue as any, 1000000, {
            message: 'Минимальная стоимость: 1 000 000 ₽',
          });

          required(path.initialPayment, {
            message: 'Укажите первоначальный взнос',
          });
          min(path.initialPayment as any, 0);

          // Cross-field: первоначальный взнос не может быть больше стоимости
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

          // Cross-field: первоначальный взнос минимум 10%
          validateTree(
            (ctx) => {
              const form = ctx.formValue();
              if (
                form.initialPayment &&
                form.propertyValue &&
                form.initialPayment < form.propertyValue * 0.1
              ) {
                return {
                  code: 'initialPaymentTooLow',
                  message: 'Первоначальный взнос должен быть не менее 10% от стоимости',
                };
              }
              return null;
            },
            { targetField: 'initialPayment' }
          );

          // Сумма кредита не может превышать стоимость - первоначальный взнос
          validateTree(
            (ctx) => {
              const form = ctx.formValue();
              if (
                form.loanAmount &&
                form.propertyValue &&
                form.initialPayment
              ) {
                const maxLoanAmount = form.propertyValue - form.initialPayment;
                if (form.loanAmount > maxLoanAmount) {
                  return {
                    code: 'loanAmountTooHigh',
                    message: `Максимальная сумма кредита: ${maxLoanAmount.toLocaleString()} ₽`,
                  };
                }
              }
              return null;
            },
            { targetField: 'loanAmount' }
          );
        }
      );

      // ========================================================================
      // Специфичная валидация для автокредита
      // ========================================================================

      applyWhen(
        path.loanType,
        (type) => type === 'car',
        (path) => {
          required(path.carBrand, { message: 'Укажите марку автомобиля' });
          required(path.carModel, { message: 'Укажите модель автомобиля' });
          required(path.carYear, { message: 'Укажите год выпуска' });

          min(path.carYear as any, 2000, { message: 'Год выпуска не ранее 2000' });
          max(path.carYear as any, new Date().getFullYear() + 1);

          required(path.carPrice, { message: 'Укажите стоимость автомобиля' });
          min(path.carPrice as any, 300000, {
            message: 'Минимальная стоимость: 300 000 ₽',
          });

          // Сумма кредита не может превышать стоимость автомобиля
          validateTree(
            (ctx) => {
              const form = ctx.formValue();
              if (form.loanAmount && form.carPrice && form.loanAmount > form.carPrice) {
                return {
                  code: 'loanExceedsCarPrice',
                  message: 'Сумма кредита не может превышать стоимость автомобиля',
                };
              }
              return null;
            },
            { targetField: 'loanAmount' }
          );
        }
      );

      // ========================================================================
      // Валидация срока в зависимости от типа кредита
      // ========================================================================

      applyWhen(
        path.loanType,
        (type) => type === 'consumer',
        (path) => {
          max(path.loanTerm, 60, {
            message: 'Максимальный срок потребительского кредита: 60 месяцев',
          });
        }
      );

      applyWhen(
        path.loanType,
        (type) => type === 'car',
        (path) => {
          max(path.loanTerm, 84, {
            message: 'Максимальный срок автокредита: 84 месяца',
          });
        }
      );

      applyWhen(
        path.loanType,
        (type) => type === 'mortgage',
        (path) => {
          max(path.loanTerm, 360, {
            message: 'Максимальный срок ипотеки: 360 месяцев (30 лет)',
          });
        }
      );
    }
  );

  // ============================================================================
  // ШАГ 2: Персональные данные
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step >= 2,
    (path) => {
      // ФИО
      validateFullName(path.lastName, 'Фамилия');
      validateFullName(path.firstName, 'Имя');
      validateFullName(path.middleName, 'Отчество');

      // Дата рождения
      required(path.birthDate, { message: 'Дата рождения обязательна' });

      validate(path.birthDate, (ctx) => {
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

        // Дополнительная проверка для ипотеки
        const loanType = ctx.getField('loanType');
        const loanTerm = ctx.getField('loanTerm');

        if (loanType === 'mortgage' && loanTerm) {
          const ageAtEnd = age + Math.floor(loanTerm / 12);
          if (ageAtEnd > 65) {
            return {
              code: 'ageExceedsMortgageLimit',
              message: 'Возраст на момент окончания кредита не должен превышать 65 лет',
            };
          }
        }

        return null;
      });

      // Место рождения
      required(path.birthPlace, { message: 'Место рождения обязательно' });
      minLength(path.birthPlace, 5);

      // Пол
      required(path.gender, { message: 'Выберите пол' });

      // Паспортные данные
      validatePassport(path);

      validate(path.passportIssueDate, (ctx) => {
        const issueDate = new Date(ctx.value());
        const birthDate = new Date(ctx.getField('birthDate'));
        const today = new Date();

        if (issueDate < birthDate) {
          return {
            code: 'issueDateBeforeBirth',
            message: 'Дата выдачи не может быть раньше даты рождения',
          };
        }

        if (issueDate > today) {
          return {
            code: 'issueDateInFuture',
            message: 'Дата выдачи не может быть в будущем',
          };
        }

        return null;
      });

      // ИНН
      required(path.inn, { message: 'ИНН обязателен' });
      pattern(path.inn, /^\d{12}$/, {
        message: 'ИНН должен содержать 12 цифр',
      });

      // Асинхронная проверка ИНН на валидность
      validateAsync(
        path.inn,
        async (ctx) => {
          const inn = ctx.value();

          if (!inn || inn.length !== 12) return null;

          try {
            const response = await fetch('/api/validate-inn', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ inn }),
            });

            const data = await response.json();

            if (!data.valid) {
              return {
                code: 'invalidInn',
                message: 'ИНН не найден в базе данных ФНС',
              };
            }

            return null;
          } catch {
            return null; // Игнорируем ошибки сети
          }
        },
        { debounce: 1000 }
      );

      // СНИЛС
      required(path.snils, { message: 'СНИЛС обязателен' });
      pattern(path.snils, /^\d{3}-\d{3}-\d{3} \d{2}$/, {
        message: 'Формат СНИЛС: 123-456-789 00',
      });
    }
  );

  // ============================================================================
  // ШАГ 3: Контактная информация
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step >= 3,
    (path) => {
      // Основной телефон
      required(path.phoneMain, { message: 'Телефон обязателен' });
      pattern(path.phoneMain, /^\+7\d{10}$/, {
        message: 'Формат: +7XXXXXXXXXX (11 цифр)',
      });

      // Дополнительный телефон (опционально)
      validate(path.phoneAdditional as any, (ctx) => {
        const phone = ctx.value();
        if (!phone) return null;

        if (!/^\+7\d{10}$/.test(phone)) {
          return {
            code: 'invalidPhone',
            message: 'Формат: +7XXXXXXXXXX',
          };
        }

        const mainPhone = ctx.getField('phoneMain');
        if (phone === mainPhone) {
          return {
            code: 'samePhone',
            message: 'Телефоны должны быть разными',
          };
        }

        return null;
      });

      // Email
      required(path.email, { message: 'Email обязателен' });
      email(path.email);
      updateOn(path.email, 'blur');

      // Асинхронная проверка уникальности email
      validateAsync(
        path.email,
        async (ctx) => {
          const email = ctx.value();

          if (!email) return null;

          try {
            const response = await fetch('/api/check-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.exists) {
              return {
                code: 'emailExists',
                message: 'Заявка с этим email уже существует',
              };
            }

            return null;
          } catch {
            return null;
          }
        },
        { debounce: 700 }
      );

      // Адрес регистрации
      validateAddress(path, 'registration');

      // Адрес проживания (если отличается от регистрации)
      applyWhen(
        path.sameAsRegistration,
        (value) => value === false,
        (path) => {
          validateAddress(path, 'residence');
        }
      );
    }
  );

  // ============================================================================
  // ШАГ 4: Информация о занятости
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step >= 4,
    (path) => {
      // Статус занятости
      required(path.employmentStatus, {
        message: 'Укажите статус занятости',
      });

      // ========================================================================
      // Валидация для работающих
      // ========================================================================

      applyWhen(
        path.employmentStatus,
        (status) => status === 'employed',
        (path) => {
          required(path.companyName, { message: 'Укажите название компании' });
          minLength(path.companyName as any, 3);

          required(path.companyInn, { message: 'ИНН компании обязателен' });
          pattern(path.companyInn as any, /^\d{10}$/, {
            message: 'ИНН компании должен содержать 10 цифр',
          });

          required(path.companyPhone, { message: 'Телефон компании обязателен' });
          pattern(path.companyPhone as any, /^\+7\d{10}$/);

          required(path.companyAddress, { message: 'Адрес компании обязателен' });
          minLength(path.companyAddress as any, 10);

          required(path.position, { message: 'Укажите должность' });
          minLength(path.position as any, 3);

          required(path.workExperienceTotal, {
            message: 'Укажите общий стаж работы',
          });
          min(path.workExperienceTotal as any, 0);

          required(path.workExperienceCurrent, {
            message: 'Укажите стаж на текущем месте',
          });
          min(path.workExperienceCurrent as any, 0);

          // Стаж на текущем месте не может быть больше общего стажа
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

          // Минимальный стаж для определенных типов кредитов
          validateTree(
            (ctx) => {
              const form = ctx.formValue();
              const loanType = form.loanType;
              const currentExperience = form.workExperienceCurrent || 0;

              if (loanType === 'mortgage' && currentExperience < 6) {
                return {
                  code: 'insufficientExperienceForMortgage',
                  message: 'Для ипотеки требуется минимум 6 месяцев на текущем месте работы',
                };
              }

              return null;
            },
            { targetField: 'workExperienceCurrent' }
          );
        }
      );

      // ========================================================================
      // Валидация для ИП
      // ========================================================================

      applyWhen(
        path.employmentStatus,
        (status) => status === 'selfEmployed',
        (path) => {
          required(path.businessType, { message: 'Укажите тип бизнеса' });
          required(path.businessInn, { message: 'ИНН ИП обязателен' });
          pattern(path.businessInn as any, /^\d{12}$/, {
            message: 'ИНН ИП должен содержать 12 цифр',
          });

          required(path.businessActivity, {
            message: 'Укажите вид деятельности',
          });
          minLength(path.businessActivity as any, 10);
        }
      );

      // ========================================================================
      // Доход
      // ========================================================================

      required(path.monthlyIncome, { message: 'Укажите ежемесячный доход' });
      min(path.monthlyIncome, 10000, {
        message: 'Минимальный доход: 10 000 ₽',
      });

      // Дополнительный доход (опционально)
      validate(path.additionalIncome as any, (ctx) => {
        const income = ctx.value();
        if (!income) return null;

        if (income < 0) {
          return {
            code: 'negativeIncome',
            message: 'Доход не может быть отрицательным',
          };
        }

        return null;
      });

      // Источник дополнительного дохода обязателен если указан доход
      applyWhen(
        path.additionalIncome as any,
        (income) => income > 0,
        (path) => {
          required(path.additionalIncomeSource, {
            message: 'Укажите источник дополнительного дохода',
          });
          minLength(path.additionalIncomeSource as any, 5);
        }
      );

      // ========================================================================
      // Проверка соотношения дохода и платежа
      // ========================================================================

      validateTree(
        (ctx) => {
          const form = ctx.formValue();

          // Расчет ежемесячного платежа (упрощенный)
          const loanAmount = form.loanAmount || 0;
          const loanTerm = form.loanTerm || 1;

          // Приблизительная ставка в зависимости от типа кредита
          const rateMap: Record<LoanType, number> = {
            consumer: 0.15,
            mortgage: 0.10,
            car: 0.12,
            business: 0.18,
            refinancing: 0.13,
          };

          const annualRate = rateMap[form.loanType] || 0.15;
          const monthlyRate = annualRate / 12;

          // Формула аннуитетного платежа
          const monthlyPayment =
            loanAmount *
            (monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) /
            (Math.pow(1 + monthlyRate, loanTerm) - 1);

          // Общий доход
          const totalIncome =
            (form.monthlyIncome || 0) + (form.additionalIncome || 0);

          // Платеж не должен превышать 50% дохода
          const maxPayment = totalIncome * 0.5;

          if (monthlyPayment > maxPayment) {
            return {
              code: 'paymentExceedsIncome',
              message: `Ежемесячный платеж (~${Math.round(monthlyPayment).toLocaleString()} ₽) превышает 50% дохода. Уменьшите сумму или увеличьте срок кредита.`,
              params: { monthlyPayment, maxPayment },
            };
          }

          return null;
        },
        { targetField: 'loanAmount' }
      );
    }
  );

  // ============================================================================
  // ШАГ 5: Дополнительная информация
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step >= 5,
    (path) => {
      // Семейное положение
      required(path.maritalStatus, {
        message: 'Укажите семейное положение',
      });

      // Иждивенцы
      required(path.dependents, { message: 'Укажите количество иждивенцев' });
      min(path.dependents, 0);
      max(path.dependents, 10, {
        message: 'Максимальное количество иждивенцев: 10',
      });

      // Образование
      required(path.education, { message: 'Укажите уровень образования' });

      // Имущество
      applyWhen(
        path.hasProperty,
        (value) => value === true,
        (path) => {
          validate(path.properties as any, (ctx) => {
            const properties = ctx.value();

            if (!properties || properties.length === 0) {
              return {
                code: 'noProperties',
                message: 'Добавьте хотя бы один объект имущества',
              };
            }

            // Проверка общей стоимости имущества
            const totalValue = properties.reduce(
              (sum: number, p: PropertyItem) => sum + (p.estimatedValue || 0),
              0
            );

            if (totalValue === 0) {
              return {
                code: 'zeroPropertyValue',
                message: 'Укажите стоимость имущества',
              };
            }

            return null;
          });
        }
      );

      // Существующие кредиты
      applyWhen(
        path.hasExistingLoans,
        (value) => value === true,
        (path) => {
          validate(path.existingLoans as any, (ctx) => {
            const loans = ctx.value();

            if (!loans || loans.length === 0) {
              return {
                code: 'noExistingLoans',
                message: 'Добавьте информацию о существующих кредитах',
              };
            }

            // Проверка общей кредитной нагрузки
            const totalMonthlyPayment = loans.reduce(
              (sum: number, loan: ExistingLoan) => sum + (loan.monthlyPayment || 0),
              0
            );

            const monthlyIncome = ctx.getField('monthlyIncome') || 0;
            const additionalIncome = ctx.getField('additionalIncome') || 0;
            const totalIncome = monthlyIncome + additionalIncome;

            // Существующая нагрузка + новый кредит не должны превышать 60%
            if (totalMonthlyPayment > totalIncome * 0.4) {
              return {
                code: 'highDebtBurden',
                message: 'Существующая кредитная нагрузка слишком высока',
                params: { totalMonthlyPayment, totalIncome },
              };
            }

            return null;
          });
        }
      );

      // Созаемщики (опционально, но обязательно для больших сумм)
      applyWhen(
        path.loanAmount,
        (amount) => amount > 3000000,
        (path) => {
          validate(path.hasCoBorrower, (ctx) => {
            const hasCoBorrower = ctx.value();
            const coBorrowers = ctx.getField('coBorrowers');

            if (!hasCoBorrower || !coBorrowers || coBorrowers.length === 0) {
              return {
                code: 'coBorrowerRequired',
                message: 'Для суммы кредита более 3 млн необходим созаемщик',
              };
            }

            return null;
          });
        }
      );
    }
  );

  // ============================================================================
  // ШАГ 6: Согласия и подтверждение
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step >= 6,
    (path) => {
      // Все согласия обязательны
      required(path.agreePersonalData, {
        message: 'Необходимо согласие на обработку персональных данных',
      });

      validate(path.agreePersonalData, (ctx) => {
        if (ctx.value() !== true) {
          return {
            code: 'mustAgree',
            message: 'Необходимо дать согласие',
          };
        }
        return null;
      });

      required(path.agreeCreditHistory, {
        message: 'Необходимо согласие на проверку кредитной истории',
      });

      validate(path.agreeCreditHistory, (ctx) => {
        if (ctx.value() !== true) {
          return { code: 'mustAgree', message: 'Необходимо дать согласие' };
        }
        return null;
      });

      required(path.agreeTerms, { message: 'Необходимо принять условия кредита' });

      validate(path.agreeTerms, (ctx) => {
        if (ctx.value() !== true) {
          return { code: 'mustAgree', message: 'Необходимо принять условия' };
        }
        return null;
      });

      // Подтверждение точности данных
      required(path.confirmAccuracy, {
        message: 'Подтвердите точность введенных данных',
      });

      validate(path.confirmAccuracy, (ctx) => {
        if (ctx.value() !== true) {
          return { code: 'mustConfirm', message: 'Необходимо подтвердить' };
        }
        return null;
      });

      // Электронная подпись (ввод кода из СМС)
      required(path.electronicSignature, {
        message: 'Введите код из СМС для подписи заявки',
      });

      pattern(path.electronicSignature, /^\d{6}$/, {
        message: 'Код должен содержать 6 цифр',
      });

      // Асинхронная проверка кода подтверждения
      validateAsync(
        path.electronicSignature,
        async (ctx) => {
          const code = ctx.value();
          const phone = ctx.getField('phoneMain');

          if (!code || code.length !== 6) return null;

          try {
            const response = await fetch('/api/verify-sms-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone, code }),
            });

            const data = await response.json();

            if (!data.valid) {
              return {
                code: 'invalidSmsCode',
                message: 'Неверный код подтверждения',
              };
            }

            return null;
          } catch {
            return {
              code: 'verificationFailed',
              message: 'Не удалось проверить код. Попробуйте еще раз',
            };
          }
        },
        { debounce: 500 }
      );
    }
  );
};

export default creditApplicationValidation;
```

---

Продолжение в следующей части с React компонентами и использованием...
