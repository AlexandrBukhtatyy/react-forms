import type { FieldPath } from '@/lib/forms/types';
import type { CreditApplicationForm } from '../../_shared/types/credit-application';
import {
  applyWhen,
  validate,
  validateTree,
  validateAsync,
  updateOn,
  required,
  min,
  max,
  minLength,
  maxLength,
  email,
  pattern,
} from '@/lib/forms/validators';

/**
 * Схема валидации для формы заявки на кредит
 *
 * Паттерн: Вся валидация определяется в отдельной функции-схеме,
 * а не в определениях полей формы
 */
const creditApplicationValidation = (path: FieldPath<CreditApplicationForm>) => {
  // ============================================================================
  // ШАГ 1: Основная информация
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step === 1,
    (path) => {
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
          min(path.propertyValue as any, 1000000, { message: 'Минимальная стоимость: 1 000 000 ₽' });

          required(path.initialPayment, { message: 'Укажите первоначальный взнос' });
          min(path.initialPayment as any, 0);

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
          min(path.carYear as any, 2000, { message: 'Год выпуска не ранее 2000' });

          required(path.carPrice, { message: 'Укажите стоимость автомобиля' });
          min(path.carPrice as any, 300000, { message: 'Минимальная стоимость: 300 000 ₽' });
        }
      );
    }
  );

  // ============================================================================
  // ШАГ 2: Персональные данные
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step === 2,
    (path) => {
      // Валидация личных данных
      required(path.personalData_lastName, { message: 'Фамилия обязательна' });
      minLength(path.personalData_lastName, 2, { message: 'Минимум 2 символа' });
      maxLength(path.personalData_lastName, 50, { message: 'Максимум 50 символов' });
      pattern(path.personalData_lastName, /^[А-ЯЁа-яё\s-]+$/, {
        message: 'Только русские буквы, пробелы и дефис'
      });

      required(path.personalData_firstName, { message: 'Имя обязательно' });
      minLength(path.personalData_firstName, 2, { message: 'Минимум 2 символа' });
      maxLength(path.personalData_firstName, 50, { message: 'Максимум 50 символов' });
      pattern(path.personalData_firstName, /^[А-ЯЁа-яё\s-]+$/, {
        message: 'Только русские буквы, пробелы и дефис'
      });

      required(path.personalData_middleName, { message: 'Отчество обязательно' });
      minLength(path.personalData_middleName, 2, { message: 'Минимум 2 символа' });
      maxLength(path.personalData_middleName, 50, { message: 'Максимум 50 символов' });
      pattern(path.personalData_middleName, /^[А-ЯЁа-яё\s-]+$/, {
        message: 'Только русские буквы, пробелы и дефис'
      });

      required(path.personalData_birthDate, { message: 'Дата рождения обязательна' });

      // Валидация возраста
      validate(path.personalData_birthDate, (ctx) => {
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

        return null;
      });

      required(path.personalData_gender, { message: 'Выберите пол' });
      required(path.personalData_birthPlace, { message: 'Место рождения обязательно' });
      minLength(path.personalData_birthPlace, 5, { message: 'Минимум 5 символов' });

      // Валидация паспортных данных
      required(path.passportData_series, { message: 'Серия паспорта обязательна' });
      pattern(path.passportData_series, /^\d{2}\s\d{2}$/, {
        message: 'Формат: 00 00',
      });

      required(path.passportData_number, { message: 'Номер паспорта обязателен' });
      pattern(path.passportData_number, /^\d{6}$/, {
        message: 'Номер должен содержать 6 цифр',
      });

      required(path.passportData_issueDate, { message: 'Дата выдачи обязательна' });

      // Валидация даты выдачи паспорта
      validate(path.passportData_issueDate, (ctx) => {
        const issueDate = new Date(ctx.value());
        const today = new Date();

        if (issueDate > today) {
          return {
            code: 'issueDateInFuture',
            message: 'Дата выдачи не может быть в будущем',
          };
        }

        return null;
      });

      required(path.passportData_issuedBy, { message: 'Кем выдан обязательно' });
      minLength(path.passportData_issuedBy, 10, { message: 'Минимум 10 символов' });

      required(path.passportData_departmentCode, { message: 'Код подразделения обязателен' });
      pattern(path.passportData_departmentCode, /^\d{3}-\d{3}$/, {
        message: 'Формат: 000-000',
      });

      // Валидация ИНН
      required(path.inn, { message: 'ИНН обязателен' });
      pattern(path.inn, /^\d{12}$/, {
        message: 'ИНН должен содержать 12 цифр',
      });

      // Валидация СНИЛС
      required(path.snils, { message: 'СНИЛС обязателен' });
      pattern(path.snils, /^\d{3}-\d{3}-\d{3}\s\d{2}$/, {
        message: 'Формат СНИЛС: 000-000-000 00',
      });
    }
  );

  // ============================================================================
  // ШАГ 3: Контактная информация
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step === 3,
    (path) => {
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
    }
  );

  // ============================================================================
  // ШАГ 4: Информация о занятости
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step === 4,
    (path) => {
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
    }
  );

  // ============================================================================
  // ШАГ 5: Дополнительная информация
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step === 5,
    (path) => {
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
          validate(path.properties as any, (ctx) => {
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
            return null;
          });
        }
      );

      // Валидация созаемщиков
      applyWhen(
        path.hasCoBorrower,
        (value) => value === true,
        (path) => {
          validate(path.coBorrowers as any, (ctx) => {
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
    }
  );

  // ============================================================================
  // ШАГ 6: Согласия и подтверждение
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step === 6,
    (path) => {
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
          const phone = ctx.getField('phoneMain');

          // Проверяем только если код полностью введен
          if (!code || code.length !== 6) return null;

          // Вызов API для проверки кода
          // В реальном приложении здесь должен быть вызов API
          // const isValid = await verifySmsCode(phone, code);
          // if (!isValid) {
          //   return { code: 'invalidSmsCode', message: 'Неверный код подтверждения' };
          // }

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
    }
  );
};

export default creditApplicationValidation;
