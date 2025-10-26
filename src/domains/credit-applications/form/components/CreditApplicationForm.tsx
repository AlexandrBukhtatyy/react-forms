/**
 * CreditApplicationForm
 *
 * Использует:
 * - useStepForm хук для управления multi-step формой
 * - GroupNode для вложенных форм и массивов
 * - validateForm для валидации по шагам
 * - Полную типизацию TypeScript
 */

import { useSignals } from '@preact/signals-react/runtime';
import { useStepForm } from '@/lib/forms';
import { createCreditApplicationForm } from '../schemas/create-credit-application-form';
import { BasicInfoForm } from './steps/step1/BasicInfoForm';
import { PersonalInfoForm } from './steps/step2/PersonalInfoForm';
import { ContactInfoForm } from './steps/step3/ContactInfoForm';
import { EmploymentForm } from './steps/step4/EmploymentForm';
import { AdditionalInfoForm } from './steps/step5/AdditionalInfoForm';
import { ConfirmationForm } from './steps/step6/ConfirmationForm';
import { STEPS } from '../constants/credit-application';
import { NavigationButtons, StepIndicator } from '@/lib/forms/components';
import creditApplicationValidation, { STEP_VALIDATIONS } from '../validation/credit-application-validation';

// ============================================================================
// Компонент формы
// ============================================================================
function CreditApplicationForm() {
  useSignals();

  // ✅ Используем новый хук useStepForm
  const {
    form,
    currentStep,
    completedSteps,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    submit,
  } = useStepForm(createCreditApplicationForm, {
    totalSteps: 6,
    stepSchemas: STEP_VALIDATIONS,
    fullSchema: creditApplicationValidation,
  });

  // ============================================================================
  // Отправка формы
  // ============================================================================

  const submitApplication = async () => {
    const result = await submit(async (values) => {
      console.log('Отправка формы:', values);
      // TODO: Отправка на сервер
      return values;
    });

    if (result) {
      alert('Заявка успешно отправлена!');
    } else {
      alert('Пожалуйста, исправьте ошибки в форме');
    }
  };

  // ============================================================================
  // Рендер
  // ============================================================================

  return (
    <div className="w-full">
      {/* Индикатор шагов */}
      <StepIndicator
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={goToStep}
      />

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
        currentStep={currentStep}
        totalSteps={6}
        isSubmitting={form.submitting.value}
        onNext={goToNextStep}
        onPrevious={goToPreviousStep}
        onSubmit={submitApplication}
      />

      {/* Информация о прогрессе */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Шаг {currentStep} из 6 • {Math.round((currentStep / 6) * 100)}% завершено
      </div>

      {/* Значение формы */}
      <hr />
      loanTerm: {form.loanTerm.value.value}
      <hr />
      {/* Значение формы */}
      <pre>
        {JSON.stringify(form.value.value, null, '  ')}
      </pre>

    </div>
  );
}

export default CreditApplicationForm;
