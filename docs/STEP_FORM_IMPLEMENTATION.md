# Имплементация Решения 4: validateForm + useStepForm

## ✅ Выполнено

Реализовано **Решение 4** из [STEP_FORM_SOLUTIONS.md](STEP_FORM_SOLUTIONS.md) - функциональный подход с `validateForm()` и хуком `useStepForm`.

---

## 📋 Что было сделано

### 1. ValidationRegistry: добавлен метод cancelRegistration()

**Файл**: [src/lib/forms/validators/validation-registry.ts](../src/lib/forms/validators/validation-registry.ts#L197-L206)

```typescript
/**
 * Отменить текущую регистрацию без сохранения в реестр
 * Используется для временной валидации (например, validateForm())
 */
cancelRegistration(): void {
  if (this.contextStack.length === 0) {
    throw new Error('No active registration context to cancel');
  }
  this.contextStack.pop();
}
```

---

### 2. GroupNode: сделан applyContextualValidators публичным

**Файл**: [src/lib/forms/core/nodes/group-node.ts](../src/lib/forms/core/nodes/group-node.ts#L260-L266)

```typescript
/**
 * Применить contextual валидаторы к полям
 *
 * Метод публичный для использования в validateForm() утилите
 * @internal
 */
async applyContextualValidators(validators: any[]): Promise<void> {
  // ... реализация
}
```

---

### 3. Создана функция validateForm

**Файл**: [src/lib/forms/validators/validate-form.ts](../src/lib/forms/validators/validate-form.ts)

Чистая функция для валидации формы по схеме без изменения ValidationRegistry:

```typescript
export async function validateForm<T extends Record<string, any>>(
  form: GroupNode<T>,
  schema: ValidationSchemaFn<T>
): Promise<boolean>
```

**Особенности**:
- Создает временный контекст валидации
- Применяет валидаторы без сохранения в реестр
- Очищает ошибки перед валидацией
- Возвращает результат валидации

**Использование**:
```typescript
// Валидация отдельного шага
const isValid = await validateForm(form, step1ValidationSchema);

// Валидация полной формы
const isValid = await validateForm(form, fullValidationSchema);
```

---

### 4. Создан хук useStepForm

**Файл**: [src/lib/forms/hooks/useStepForm.ts](../src/lib/forms/hooks/useStepForm.ts)

Хук для управления multi-step формами с инкапсуляцией всей логики:

```typescript
const {
  form,                    // GroupNode формы
  currentStep,             // Текущий шаг (1-based)
  completedSteps,          // Завершенные шаги
  goToNextStep,            // Переход на следующий шаг с валидацией
  goToPreviousStep,        // Переход на предыдущий шаг
  goToStep,                // Переход на конкретный шаг
  submit,                  // Отправка формы с полной валидацией
  isFirstStep,             // Первый ли это шаг
  isLastStep,              // Последний ли это шаг
} = useStepForm(createForm, config);
```

**Конфигурация**:
```typescript
{
  totalSteps: 6,
  stepSchemas: {
    1: step1ValidationSchema,
    2: step2ValidationSchema,
    // ...
  },
  fullSchema: fullValidationSchema,
}
```

---

### 5. Удалены currentStep/completedSteps из формы

**Изменения**:

1. **Тип формы** ([types/credit-application.ts](../src/domains/credit-applications/form/types/credit-application.ts)):
   - ❌ Удалены `currentStep: number`
   - ❌ Удалены `completedSteps: number[]`

2. **Схема формы** ([schemas/create-credit-application-form.ts](../src/domains/credit-applications/form/schemas/create-credit-application-form.ts)):
   - ❌ Удалены поля `currentStep` и `completedSteps`
   - ❌ Удалено `form.applyValidationSchema(creditApplicationValidation)`

---

### 6. Адаптированы NavigationButtons и StepIndicator

#### NavigationButtons

**Файл**: [src/lib/forms/components/other/NavigationButtons.tsx](../src/lib/forms/components/other/NavigationButtons.tsx)

**Было**:
```typescript
interface NavigationButtonsProps {
  control: GroupNodeWithControls<any>;
  onSubmit: () => void;
}
```

**Стало**:
```typescript
interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
}
```

#### StepIndicator

**Файл**: [src/lib/forms/components/other/StepIndicator.tsx](../src/lib/forms/components/other/StepIndicator.tsx)

**Было**:
```typescript
interface StepIndicatorProps {
  steps: Array<{...}>;
  control: any;
}
```

**Стало**:
```typescript
interface StepIndicatorProps {
  steps: Array<{...}>;
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}
```

---

### 7. Обновлен CreditApplicationForm

**Файл**: [src/domains/credit-applications/form/components/CreditApplicationForm.tsx](../src/domains/credit-applications/form/components/CreditApplicationForm.tsx)

**Было**:
```typescript
const [form] = useState(() => createCreditApplicationForm());
const currentStep = form.currentStep.value.value;

const submitApplication = async () => {
  const isValid = await form.validate();
  // ...
};
```

**Стало**:
```typescript
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

const submitApplication = async () => {
  const result = await submit(async (values) => {
    console.log('Отправка формы:', values);
    return values;
  });

  if (result) {
    alert('Заявка успешно отправлена!');
  } else {
    alert('Пожалуйста, исправьте ошибки в форме');
  }
};
```

**Использование компонентов**:
```typescript
<StepIndicator
  steps={STEPS}
  currentStep={currentStep}
  completedSteps={completedSteps}
  onStepClick={goToStep}
/>

<NavigationButtons
  currentStep={currentStep}
  totalSteps={6}
  isSubmitting={form.submitting.value}
  onNext={goToNextStep}
  onPrevious={goToPreviousStep}
  onSubmit={submitApplication}
/>
```

---

## 🎯 Преимущества реализации

### ✅ Разделение ответственности
- **GroupNode** содержит только данные формы (доменная модель)
- **React state** (внутри useStepForm) управляет UI-состоянием шагов
- **validateForm** - чистая функция для валидации

### ✅ Чистый API
```typescript
// Валидация шага
const isValid = await validateForm(form, step1ValidationSchema);

// Или через хук
await goToNextStep(); // Валидирует текущий шаг автоматически
```

### ✅ Нет побочных эффектов
- `validateForm()` не изменяет ValidationRegistry
- Валидация по шагам не влияет на полную схему

### ✅ Переиспользуемость
```typescript
// Хук работает с ЛЮБОЙ формой
const { form, goToNextStep } = useStepForm(createMyForm, {
  totalSteps: 3,
  stepSchemas: { 1: step1Schema, 2: step2Schema, 3: step3Schema },
  fullSchema: fullSchema,
});
```

### ✅ Типобезопасность
- Полная типизация TypeScript
- `GroupNodeWithControls<T>` для доступа к полям через Proxy
- Типизированные validation schemas

---

## 📝 Примеры использования

### Простое использование validateForm

```typescript
import { validateForm } from '@/lib/forms';

// Валидация одного шага
const validateStep1 = async () => {
  const isValid = await validateForm(form, step1ValidationSchema);

  if (!isValid) {
    form.markAsTouched();
    alert('Исправьте ошибки');
    return;
  }

  // Переход на следующий шаг
  setCurrentStep(2);
};
```

### Использование хука useStepForm

```typescript
import { useStepForm } from '@/lib/forms';

function MyMultiStepForm() {
  const {
    form,
    currentStep,
    goToNextStep,
    submit,
  } = useStepForm(createMyForm, {
    totalSteps: 3,
    stepSchemas: {
      1: step1Schema,
      2: step2Schema,
      3: step3Schema,
    },
    fullSchema: fullSchema,
  });

  return (
    <div>
      {currentStep === 1 && <Step1 control={form} />}
      {currentStep === 2 && <Step2 control={form} />}
      {currentStep === 3 && <Step3 control={form} />}

      <button onClick={goToNextStep}>Далее</button>
      <button onClick={() => submit(onSubmit)}>Отправить</button>
    </div>
  );
}
```

### Создание хелперов

```typescript
// Валидация нескольких шагов
async function validateSteps(
  form: GroupNode<any>,
  steps: number[]
): Promise<boolean> {
  for (const step of steps) {
    const schema = stepSchemas[step];
    const isValid = await validateForm(form, schema);
    if (!isValid) return false;
  }
  return true;
}

// Использование
const isValid = await validateSteps(form, [1, 2, 3]);
```

---

## 🚀 Результат

Dev-сервер успешно запущен: **http://localhost:5173**

Все изменения применены, форма работает с новой архитектурой:
- ✅ Валидация по шагам через `validateForm()`
- ✅ Управление состоянием через `useStepForm`
- ✅ Разделение доменной модели и UI-состояния
- ✅ Чистый и типобезопасный API
- ✅ Полная переиспользуемость кода

---

## 📚 Дополнительные материалы

- [STEP_FORM_SOLUTIONS.md](STEP_FORM_SOLUTIONS.md) - все 4 варианта решения с анализом
- [PROMT.md](../PROMT.md) - оригинальная постановка задачи
- [CLAUDE.md](../CLAUDE.md) - общая архитектура проекта
