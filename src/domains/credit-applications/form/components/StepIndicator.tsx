export interface StepIndicatorProps {
  steps: Array<{number: number, title: string, icon: string}>;
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, completedSteps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-8 p-4 bg-gray-100 rounded-lg">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.number);
        const isCurrent = currentStep === step.number;
        const canClick = step.number === 1 || completedSteps.includes(step.number - 1);

        return (
          <div key={step.number} className="flex items-center flex-1">
            <div
              className={`flex items-center gap-2 p-3 rounded-lg transition-all cursor-pointer
                ${isCurrent ? 'bg-blue-500 text-white' : ''}
                ${isCompleted ? 'text-green-500' : ''}
                ${canClick ? 'hover:bg-gray-200' : 'cursor-not-allowed opacity-50'}
              `}
              onClick={() => canClick && onStepClick(step.number)}
            >
              <div className="text-2xl">{isCompleted ? '✓' : step.icon}</div>
              <div className="text-xs font-medium">{step.title}</div>
              <div className="text-xs opacity-70">{step.number}</div>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
