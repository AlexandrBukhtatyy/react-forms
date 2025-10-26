/**
 * Создание формы кредитной заявки
 *
 * Функция создаёт GroupNode с полной схемой формы, включая:
 * - 6 шагов заполнения
 * - Вложенные формы (personalData, passportData, addresses)
 * - Массивы форм (properties, existingLoans, coBorrowers)
 */

import type { GroupNodeWithControls } from '@/lib/forms';
import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { Input, Select, Textarea, Checkbox, RadioGroup, InputMask } from '@/lib/forms/components';
import {
  LOAN_TYPES,
  EMPLOYMENT_STATUSES,
  MARITAL_STATUSES,
  EDUCATIONS,
} from '../constants/credit-application';
import { personalDataSchema } from '../components/nested-forms/PersonalDataForm';
import { passportDataSchema } from '../components/nested-forms/PassportDataForm';
import { addressFormSchema } from '../components/nested-forms/AddressForm';
import { propertyFormSchema } from '../components/nested-forms/PropertyForm';
import { existingLoansFormSchema } from '../components/nested-forms/ExistingLoanForm';
import { coBorrowersFormSchema } from '../components/nested-forms/CoBorrowerForm';



import type { CreditApplicationForm } from '../types/credit-application';
import creditApplicationValidation from '../validation/credit-application-validation';

export const createCreditApplicationForm = (): GroupNodeWithControls<CreditApplicationForm> => {
  const schema = {
    // ========================================================================
    // Мета-данные формы
    // ========================================================================

    currentStep: {
      value: 1,
      component: () => null,
    },

    completedSteps: {
      value: [] as number[],
      component: () => null,
    },

    // ========================================================================
    // Шаг 1: Основная информация
    // ========================================================================

    loanType: {
      value: 'consumer',
      component: Select,
      componentProps: {
        label: 'Тип кредита',
        placeholder: 'Выберите тип кредита',
        options: LOAN_TYPES,
      },
    },

    loanAmount: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Сумма кредита (₽)',
        placeholder: 'Введите сумму',
        type: 'number',
        min: 50000,
        max: 10000000,
        step: 10000,
      },
    },

    loanTerm: {
      value: 12,
      component: Input,
      componentProps: {
        label: 'Срок кредита (месяцев)',
        placeholder: 'Введите срок',
        type: 'number',
        min: 6,
        max: 240,
      },
    },

    loanPurpose: {
      value: '',
      component: Textarea,
      componentProps: {
        label: 'Цель кредита',
        placeholder: 'Опишите, на что планируете потратить средства',
        rows: 4,
        maxLength: 500,
      },
    },

    // Условные поля для ипотеки
    propertyValue: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Стоимость недвижимости (₽)',
        placeholder: 'Введите стоимость',
        type: 'number',
        min: 1000000,
        step: 100000,
      },
    },

    initialPayment: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Первоначальный взнос (₽)',
        placeholder: 'Введите сумму',
        type: 'number',
        min: 0,
        step: 10000,
      },
    },

    // Условные поля для автокредита
    carBrand: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Марка автомобиля',
        placeholder: 'Например: Toyota',
      },
    },

    carModel: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Модель автомобиля',
        placeholder: 'Например: Camry',
      },
    },

    carYear: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Год выпуска',
        placeholder: '2020',
        type: 'number',
        min: 2000,
        max: new Date().getFullYear() + 1,
      },
    },

    carPrice: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Стоимость автомобиля (₽)',
        placeholder: 'Введите стоимость',
        type: 'number',
        min: 300000,
        step: 10000,
      },
    },

    // ========================================================================
    // Шаг 2: Персональные данные (ВЛОЖЕННЫЕ ФОРМЫ!)
    // ========================================================================

    personalData: personalDataSchema,

    passportData: passportDataSchema,

    // Дополнительные документы
    inn: {
      value: '',
      component: InputMask,
      componentProps: {
        label: 'ИНН',
        placeholder: '123456789012',
        mask: '999999999999',
      },
    },

    snils: {
      value: '',
      component: InputMask,
      componentProps: {
        label: 'СНИЛС',
        placeholder: '123-456-789 00',
        mask: '999-999-999 99',
      },
    },

    // ========================================================================
    // Шаг 3: Контактная информация
    // ========================================================================

    phoneMain: {
      value: '',
      component: InputMask,
      componentProps: {
        label: 'Основной телефон',
        placeholder: '+7 (___) ___-__-__',
        mask: '+7 (999) 999-99-99',
      },
    },

    phoneAdditional: {
      value: undefined,
      component: InputMask,
      componentProps: {
        label: 'Дополнительный телефон',
        placeholder: '+7 (___) ___-__-__',
        mask: '+7 (999) 999-99-99',
      },
    },

    email: {
      value: '',
      component: Input,
      componentProps: {
        label: 'Email',
        placeholder: 'example@mail.com',
        type: 'email',
      },
    },

    emailAdditional: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Дополнительный email',
        placeholder: 'example@mail.com',
        type: 'email',
      },
    },

    // Адрес регистрации (вложенная форма)
    registrationAddress: addressFormSchema,

    sameAsRegistration: {
      value: true,
      component: Checkbox,
      componentProps: {
        label: 'Адрес проживания совпадает с адресом регистрации',
      },
    },

    // Адрес проживания (условная вложенная форма)
    residenceAddress: addressFormSchema,

    // ========================================================================
    // Шаг 4: Информация о занятости
    // ========================================================================

    employmentStatus: {
      value: 'employed',
      component: RadioGroup,
      componentProps: {
        label: 'Статус занятости',
        options: EMPLOYMENT_STATUSES,
      },
    },

    companyName: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Название компании',
        placeholder: 'Введите название',
      },
    },

    companyInn: {
      value: undefined,
      component: InputMask,
      componentProps: {
        label: 'ИНН компании',
        placeholder: '1234567890',
        mask: '9999999999',
      },
    },

    companyPhone: {
      value: undefined,
      component: InputMask,
      componentProps: {
        label: 'Телефон компании',
        placeholder: '+7 (___) ___-__-__',
        mask: '+7 (999) 999-99-99',
      },
    },

    companyAddress: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Адрес компании',
        placeholder: 'Полный адрес',
      },
    },

    position: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Должность',
        placeholder: 'Ваша должность',
      },
    },

    workExperienceTotal: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Общий стаж работы (месяцев)',
        placeholder: '0',
        type: 'number',
        min: 0,
      },
    },

    workExperienceCurrent: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Стаж на текущем месте (месяцев)',
        placeholder: '0',
        type: 'number',
        min: 0,
      },
    },

    monthlyIncome: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Ежемесячный доход (₽)',
        placeholder: '0',
        type: 'number',
        min: 10000,
        step: 1000,
      },
    },

    additionalIncome: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Дополнительный доход (₽)',
        placeholder: '0',
        type: 'number',
        min: 0,
        step: 1000,
      },
    },

    additionalIncomeSource: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Источник дополнительного дохода',
        placeholder: 'Опишите источник',
      },
    },

    businessType: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Тип бизнеса',
        placeholder: 'ИП, ООО и т.д.',
      },
    },

    businessInn: {
      value: undefined,
      component: InputMask,
      componentProps: {
        label: 'ИНН ИП',
        placeholder: '123456789012',
        mask: '999999999999',
      },
    },

    businessActivity: {
      value: undefined,
      component: Textarea,
      componentProps: {
        label: 'Вид деятельности',
        placeholder: 'Опишите вид деятельности',
        rows: 3,
      },
    },

    // ========================================================================
    // Шаг 5: Дополнительная информация
    // ========================================================================

    maritalStatus: {
      value: 'single',
      component: RadioGroup,
      componentProps: {
        label: 'Семейное положение',
        options: MARITAL_STATUSES,
      },
    },

    dependents: {
      value: 0,
      component: Input,
      componentProps: {
        label: 'Количество иждивенцев',
        placeholder: '0',
        type: 'number',
        min: 0,
        max: 10,
      },
    },

    education: {
      value: 'higher',
      component: Select,
      componentProps: {
        label: 'Образование',
        placeholder: 'Выберите уровень образования',
        options: EDUCATIONS,
      },
    },

    hasProperty: {
      value: false,
      component: Checkbox,
      componentProps: {
        label: 'У меня есть имущество',
      },
    },

    // Массив форм: Имущество
    properties: [
      propertyFormSchema
    ],

    hasExistingLoans: {
      value: false,
      component: Checkbox,
      componentProps: {
        label: 'У меня есть другие кредиты',
      },
    },

    // Массив форм: Существующие кредиты
    existingLoans: [
      existingLoansFormSchema
    ],

    hasCoBorrower: {
      value: false,
      component: Checkbox,
      componentProps: {
        label: 'Добавить созаемщика',
      },
    },

    // Массив форм: Созаемщики (с вложенной группой personalData)
    coBorrowers: [
      coBorrowersFormSchema
    ],

    // ========================================================================
    // Шаг 6: Согласия
    // ========================================================================

    agreePersonalData: {
      value: false,
      component: Checkbox,
      componentProps: {
        label: 'Согласие на обработку персональных данных',
      },
    },

    agreeCreditHistory: {
      value: false,
      component: Checkbox,
      componentProps: {
        label: 'Согласие на проверку кредитной истории',
      },
    },

    agreeMarketing: {
      value: false,
      component: Checkbox,
      componentProps: {
        label: 'Согласие на получение маркетинговых материалов',
      },
    },

    agreeTerms: {
      value: false,
      component: Checkbox,
      componentProps: {
        label: 'Согласие с условиями кредитования',
      },
    },

    confirmAccuracy: {
      value: false,
      component: Checkbox,
      componentProps: {
        label: 'Подтверждаю точность введенных данных',
      },
    },

    electronicSignature: {
      value: '',
      component: InputMask,
      componentProps: {
        label: 'Код подтверждения из СМС',
        placeholder: '123456',
        mask: '999999',
      },
    },
  };

  const form = new GroupNode(schema as any);

  form.applyValidationSchema(creditApplicationValidation);

  return form;
};
