/**
 * CreditApplicationForm
 *
 * Использует:
 * - useStepForm хук для управления multi-step формой
 * - GroupNode для вложенных форм и массивов
 * - validateForm для валидации по шагам
 * - useLoadCreditApplication для загрузки данных
 * - Полную типизацию TypeScript
 */

import { useState, useMemo } from 'react';
import { useStepForm } from '@/lib/forms';
import { createCreditApplicationForm } from '../schema/create-credit-application-form';
import { BasicInfoForm } from './steps/BasicInfoForm';
import { PersonalInfoForm } from './steps/PersonalInfoForm';
import { ContactInfoForm } from './steps/ContactInfoForm';
import { EmploymentForm } from './steps/EmploymentForm';
import { AdditionalInfoForm } from './steps/AdditionalInfoForm';
import { ConfirmationForm } from './steps/ConfirmationForm';
import { STEPS } from '../constants/credit-application';
import { NavigationButtons, StepIndicator } from '@/lib/forms/components';
import creditApplicationValidation, { STEP_VALIDATIONS } from '../validation/credit-application-validation';
import { useLoadCreditApplication } from '../hooks/useLoadCreditApplication';
import { setSimulateError, getSimulateError } from '../../api/mock-credit-application-api';

// ============================================================================
// Компонент формы
// ============================================================================
function CreditApplicationForm() {

  // ✅ Инициализируем форму (мемоизируем, чтобы не пересоздавать при каждом рендере)
  const form = useMemo(() => createCreditApplicationForm(), [])

  // ✅ Переключатель для имитации ошибок
  const [simulateErrorEnabled, setSimulateErrorEnabled] = useState(getSimulateError());

  const handleToggleError = () => {
    const newValue = !simulateErrorEnabled;
    setSimulateErrorEnabled(newValue);
    setSimulateError(newValue);
  };

  // ✅ Используем новый хук useStepForm
  const {
    currentStep,
    completedSteps,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    submit,
  } = useStepForm(form, {
    totalSteps: 6,
    stepSchemas: STEP_VALIDATIONS,
    fullSchema: creditApplicationValidation,
  });

  // ============================================================================
  // Загрузка данных
  // ============================================================================

  // ✅ Загружаем данные заявки (можно передать ID: '1' или '2', или null для пустой формы)
  const { isLoading, error } = useLoadCreditApplication(form, '1');

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

  // ============================================================================
  // Рендер: Загрузка
  // ============================================================================
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <div className="text-lg text-gray-600">Загрузка данных...</div>
          <div className="text-sm text-gray-500">Пожалуйста, подождите</div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Рендер: Ошибка
  // ============================================================================
  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center space-y-4">
          <div className="text-red-600 text-5xl">⚠️</div>
          <div className="text-xl font-semibold text-red-800">Ошибка загрузки</div>
          <div className="text-red-700">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Рендер: Форма
  // ============================================================================
  return (
    <div className="w-full">
      {/* Панель отладки */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-300">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">Панель отладки</div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <span className="text-sm text-gray-600">Имитация ошибок загрузки</span>
            <input
              type="checkbox"
              checked={simulateErrorEnabled}
              onChange={handleToggleError}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

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
      <pre>
        {JSON.stringify(form.value.value, null, '  ')}
      </pre>

    </div>
  );
}

export default CreditApplicationForm;
