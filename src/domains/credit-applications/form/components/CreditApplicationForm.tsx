/**
 * CreditApplicationForm
 *
 * Использует DeepFormStore для элегантной работы с:
 * - Вложенными формами (personalData, passportData, addresses)
 * - Массивами форм (properties, existingLoans, coBorrowers)
 * - Полной типизацией TypeScript
 */

import { useState } from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { StepIndicator } from './StepIndicator';
import { NavigationButtons } from './NavigationButtons';
import { createCreditApplicationForm } from './create-credit-application-form';
import { BasicInfoForm } from './steps/step1/BasicInfoForm';
import { PersonalInfoForm } from './steps/step2/PersonalInfoForm';
import { ContactInfoForm } from './steps/step3/ContactInfoForm';
import { EmploymentForm } from './steps/step4/EmploymentForm';
import { AdditionalInfoForm } from './steps/step5/AdditionalInfoForm';
import { ConfirmationForm } from './steps/step6/ConfirmationForm';
import { STEPS } from '../constants/credit-application';

// ============================================================================
// Компонент формы
// ============================================================================
function CreditApplicationForm() {
  useSignals();

  const [form] = useState(() => createCreditApplicationForm());

  // Доступ к полям через DeepFormStore API
  const currentStep = form.controls.currentStep.value;

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
      const values = form.getValue();
      console.log('Отправка формы:', values);

      // Демонстрация доступа к вложенным данным
      console.log('Personal Data:', form.controls.personalData.getValue());
      console.log('Passport Data:', form.controls.passportData.getValue());
      console.log('Registration Address:', form.controls.registrationAddress.getValue());

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
