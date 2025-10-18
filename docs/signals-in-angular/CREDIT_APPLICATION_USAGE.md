# Использование формы заявки на кредит

> **Часть 3: React компоненты и использование**

## Создание формы

```typescript
import { FormStore } from './lib/forms';
import creditApplicationValidation from './validations/credit-application';
import type { CreditApplicationForm } from './types/credit-application';
import { Input } from './lib/forms/components/input';
import { InputPassword } from './lib/forms/components/input-password';
import { InputNumber } from './lib/forms/components/input-number';
import { InputDate } from './lib/forms/components/input-date';
import { InputPhone } from './lib/forms/components/input-phone';
import { InputEmail } from './lib/forms/components/input-email';
import { InputMask } from './lib/forms/components/input-mask';
import { Textarea } from './lib/forms/components/textarea';
import { Select } from './lib/forms/components/select';
import { Checkbox } from './lib/forms/components/checkbox';
import { RadioGroup } from './lib/forms/components/radio-group';

// ============================================================================
// Создание инстанса формы
// ============================================================================

export function createCreditApplicationForm() {
  const form = new FormStore<CreditApplicationForm>(
    {
      // Метаданные
      currentStep: {
        value: 1,
        component: () => null
      },
      completedSteps: {
        value: [],
        component: () => null
      },

      // ============================================================================
      // Шаг 1: Основная информация
      // ============================================================================

      loanType: {
        value: 'consumer' as const,
        component: Select,
        componentProps: {
          label: 'Тип кредита',
          placeholder: 'Выберите тип кредита',
          options: [
            { value: 'consumer', label: 'Потребительский кредит' },
            { value: 'mortgage', label: 'Ипотека' },
            { value: 'car', label: 'Автокредит' },
            { value: 'business', label: 'Кредит для бизнеса' },
            { value: 'refinancing', label: 'Рефинансирование' },
          ],
        },
      },

      loanAmount: {
        value: 0,
        component: InputNumber,
        componentProps: {
          label: 'Сумма кредита',
          placeholder: 'Введите сумму',
          hint: 'От 50 000 до 10 000 000 ₽',
          min: 50000,
          max: 10000000,
          step: 10000,
        },
      },

      loanTerm: {
        value: 12,
        component: InputNumber,
        componentProps: {
          label: 'Срок кредита (месяцев)',
          placeholder: 'Введите срок',
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
        component: InputNumber,
        componentProps: {
          label: 'Стоимость недвижимости',
          placeholder: 'Введите стоимость',
          min: 1000000,
          step: 100000,
        },
      },

      initialPayment: {
        value: undefined,
        component: InputNumber,
        componentProps: {
          label: 'Первоначальный взнос',
          placeholder: 'Введите сумму',
          hint: 'Минимум 10% от стоимости недвижимости',
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
        component: InputNumber,
        componentProps: {
          label: 'Год выпуска',
          placeholder: '2020',
          min: 2000,
          max: new Date().getFullYear() + 1,
        },
      },

      carPrice: {
        value: undefined,
        component: InputNumber,
        componentProps: {
          label: 'Стоимость автомобиля',
          placeholder: 'Введите стоимость',
          min: 300000,
          step: 10000,
        },
      },

      // ============================================================================
      // Шаг 2: Персональные данные
      // ============================================================================

      lastName: {
        value: '',
        component: Input,
        componentProps: {
          label: 'Фамилия',
          placeholder: 'Введите фамилию',
        },
      },

      firstName: {
        value: '',
        component: Input,
        componentProps: {
          label: 'Имя',
          placeholder: 'Введите имя',
        },
      },

      middleName: {
        value: '',
        component: Input,
        componentProps: {
          label: 'Отчество',
          placeholder: 'Введите отчество',
        },
      },

      birthDate: {
        value: '',
        component: InputDate,
        componentProps: {
          label: 'Дата рождения',
          placeholder: 'дд.мм.гггг',
        },
      },

      birthPlace: {
        value: '',
        component: Input,
        componentProps: {
          label: 'Место рождения',
          placeholder: 'Город, страна',
        },
      },

      gender: {
        value: 'male' as const,
        component: RadioGroup,
        componentProps: {
          label: 'Пол',
          options: [
            { value: 'male', label: 'Мужской' },
            { value: 'female', label: 'Женский' },
          ],
        },
      },

      passportSeries: {
        value: '',
        component: InputMask,
        componentProps: {
          label: 'Серия паспорта',
          placeholder: '1234',
          mask: '9999',
        },
      },

      passportNumber: {
        value: '',
        component: InputMask,
        componentProps: {
          label: 'Номер паспорта',
          placeholder: '123456',
          mask: '999999',
        },
      },

      passportIssueDate: {
        value: '',
        component: InputDate,
        componentProps: {
          label: 'Дата выдачи паспорта',
          placeholder: 'дд.мм.гггг',
        },
      },

      passportIssuedBy: {
        value: '',
        component: Input,
        componentProps: {
          label: 'Кем выдан',
          placeholder: 'Наименование органа',
        },
      },

      passportDepartmentCode: {
        value: '',
        component: InputMask,
        componentProps: {
          label: 'Код подразделения',
          placeholder: '123-456',
          mask: '999-999',
        },
      },

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

      // ============================================================================
      // Шаг 3: Контактная информация
      // ============================================================================

      phoneMain: {
        value: '',
        component: InputPhone,
        componentProps: {
          label: 'Основной телефон',
          placeholder: '+7 (___) ___-__-__',
        },
      },

      phoneAdditional: {
        value: undefined,
        component: InputPhone,
        componentProps: {
          label: 'Дополнительный телефон',
          placeholder: '+7 (___) ___-__-__',
        },
      },

      email: {
        value: '',
        component: InputEmail,
        componentProps: {
          label: 'Email',
          placeholder: 'example@mail.com',
        },
      },

      emailAdditional: {
        value: undefined,
        component: InputEmail,
        componentProps: {
          label: 'Дополнительный email',
          placeholder: 'example@mail.com',
        },
      },

      // Адрес регистрации
      registrationRegion: {
        value: '',
        component: Select,
        componentProps: {
          label: 'Регион (регистрация)',
          placeholder: 'Выберите регион',
          // options будут загружены динамически
        },
      },

      registrationCity: {
        value: '',
        component: Input,
        componentProps: {
          label: 'Город (регистрация)',
          placeholder: 'Введите город',
        },
      },

      registrationStreet: {
        value: '',
        component: Input,
        componentProps: {
          label: 'Улица (регистрация)',
          placeholder: 'Введите улицу',
        },
      },

      registrationHouse: {
        value: '',
        component: Input,
        componentProps: {
          label: 'Дом (регистрация)',
          placeholder: '1',
        },
      },

      registrationApartment: {
        value: undefined,
        component: Input,
        componentProps: {
          label: 'Квартира (регистрация)',
          placeholder: '1',
        },
      },

      registrationPostalCode: {
        value: '',
        component: InputMask,
        componentProps: {
          label: 'Индекс (регистрация)',
          placeholder: '123456',
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

      // Адрес проживания
      residenceRegion: {
        value: undefined,
        component: Select,
        componentProps: {
          label: 'Регион (проживание)',
          placeholder: 'Выберите регион',
        },
      },

      residenceCity: {
        value: undefined,
        component: Input,
        componentProps: {
          label: 'Город (проживание)',
          placeholder: 'Введите город',
        },
      },

      residenceStreet: {
        value: undefined,
        component: Input,
        componentProps: {
          label: 'Улица (проживание)',
          placeholder: 'Введите улицу',
        },
      },

      residenceHouse: {
        value: undefined,
        component: Input,
        componentProps: {
          label: 'Дом (проживание)',
          placeholder: '1',
        },
      },

      residenceApartment: {
        value: undefined,
        component: Input,
        componentProps: {
          label: 'Квартира (проживание)',
          placeholder: '1',
        },
      },

      residencePostalCode: {
        value: undefined,
        component: InputMask,
        componentProps: {
          label: 'Индекс (проживание)',
          placeholder: '123456',
          mask: '999999',
        },
      },

      // ============================================================================
      // Шаг 4: Информация о занятости
      // ============================================================================

      employmentStatus: {
        value: 'employed' as const,
        component: RadioGroup,
        componentProps: {
          label: 'Статус занятости',
          options: [
            { value: 'employed', label: 'Работаю по найму' },
            { value: 'selfEmployed', label: 'Индивидуальный предприниматель' },
            { value: 'unemployed', label: 'Не работаю' },
            { value: 'retired', label: 'Пенсионер' },
            { value: 'student', label: 'Студент' },
          ],
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
        component: InputPhone,
        componentProps: {
          label: 'Телефон компании',
          placeholder: '+7 (___) ___-__-__',
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
        component: InputNumber,
        componentProps: {
          label: 'Общий стаж работы (месяцев)',
          placeholder: '0',
          min: 0,
        },
      },

      workExperienceCurrent: {
        value: undefined,
        component: InputNumber,
        componentProps: {
          label: 'Стаж на текущем месте (месяцев)',
          placeholder: '0',
          min: 0,
        },
      },

      monthlyIncome: {
        value: 0,
        component: InputNumber,
        componentProps: {
          label: 'Ежемесячный доход',
          placeholder: '0',
          min: 10000,
          step: 1000,
        },
      },

      additionalIncome: {
        value: undefined,
        component: InputNumber,
        componentProps: {
          label: 'Дополнительный доход',
          placeholder: '0',
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

      // ============================================================================
      // Шаг 5: Дополнительная информация
      // ============================================================================

      maritalStatus: {
        value: 'single' as const,
        component: RadioGroup,
        componentProps: {
          label: 'Семейное положение',
          options: [
            { value: 'single', label: 'Холост/Не замужем' },
            { value: 'married', label: 'Женат/Замужем' },
            { value: 'divorced', label: 'Разведен(а)' },
            { value: 'widowed', label: 'Вдовец/Вдова' },
          ],
        },
      },

      dependents: {
        value: 0,
        component: InputNumber,
        componentProps: {
          label: 'Количество иждивенцев',
          placeholder: '0',
          min: 0,
          max: 10,
        },
      },

      education: {
        value: 'higher' as const,
        component: Select,
        componentProps: {
          label: 'Образование',
          placeholder: 'Выберите уровень образования',
          options: [
            { value: 'secondary', label: 'Среднее' },
            { value: 'specialized', label: 'Среднее специальное' },
            { value: 'higher', label: 'Высшее' },
            { value: 'postgraduate', label: 'Послевузовское' },
          ],
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
        component: PropertyListComponent,
        componentProps: {
          label: 'Имущество',
        },
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
        component: ExistingLoansComponent,
        componentProps: {
          label: 'Существующие кредиты',
        },
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
        component: CoBorrowersComponent,
        componentProps: {
          label: 'Созаемщики',
        },
      },

      // ============================================================================
      // Шаг 6: Согласия
      // ============================================================================

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
    },
    creditApplicationValidation
  );

  return form;
}
```

---

## React компоненты

### Главный компонент формы

```typescript
import React, { useState } from 'react';
import { createCreditApplicationForm } from './form-factory';
import { StepIndicator } from './components/StepIndicator';
import { Step1BasicInfo } from './components/Step1BasicInfo';
import { Step2PersonalData } from './components/Step2PersonalData';
import { Step3ContactInfo } from './components/Step3ContactInfo';
import { Step4Employment } from './components/Step4Employment';
import { Step5Additional } from './components/Step5Additional';
import { Step6Confirmation } from './components/Step6Confirmation';
import { NavigationButtons } from './components/NavigationButtons';

export function CreditApplicationPage() {
  // Создаем форму при инициализации компонента
  const [form] = useState(() => createCreditApplicationForm());

  // Текущий шаг (reactive через signals)
  const currentStep = form.controls.currentStep.value;

  // ============================================================================
  // Навигация между шагами
  // ============================================================================

  const goToNextStep = async () => {
    // Валидируем текущий шаг
    const isValid = await form.validate();

    if (!isValid) {
      // Показываем ошибки
      form.markAllAsTouched();
      return;
    }

    // Переходим на следующий шаг
    const nextStep = Math.min(currentStep + 1, 6);
    form.controls.currentStep.setValue(nextStep);

    // Добавляем текущий шаг в список завершенных
    const completedSteps = form.controls.completedSteps.value;
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
    const completedSteps = form.controls.completedSteps.value;

    // Можно перейти только на завершенный шаг или следующий после последнего завершенного
    const canGoTo =
      step === 1 ||
      completedSteps.includes(step - 1) ||
      step <= Math.max(...completedSteps) + 1;

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
      const result = await form.submit(async (values) => {
        const response = await fetch('/api/credit-applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          throw new Error('Ошибка отправки заявки');
        }

        return await response.json();
      });

      if (result) {
        alert(`Заявка успешно отправлена! Номер: ${result.applicationNumber}`);
        // Перенаправляем на страницу успеха
        window.location.href = `/applications/${result.id}`;
      }
    } catch (error) {
      alert('Произошла ошибка при отправке заявки. Попробуйте еще раз.');
      console.error(error);
    }
  };

  // ============================================================================
  // Сохранение черновика
  // ============================================================================

  const saveDraft = async () => {
    try {
      const values = form.getValue();

      await fetch('/api/credit-applications/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      alert('Черновик сохранен');
    } catch (error) {
      alert('Не удалось сохранить черновик');
    }
  };

  // ============================================================================
  // Рендер
  // ============================================================================

  return (
    <div className="credit-application">
      <div className="container">
        <h1>Заявка на кредит</h1>

        {/* Индикатор шагов */}
        <StepIndicator
          currentStep={currentStep}
          completedSteps={form.controls.completedSteps.value}
          onStepClick={goToStep}
        />

        {/* Форма текущего шага */}
        <div className="form-content">
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
          onSaveDraft={saveDraft}
          isSubmitting={form.submitting}
        />

        {/* Информация о прогрессе */}
        <div className="progress-info">
          <p>
            Шаг {currentStep} из 6 •{' '}
            {Math.round((currentStep / 6) * 100)}% завершено
          </p>
          <button onClick={saveDraft} className="link-button">
            Сохранить черновик
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Компонент шага 1: Основная информация

```typescript
import React from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { FormStore } from '../lib/forms';
import { FormField } from '../lib/forms/components/form-field';
import type { CreditApplicationForm } from '../types/credit-application';

interface Step1Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step1BasicInfo({ form }: Step1Props) {
  useSignals();

  const loanType = form.controls.loanType.value;

  return (
    <div className="form-step">
      <h2>Основная информация о кредите</h2>

      {/* Тип кредита */}
      <FormField control={form.controls.loanType} />

      {/* Сумма кредита */}
      <FormField control={form.controls.loanAmount} />

      {/* Срок кредита */}
      <FormField control={form.controls.loanTerm} />

      {/* Цель кредита */}
      <FormField control={form.controls.loanPurpose} />

      {/* Специфичные поля для ипотеки */}
      {loanType === 'mortgage' && (
        <>
          <h3>Информация о недвижимости</h3>
          <FormField control={form.controls.propertyValue!} />
          <FormField control={form.controls.initialPayment!} />
        </>
      )}

      {/* Специфичные поля для автокредита */}
      {loanType === 'car' && (
        <>
          <h3>Информация об автомобиле</h3>
          <FormField control={form.controls.carBrand!} />
          <FormField control={form.controls.carModel!} />

          <div className="form-row">
            <FormField control={form.controls.carYear!} />
            <FormField control={form.controls.carPrice!} />
          </div>
        </>
      )}

      {/* Расчет примерного платежа */}
      {form.controls.loanAmount.value > 0 && form.controls.loanTerm.value > 0 && (
        <div className="payment-estimate">
          <h4>Примерный ежемесячный платеж</h4>
          <p className="payment-amount">
            {calculateMonthlyPayment(
              form.controls.loanAmount.value,
              form.controls.loanTerm.value,
              loanType
            ).toLocaleString()}{' '}
            ₽
          </p>
          <p className="payment-note">
            Окончательная ставка и платеж будут рассчитаны после рассмотрения
            заявки
          </p>
        </div>
      )}
    </div>
  );
}

// Вспомогательная функция для расчета платежа
function calculateMonthlyPayment(
  amount: number,
  term: number,
  type: string
): number {
  const rateMap: Record<string, number> = {
    consumer: 0.15,
    mortgage: 0.10,
    car: 0.12,
    business: 0.18,
    refinancing: 0.13,
  };

  const annualRate = rateMap[type] || 0.15;
  const monthlyRate = annualRate / 12;

  const payment =
    amount *
    (monthlyRate * Math.pow(1 + monthlyRate, term)) /
    (Math.pow(1 + monthlyRate, term) - 1);

  return Math.round(payment);
}
```

### Компонент шага 2: Персональные данные

```typescript
import React from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { FormStore } from '../lib/forms';
import { FormField } from '../lib/forms/components/form-field';
import type { CreditApplicationForm } from '../types/credit-application';

interface Step2Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step2PersonalData({ form }: Step2Props) {
  useSignals();

  return (
    <div className="form-step">
      <h2>Персональные данные</h2>

      <h3>ФИО</h3>
      <FormField control={form.controls.lastName} />
      <FormField control={form.controls.firstName} />
      <FormField control={form.controls.middleName} />

      <h3>Основная информация</h3>
      <div className="form-row">
        <FormField control={form.controls.birthDate} />
        <FormField control={form.controls.gender} />
      </div>
      <FormField control={form.controls.birthPlace} />

      <h3>Паспортные данные</h3>
      <div className="form-row">
        <FormField control={form.controls.passportSeries} />
        <FormField control={form.controls.passportNumber} />
      </div>
      <FormField control={form.controls.passportIssueDate} />
      <FormField control={form.controls.passportIssuedBy} />
      <FormField control={form.controls.passportDepartmentCode} />

      <h3>Другие документы</h3>
      <div className="form-row">
        <FormField control={form.controls.inn} />
        <FormField control={form.controls.snils} />
      </div>
    </div>
  );
}
```

### Компонент шага 3: Контактная информация

```typescript
import React from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { FormStore } from '../lib/forms';
import { FormField } from '../lib/forms/components/form-field';
import type { CreditApplicationForm } from '../types/credit-application';

interface Step3Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step3ContactInfo({ form }: Step3Props) {
  useSignals();

  const sameAsRegistration = form.controls.sameAsRegistration.value;

  return (
    <div className="form-step">
      <h2>Контактная информация</h2>

      <h3>Телефоны и Email</h3>
      <div className="form-row">
        <FormField control={form.controls.phoneMain} />
        <FormField control={form.controls.phoneAdditional} />
      </div>
      <div className="form-row">
        <FormField control={form.controls.email} />
        <FormField control={form.controls.emailAdditional} />
      </div>

      <h3>Адрес регистрации</h3>
      <FormField control={form.controls.registrationRegion} />
      <FormField control={form.controls.registrationCity} />
      <FormField control={form.controls.registrationStreet} />
      <div className="form-row">
        <FormField control={form.controls.registrationHouse} />
        <FormField control={form.controls.registrationApartment} />
      </div>
      <FormField control={form.controls.registrationPostalCode} />

      <FormField control={form.controls.sameAsRegistration} />

      {!sameAsRegistration && (
        <>
          <h3>Адрес проживания</h3>
          <FormField control={form.controls.residenceRegion!} />
          <FormField control={form.controls.residenceCity!} />
          <FormField control={form.controls.residenceStreet!} />
          <div className="form-row">
            <FormField control={form.controls.residenceHouse!} />
            <FormField control={form.controls.residenceApartment!} />
          </div>
          <FormField control={form.controls.residencePostalCode!} />
        </>
      )}
    </div>
  );
}
```

### Компонент шага 4: Информация о занятости

```typescript
import React from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { FormStore } from '../lib/forms';
import { FormField } from '../lib/forms/components/form-field';
import type { CreditApplicationForm } from '../types/credit-application';

interface Step4Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step4Employment({ form }: Step4Props) {
  useSignals();

  const employmentStatus = form.controls.employmentStatus.value;

  return (
    <div className="form-step">
      <h2>Информация о занятости</h2>

      <FormField control={form.controls.employmentStatus} />

      {/* Для работающих */}
      {employmentStatus === 'employed' && (
        <>
          <h3>Место работы</h3>
          <FormField control={form.controls.companyName!} />
          <FormField control={form.controls.companyInn!} />
          <FormField control={form.controls.companyPhone!} />
          <FormField control={form.controls.companyAddress!} />
          <FormField control={form.controls.position!} />

          <h3>Стаж работы</h3>
          <div className="form-row">
            <FormField control={form.controls.workExperienceTotal!} />
            <FormField control={form.controls.workExperienceCurrent!} />
          </div>
        </>
      )}

      {/* Для ИП */}
      {employmentStatus === 'selfEmployed' && (
        <>
          <h3>Информация о бизнесе</h3>
          <FormField control={form.controls.businessType!} />
          <FormField control={form.controls.businessInn!} />
          <FormField control={form.controls.businessActivity!} />
        </>
      )}

      <h3>Доход</h3>
      <FormField control={form.controls.monthlyIncome} />
      <FormField control={form.controls.additionalIncome} />
      {form.controls.additionalIncome?.value && (
        <FormField control={form.controls.additionalIncomeSource!} />
      )}
    </div>
  );
}
```

### Компонент шага 5: Дополнительная информация

```typescript
import React from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { FormStore } from '../lib/forms';
import { FormField } from '../lib/forms/components/form-field';
import type { CreditApplicationForm } from '../types/credit-application';

interface Step5Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step5Additional({ form }: Step5Props) {
  useSignals();

  const hasProperty = form.controls.hasProperty.value;
  const hasExistingLoans = form.controls.hasExistingLoans.value;
  const hasCoBorrower = form.controls.hasCoBorrower.value;

  return (
    <div className="form-step">
      <h2>Дополнительная информация</h2>

      <h3>Личная информация</h3>
      <FormField control={form.controls.maritalStatus} />
      <FormField control={form.controls.dependents} />
      <FormField control={form.controls.education} />

      <h3>Имущество</h3>
      <FormField control={form.controls.hasProperty} />
      {hasProperty && <FormField control={form.controls.properties!} />}

      <h3>Кредиты</h3>
      <FormField control={form.controls.hasExistingLoans} />
      {hasExistingLoans && <FormField control={form.controls.existingLoans!} />}

      <h3>Созаемщики</h3>
      <FormField control={form.controls.hasCoBorrower} />
      {hasCoBorrower && <FormField control={form.controls.coBorrowers!} />}
    </div>
  );
}
```

### Компонент шага 6: Подтверждение

```typescript
import React from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { FormStore } from '../lib/forms';
import { FormField } from '../lib/forms/components/form-field';
import type { CreditApplicationForm } from '../types/credit-application';

interface Step6Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step6Confirmation({ form }: Step6Props) {
  useSignals();

  return (
    <div className="form-step">
      <h2>Подтверждение и согласия</h2>

      <div className="agreements-section">
        <h3>Необходимые согласия</h3>
        <FormField control={form.controls.agreePersonalData} />
        <FormField control={form.controls.agreeCreditHistory} />
        <FormField control={form.controls.agreeTerms} />

        <h3>Дополнительно</h3>
        <FormField control={form.controls.agreeMarketing} />
      </div>

      <div className="confirmation-section">
        <h3>Подтверждение</h3>
        <FormField control={form.controls.confirmAccuracy} />
        <FormField control={form.controls.electronicSignature} />

        <div className="info-box">
          <p>
            На указанный номер телефона будет отправлен код подтверждения.
            Введите его в поле выше для завершения подачи заявки.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Компонент навигации

```typescript
import React from 'react';

interface NavigationButtonsProps {
  currentStep: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onSaveDraft: () => void;
  isSubmitting: boolean;
}

export function NavigationButtons({
  currentStep,
  onPrevious,
  onNext,
  onSubmit,
  onSaveDraft,
  isSubmitting,
}: NavigationButtonsProps) {
  return (
    <div className="navigation-buttons">
      {currentStep > 1 && (
        <button
          type="button"
          onClick={onPrevious}
          className="button button-secondary"
          disabled={isSubmitting}
        >
          ← Назад
        </button>
      )}

      <div className="spacer" />

      {currentStep < 6 && (
        <button
          type="button"
          onClick={onNext}
          className="button button-primary"
          disabled={isSubmitting}
        >
          Далее →
        </button>
      )}

      {currentStep === 6 && (
        <button
          type="button"
          onClick={onSubmit}
          className="button button-success"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
        </button>
      )}
    </div>
  );
}
```

### Индикатор шагов

```typescript
import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

const STEPS = [
  { number: 1, title: 'Кредит', icon: '💰' },
  { number: 2, title: 'Данные', icon: '👤' },
  { number: 3, title: 'Контакты', icon: '📞' },
  { number: 4, title: 'Работа', icon: '💼' },
  { number: 5, title: 'Доп. инфо', icon: '📋' },
  { number: 6, title: 'Подтверждение', icon: '✓' },
];

export function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {STEPS.map((step, index) => {
        const isCompleted = completedSteps.includes(step.number);
        const isCurrent = currentStep === step.number;
        const canClick =
          step.number === 1 ||
          completedSteps.includes(step.number - 1) ||
          step.number <= Math.max(...completedSteps, 1) + 1;

        return (
          <React.Fragment key={step.number}>
            <div
              className={`step ${isCurrent ? 'current' : ''} ${
                isCompleted ? 'completed' : ''
              } ${canClick ? 'clickable' : ''}`}
              onClick={() => canClick && onStepClick(step.number)}
            >
              <div className="step-icon">
                {isCompleted ? '✓' : step.icon}
              </div>
              <div className="step-title">{step.title}</div>
              <div className="step-number">{step.number}</div>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={`step-connector ${isCompleted ? 'completed' : ''}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
```

---

## Стили (CSS)

```css
/* Основной контейнер */
.credit-application {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

/* Индикатор шагов */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 40px 0;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 12px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.step.clickable {
  cursor: pointer;
}

.step.clickable:hover {
  background: rgba(0, 0, 0, 0.05);
}

.step.current {
  background: #007bff;
  color: white;
}

.step.completed {
  color: #28a745;
}

.step-icon {
  font-size: 24px;
}

.step-title {
  font-size: 12px;
  font-weight: 500;
}

.step-number {
  font-size: 10px;
  opacity: 0.7;
}

.step-connector {
  flex: 1;
  height: 2px;
  background: #ddd;
  margin: 0 10px;
}

.step-connector.completed {
  background: #28a745;
}

/* Содержимое формы */
.form-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-step h2 {
  margin-top: 0;
  margin-bottom: 24px;
  color: #333;
}

.form-step h3 {
  margin-top: 32px;
  margin-bottom: 16px;
  color: #555;
  font-size: 18px;
}

/* Кнопки навигации */
.navigation-buttons {
  display: flex;
  gap: 16px;
  margin-top: 32px;
}

.spacer {
  flex: 1;
}

.button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-primary {
  background: #007bff;
  color: white;
}

.button-primary:hover:not(:disabled) {
  background: #0056b3;
}

.button-secondary {
  background: #6c757d;
  color: white;
}

.button-secondary:hover:not(:disabled) {
  background: #545b62;
}

.button-success {
  background: #28a745;
  color: white;
}

.button-success:hover:not(:disabled) {
  background: #218838;
}

/* Информация о прогрессе */
.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
  color: #666;
}

.link-button {
  background: none;
  border: none;
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
}

.link-button:hover {
  color: #0056b3;
}

/* Расчет платежа */
.payment-estimate {
  margin-top: 24px;
  padding: 20px;
  background: #e7f3ff;
  border-left: 4px solid #007bff;
  border-radius: 6px;
}

.payment-estimate h4 {
  margin: 0 0 8px 0;
  color: #007bff;
  font-size: 16px;
}

.payment-amount {
  font-size: 32px;
  font-weight: 700;
  color: #007bff;
  margin: 8px 0;
}

.payment-note {
  font-size: 12px;
  color: #666;
  margin: 8px 0 0 0;
}

/* Строка с несколькими полями */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Секции согласий и подтверждения */
.agreements-section,
.confirmation-section {
  margin-top: 24px;
}

.info-box {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-left: 4px solid #17a2b8;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .step-indicator {
    overflow-x: auto;
  }

  .step-title {
    display: none;
  }
}
```

---

## Ключевые изменения

✅ **FormField принимает только `control`** - все остальные свойства в `componentProps`
✅ **Нет вложенного контента** - `FormField` используется как самозакрывающийся тег
✅ **Добавлен `useSignals()`** в каждый компонент для реактивности
✅ **Все свойства компонентов** (label, placeholder, hint, options) теперь в схеме формы
✅ **Чище и проще** - меньше кода, легче поддерживать

## Итого

Этот пример демонстрирует:

✅ **Правильное использование FormField** - только control, без children
✅ **Сложную многошаговую форму** с 6 шагами
✅ **Условную валидацию** в зависимости от типа кредита
✅ **Cross-field валидацию** (проверка соотношений между полями)
✅ **Асинхронную валидацию** (проверка ИНН, email, СМС-кода)
✅ **Динамические поля** в зависимости от выбранных опций
✅ **Реактивность через Signals** для оптимальной производительности
✅ **Переиспользуемые компоненты** и валидаторы
✅ **UX-паттерны**: индикатор прогресса, сохранение черновика, навигация

Форма полностью готова к использованию и может быть легко адаптирована под конкретные требования банка или финансовой организации.
