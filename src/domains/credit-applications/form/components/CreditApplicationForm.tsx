/**
 * CreditApplicationForm
 *
 * Использует GroupNode для элегантной работы с:
 * - Вложенными формами (personalData, passportData, addresses)
 * - Массивами форм (properties, existingLoans, coBorrowers)
 * - Полной типизацией TypeScript
 */

import { useState } from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { createCreditApplicationForm } from '../schemas/create-credit-application-form';
import { BasicInfoForm } from './steps/step1/BasicInfoForm';
import { PersonalInfoForm } from './steps/step2/PersonalInfoForm';
import { ContactInfoForm } from './steps/step3/ContactInfoForm';
import { EmploymentForm } from './steps/step4/EmploymentForm';
import { AdditionalInfoForm } from './steps/step5/AdditionalInfoForm';
import { ConfirmationForm } from './steps/step6/ConfirmationForm';
import { STEPS } from '../constants/credit-application';
import { NavigationButtons, StepIndicator } from '@/lib/forms/components';

// ============================================================================
// Компонент формы
// ============================================================================
function CreditApplicationForm() {
  useSignals();

  const [form] = useState(() => createCreditApplicationForm());

  // Доступ к полям через GroupNode API (прямой доступ через proxy)
  const currentStep = form.currentStep.value.value;

  // ============================================================================
  // Отправка формы
  // ============================================================================

  const submitApplication = async () => {
    const isValid = await form.validate();

    if (!isValid) {
      form.markAsTouched();
      alert('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    try {
      const values = form.getValue();
      console.log('Отправка формы:', values);
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
      <StepIndicator steps={STEPS} control={form}/>

      {/* Форма текущего шага */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        {currentStep === 1 && <BasicInfoForm control={form} />}
        {currentStep === 2 && <PersonalInfoForm control={form} />}
        {currentStep === 3 && <ContactInfoForm control={form} />}
        {currentStep === 4 && <EmploymentForm control={form} />}
        {currentStep === 5 && <AdditionalInfoForm control={form} />}
        {currentStep === 6 && <ConfirmationForm control={form} />}
      </div>

      {/* Кнопки навигации */}
      <NavigationButtons
        control={form}
        onSubmit={submitApplication}
      />

      {/* Информация о прогрессе */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Шаг {currentStep} из 6 • {Math.round((currentStep / 6) * 100)}% завершено
      </div>
    </div>
  );
}

export default CreditApplicationForm;
