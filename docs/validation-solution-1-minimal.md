# Вариант 1: Минимальные изменения

## Описание подхода

Самый простой и прямолинейный подход — раскомментировать валидацию в `create-credit-application-form.ts` и применить всю схему валидации сразу при создании формы. Никаких архитектурных изменений, минимум кода.

## Суть решения

- Применить **всю схему валидации** (`creditApplicationValidation`) при инициализации формы
- Валидация всех 6 шагов регистрируется одновременно
- Валидаторы срабатывают при вызове `form.validate()` или валидации конкретного поля
- Условная валидация (`applyWhen`) автоматически проверяет условия

## Необходимые изменения кода

### 1. Раскомментировать валидацию в `create-credit-application-form.ts`

```typescript
// Файл: src/domains/credit-applications/form/schemas/create-credit-application-form.ts

import creditApplicationValidation from '../validation/credit-application-validation';

export const createCreditApplicationForm = (): GroupNodeWithControls<CreditApplicationForm> => {
  const schema = {
    // ... вся схема формы
  };

  const form = new GroupNode(schema as any);

  // ✅ Раскомментировать эту строку
  form.applyValidationSchema(creditApplicationValidation);

  return form;
};
```

### 2. Проверить импорты в validation файлах (уже готово)

Все импорты уже корректны:
```typescript
// ✅ Все файлы валидации используют правильные импорты
import type { FieldPath, ValidationSchemaFn } from '@/lib/forms/types';
import { required, min, max, applyWhen, validateTree } from '@/lib/forms/validators';
```

### 3. Опционально: настроить когда валидировать

В компоненте формы можно настроить, когда запускать валидацию:

```typescript
// Файл: src/domains/credit-applications/form/components/CreditApplicationForm.tsx

const handleNextStep = async () => {
  // Валидировать всю форму перед переходом (опционально)
  const isValid = await form.validate();

  if (!isValid) {
    form.markAsTouched();
    alert('Пожалуйста, исправьте ошибки');
    return;
  }

  // Переход на следующий шаг
  form.currentStep.setValue(currentStep + 1);
};
```

## Как работает

### Регистрация валидаторов

При вызове `form.applyValidationSchema(creditApplicationValidation)`:

1. Создается `FieldPath` для доступа к полям формы
2. Вызываются все функции валидации (шаги 1-6)
3. Валидаторы регистрируются в `ValidationRegistry`
4. Каждый валидатор привязывается к соответствующему полю

### Выполнение валидации

При вызове `form.validate()` или `form.email.validate()`:

1. GroupNode проходит по всем зарегистрированным валидаторам
2. Проверяет условия `applyWhen` (если есть)
3. Выполняет синхронные валидаторы
4. Выполняет асинхронные валидаторы параллельно
5. Устанавливает ошибки через `setErrors()`

### Пример: условная валидация

```typescript
// Валидация ипотеки применяется только когда loanType === 'mortgage'
applyWhen(
  path.loanType,
  (type) => type === 'mortgage',
  (path) => {
    required(path.propertyValue, { message: 'Укажите стоимость недвижимости' });
    required(path.initialPayment, { message: 'Укажите первоначальный взнос' });
  }
);
```

## Плюсы

### ✅ Простота и надежность
- **Минимум кода**: одна строка `form.applyValidationSchema(creditApplicationValidation)`
- **Нет архитектурных изменений**: используем готовый API
- **Легко тестировать**: вся валидация в одном месте

### ✅ Полная валидация
- **Все поля валидируются**: гарантия корректности данных
- **Кросс-полевая валидация работает**: `validateTree` проверяет связи между шагами
- **Условная логика**: `applyWhen` автоматически скрывает/показывает валидацию

### ✅ Консистентность
- **Единая схема**: все правила валидации в одном месте
- **Переиспользование**: можно использовать `STEP_VALIDATIONS` для частичной проверки
- **Типобезопасность**: `FieldPath<CreditApplicationForm>` гарантирует правильные пути

## Минусы

### ❌ Производительность
- **Валидация всей формы сразу**: может быть медленно на больших формах
- **Ненужные проверки**: валидируются поля из всех 6 шагов, даже если пользователь на шаге 1
- **Потенциально много ошибок**: пользователь видит ошибки для незаполненных шагов

### ❌ UX
- **form.valid.value === false** всегда на первых шагах, потому что поля следующих шагов не заполнены
- **Индикатор прогресса может быть некорректным**: "невалидная форма" не значит "ошибка в текущем шаге"
- **Сложно показать только ошибки текущего шага**: нужна дополнительная фильтрация

### ❌ Гибкость
- **Нет контроля над тем, когда валидировать**: валидация либо включена, либо нет
- **Сложно добавить динамическую валидацию**: нельзя легко менять правила на лету
- **Трудно отключить валидацию для конкретного шага**: нужно править схему

## Рекомендации по использованию

### Когда использовать этот вариант

✅ **Подходит для**:
- Небольших форм (до 20-30 полей)
- Простых многошаговых форм без сложной логики
- Прототипов и MVP
- Когда нужно быстро запустить валидацию

❌ **Не подходит для**:
- Больших форм с 50+ полями
- Форм с частыми изменениями схемы валидации
- Когда важна производительность на мобильных устройствах
- Когда нужна пошаговая валидация с четким UX

### Как улучшить UX

#### 1. Валидировать только при необходимости

```typescript
// Валидировать только при переходе между шагами
const handleNextStep = async () => {
  const isValid = await form.validate();
  if (!isValid) {
    // Показать только ошибки текущего шага
    const currentStepErrors = form.errors.value.filter(
      err => /* логика фильтрации по текущему шагу */
    );
    if (currentStepErrors.length > 0) {
      alert('Исправьте ошибки на текущем шаге');
      return;
    }
  }
  form.currentStep.setValue(currentStep + 1);
};
```

#### 2. Использовать `form.touched` для показа ошибок

```typescript
// Показывать ошибки только для touched полей
{form.email.touched.value && form.email.errors.value.length > 0 && (
  <div className="error">
    {form.email.errors.value[0].message}
  </div>
)}
```

#### 3. Частичная валидация конкретного шага

```typescript
// Использовать STEP_VALIDATIONS для валидации одного шага
import { STEP_VALIDATIONS } from '../validation/credit-application-validation';

const validateCurrentStep = async () => {
  const stepValidation = STEP_VALIDATIONS[currentStep];

  // Создать временную форму только с полями текущего шага
  // и применить валидацию только для этого шага
  // (требует дополнительной реализации)
};
```

## Пример полной интеграции

### create-credit-application-form.ts

```typescript
import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import creditApplicationValidation from '../validation/credit-application-validation';

export const createCreditApplicationForm = () => {
  const schema = {
    // ... вся схема
  };

  const form = new GroupNode(schema as any);

  // Применяем валидацию
  form.applyValidationSchema(creditApplicationValidation);

  return form;
};
```

### CreditApplicationForm.tsx

```typescript
function CreditApplicationForm() {
  const [form] = useState(() => createCreditApplicationForm());
  const currentStep = form.currentStep.value.value;

  const handleNextStep = async () => {
    // Валидация всей формы
    const isValid = await form.validate();

    if (!isValid) {
      form.markAsTouched();
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    form.currentStep.setValue(currentStep + 1);
  };

  const submitApplication = async () => {
    const isValid = await form.validate();
    if (!isValid) {
      form.markAsTouched();
      alert('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    // Отправка формы
    const values = form.getValue();
    await api.submitCreditApplication(values);
  };

  return (
    <div>
      <StepIndicator steps={STEPS} control={form} />

      {/* Рендер текущего шага */}
      {currentStep === 1 && <BasicInfoForm control={form} />}
      {/* ... остальные шаги */}

      <NavigationButtons
        control={form}
        onNext={handleNextStep}
        onSubmit={submitApplication}
      />
    </div>
  );
}
```

## Заключение

**Вариант 1** — это самое простое и быстрое решение для интеграции валидации. Он требует минимум изменений (буквально одну строку кода) и использует уже написанные валидационные схемы без модификаций.

Однако для большой формы с 6 шагами и множеством условных полей этот подход может привести к проблемам с UX и производительностью. Пользователь будет видеть форму как "невалидную" с первого шага, что может сбивать с толку.

**Рекомендация**: использовать как **стартовую точку** для быстрого запуска валидации, затем при необходимости мигрировать на **Вариант 2** (пошаговая валидация) для улучшения UX.
