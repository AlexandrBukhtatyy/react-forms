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
  const currentStep = (form as any).currentStep.value.value;

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

      // Демонстрация доступа к вложенным данным
      console.log('Personal Data:', (form as any).personalData.getValue());
      console.log('Passport Data:', (form as any).passportData.getValue());
      console.log('Registration Address:', (form as any).registrationAddress.getValue());

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
      <StepIndicator steps={STEPS} form={form}/>

      {/* Форма текущего шага */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        {currentStep === 1 && <BasicInfoForm form={form} />}
        {currentStep === 2 && <PersonalInfoForm form={form} />}
        {currentStep === 3 && <ContactInfoForm form={form} />}
        {currentStep === 4 && <EmploymentForm form={form} />}
        {currentStep === 5 && <AdditionalInfoForm form={form} />}
        {currentStep === 6 && <ConfirmationForm form={form} />}
      </div>

      {/* Кнопки навигации */}
      <NavigationButtons
        form={form}
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
