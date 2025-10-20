interface NavigationButtonsProps {
  currentStep: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function NavigationButtons({
  currentStep,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting,
}: NavigationButtonsProps) {
  return (
    <div className="flex gap-4 mt-8">
      {currentStep > 1 && (
        <button
          type="button"
          onClick={onPrevious}
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
          onClick={onNext}
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
