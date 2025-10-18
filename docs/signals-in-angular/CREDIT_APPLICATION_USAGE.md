# Использование формы заявки на кредит

> **Часть 3: React компоненты и использование**

## Создание формы

```typescript
import { FormStore } from './lib/forms';
import creditApplicationValidation from './validations/credit-application';
import type { CreditApplicationForm } from './types/credit-application';

// ============================================================================
// Создание инстанса формы
// ============================================================================

export function createCreditApplicationForm() {
  const form = new FormStore<CreditApplicationForm>(
    {
      // Метаданные
      currentStep: { value: 1, component: () => null },
      completedSteps: { value: [], component: () => null },

      // Шаг 1: Основная информация
      loanType: { value: 'consumer' as const, component: Select },
      loanAmount: { value: 0, component: InputNumber },
      loanTerm: { value: 12, component: InputNumber },
      loanPurpose: { value: '', component: Textarea },

      propertyValue: { value: undefined, component: InputNumber },
      initialPayment: { value: undefined, component: InputNumber },

      carBrand: { value: undefined, component: InputText },
      carModel: { value: undefined, component: InputText },
      carYear: { value: undefined, component: InputNumber },
      carPrice: { value: undefined, component: InputNumber },

      // Шаг 2: Персональные данные
      lastName: { value: '', component: InputText },
      firstName: { value: '', component: InputText },
      middleName: { value: '', component: InputText },
      birthDate: { value: '', component: InputDate },
      birthPlace: { value: '', component: InputText },
      gender: { value: 'male' as const, component: RadioGroup },

      passportSeries: { value: '', component: InputMask },
      passportNumber: { value: '', component: InputMask },
      passportIssueDate: { value: '', component: InputDate },
      passportIssuedBy: { value: '', component: InputText },
      passportDepartmentCode: { value: '', component: InputMask },

      inn: { value: '', component: InputMask },
      snils: { value: '', component: InputMask },

      // Шаг 3: Контактная информация
      phoneMain: { value: '', component: InputPhone },
      phoneAdditional: { value: undefined, component: InputPhone },
      email: { value: '', component: InputEmail },
      emailAdditional: { value: undefined, component: InputEmail },

      registrationRegion: { value: '', component: Select },
      registrationCity: { value: '', component: InputText },
      registrationStreet: { value: '', component: InputText },
      registrationHouse: { value: '', component: InputText },
      registrationApartment: { value: undefined, component: InputText },
      registrationPostalCode: { value: '', component: InputMask },

      sameAsRegistration: { value: true, component: Checkbox },
      residenceRegion: { value: undefined, component: Select },
      residenceCity: { value: undefined, component: InputText },
      residenceStreet: { value: undefined, component: InputText },
      residenceHouse: { value: undefined, component: InputText },
      residenceApartment: { value: undefined, component: InputText },
      residencePostalCode: { value: undefined, component: InputMask },

      // Шаг 4: Информация о занятости
      employmentStatus: { value: 'employed' as const, component: RadioGroup },

      companyName: { value: undefined, component: InputText },
      companyInn: { value: undefined, component: InputMask },
      companyPhone: { value: undefined, component: InputPhone },
      companyAddress: { value: undefined, component: InputText },
      position: { value: undefined, component: InputText },
      workExperienceTotal: { value: undefined, component: InputNumber },
      workExperienceCurrent: { value: undefined, component: InputNumber },

      monthlyIncome: { value: 0, component: InputNumber },
      additionalIncome: { value: undefined, component: InputNumber },
      additionalIncomeSource: { value: undefined, component: InputText },

      businessType: { value: undefined, component: InputText },
      businessInn: { value: undefined, component: InputMask },
      businessActivity: { value: undefined, component: Textarea },

      // Шаг 5: Дополнительная информация
      maritalStatus: { value: 'single' as const, component: RadioGroup },
      dependents: { value: 0, component: InputNumber },
      education: { value: 'higher' as const, component: Select },

      hasProperty: { value: false, component: Checkbox },
      properties: { value: undefined, component: PropertyListComponent },

      hasExistingLoans: { value: false, component: Checkbox },
      existingLoans: { value: undefined, component: ExistingLoansComponent },

      hasCoBorrower: { value: false, component: Checkbox },
      coBorrowers: { value: undefined, component: CoBorrowersComponent },

      // Шаг 6: Согласия
      agreePersonalData: { value: false, component: Checkbox },
      agreeCreditHistory: { value: false, component: Checkbox },
      agreeMarketing: { value: false, component: Checkbox },
      agreeTerms: { value: false, component: Checkbox },

      confirmAccuracy: { value: false, component: Checkbox },
      electronicSignature: { value: '', component: InputMask },
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
import { FormStore } from '../lib/forms';
import { FormField } from '../lib/forms/components/form-field';
import type { CreditApplicationForm } from '../types/credit-application';

interface Step1Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step1BasicInfo({ form }: Step1Props) {
  const loanType = form.controls.loanType.value;

  return (
    <div className="form-step">
      <h2>Основная информация о кредите</h2>

      {/* Тип кредита */}
      <FormField
        label="Тип кредита"
        required
        control={form.controls.loanType}
      >
        <select
          value={form.controls.loanType.value}
          onChange={(e) =>
            form.controls.loanType.setValue(e.target.value as any)
          }
          disabled={form.controls.loanType.disabled}
        >
          <option value="">Выберите тип кредита</option>
          <option value="consumer">Потребительский кредит</option>
          <option value="mortgage">Ипотека</option>
          <option value="car">Автокредит</option>
          <option value="business">Кредит для бизнеса</option>
          <option value="refinancing">Рефинансирование</option>
        </select>
      </FormField>

      {/* Сумма кредита */}
      <FormField
        label="Сумма кредита"
        required
        control={form.controls.loanAmount}
        hint="От 50 000 до 10 000 000 ₽"
      >
        <input
          type="number"
          value={form.controls.loanAmount.value}
          onChange={(e) =>
            form.controls.loanAmount.setValue(Number(e.target.value))
          }
          placeholder="Введите сумму"
          min={50000}
          max={10000000}
          step={10000}
        />
      </FormField>

      {/* Срок кредита */}
      <FormField
        label="Срок кредита (месяцев)"
        required
        control={form.controls.loanTerm}
      >
        <input
          type="number"
          value={form.controls.loanTerm.value}
          onChange={(e) =>
            form.controls.loanTerm.setValue(Number(e.target.value))
          }
          placeholder="Введите срок"
          min={6}
          max={240}
        />
      </FormField>

      {/* Цель кредита */}
      <FormField
        label="Цель кредита"
        required
        control={form.controls.loanPurpose}
      >
        <textarea
          value={form.controls.loanPurpose.value}
          onChange={(e) => form.controls.loanPurpose.setValue(e.target.value)}
          placeholder="Опишите, на что планируете потратить средства"
          rows={4}
          maxLength={500}
        />
      </FormField>

      {/* Специфичные поля для ипотеки */}
      {loanType === 'mortgage' && (
        <>
          <h3>Информация о недвижимости</h3>

          <FormField
            label="Стоимость недвижимости"
            required
            control={form.controls.propertyValue!}
          >
            <input
              type="number"
              value={form.controls.propertyValue?.value ?? ''}
              onChange={(e) =>
                form.controls.propertyValue?.setValue(Number(e.target.value))
              }
              placeholder="Введите стоимость"
              min={1000000}
              step={100000}
            />
          </FormField>

          <FormField
            label="Первоначальный взнос"
            required
            control={form.controls.initialPayment!}
            hint="Минимум 10% от стоимости недвижимости"
          >
            <input
              type="number"
              value={form.controls.initialPayment?.value ?? ''}
              onChange={(e) =>
                form.controls.initialPayment?.setValue(Number(e.target.value))
              }
              placeholder="Введите сумму"
              min={0}
              step={10000}
            />
          </FormField>
        </>
      )}

      {/* Специфичные поля для автокредита */}
      {loanType === 'car' && (
        <>
          <h3>Информация об автомобиле</h3>

          <FormField
            label="Марка автомобиля"
            required
            control={form.controls.carBrand!}
          >
            <input
              type="text"
              value={form.controls.carBrand?.value ?? ''}
              onChange={(e) => form.controls.carBrand?.setValue(e.target.value)}
              placeholder="Например: Toyota"
            />
          </FormField>

          <FormField
            label="Модель автомобиля"
            required
            control={form.controls.carModel!}
          >
            <input
              type="text"
              value={form.controls.carModel?.value ?? ''}
              onChange={(e) => form.controls.carModel?.setValue(e.target.value)}
              placeholder="Например: Camry"
            />
          </FormField>

          <div className="form-row">
            <FormField
              label="Год выпуска"
              required
              control={form.controls.carYear!}
            >
              <input
                type="number"
                value={form.controls.carYear?.value ?? ''}
                onChange={(e) =>
                  form.controls.carYear?.setValue(Number(e.target.value))
                }
                placeholder="2020"
                min={2000}
                max={new Date().getFullYear() + 1}
              />
            </FormField>

            <FormField
              label="Стоимость автомобиля"
              required
              control={form.controls.carPrice!}
            >
              <input
                type="number"
                value={form.controls.carPrice?.value ?? ''}
                onChange={(e) =>
                  form.controls.carPrice?.setValue(Number(e.target.value))
                }
                placeholder="Введите стоимость"
                min={300000}
                step={10000}
              />
            </FormField>
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

## Итого

Этот пример демонстрирует:

✅ **Сложную многошаговую форму** с 6 шагами
✅ **Условную валидацию** в зависимости от типа кредита
✅ **Cross-field валидацию** (проверка соотношений между полями)
✅ **Асинхронную валидацию** (проверка ИНН, email, СМС-кода)
✅ **Динамические поля** в зависимости от выбранных опций
✅ **Реактивность через Signals** для оптимальной производительности
✅ **Переиспользуемые компоненты** и валидаторы
✅ **UX-паттерны**: индикатор прогресса, сохранение черновика, навигация

Форма полностью готова к использованию и может быть легко адаптирована под конкретные требования банка или финансовой организации.
