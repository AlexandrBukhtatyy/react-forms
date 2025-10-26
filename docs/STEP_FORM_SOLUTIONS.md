# Решения для разделения состояния шагов и формы

## Проблема

Состояние шагов (`currentStep`, `completedSteps`) хранится внутри `GroupNode` как обычные поля, что нарушает Single Responsibility Principle и усложняет валидацию по шагам.

## Решение 1: React State + Temporary Validation Schema

### Описание подхода

- **Состояние шагов** хранится в React state компонента
- **Валидация по шагам** использует временную схему через `applyValidationSchema()`
- **NavigationButtons/StepIndicator** принимают состояние и callback'и как пропсы

### Пример кода

```typescript
// ============================================================================
// Создание формы (БЕЗ currentStep/completedSteps)
// ============================================================================

const createCreditApplicationForm = (): GroupNodeWithControls<CreditApplicationForm> => {
  const schema = {
    // Шаг 1
    loanType: { value: 'consumer', component: Select, /*...*/ },
    loanAmount: { value: undefined, component: Input, /*...*/ },

    // Шаг 2
    personalData: personalDataSchema,
    passportData: passportDataSchema,

    // ... остальные поля БЕЗ currentStep/completedSteps
  };

  const form = new GroupNode(schema);

  // Применяем ПОЛНУЮ схему валидации (для submit)
  form.applyValidationSchema(fullValidationSchema);

  return form;
};

// ============================================================================
// Валидация по шагам
// ============================================================================

// Схемы валидации для каждого шага
const step1ValidationSchema = (path: FieldPath<CreditApplicationForm>) => {
  required(path.loanType);
  required(path.loanAmount);
  minValue(path.loanAmount, 50000);

  applyWhen(path.loanType, (type) => type === 'mortgage', () => {
    required(path.propertyValue);
    required(path.initialPayment);
  });
};

const step2ValidationSchema = (path: FieldPath<CreditApplicationForm>) => {
  required(path.personalData.firstName);
  required(path.personalData.lastName);
  required(path.passportData.series);
  required(path.passportData.number);
};

// ... step3, step4, step5, step6

const fullValidationSchema = (path: FieldPath<CreditApplicationForm>) => {
  step1ValidationSchema(path);
  step2ValidationSchema(path);
  step3ValidationSchema(path);
  step4ValidationSchema(path);
  step5ValidationSchema(path);
  step6ValidationSchema(path);
};

// Маппинг шагов на схемы
const stepValidationSchemas = {
  1: step1ValidationSchema,
  2: step2ValidationSchema,
  3: step3ValidationSchema,
  4: step4ValidationSchema,
  5: step5ValidationSchema,
  6: step6ValidationSchema,
};

// ============================================================================
// Компонент формы
// ============================================================================

function CreditApplicationForm() {
  useSignals();

  const [form] = useState(() => createCreditApplicationForm());
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Валидация текущего шага
  const validateCurrentStep = async () => {
    const stepSchema = stepValidationSchemas[currentStep];

    // Временно применяем схему для текущего шага
    form.applyValidationSchema(stepSchema);

    const isValid = await form.validate();

    // Восстанавливаем полную схему
    form.applyValidationSchema(fullValidationSchema);

    return isValid;
  };

  // Переход на следующий шаг
  const goToNextStep = async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      form.markAsTouched();
      alert('Пожалуйста, исправьте ошибки');
      return;
    }

    const nextStep = Math.min(currentStep + 1, 6);
    setCurrentStep(nextStep);

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
  };

  // Отправка формы
  const submitApplication = async () => {
    // Применяем полную схему валидации
    form.applyValidationSchema(fullValidationSchema);

    const isValid = await form.validate();
    if (!isValid) {
      form.markAsTouched();
      alert('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    const values = form.getValue();
    console.log('Отправка формы:', values);
  };

  return (
    <div>
      <StepIndicator
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={setCurrentStep}
      />

      {/* Форма текущего шага */}
      {currentStep === 1 && <BasicInfoForm control={form} />}
      {currentStep === 2 && <PersonalInfoForm control={form} />}
      {/* ... */}

      <NavigationButtons
        currentStep={currentStep}
        completedSteps={completedSteps}
        isSubmitting={form.submitting.value}
        onNext={goToNextStep}
        onPrevious={() => setCurrentStep(currentStep - 1)}
        onSubmit={submitApplication}
      />
    </div>
  );
}
```

### Адаптированные компоненты

```typescript
// ============================================================================
// NavigationButtons (новая реализация)
// ============================================================================

interface NavigationButtonsProps {
  currentStep: number;
  completedSteps: number[];
  isSubmitting: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
}

export function NavigationButtons({
  currentStep,
  completedSteps,
  isSubmitting,
  onNext,
  onPrevious,
  onSubmit
}: NavigationButtonsProps) {
  return (
    <div className="flex gap-4 mt-8">
      {currentStep > 1 && (
        <button onClick={onPrevious} disabled={isSubmitting}>
          ← Назад
        </button>
      )}

      <div className="flex-1" />

      {currentStep < 6 && (
        <button onClick={onNext} disabled={isSubmitting}>
          Далее →
        </button>
      )}

      {currentStep === 6 && (
        <button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// StepIndicator (новая реализация)
// ============================================================================

interface StepIndicatorProps {
  steps: Array<{ number: number; title: string; icon: string }>;
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick
}: StepIndicatorProps) {
  const goToStep = (step: number) => {
    const canGoTo = step === 1 || completedSteps.includes(step - 1);
    if (canGoTo) {
      onStepClick(step);
    }
  };

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step) => {
        const isCompleted = completedSteps.includes(step.number);
        const isCurrent = currentStep === step.number;
        const canClick = step === 1 || completedSteps.includes(step.number - 1);

        return (
          <div key={step.number} onClick={() => goToStep(step.number)}>
            <div className={isCurrent ? 'active' : ''}>
              {isCompleted ? '✓' : step.icon} {step.title}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Плюсы

✅ **Простота**: Минимальные изменения в архитектуре
✅ **Чистота модели**: GroupNode содержит только данные формы
✅ **Гибкость**: React state легко расширяется (добавить историю навигации, анимации)
✅ **Стандартный подход**: Обычный React паттерн для UI-состояния

### Минусы

❌ **Производительность**: Двойное применение validation schema (временная + полная)
❌ **Побочные эффекты**: `applyValidationSchema()` изменяет состояние ValidationRegistry
❌ **Потенциальные баги**: Можно забыть восстановить полную схему после валидации шага
❌ **Неочевидное поведение**: Валидаторы "тихо" перезаписываются

### Миграционный путь

1. Удалить `currentStep`/`completedSteps` из схемы формы
2. Добавить React state в компонент
3. Адаптировать NavigationButtons и StepIndicator
4. Создать функцию `validateCurrentStep()` с временным применением схемы

---

## Решение 2: Расширенный API GroupNode (validate с параметром)

### Описание подхода

- **Состояние шагов** хранится в React state
- **Валидация по шагам** через новый метод `validate(schema?)` с опциональным параметром
- **ValidationRegistry** поддерживает временную валидацию без изменения зарегистрированной схемы

### Пример кода

```typescript
// ============================================================================
// Расширенный метод validate() в GroupNode
// ============================================================================

class GroupNode<T> extends FormNode<T> {
  // ... существующий код

  /**
   * Валидация формы
   * @param schema - Опциональная схема валидации для одноразового применения
   */
  async validate(schema?: ValidationSchemaFn<T>): Promise<boolean> {
    // Если передана временная схема - использовать её
    if (schema) {
      return this.validateWithTemporarySchema(schema);
    }

    // Иначе - использовать зарегистрированную схему (существующее поведение)
    const results = await Promise.all(
      Array.from(this.fields.values()).map((field) => field.validate())
    );

    const validators = ValidationRegistry.getValidators(this as any);
    if (validators && validators.length > 0) {
      await this.applyContextualValidators(validators);
    }

    return Array.from(this.fields.values()).every(
      (field) => field.valid.value
    );
  }

  /**
   * Валидация с временной схемой (без изменения ValidationRegistry)
   * @private
   */
  private async validateWithTemporarySchema(
    schema: ValidationSchemaFn<T>
  ): Promise<boolean> {
    // Создаем временный контекст
    ValidationRegistry.beginRegistration();

    try {
      const path = createFieldPath<T>();
      schema(path);

      // Получаем валидаторы из контекста БЕЗ сохранения в реестр
      const tempValidators = ValidationRegistry.getCurrentContext()?.getValidators() || [];
      ValidationRegistry.cancelRegistration(); // Новый метод для отмены регистрации

      // Сохраняем текущие ошибки
      const currentErrors = new Map<string, ValidationError[]>();
      this.fields.forEach((field, key) => {
        currentErrors.set(key as string, [...field.errors.value]);
      });

      // Применяем временные валидаторы
      await this.applyContextualValidators(tempValidators);

      // Проверяем результат
      const isValid = Array.from(this.fields.values()).every(
        (field) => field.valid.value
      );

      // Если невалидно - оставляем ошибки, если валидно - восстанавливаем предыдущие
      if (isValid) {
        this.fields.forEach((field, key) => {
          const prevErrors = currentErrors.get(key as string) || [];
          field.setErrors(prevErrors);
        });
      }

      return isValid;
    } catch (error) {
      ValidationRegistry.cancelRegistration();
      throw error;
    }
  }
}

// ============================================================================
// Использование в компоненте
// ============================================================================

function CreditApplicationForm() {
  useSignals();

  const [form] = useState(() => createCreditApplicationForm());
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Валидация текущего шага
  const validateCurrentStep = async () => {
    const stepSchema = stepValidationSchemas[currentStep];

    // ✅ Чистый API: передаем схему как параметр
    const isValid = await form.validate(stepSchema);

    return isValid;
  };

  // Переход на следующий шаг
  const goToNextStep = async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      form.markAsTouched();
      alert('Пожалуйста, исправьте ошибки');
      return;
    }

    setCurrentStep(currentStep + 1);
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
  };

  // Отправка формы (БЕЗ параметра = используется полная схема)
  const submitApplication = async () => {
    const isValid = await form.validate(); // Полная схема из applyValidationSchema()

    if (!isValid) {
      form.markAsTouched();
      alert('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    const values = form.getValue();
    console.log('Отправка формы:', values);
  };

  return (
    <div>
      <StepIndicator {...} />
      <NavigationButtons {...} />
    </div>
  );
}
```

### Изменения в ValidationRegistry

```typescript
class ValidationRegistryClass {
  // ... существующий код

  /**
   * Отменить текущую регистрацию без сохранения в реестр
   */
  cancelRegistration(): void {
    this.contextStack.pop();
  }
}
```

### Плюсы

✅ **Чистый API**: `form.validate(stepSchema)` - очевидное и понятное поведение
✅ **Нет побочных эффектов**: ValidationRegistry не изменяется при валидации шага
✅ **Удобство**: Не нужно помнить о восстановлении схемы
✅ **Безопасность**: Невозможно "забыть" восстановить схему
✅ **Производительность**: Только одна валидация вместо двух

### Минусы

❌ **Изменение API**: Требует модификации GroupNode.validate()
❌ **Сложность реализации**: Нужно корректно обрабатывать временные валидаторы
❌ **Управление ошибками**: Нужно решить, что делать с ошибками после временной валидации

### Миграционный путь

1. Добавить метод `cancelRegistration()` в ValidationRegistry
2. Модифицировать `GroupNode.validate()` для поддержки опционального параметра
3. Реализовать `validateWithTemporarySchema()` в GroupNode
4. Удалить `currentStep`/`completedSteps` из схемы формы
5. Адаптировать компоненты NavigationButtons и StepIndicator
6. Обновить документацию и примеры

---

## Решение 3: StepFormController (Facade Pattern)

### Описание подхода

- **Состояние шагов** инкапсулировано в отдельном классе `StepFormController`
- **Валидация по шагам** управляется контроллером
- **Facade pattern**: Скрывает сложность работы с шагами за простым интерфейсом

### Пример кода

```typescript
// ============================================================================
// StepFormController
// ============================================================================

export class StepFormController<T extends Record<string, any>> {
  private _currentStep: Signal<number>;
  private _completedSteps: Signal<number[]>;
  private stepValidationSchemas: Map<number, ValidationSchemaFn<T>>;
  private fullValidationSchema: ValidationSchemaFn<T>;

  constructor(
    private form: GroupNodeWithControls<T>,
    config: {
      totalSteps: number;
      stepSchemas: Record<number, ValidationSchemaFn<T>>;
      fullSchema: ValidationSchemaFn<T>;
    }
  ) {
    this._currentStep = signal(1);
    this._completedSteps = signal<number[]>([]);

    this.stepValidationSchemas = new Map(Object.entries(config.stepSchemas).map(
      ([step, schema]) => [Number(step), schema]
    ));

    this.fullValidationSchema = config.fullSchema;

    // Применяем полную схему к форме
    this.form.applyValidationSchema(this.fullValidationSchema);
  }

  // Реактивные свойства
  get currentStep(): ReadonlySignal<number> {
    return this._currentStep;
  }

  get completedSteps(): ReadonlySignal<number[]> {
    return this._completedSteps;
  }

  get isFirstStep(): boolean {
    return this._currentStep.value === 1;
  }

  get isLastStep(): boolean {
    return this._currentStep.value === this.stepValidationSchemas.size;
  }

  // Валидация текущего шага
  async validateCurrentStep(): Promise<boolean> {
    const stepSchema = this.stepValidationSchemas.get(this._currentStep.value);

    if (!stepSchema) {
      throw new Error(`No validation schema for step ${this._currentStep.value}`);
    }

    // Используем временную валидацию (Решение 2)
    return this.form.validate(stepSchema);
  }

  // Переход на следующий шаг
  async goToNextStep(): Promise<boolean> {
    const isValid = await this.validateCurrentStep();

    if (!isValid) {
      this.form.markAsTouched();
      return false;
    }

    const current = this._currentStep.value;

    // Добавляем в завершенные
    if (!this._completedSteps.value.includes(current)) {
      this._completedSteps.value = [...this._completedSteps.value, current];
    }

    // Переходим на следующий шаг
    if (!this.isLastStep) {
      this._currentStep.value = current + 1;
    }

    return true;
  }

  // Переход на предыдущий шаг
  goToPreviousStep(): void {
    if (!this.isFirstStep) {
      this._currentStep.value = this._currentStep.value - 1;
    }
  }

  // Переход на конкретный шаг
  goToStep(step: number): boolean {
    const canGoTo = step === 1 || this._completedSteps.value.includes(step - 1);

    if (canGoTo && step >= 1 && step <= this.stepValidationSchemas.size) {
      this._currentStep.value = step;
      return true;
    }

    return false;
  }

  // Отправка формы
  async submit<R = any>(
    onSubmit: (values: T) => Promise<R> | R
  ): Promise<R | null> {
    // Валидируем всю форму с полной схемой
    const isValid = await this.form.validate();

    if (!isValid) {
      this.form.markAsTouched();
      return null;
    }

    return this.form.submit(onSubmit);
  }
}

// ============================================================================
// Использование в компоненте
// ============================================================================

function CreditApplicationForm() {
  useSignals();

  const [form] = useState(() => createCreditApplicationForm());

  const [stepController] = useState(() =>
    new StepFormController(form, {
      totalSteps: 6,
      stepSchemas: {
        1: step1ValidationSchema,
        2: step2ValidationSchema,
        3: step3ValidationSchema,
        4: step4ValidationSchema,
        5: step5ValidationSchema,
        6: step6ValidationSchema,
      },
      fullSchema: fullValidationSchema,
    })
  );

  return (
    <div>
      <StepIndicator
        steps={STEPS}
        currentStep={stepController.currentStep.value}
        completedSteps={stepController.completedSteps.value}
        onStepClick={(step) => stepController.goToStep(step)}
      />

      {/* Форма */}
      {stepController.currentStep.value === 1 && <BasicInfoForm control={form} />}
      {stepController.currentStep.value === 2 && <PersonalInfoForm control={form} />}
      {/* ... */}

      <NavigationButtons
        currentStep={stepController.currentStep.value}
        completedSteps={stepController.completedSteps.value}
        isSubmitting={form.submitting.value}
        onNext={() => stepController.goToNextStep()}
        onPrevious={() => stepController.goToPreviousStep()}
        onSubmit={() => stepController.submit(async (values) => {
          console.log('Отправка:', values);
        })}
      />
    </div>
  );
}
```

### Хук для упрощения использования

```typescript
// ============================================================================
// useStepForm hook
// ============================================================================

export function useStepForm<T extends Record<string, any>>(
  createForm: () => GroupNodeWithControls<T>,
  config: {
    totalSteps: number;
    stepSchemas: Record<number, ValidationSchemaFn<T>>;
    fullSchema: ValidationSchemaFn<T>;
  }
) {
  const [form] = useState(createForm);
  const [controller] = useState(() => new StepFormController(form, config));

  return {
    form,
    controller,
    currentStep: controller.currentStep.value,
    completedSteps: controller.completedSteps.value,
  };
}

// Использование
function CreditApplicationForm() {
  useSignals();

  const { form, controller, currentStep } = useStepForm(
    createCreditApplicationForm,
    {
      totalSteps: 6,
      stepSchemas: { 1: step1ValidationSchema, /* ... */ },
      fullSchema: fullValidationSchema,
    }
  );

  return (
    <div>
      {currentStep === 1 && <BasicInfoForm control={form} />}
      {/* ... */}
    </div>
  );
}
```

### Плюсы

✅ **Инкапсуляция**: Вся логика шагов в одном месте
✅ **Переиспользование**: StepFormController можно использовать в других формах
✅ **Типобезопасность**: TypeScript контроль всех операций
✅ **Удобный API**: Простые методы `goToNextStep()`, `goToPreviousStep()`, `goToStep()`
✅ **Реактивность**: Signals для currentStep/completedSteps
✅ **Тестируемость**: Легко протестировать логику отдельно от UI

### Минусы

❌ **Дополнительная абстракция**: Еще один класс для изучения
❌ **Зависимость от Решения 2**: Требует поддержки `validate(schema)` в GroupNode
❌ **Сложность**: Больше кода, чем Решение 1

### Миграционный путь

1. Реализовать Решение 2 (расширенный validate)
2. Создать класс StepFormController
3. Создать хук useStepForm
4. Удалить `currentStep`/`completedSteps` из схемы формы
5. Адаптировать NavigationButtons и StepIndicator
6. Обновить CreditApplicationForm для использования useStepForm
7. Добавить примеры в документацию

---

## Решение 4: Функция validateForm (Функциональный подход) ⭐ **САМОЕ ПРОСТОЕ**

### Описание подхода

- **Состояние шагов** хранится в React state
- **Валидация по шагам** через отдельную функцию `validateForm(form, schema)`
- **Нет изменений в GroupNode API** - чистая функция снаружи
- **Функциональный подход** вместо объектно-ориентированного

### Пример кода

```typescript
// ============================================================================
// Утилита для валидации формы по схеме
// src/lib/forms/validators/validate-form.ts
// ============================================================================

import type { GroupNode } from '../core/nodes/group-node';
import type { ValidationSchemaFn } from '../types';
import { ValidationRegistry, createFieldPath } from './index';

/**
 * Валидировать форму в соответствии с указанной схемой
 *
 * @param form - GroupNode для валидации
 * @param schema - Схема валидации
 * @returns Promise<boolean> - true если форма валидна
 *
 * @example
 * ```typescript
 * const isValid = await validateForm(form, step1ValidationSchema);
 * ```
 */
export async function validateForm<T extends Record<string, any>>(
  form: GroupNode<T>,
  schema: ValidationSchemaFn<T>
): Promise<boolean> {
  // Создаем временный контекст регистрации
  ValidationRegistry.beginRegistration();

  try {
    const path = createFieldPath<T>();
    schema(path);

    // Получаем валидаторы БЕЗ сохранения в реестр
    const context = ValidationRegistry.getCurrentContext();
    const tempValidators = context?.getValidators() || [];

    // Очищаем стек контекстов (не сохраняем в formStoreMap)
    ValidationRegistry.cancelRegistration();

    // Очищаем текущие ошибки полей
    form.clearErrors();

    // Валидируем все поля
    await Promise.all(
      Array.from((form as any).fields.values()).map((field: any) => field.validate())
    );

    // Применяем временные contextual валидаторы
    await (form as any).applyContextualValidators(tempValidators);

    // Проверяем результат
    return form.valid.value;
  } catch (error) {
    // В случае ошибки очищаем стек
    ValidationRegistry.cancelRegistration();
    throw error;
  }
}
```

```typescript
// ============================================================================
// ValidationRegistry - добавляем метод cancelRegistration
// src/lib/forms/validators/validation-registry.ts
// ============================================================================

class ValidationRegistryClass {
  // ... существующий код

  /**
   * Отменить текущую регистрацию без сохранения в реестр
   * Используется в validateForm() для временной валидации
   */
  cancelRegistration(): void {
    if (this.contextStack.length === 0) {
      throw new Error('No active registration context to cancel');
    }
    this.contextStack.pop();
  }
}
```

### Использование в компоненте

```typescript
// ============================================================================
// Импорт функции
// ============================================================================

import { validateForm } from '@/lib/forms/validators/validate-form';

// ============================================================================
// Схемы валидации для шагов
// ============================================================================

const step1ValidationSchema = (path: FieldPath<CreditApplicationForm>) => {
  required(path.loanType);
  required(path.loanAmount);
  minValue(path.loanAmount, 50000);

  applyWhen(path.loanType, (type) => type === 'mortgage', () => {
    required(path.propertyValue);
    required(path.initialPayment);
  });
};

const step2ValidationSchema = (path: FieldPath<CreditApplicationForm>) => {
  required(path.personalData.firstName);
  required(path.personalData.lastName);
  required(path.passportData.series);
  required(path.passportData.number);
};

// ... остальные шаги

const fullValidationSchema = (path: FieldPath<CreditApplicationForm>) => {
  step1ValidationSchema(path);
  step2ValidationSchema(path);
  step3ValidationSchema(path);
  step4ValidationSchema(path);
  step5ValidationSchema(path);
  step6ValidationSchema(path);
};

const stepValidationSchemas = {
  1: step1ValidationSchema,
  2: step2ValidationSchema,
  3: step3ValidationSchema,
  4: step4ValidationSchema,
  5: step5ValidationSchema,
  6: step6ValidationSchema,
};

// ============================================================================
// Компонент формы
// ============================================================================

function CreditApplicationForm() {
  useSignals();

  const [form] = useState(() => createCreditApplicationForm());
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // ✅ Валидация текущего шага через функцию
  const validateCurrentStep = async () => {
    const stepSchema = stepValidationSchemas[currentStep];
    return await validateForm(form, stepSchema);
  };

  // Переход на следующий шаг
  const goToNextStep = async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      form.markAsTouched();
      alert('Пожалуйста, исправьте ошибки');
      return;
    }

    const nextStep = Math.min(currentStep + 1, 6);
    setCurrentStep(nextStep);

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
  };

  // ✅ Отправка формы - валидация полной схемы
  const submitApplication = async () => {
    const isValid = await validateForm(form, fullValidationSchema);

    if (!isValid) {
      form.markAsTouched();
      alert('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    const values = form.getValue();
    console.log('Отправка формы:', values);
  };

  return (
    <div>
      <StepIndicator
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={setCurrentStep}
      />

      {/* Форма текущего шага */}
      {currentStep === 1 && <BasicInfoForm control={form} />}
      {currentStep === 2 && <PersonalInfoForm control={form} />}
      {/* ... */}

      <NavigationButtons
        currentStep={currentStep}
        completedSteps={completedSteps}
        isSubmitting={form.submitting.value}
        onNext={goToNextStep}
        onPrevious={() => setCurrentStep(currentStep - 1)}
        onSubmit={submitApplication}
      />
    </div>
  );
}
```

### Преимущества функционального подхода

```typescript
// ============================================================================
// Можно легко создать хелперы
// ============================================================================

// Валидация нескольких шагов
async function validateSteps(
  form: GroupNode<any>,
  steps: number[]
): Promise<boolean> {
  for (const step of steps) {
    const schema = stepValidationSchemas[step];
    const isValid = await validateForm(form, schema);
    if (!isValid) return false;
  }
  return true;
}

// Валидация с кастомным обработчиком ошибок
async function validateFormWithErrors<T>(
  form: GroupNode<T>,
  schema: ValidationSchemaFn<T>,
  onError?: (errors: ValidationError[]) => void
): Promise<boolean> {
  const isValid = await validateForm(form, schema);

  if (!isValid && onError) {
    onError(form.errors.value);
  }

  return isValid;
}

// Использование
const isValid = await validateFormWithErrors(
  form,
  step1ValidationSchema,
  (errors) => {
    console.log('Ошибки валидации:', errors);
    showToast('Исправьте ошибки в форме');
  }
);
```

### Интеграция с useStepForm хуком

```typescript
// ============================================================================
// Хук с функциональным подходом
// ============================================================================

export function useStepForm<T extends Record<string, any>>(
  createForm: () => GroupNode<T>,
  config: {
    totalSteps: number;
    stepSchemas: Record<number, ValidationSchemaFn<T>>;
    fullSchema: ValidationSchemaFn<T>;
  }
) {
  const [form] = useState(createForm);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const validateCurrentStep = useCallback(async () => {
    const schema = config.stepSchemas[currentStep];
    return await validateForm(form, schema);
  }, [form, currentStep, config.stepSchemas]);

  const goToNextStep = useCallback(async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      form.markAsTouched();
      return false;
    }

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    if (currentStep < config.totalSteps) {
      setCurrentStep(currentStep + 1);
    }

    return true;
  }, [validateCurrentStep, currentStep, completedSteps, config.totalSteps]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    const canGoTo = step === 1 || completedSteps.includes(step - 1);
    if (canGoTo && step >= 1 && step <= config.totalSteps) {
      setCurrentStep(step);
      return true;
    }
    return false;
  }, [completedSteps, config.totalSteps]);

  const submit = useCallback(async (
    onSubmit: (values: T) => Promise<any> | any
  ) => {
    const isValid = await validateForm(form, config.fullSchema);

    if (!isValid) {
      form.markAsTouched();
      return null;
    }

    return form.submit(onSubmit);
  }, [form, config.fullSchema]);

  return {
    form,
    currentStep,
    completedSteps,
    validateCurrentStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    submit,
  };
}

// ============================================================================
// Использование хука
// ============================================================================

function CreditApplicationForm() {
  useSignals();

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
    stepSchemas: {
      1: step1ValidationSchema,
      2: step2ValidationSchema,
      3: step3ValidationSchema,
      4: step4ValidationSchema,
      5: step5ValidationSchema,
      6: step6ValidationSchema,
    },
    fullSchema: fullValidationSchema,
  });

  return (
    <div>
      <StepIndicator
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={goToStep}
      />

      {currentStep === 1 && <BasicInfoForm control={form} />}
      {currentStep === 2 && <PersonalInfoForm control={form} />}
      {/* ... */}

      <NavigationButtons
        currentStep={currentStep}
        completedSteps={completedSteps}
        isSubmitting={form.submitting.value}
        onNext={goToNextStep}
        onPrevious={goToPreviousStep}
        onSubmit={() => submit(async (values) => {
          console.log('Отправка:', values);
        })}
      />
    </div>
  );
}
```

### Плюсы

✅ **Нет изменений в GroupNode**: API остается неизменным
✅ **Простота**: Одна функция, понятное поведение
✅ **Чистая функция**: Нет побочных эффектов, легко тестируется
✅ **Гибкость**: Можно создавать хелперы и композировать
✅ **Типобезопасность**: Полная поддержка TypeScript
✅ **Переиспользование**: Работает с любой формой и схемой
✅ **Производительность**: Одна валидация без перезаписи реестра
✅ **Tree-shaking**: Функцию можно не импортировать, если не нужна

### Минусы

❌ **Требует ValidationRegistry.cancelRegistration()**: Небольшое изменение в реестре
❌ **Доступ к приватным методам**: Нужен доступ к `form.applyContextualValidators()` (или сделать его публичным)
❌ **Нужно импортировать**: Дополнительный импорт в компонентах

### Миграционный путь

1. Добавить метод `cancelRegistration()` в ValidationRegistry
2. Сделать `applyContextualValidators()` публичным в GroupNode (или экспортировать отдельно)
3. Создать файл `src/lib/forms/validators/validate-form.ts` с функцией
4. Экспортировать функцию из `src/lib/forms/validators/index.ts`
5. Удалить `currentStep`/`completedSteps` из схемы формы
6. Создать хук `useStepForm()` для удобства
7. Адаптировать NavigationButtons и StepIndicator
8. Обновить CreditApplicationForm
9. Добавить примеры и тесты

### Сравнение с другими решениями

**vs Решение 1**: Не нужно помнить о восстановлении схемы
**vs Решение 2**: Не требует изменения API GroupNode.validate()
**vs Решение 3**: Проще, меньше абстракций, но можно комбинировать с хуком

---

## Сравнительная таблица решений

| Критерий | Решение 1<br/>(React State) | Решение 2<br/>(validate API) | Решение 3<br/>(Controller) | Решение 4<br/>(validateForm fn) |
|----------|------------------------|-------------------------|------------------------|------------------------|
| **Сложность реализации** | ⭐ Низкая | ⭐⭐ Средняя | ⭐⭐⭐ Высокая | ⭐ Низкая |
| **Изменения в GroupNode** | Нет | Да (метод validate) | Да (Решение 2 + Controller) | Нет |
| **Изменения в ValidationRegistry** | Нет | Да (cancelRegistration) | Да (Решение 2) | Да (cancelRegistration) |
| **Чистота API** | ⭐⭐ Средняя | ⭐⭐⭐ Высокая | ⭐⭐⭐ Высокая | ⭐⭐⭐ Высокая |
| **Переиспользование** | ⭐ Низкое | ⭐⭐ Среднее | ⭐⭐⭐ Высокое | ⭐⭐⭐ Высокое |
| **Производительность** | ⭐⭐ (2 валидации) | ⭐⭐⭐ (1 валидация) | ⭐⭐⭐ (1 валидация) | ⭐⭐⭐ (1 валидация) |
| **Безопасность** | ⭐ (можно забыть схему) | ⭐⭐⭐ (нет побочных эффектов) | ⭐⭐⭐ (инкапсуляция) | ⭐⭐⭐ (нет побочных эффектов) |
| **Типобезопасность** | ⭐⭐ Средняя | ⭐⭐⭐ Высокая | ⭐⭐⭐ Высокая | ⭐⭐⭐ Высокая |
| **Композируемость** | ⭐ Низкая | ⭐⭐ Средняя | ⭐⭐ Средняя | ⭐⭐⭐ Высокая (функции) |
| **Tree-shaking** | N/A | N/A | ⭐⭐ (хук опционален) | ⭐⭐⭐ (можно не импортировать) |

## Рекомендация

### 🏆 **Решение 4 (validateForm функция)** - ЛУЧШИЙ ВЫБОР

**Почему:**
- ✅ Самая простая реализация (одна функция)
- ✅ Не меняет API GroupNode
- ✅ Минимальные изменения (только ValidationRegistry.cancelRegistration)
- ✅ Функциональный подход - легко композировать и тестировать
- ✅ Можно комбинировать с хуком useStepForm для удобства

**Использование:**
```typescript
// Простое использование
const isValid = await validateForm(form, step1ValidationSchema);

// С хуком для удобства
const { goToNextStep, submit } = useStepForm(createForm, config);
```

---

### Альтернативы

**Решение 2 (Расширенный API)** - если предпочитаете ООП подход:
- Валидация как метод формы: `form.validate(schema)`
- Более "традиционный" API
- Требует изменения GroupNode

**Решение 3 (Controller)** - для сложных сценариев:
- Много multi-step форм в проекте
- Нужна сложная логика навигации (условные шаги, ветвление)
- Максимальная инкапсуляция

**Решение 1** - НЕ рекомендуется:
- Только для быстрого прототипа
- Риск багов из-за забытой схемы
- Двойная валидация снижает производительность
