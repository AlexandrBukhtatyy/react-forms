import { useSignals } from '@preact/signals-react/runtime';
import type { DeepFormStore } from '@/lib/forms/core/deep-form-store';

interface NavigationButtonsProps {
  form: DeepFormStore<any>;
  onSubmit: () => void;
}

export function NavigationButtons({ form, onSubmit }: NavigationButtonsProps) {
  useSignals();

  // Доступ к полям формы через DeepFormStore
  const currentStep = form.controls.currentStep.value;
  const completedSteps = form.controls.completedSteps.value;
  const isSubmitting = form.submitting.value;

  // ============================================================================
  // Логика навигации между шагами
  // ============================================================================

  const goToNextStep = async () => {
    const nextStep = Math.min(currentStep + 1, 6);
    form.controls.currentStep.value = nextStep;

    // Добавляем текущий шаг в список завершенных
    if (!completedSteps.includes(currentStep)) {
      form.controls.completedSteps.value = [...completedSteps, currentStep];
    }

    // Скроллим страницу вверх для удобства пользователя
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousStep = () => {
    const previousStep = Math.max(currentStep - 1, 1);
    form.controls.currentStep.value = previousStep;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================================================
  // Рендер кнопок
  // ============================================================================

  return (
    <div className="flex gap-4 mt-8">
      {currentStep > 1 && (
        <button
          type="button"
          onClick={goToPreviousStep}
          className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          ← Назад
        </button>
      )}

      <div className="flex-1" />

      {currentStep < 6 && (
        <button
          type="button"
          onClick={goToNextStep}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          Далее →
        </button>
      )}

      {currentStep === 6 && (
        <button
          type="button"
          onClick={onSubmit}
          className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
        </button>
      )}
    </div>
  );
}
