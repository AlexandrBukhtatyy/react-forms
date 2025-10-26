# Вариант 2: Пошаговая валидация

## Описание подхода

Умный подход с **динамической валидацией**: применяем схему валидации только для **текущего шага**. При переходе между шагами удаляем старую валидацию и применяем новую. Это обеспечивает отличный UX и оптимальную производительность.

## Суть решения

- **Динамическое применение валидации**: при смене шага применяется `STEP_VALIDATIONS[currentStep]`
- **Только релевантные ошибки**: пользователь видит ошибки только текущего шага
- **form.valid.value === true** если текущий шаг заполнен корректно
- **Финальная валидация** всей формы при отправке

## Архитектура

### 1. Создать хук для управления валидацией

```typescript
// Файл: src/domains/credit-applications/form/hooks/useStepValidation.ts

import { useEffect } from 'react';
import type { GroupNodeWithControls } from '@/lib/forms';
import type { CreditApplicationForm } from '../types/credit-application';
import { STEP_VALIDATIONS } from '../validation/credit-application-validation';

/**
 * Хук для динамического применения валидации текущего шага
 *
 * @param form - форма кредитной заявки
 * @param currentStep - текущий шаг (1-6)
 */
export const useStepValidation = (
  form: GroupNodeWithControls<CreditApplicationForm>,
  currentStep: number
) => {
  useEffect(() => {
    // Получить схему валидации для текущего шага
    const stepValidation = STEP_VALIDATIONS[currentStep as keyof typeof STEP_VALIDATIONS];

    if (!stepValidation) {
      console.warn(`No validation schema for step ${currentStep}`);
      return;
    }

    // Применить схему валидации для текущего шага
    form.applyValidationSchema(stepValidation);

    // ✅ Очистить ошибки при смене шага (опционально)
    // form.clearErrors();

    // Cleanup не требуется, потому что при следующем вызове
    // applyValidationSchema перезапишет валидаторы
  }, [form, currentStep]);
};
```

### 2. Использовать хук в компоненте формы

```typescript
// Файл: src/domains/credit-applications/form/components/CreditApplicationForm.tsx

import { useState } from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { createCreditApplicationForm } from '../schemas/create-credit-application-form';
import { useStepValidation } from '../hooks/useStepValidation';
import creditApplicationValidation from '../validation/credit-application-validation';

function CreditApplicationForm() {
  useSignals();

  const [form] = useState(() => createCreditApplicationForm());

  const currentStep = form.currentStep.value.value;

  // ✅ Применить валидацию для текущего шага
  useStepValidation(form, currentStep);

  const handleNextStep = async () => {
    // Валидировать текущий шаг
    const isValid = await form.validate();

    if (!isValid) {
      form.markAsTouched();
      alert('Пожалуйста, исправьте ошибки на текущем шаге');
      return;
    }

    // Перейти на следующий шаг
    form.currentStep.setValue(currentStep + 1);
  };

  const submitApplication = async () => {
    // Финальная валидация ВСЕЙ формы
    form.applyValidationSchema(creditApplicationValidation);

    const isValid = await form.validate();

    if (!isValid) {
      form.markAsTouched();
      alert('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    try {
      const values = form.getValue();
      await api.submitCreditApplication(values);
      alert('Заявка успешно отправлена!');
    } catch (error) {
      alert('Произошла ошибка при отправке заявки');
      console.error(error);
    }
  };

  return (
    <div className="w-full">
      <StepIndicator steps={STEPS} control={form} />

      <div className="bg-white p-8 rounded-lg shadow-md">
        {currentStep === 1 && <BasicInfoForm control={form} />}
        {currentStep === 2 && <PersonalInfoForm control={form} />}
        {currentStep === 3 && <ContactInfoForm control={form} />}
        {currentStep === 4 && <EmploymentForm control={form} />}
        {currentStep === 5 && <AdditionalInfoForm control={form} />}
        {currentStep === 6 && <ConfirmationForm control={form} />}
      </div>

      <NavigationButtons
        control={form}
        onNext={handleNextStep}
        onSubmit={submitApplication}
      />
    </div>
  );
}
```

### 3. НЕ применять валидацию при создании формы

```typescript
// Файл: src/domains/credit-applications/form/schemas/create-credit-application-form.ts

export const createCreditApplicationForm = (): GroupNodeWithControls<CreditApplicationForm> => {
  const schema = {
    // ... вся схема формы
  };

  const form = new GroupNode(schema as any);

  // ❌ НЕ применяем валидацию здесь!
  // Валидация будет применена динамически через useStepValidation()

  return form;
};
```

## Как работает

### Жизненный цикл валидации

```
1. Монтирование компонента
   └─> useStepValidation(form, 1)
       └─> form.applyValidationSchema(STEP_VALIDATIONS[1])
           └─> Регистрация валидаторов только для шага 1

2. Пользователь заполняет поля шага 1
   └─> form.validate()
       └─> Проверяются только поля шага 1
       └─> form.valid.value === true (если шаг 1 валиден)

3. Переход на шаг 2
   └─> form.currentStep.setValue(2)
       └─> useEffect в useStepValidation
           └─> form.applyValidationSchema(STEP_VALIDATIONS[2])
               └─> Перерегистрация: удаляются валидаторы шага 1
               └─> Добавляются валидаторы шага 2

4. Финальная отправка
   └─> form.applyValidationSchema(creditApplicationValidation)
       └─> Регистрация ВСЕХ валидаторов (шаги 1-6)
   └─> form.validate()
       └─> Проверяется вся форма
```

### Пример потока для пользователя

```
Шаг 1: Основная информация
├─ Поля: loanType, loanAmount, loanTerm, loanPurpose
├─ Валидация: только этих полей + условные (ипотека/автокредит)
├─ form.valid.value: true (если заполнено корректно)
└─ Кнопка "Далее" → валидация → переход

Шаг 2: Персональные данные
├─ Поля: personalData.*, passportData.*, inn, snils
├─ Валидация: только этих полей
├─ form.valid.value: true (если заполнено корректно)
└─ Кнопка "Далее" → валидация → переход

... (аналогично для шагов 3-5)

Шаг 6: Согласия
├─ Поля: agreePersonalData, agreeCreditHistory, и т.д.
├─ Валидация: только этих полей
├─ form.valid.value: true (если заполнено корректно)
└─ Кнопка "Отправить"
    └─ Применяется полная валидация (все шаги)
    └─ Финальная проверка
    └─ Отправка
```

## Плюсы

### ✅ Отличный UX

- **Только релевантные ошибки**: пользователь видит ошибки текущего шага
- **form.valid === true** на заполненном шаге дает ощущение прогресса
- **Нет путаницы**: незаполненные будущие шаги не мешают
- **Четкий фидбек**: понятно, что нужно исправить прямо сейчас

### ✅ Производительность

- **Валидация минимум полей**: только 5-10 полей вместо 50+
- **Быстрая валидация**: меньше вычислений при каждом изменении
- **Меньше перерендеров**: меньше зависимостей в computed signals

### ✅ Гибкость

- **Легко добавить/убрать шаги**: просто обновить STEP_VALIDATIONS
- **Можно кастомизировать**: разная логика для разных шагов
- **Динамическая валидация**: можно менять правила на лету

### ✅ Безопасность

- **Финальная проверка**: перед отправкой валидируется вся форма
- **Двойная валидация**: и на шагах, и в конце
- **Защита от манипуляций**: нельзя отправить форму с невалидными предыдущими шагами

## Минусы

### ❌ Сложность реализации

- **Больше кода**: нужен хук + логика в компоненте
- **Дополнительная абстракция**: useStepValidation может усложнить понимание
- **Требует тестирования**: нужно проверить переходы между всеми шагами

### ❌ Потенциальные баги

- **Потеря состояния валидации**: при переходе назад ошибки могут исчезнуть
- **Нет истории ошибок**: не видно, какие шаги были невалидными ранее
- **Сложно дебажить**: валидаторы меняются динамически

### ❌ Ограничения

- **Нет кросс-шаговой валидации в runtime**: validateTree не может проверять поля из других шагов
- **Финальная валидация обязательна**: нельзя пропустить последнюю проверку
- **Может быть неожиданность на последнем шаге**: если ранее заполненные поля стали невалидными

## Улучшения и оптимизации

### 1. Кэширование валидации предыдущих шагов

```typescript
// Файл: src/domains/credit-applications/form/hooks/useStepValidation.ts

import { useRef } from 'react';

export const useStepValidation = (
  form: GroupNodeWithControls<CreditApplicationForm>,
  currentStep: number
) => {
  const validatedSteps = useRef<Set<number>>(new Set());

  useEffect(() => {
    const stepValidation = STEP_VALIDATIONS[currentStep as keyof typeof STEP_VALIDATIONS];

    if (!stepValidation) return;

    form.applyValidationSchema(stepValidation);

    // Запомнить, что этот шаг был валидирован
    validatedSteps.current.add(currentStep);
  }, [form, currentStep]);

  // Вернуть функцию для проверки, были ли предыдущие шаги валидированы
  const validateAllPreviousSteps = async (): Promise<boolean> => {
    // Применить валидацию всех шагов до текущего
    const allValidationUpToCurrentStep = (path: FieldPath<CreditApplicationForm>) => {
      for (let step = 1; step <= currentStep; step++) {
        const validation = STEP_VALIDATIONS[step as keyof typeof STEP_VALIDATIONS];
        if (validation) {
          validation(path);
        }
      }
    };

    form.applyValidationSchema(allValidationUpToCurrentStep);
    return await form.validate();
  };

  return { validateAllPreviousSteps };
};
```

### 2. Индикатор валидности каждого шага

```typescript
// Файл: src/domains/credit-applications/form/hooks/useStepValidationStatus.ts

import { useState, useEffect } from 'react';
import type { GroupNodeWithControls } from '@/lib/forms';
import type { CreditApplicationForm } from '../types/credit-application';

type StepStatus = 'not_started' | 'in_progress' | 'valid' | 'invalid';

export const useStepValidationStatus = (
  form: GroupNodeWithControls<CreditApplicationForm>
) => {
  const [stepStatuses, setStepStatuses] = useState<Record<number, StepStatus>>({
    1: 'not_started',
    2: 'not_started',
    3: 'not_started',
    4: 'not_started',
    5: 'not_started',
    6: 'not_started',
  });

  const updateStepStatus = async (step: number) => {
    // Применить валидацию конкретного шага
    const stepValidation = STEP_VALIDATIONS[step as keyof typeof STEP_VALIDATIONS];
    if (!stepValidation) return;

    form.applyValidationSchema(stepValidation);
    const isValid = await form.validate();

    setStepStatuses(prev => ({
      ...prev,
      [step]: isValid ? 'valid' : 'invalid',
    }));
  };

  return { stepStatuses, updateStepStatus };
};
```

Использование в компоненте:

```typescript
const { stepStatuses, updateStepStatus } = useStepValidationStatus(form);

const handleNextStep = async () => {
  await updateStepStatus(currentStep);

  if (stepStatuses[currentStep] === 'valid') {
    form.currentStep.setValue(currentStep + 1);
  } else {
    alert('Исправьте ошибки на текущем шаге');
  }
};

// Отображение в StepIndicator
<StepIndicator
  steps={STEPS}
  control={form}
  stepStatuses={stepStatuses}
/>
```

### 3. Поддержка навигации назад с сохранением валидации

```typescript
const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));

const handleNextStep = async () => {
  const isValid = await form.validate();

  if (!isValid) {
    form.markAsTouched();
    return;
  }

  // Запомнить, что этот шаг посещен и валиден
  setVisitedSteps(prev => new Set([...prev, currentStep + 1]));
  form.currentStep.setValue(currentStep + 1);
};

const handlePrevStep = () => {
  // При возврате назад не валидируем, просто переходим
  form.currentStep.setValue(currentStep - 1);
};
```

## Рекомендации по использованию

### Когда использовать этот вариант

✅ **Подходит для**:
- Больших многошаговых форм (5+ шагов)
- Форм с большим количеством полей (30+)
- Когда важен UX и ощущение прогресса
- Когда шаги логически независимы

❌ **Не подходит для**:
- Форм с сильной кросс-шаговой зависимостью
- Когда нужна одновременная валидация всех полей
- Когда требуется простота (используйте Вариант 1)

### Best Practices

1. **Всегда делайте финальную валидацию** всей формы перед отправкой
2. **Кэшируйте результаты** валидации предыдущих шагов
3. **Показывайте прогресс**: индикатор валидных/невалидных шагов
4. **Разрешите возврат** на предыдущие шаги без потери данных
5. **Тестируйте переходы**: особенно edge cases (пропуск шагов, возврат назад)

## Заключение

**Вариант 2** — это оптимальное решение для **больших многошаговых форм** с акцентом на UX и производительность. Он требует чуть больше кода, чем Вариант 1, но обеспечивает:

- Лучший пользовательский опыт
- Быструю валидацию
- Четкий фидбек на каждом шаге
- Гибкость и расширяемость

**Рекомендация**: использовать этот вариант для **production-версии** формы кредитной заявки с 6 шагами и 50+ полями. Дополнительная сложность окупается качеством UX.
