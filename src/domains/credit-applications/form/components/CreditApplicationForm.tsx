import { useState } from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { FormStore } from '@/lib/forms/core/form-store';
import type { FormSchema } from '@/lib/forms/types';
import { Input, Select, Textarea, Checkbox, RadioGroup, InputMask } from '@/lib/forms/components';
import { StepIndicator } from './StepIndicator';
import { NavigationButtons } from './NavigationButtons';
import {
  Step1BasicInfo,
  Step2PersonalData,
  Step3ContactInfo,
  Step4Employment,
  Step5Additional,
  Step6Confirmation,
} from './steps';
import type { CreditApplicationForm as CreditApplicationFormModel } from '../../_shared/types/credit-application';
import {
  LOAN_TYPES,
  EMPLOYMENT_STATUSES,
  MARITAL_STATUSES,
  EDUCATIONS,
  GENDERS,
} from '../../_shared/constants/credit-application';
import creditApplicationValidation from '../schema/credit-application-validation';

// ============================================================================
// Создание схемы формы
// ============================================================================

const createCreditApplicationForm = () => {
  const schema: FormSchema<CreditApplicationFormModel> = {
    // Метаданные формы
    currentStep: {
      value: 1,
      component: () => null,
      componentProps: {},
    },
    completedSteps: {
      value: [],
      component: () => null,
      componentProps: {},
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

    // Специфичные поля для ипотеки
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

    // Специфичные поля для автокредита
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
    // Шаг 2: Персональные данные
    // ========================================================================

    // Личные данные
    personalData_lastName: {
      value: '',
      component: Input,
      componentProps: {
        label: 'Фамилия',
        placeholder: 'Введите фамилию',
      },
    },

    personalData_firstName: {
      value: '',
      component: Input,
      componentProps: {
        label: 'Имя',
        placeholder: 'Введите имя',
      },
    },

    personalData_middleName: {
      value: '',
      component: Input,
      componentProps: {
        label: 'Отчество',
        placeholder: 'Введите отчество',
      },
    },

    personalData_birthDate: {
      value: '',
      component: Input,
      componentProps: {
        label: 'Дата рождения',
        type: 'date',
      },
    },

    personalData_gender: {
      value: 'male',
      component: RadioGroup,
      componentProps: {
        label: 'Пол',
        options: GENDERS,
      },
    },

    personalData_birthPlace: {
      value: '',
      component: Input,
      componentProps: {
        label: 'Место рождения',
        placeholder: 'Введите место рождения',
      },
    },

    // Паспортные данные
    passportData_series: {
      value: '',
      component: InputMask,
      componentProps: {
        label: 'Серия паспорта',
        placeholder: '00 00',
        mask: '99 99',
      },
    },

    passportData_number: {
      value: '',
      component: InputMask,
      componentProps: {
        label: 'Номер паспорта',
        placeholder: '000000',
        mask: '999999',
      },
    },

    passportData_issueDate: {
      value: '',
      component: Input,
      componentProps: {
        label: 'Дата выдачи',
        type: 'date',
      },
    },

    passportData_issuedBy: {
      value: '',
      component: Textarea,
      componentProps: {
        label: 'Кем выдан',
        placeholder: 'Введите наименование органа',
        rows: 3,
      },
    },

    passportData_departmentCode: {
      value: '',
      component: InputMask,
      componentProps: {
        label: 'Код подразделения',
        placeholder: '000-000',
        mask: '999-999',
      },
    },

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

    // Заглушки для обратной совместимости с типами
    personalData: {
      value: {
        lastName: '',
        firstName: '',
        middleName: '',
        birthDate: '',
        birthPlace: '',
        gender: 'male',
      },
      component: () => null,
      componentProps: {},
    },

    passportData: {
      value: {
        series: '',
        number: '',
        issueDate: '',
        issuedBy: '',
        departmentCode: '',
      },
      component: () => null,
      componentProps: {},
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

    // Адрес регистрации
    registrationAddress_region: {
      value: '',
      component: Input,
      componentProps: {
        label: 'Регион',
        placeholder: 'Введите регион',
      },
    },

    registrationAddress_city: {
      value: '',
      component: Input,
      componentProps: {
        label: 'Город',
        placeholder: 'Введите город',
      },
    },

    registrationAddress_street: {
      value: '',
      component: Input,
      componentProps: {
        label: 'Улица',
        placeholder: 'Введите улицу',
      },
    },

    registrationAddress_house: {
      value: '',
      component: Input,
      componentProps: {
        label: 'Дом',
        placeholder: '№',
      },
    },

    registrationAddress_apartment: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Квартира',
        placeholder: '№',
      },
    },

    registrationAddress_postalCode: {
      value: '',
      component: InputMask,
      componentProps: {
        label: 'Индекс',
        placeholder: '000000',
        mask: '999999',
      },
    },

    sameAsRegistration: {
      value: true,
      component: Checkbox,
      componentProps: {
        label: 'Адрес проживания совпадает с адресом регистрации',
      },
    },

    // Адрес проживания (условные поля)
    residenceAddress_region: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Регион',
        placeholder: 'Введите регион',
      },
    },

    residenceAddress_city: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Город',
        placeholder: 'Введите город',
      },
    },

    residenceAddress_street: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Улица',
        placeholder: 'Введите улицу',
      },
    },

    residenceAddress_house: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Дом',
        placeholder: '№',
      },
    },

    residenceAddress_apartment: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Квартира',
        placeholder: '№',
      },
    },

    residenceAddress_postalCode: {
      value: undefined,
      component: InputMask,
      componentProps: {
        label: 'Индекс',
        placeholder: '000000',
        mask: '999999',
      },
    },

    // Заглушки для обратной совместимости с типами
    registrationAddress: {
      value: {
        region: '',
        city: '',
        street: '',
        house: '',
        apartment: undefined,
        postalCode: '',
      },
      component: () => null,
      componentProps: {},
    },

    residenceAddress: {
      value: undefined,
      component: () => null,
      componentProps: {},
    },

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

    properties: {
      value: undefined,
      component: () => null,
      componentProps: {},
    },

    hasExistingLoans: {
      value: false,
      component: Checkbox,
      componentProps: {
        label: 'У меня есть другие кредиты',
      },
    },

    existingLoans: {
      value: undefined,
      component: () => null,
      componentProps: {},
    },

    hasCoBorrower: {
      value: false,
      component: Checkbox,
      componentProps: {
        label: 'Добавить созаемщика',
      },
    },

    coBorrowers: {
      value: undefined,
      component: () => null,
      componentProps: {},
    },

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
  } as any; // Используем 'as any' из-за вложенных объектов

  const form = new FormStore(schema);

  // Применяем validation schema
  form.applyValidationSchema(creditApplicationValidation);

  return form;
};

// ============================================================================
// Компонент формы
// ============================================================================

function CreditApplicationForm() {
  useSignals();

  // Создаем форму при инициализации компонента
  const [form] = useState(() => createCreditApplicationForm());

  // Текущий шаг (reactive через signals)
  const currentStep = form.controls.currentStep.value;
  const completedSteps = form.controls.completedSteps.value;

  // ============================================================================
  // Навигация между шагами
  // ============================================================================

  const goToNextStep = async () => {
    console.log('🔍 Attempting to go to next step. Current step:', currentStep);

    // Валидируем текущий шаг
    const isValid = await form.validate();
    console.log('✅ Validation result:', isValid);

    if (!isValid) {
      // Показываем ошибки
      console.warn('❌ Validation failed. Marking all as touched.');

      // Логируем ошибки для отладки
      form.fields.forEach((field, key) => {
        if (field.errors.length > 0) {
          console.error(`Field "${String(key)}" has errors:`, field.errors);
        }
      });

      form.markAllAsTouched();
      return;
    }

    // Переходим на следующий шаг
    const nextStep = Math.min(currentStep + 1, 6);
    console.log('✨ Moving to step:', nextStep);
    form.controls.currentStep.setValue(nextStep);

    // Добавляем текущий шаг в список завершенных
    if (!completedSteps.includes(currentStep)) {
      form.controls.completedSteps.setValue([...completedSteps, currentStep]);
    }

    // Скроллим наверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousStep = () => {
    const previousStep = Math.max(currentStep - 1, 1);
    form.controls.currentStep.setValue(previousStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToStep = (step: number) => {
    // Можно перейти только на завершенный шаг или следующий после последнего завершенного
    const canGoTo = step === 1 || completedSteps.includes(step - 1);

    if (canGoTo) {
      form.controls.currentStep.setValue(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ============================================================================
  // Отправка формы
  // ============================================================================

  const submitApplication = async () => {
    const isValid = await form.validate();

    if (!isValid) {
      form.markAllAsTouched();
      alert('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    try {
      const values = form.value;
      console.log('Отправка формы:', values);

      // Здесь будет реальная отправка на сервер
      // const response = await fetch('/api/credit-applications', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(values),
      // });

      alert('Заявка успешно отправлена!');
    } catch (error) {
      alert('Произошла ошибка при отправке заявки');
      console.error(error);
    }
  };

  // ============================================================================
  // Рендер
  // ============================================================================

  return (
    <div className="w-full">
      {/* Индикатор шагов */}
      <StepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={goToStep}
      />

      {/* Форма текущего шага */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        {currentStep === 1 && <Step1BasicInfo form={form} />}
        {currentStep === 2 && <Step2PersonalData form={form} />}
        {currentStep === 3 && <Step3ContactInfo form={form} />}
        {currentStep === 4 && <Step4Employment form={form} />}
        {currentStep === 5 && <Step5Additional form={form} />}
        {currentStep === 6 && <Step6Confirmation form={form} />}
      </div>

      {/* Кнопки навигации */}
      <NavigationButtons
        currentStep={currentStep}
        onPrevious={goToPreviousStep}
        onNext={goToNextStep}
        onSubmit={submitApplication}
        isSubmitting={form.submitting}
      />

      {/* Информация о прогрессе */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Шаг {currentStep} из 6 • {Math.round((currentStep / 6) * 100)}% завершено
      </div>
    </div>
  );
}

export default CreditApplicationForm;
