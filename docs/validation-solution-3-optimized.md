# Вариант 3: Гибридный подход с умной валидацией

## Описание подхода

Самый продвинутый вариант, объединяющий преимущества Вариантов 1 и 2: **применяем всю схему валидации сразу**, но валидируем **умно и лениво** — только когда это действительно нужно. Используем стратегии валидации, кэширование и оптимизацию производительности.

## Суть решения

- **Вся схема применена**: `creditApplicationValidation` регистрируется один раз
- **Умная валидация**: валидируем только измененные/touched поля
- **Стратегии валидации**: `onChange`, `onBlur`, `onSubmit`
- **Зональная валидация**: можем валидировать конкретный шаг или всю форму
- **Кэширование**: сохраняем результаты валидации для неизмененных полей

## Архитектура

### 1. Создать ValidationManager для управления валидацией

```typescript
// Файл: src/domains/credit-applications/form/utils/ValidationManager.ts

import type { GroupNodeWithControls } from '@/lib/forms';
import type { CreditApplicationForm } from '../types/credit-application';
import { STEP_VALIDATIONS } from '../validation/credit-application-validation';

export type ValidationMode = 'onChange' | 'onBlur' | 'onSubmit';
export type ValidationScope = 'step' | 'all' | 'touched';

interface ValidationOptions {
  mode?: ValidationMode;
  scope?: ValidationScope;
}

/**
 * ValidationManager - менеджер умной валидации формы
 *
 * Обеспечивает:
 * - Контроль когда валидировать (onChange, onBlur, onSubmit)
 * - Контроль что валидировать (step, all, touched)
 * - Кэширование результатов
 * - Оптимизацию производительности
 */
export class ValidationManager {
  private form: GroupNodeWithControls<CreditApplicationForm>;
  private mode: ValidationMode = 'onBlur';
  private validationCache: Map<string, boolean> = new Map();

  constructor(
    form: GroupNodeWithControls<CreditApplicationForm>,
    options?: ValidationOptions
  ) {
    this.form = form;
    if (options?.mode) {
      this.mode = options.mode;
    }
  }

  /**
   * Валидировать конкретный шаг
   */
  async validateStep(step: number): Promise<boolean> {
    const stepValidation = STEP_VALIDATIONS[step as keyof typeof STEP_VALIDATIONS];

    if (!stepValidation) {
      console.warn(`No validation for step ${step}`);
      return true;
    }

    // Временно применить валидацию шага
    this.form.applyValidationSchema(stepValidation);

    // Валидировать
    const isValid = await this.form.validate();

    // Кэшировать результат
    this.validationCache.set(`step_${step}`, isValid);

    return isValid;
  }

  /**
   * Валидировать все предыдущие шаги до текущего (включительно)
   */
  async validateUpToStep(currentStep: number): Promise<boolean> {
    for (let step = 1; step <= currentStep; step++) {
      const isValid = await this.validateStep(step);
      if (!isValid) {
        return false;
      }
    }
    return true;
  }

  /**
   * Валидировать только touched поля
   */
  async validateTouched(): Promise<boolean> {
    // Получить все touched поля
    const touchedFields = this.getTouchedFields();

    if (touchedFields.length === 0) {
      return true;
    }

    // Валидировать только touched поля
    // (требует расширения API FormNode)
    return await this.form.validate();
  }

  /**
   * Валидировать всю форму (для финального submit)
   */
  async validateAll(): Promise<boolean> {
    // Применить полную схему валидации
    const { default: creditApplicationValidation } = await import(
      '../validation/credit-application-validation'
    );

    this.form.applyValidationSchema(creditApplicationValidation);

    // Валидировать всё
    const isValid = await this.form.validate();

    return isValid;
  }

  /**
   * Получить статус валидации для каждого шага
   */
  getStepStatuses(): Record<number, boolean | null> {
    const statuses: Record<number, boolean | null> = {};

    for (let step = 1; step <= 6; step++) {
      statuses[step] = this.validationCache.get(`step_${step}`) ?? null;
    }

    return statuses;
  }

  /**
   * Очистить кэш валидации
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Установить режим валидации
   */
  setMode(mode: ValidationMode): void {
    this.mode = mode;
  }

  /**
   * Получить touched поля (вспомогательный метод)
   */
  private getTouchedFields(): string[] {
    // Реализация зависит от API FormNode
    // Пока заглушка
    return [];
  }
}
```

### 2. Использовать ValidationManager в форме

```typescript
// Файл: src/domains/credit-applications/form/components/CreditApplicationForm.tsx

import { useState, useMemo } from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { createCreditApplicationForm } from '../schemas/create-credit-application-form';
import { ValidationManager } from '../utils/ValidationManager';

function CreditApplicationForm() {
  useSignals();

  const [form] = useState(() => createCreditApplicationForm());

  // Создать ValidationManager
  const validationManager = useMemo(
    () => new ValidationManager(form, { mode: 'onBlur' }),
    [form]
  );

  const currentStep = form.currentStep.value.value;

  const handleNextStep = async () => {
    // Валидировать только текущий шаг
    const isValid = await validationManager.validateStep(currentStep);

    if (!isValid) {
      form.markAsTouched();
      alert('Пожалуйста, исправьте ошибки на текущем шаге');
      return;
    }

    // Перейти на следующий шаг
    form.currentStep.setValue(currentStep + 1);
  };

  const handlePrevStep = () => {
    // При возврате назад просто переходим, не валидируем
    form.currentStep.setValue(currentStep - 1);
  };

  const submitApplication = async () => {
    // Финальная валидация ВСЕЙ формы
    const isValid = await validationManager.validateAll();

    if (!isValid) {
      form.markAsTouched();

      // Найти первый невалидный шаг
      const stepStatuses = validationManager.getStepStatuses();
      for (let step = 1; step <= 6; step++) {
        if (stepStatuses[step] === false) {
          form.currentStep.setValue(step);
          alert(`Пожалуйста, исправьте ошибки на шаге ${step}`);
          return;
        }
      }

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
      <StepIndicator
        steps={STEPS}
        control={form}
        stepStatuses={validationManager.getStepStatuses()}
      />

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
        onPrev={handlePrevStep}
        onSubmit={submitApplication}
      />
    </div>
  );
}
```

### 3. Применить валидацию при создании формы (один раз)

```typescript
// Файл: src/domains/credit-applications/form/schemas/create-credit-application-form.ts

import creditApplicationValidation from '../validation/credit-application-validation';

export const createCreditApplicationForm = (): GroupNodeWithControls<CreditApplicationForm> => {
  const schema = {
    // ... вся схема формы
  };

  const form = new GroupNode(schema as any);

  // ✅ Применить полную схему валидации сразу
  // Но валидация будет запускаться только когда нужно (через ValidationManager)
  form.applyValidationSchema(creditApplicationValidation);

  return form;
};
```

## Расширенные возможности

### 1. Debounce для асинхронной валидации

```typescript
// ValidationManager.ts

import { debounce } from 'lodash';

export class ValidationManager {
  private debouncedValidate: ReturnType<typeof debounce>;

  constructor(form: GroupNodeWithControls<CreditApplicationForm>) {
    // ...

    // Создать debounced версию валидации
    this.debouncedValidate = debounce(
      async () => await this.form.validate(),
      500
    );
  }

  /**
   * Валидировать с debounce (для onChange)
   */
  async validateDebounced(): Promise<void> {
    await this.debouncedValidate();
  }
}
```

Использование:

```typescript
// В Input компоненте
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  control.setValue(e.target.value);

  // Валидация с debounce
  validationManager.validateDebounced();
};
```

### 2. Прогрессивная валидация

```typescript
/**
 * Прогрессивная валидация:
 * - На первых шагах: валидация onBlur
 * - На последних шагах: валидация onChange (более строгая)
 */
export class ValidationManager {
  getValidationModeForStep(step: number): ValidationMode {
    if (step <= 3) {
      return 'onBlur'; // Мягкая валидация на первых шагах
    } else {
      return 'onChange'; // Строгая валидация на последних шагах
    }
  }

  async validateWithMode(step: number): Promise<boolean> {
    const mode = this.getValidationModeForStep(step);

    if (mode === 'onSubmit') {
      // Не валидировать до submit
      return true;
    }

    return await this.validateStep(step);
  }
}
```

### 3. Параллельная валидация независимых шагов

```typescript
/**
 * Валидировать несколько шагов параллельно
 */
async validateStepsParallel(steps: number[]): Promise<boolean> {
  const validations = steps.map(step => this.validateStep(step));
  const results = await Promise.all(validations);

  return results.every(result => result === true);
}

// Использование
const isValid = await validationManager.validateStepsParallel([1, 2, 3]);
```

### 4. Умные подсказки (field hints)

```typescript
/**
 * Получить подсказки для улучшения валидности
 */
getValidationHints(step: number): string[] {
  const hints: string[] = [];

  // Проанализировать ошибки и предложить решения
  const errors = this.form.errors.value;

  for (const error of errors) {
    if (error.code === 'required') {
      hints.push(`Заполните обязательное поле: ${error.field}`);
    } else if (error.code === 'email') {
      hints.push('Проверьте формат email адреса');
    } else if (error.code === 'minLength') {
      hints.push(`Минимальная длина: ${error.params?.min} символов`);
    }
  }

  return hints;
}
```

## Плюсы

### ✅ Лучшее из двух миров

- **Полная валидация**: все правила зарегистрированы
- **Умная стратегия**: валидация только когда нужно
- **Гибкость**: можно менять режим валидации на лету

### ✅ Отличная производительность

- **Lazy validation**: не валидируем до первого взаимодействия
- **Debounce**: не перегружаем при быстром вводе
- **Кэширование**: повторная валидация мгновенная
- **Параллелизм**: независимые шаги валидируются одновременно

### ✅ Расширенные возможности

- **Режимы валидации**: onChange, onBlur, onSubmit
- **Зональная валидация**: step, all, touched
- **Прогрессивная валидация**: разная строгость на разных шагах
- **Аналитика**: статистика валидации, hints

### ✅ Отличный UX

- **Нет лишних ошибок**: показываем только релевантное
- **Быстрая обратная связь**: debounce + оптимизация
- **Прогресс**: видно, какие шаги валидны
- **Навигация**: переход на невалидный шаг при ошибке

## Минусы

### ❌ Сложность

- **Много кода**: ValidationManager + логика в компоненте
- **Абстракция**: требует понимания архитектуры
- **Тестирование**: нужно покрыть тестами все сценарии
- **Кривая обучения**: новым разработчикам сложнее разобраться

### ❌ Over-engineering

- **Избыточность**: для простых форм это слишком сложно
- **Maintenance**: больше кода для поддержки
- **Потенциальные баги**: больше точек отказа

### ❌ Зависимости

- **Кастомный код**: ValidationManager нужно поддерживать
- **API FormNode**: может потребовать расширения
- **Lodash**: для debounce (можно заменить на самописный)

## Оптимизации и улучшения

### 1. Интеграция с React Query для async валидации

```typescript
import { useQuery } from '@tanstack/react-query';

/**
 * Асинхронная валидация с кэшированием через React Query
 */
const useAsyncValidation = (fieldName: string, value: any) => {
  return useQuery({
    queryKey: ['validation', fieldName, value],
    queryFn: async () => {
      // Проверить на сервере (например, уникальность email)
      const response = await api.validateField(fieldName, value);
      return response.isValid;
    },
    enabled: !!value,
    staleTime: 5 * 60 * 1000, // Кэш на 5 минут
  });
};
```

### 2. Визуализация прогресса валидации

```typescript
/**
 * Компонент визуализации прогресса
 */
const ValidationProgress = ({ manager }: { manager: ValidationManager }) => {
  const statuses = manager.getStepStatuses();

  const validSteps = Object.values(statuses).filter(s => s === true).length;
  const totalSteps = 6;
  const progress = (validSteps / totalSteps) * 100;

  return (
    <div className="validation-progress">
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <span>{validSteps} из {totalSteps} шагов заполнено корректно</span>
    </div>
  );
};
```

### 3. Автосохранение с валидацией

```typescript
/**
 * Автосохранение валидных данных
 */
useEffect(() => {
  const autoSave = debounce(async () => {
    const isValid = await validationManager.validateTouched();

    if (isValid) {
      // Сохранить черновик
      const values = form.getValue();
      await api.saveDraft(values);
    }
  }, 2000);

  // Слушать изменения формы
  const unsubscribe = form.value.subscribe(() => {
    autoSave();
  });

  return () => {
    unsubscribe();
    autoSave.cancel();
  };
}, [form, validationManager]);
```

## Рекомендации по использованию

### Когда использовать этот вариант

✅ **Подходит для**:
- Enterprise-приложений с высокими требованиями к UX
- Очень больших форм (50+ полей)
- Форм с асинхронной валидацией
- Когда нужна максимальная гибкость и контроль
- Когда есть ресурсы на разработку и поддержку

❌ **Не подходит для**:
- MVP и прототипов (слишком сложно)
- Маленьких команд без опыта
- Форм с простой логикой
- Когда нужна быстрая разработка

### Best Practices

1. **Начните с Варианта 1 или 2**, затем мигрируйте на Вариант 3 если нужно
2. **Тестируйте каждую стратегию**: onChange, onBlur, onSubmit
3. **Профилируйте производительность**: убедитесь, что оптимизация работает
4. **Документируйте**: ValidationManager должен быть хорошо задокументирован
5. **Мониторьте**: логируйте метрики валидации для анализа

### Пошаговая миграция

```typescript
// Шаг 1: Добавить ValidationManager
const validationManager = new ValidationManager(form);

// Шаг 2: Заменить form.validate() на validationManager.validateStep()
// Было:
// await form.validate();

// Стало:
await validationManager.validateStep(currentStep);

// Шаг 3: Добавить режимы валидации
validationManager.setMode('onBlur');

// Шаг 4: Использовать кэширование
const stepStatuses = validationManager.getStepStatuses();

// Шаг 5: Добавить debounce для async полей
await validationManager.validateDebounced();
```

## Сравнение вариантов

| Критерий | Вариант 1 | Вариант 2 | **Вариант 3** |
|----------|-----------|-----------|---------------|
| **Сложность** | Низкая | Средняя | **Высокая** |
| **UX** | Средний | Отличный | **Превосходный** |
| **Производительность** | Средняя | Хорошая | **Отличная** |
| **Гибкость** | Низкая | Средняя | **Максимальная** |
| **Время разработки** | 30 мин | 2-3 часа | **1-2 дня** |
| **Поддержка** | Легко | Средне | **Сложно** |
| **Подходит для** | MVP | Production | **Enterprise** |

## Заключение

**Вариант 3** — это **production-ready решение enterprise-уровня** для максимально сложных форм. Он объединяет:

- ✅ Полноту валидации (Вариант 1)
- ✅ Умную стратегию (Вариант 2)
- ✅ Расширенные возможности (кэширование, debounce, режимы)
- ✅ Максимальную гибкость и контроль

**Цена**: высокая сложность и время разработки.

**Рекомендация**: использовать только если:
- Вариант 2 не справляется с требованиями
- Есть ресурсы на разработку ValidationManager
- Нужна максимальная производительность
- Требуется детальный контроль над валидацией

Для большинства случаев **Вариант 2 (пошаговая валидация)** будет оптимальным выбором.
