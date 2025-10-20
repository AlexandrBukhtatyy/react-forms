# Пошаговая инструкция: Перенос формы заявки на кредит в Form2Page

> **Статус выполнения**: ✅ Базовая реализация завершена (7/11 шагов выполнено)
> **Последнее обновление**: 2025-10-19

## Контекст

**Исходный материал**: `docs/signals-in-angular/` - документация с примером формы заявки на кредит
**Целевой компонент**: `src/pages/Form2Page.tsx`
**Архитектура**: React + @preact/signals-react + FormStore + Domain-Driven Design
**Требование**: Использовать компонент `FormField` для каждого поля

**Текущее состояние проекта**:
- ✅ Базовая архитектура (FormStore, FieldController) реализована
- ✅ Базовые компоненты (Input, Select, Textarea, Checkbox, RadioGroup, InputMask) созданы
- ✅ Форма заявки на кредит реализована с domain-driven структурой
- ✅ Шаг 1 (Основная информация о кредите) полностью реализован
- ⏸️ Шаги 2-6 ожидают реализации (заглушки готовы)

## Быстрый старт

**✅ БАЗОВАЯ РЕАЛИЗАЦИЯ ЗАВЕРШЕНА**. Форма работает с domain-driven структурой.

**Структура проекта**:
```
src/domains/credit-applications/
  ├── _shared/
  │   ├── types/credit-application.ts       # Типы данных
  │   └── constants/credit-application.ts   # Словари для Select/Radio
  └── form/
      └── components/
          ├── CreditApplicationForm.tsx      # Главный компонент формы
          ├── Step1BasicInfo.tsx             # Шаг 1 (реализован)
          ├── StepIndicator.tsx              # Индикатор шагов
          └── NavigationButtons.tsx          # Кнопки навигации
```

**Следующие шаги**: Реализация шагов 2-6, добавление валидации, вложенные формы.

---

## Чек-лист выполнения

- [x] **Шаг 1**: Создать типы данных (`src/domains/credit-applications/_shared/types/`)
- [x] **Шаг 2**: Создать компоненты форм (Textarea, Checkbox, RadioGroup, InputMask)
- [x] **Шаг 3**: Создать словари (`src/domains/credit-applications/_shared/constants/`)
- [x] **Шаг 4**: Создать компоненты шагов (Step1BasicInfo, StepIndicator, NavigationButtons)
- [x] **Шаг 5**: Создать схему формы (перенесена в `CreditApplicationForm.tsx`)
- [x] **Шаг 6**: Реализовать Form2Page (`src/pages/Form2Page.tsx`)
- [x] **Шаг 7**: Протестировать базовую версию
- [ ] **Шаг 8**: Завершить все 6 шагов формы (Step2-Step6)
- [ ] **Шаг 9**: Добавить валидацию
- [ ] **Шаг 10**: Добавить вложенные формы (опционально)
- [ ] **Шаг 11**: Добавить массивы вложенных форм (опционально)

---

## Обзор задачи

Форма заявки на кредит состоит из:
- **6 шагов** (пошаговая форма)
- **Простые поля** (текст, число, select, checkbox)
- **Вложенные формы** (PersonalData, PassportData, Address)
- **Массивы вложенных форм** (имущество, кредиты, созаемщики)
- **Условная валидация** (в зависимости от типа кредита)
- **Cross-field валидация** (между полями)
- **Асинхронная валидация** (ИНН, email, СМС-код)

---

## Шаг 1: Создание типов данных

### 1.1 Создать файл с типами

**Путь**: `src/domains/credit-applications/_shared/types/credit-application.ts`

**Содержимое**:

```typescript
// ============================================================================
// Базовые типы
// ============================================================================

export type LoanType = 'consumer' | 'mortgage' | 'car' | 'business' | 'refinancing';
export type EmploymentStatus = 'employed' | 'selfEmployed' | 'unemployed' | 'retired' | 'student';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
export type PropertyType = 'apartment' | 'house' | 'car' | 'land' | 'none';
export type EducationLevel = 'secondary' | 'specialized' | 'higher' | 'postgraduate';

// ============================================================================
// Вложенные интерфейсы
// ============================================================================

/**
 * Личные данные (вложенная форма)
 */
export interface PersonalData {
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  birthPlace: string;
  gender: 'male' | 'female';
}

/**
 * Паспортные данные (вложенная форма)
 */
export interface PassportData {
  series: string;
  number: string;
  issueDate: string;
  issuedBy: string;
  departmentCode: string;
}

/**
 * Адрес (вложенная форма)
 */
export interface Address {
  region: string;
  city: string;
  street: string;
  house: string;
  apartment?: string;
  postalCode: string;
}

// ============================================================================
// Элементы массивов
// ============================================================================

export interface PropertyItem {
  id: string;
  type: PropertyType;
  description: string;
  estimatedValue: number;
  hasEncumbrance: boolean;
}

export interface ExistingLoan {
  id: string;
  bank: string;
  type: string;
  amount: number;
  remainingAmount: number;
  monthlyPayment: number;
  maturityDate: string;
}

export interface CoBorrower {
  id: string;
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  phone: string;
  relationship: string;
  monthlyIncome: number;
}

// ============================================================================
// Основной интерфейс формы
// ============================================================================

export interface CreditApplicationForm {
  // Метаданные формы
  currentStep: number;
  completedSteps: number[];

  // Шаг 1: Основная информация
  loanType: LoanType;
  loanAmount: number;
  loanTerm: number;
  loanPurpose: string;

  // Специфичные поля для ипотеки
  propertyValue?: number;
  initialPayment?: number;

  // Специфичные поля для автокредита
  carBrand?: string;
  carModel?: string;
  carYear?: number;
  carPrice?: number;

  // Шаг 2: Персональные данные
  personalData: PersonalData;
  passportData: PassportData;
  inn: string;
  snils: string;

  // Шаг 3: Контактная информация
  phoneMain: string;
  phoneAdditional?: string;
  email: string;
  emailAdditional?: string;
  registrationAddress: Address;
  sameAsRegistration: boolean;
  residenceAddress?: Address;

  // Шаг 4: Информация о занятости
  employmentStatus: EmploymentStatus;
  companyName?: string;
  companyInn?: string;
  companyPhone?: string;
  companyAddress?: string;
  position?: string;
  workExperienceTotal?: number;
  workExperienceCurrent?: number;
  monthlyIncome: number;
  additionalIncome?: number;
  additionalIncomeSource?: string;
  businessType?: string;
  businessInn?: string;
  businessActivity?: string;

  // Шаг 5: Дополнительная информация
  maritalStatus: MaritalStatus;
  dependents: number;
  education: EducationLevel;
  hasProperty: boolean;
  properties?: PropertyItem[];
  hasExistingLoans: boolean;
  existingLoans?: ExistingLoan[];
  hasCoBorrower: boolean;
  coBorrowers?: CoBorrower[];

  // Шаг 6: Согласия
  agreePersonalData: boolean;
  agreeCreditHistory: boolean;
  agreeMarketing: boolean;
  agreeTerms: boolean;
  confirmAccuracy: boolean;
  electronicSignature: string;
}
```

**Статус**: ✅ Типы созданы и размещены в domain structure

---

## Шаг 2: Создание недостающих компонентов (заглушки)

### 2.1 Проверить существующие компоненты

**Существуют**:
- ✅ `Input` (src/lib/forms/components/input.tsx)
- ✅ `Select` (src/lib/forms/components/select.tsx)
- ✅ `FormField` (src/lib/forms/components/form-field.tsx)

**Нужно создать заглушки**:
- ❌ `Textarea`
- ❌ `Checkbox`
- ❌ `RadioGroup`
- ❌ `InputMask`
- ❌ `InputDate` (можно использовать Input с type="date")
- ❌ `InputNumber` (уже есть в Input через type="number")
- ❌ `InputPhone` (можно использовать InputMask)
- ❌ `InputEmail` (можно использовать Input с type="email")

### 2.2 Создать Textarea

**Путь**: `src/lib/forms/components/textarea.tsx`

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  className?: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, onChange, onBlur, placeholder, disabled, rows = 3, maxLength, ...props }, ref) => {
    const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      onChange?.(newValue || null);
    };

    const textareaValue = React.useMemo(() => {
      if (value === null || value === undefined) return '';
      return String(value);
    }, [value]);

    return (
      <textarea
        ref={ref}
        value={textareaValue}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={cn(
          'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
          'resize-y',
          className
        )}
        onChange={handleTextareaChange}
        onBlur={onBlur}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
```

### 2.3 Создать Checkbox

**Путь**: `src/lib/forms/components/checkbox.tsx`

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  className?: string;
  value?: boolean;
  onChange?: (value: boolean) => void;
  onBlur?: () => void;
  label?: string;
  disabled?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, value, onChange, onBlur, label, disabled, ...props }, ref) => {
    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event.target.checked);
    };

    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          checked={value || false}
          disabled={disabled}
          className={cn(
            'h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          onChange={handleCheckboxChange}
          onBlur={onBlur}
          {...props}
        />
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
```

### 2.4 Создать RadioGroup

**Путь**: `src/lib/forms/components/radio-group.tsx`

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  className?: string;
  value?: string | null;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  options: RadioOption[];
  disabled?: boolean;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onChange, onBlur, options, disabled, ...props }, ref) => {
    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event.target.value);
    };

    return (
      <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props}>
        {options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <input
              type="radio"
              value={option.value}
              checked={value === option.value}
              disabled={disabled}
              className={cn(
                'h-4 w-4 border-gray-300 text-primary focus:ring-2 focus:ring-primary',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              onChange={handleRadioChange}
              onBlur={onBlur}
            />
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {option.label}
            </label>
          </div>
        ))}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

export { RadioGroup };
```

### 2.5 Создать InputMask (упрощенная версия)

**Путь**: `src/lib/forms/components/input-mask.tsx`

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputMaskProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  className?: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
  onBlur?: () => void;
  mask?: string; // Простая маска (например: '999-999-999 99')
  placeholder?: string;
  disabled?: boolean;
}

const InputMask = React.forwardRef<HTMLInputElement, InputMaskProps>(
  ({ className, value, onChange, onBlur, mask, placeholder, disabled, ...props }, ref) => {
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      onChange?.(newValue || null);
    };

    const inputValue = React.useMemo(() => {
      if (value === null || value === undefined) return '';
      return String(value);
    }, [value]);

    return (
      <input
        ref={ref}
        type="text"
        value={inputValue}
        disabled={disabled}
        placeholder={placeholder || mask}
        className={cn(
          'h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
          className
        )}
        onChange={handleInputChange}
        onBlur={onBlur}
        {...props}
      />
    );
  }
);

InputMask.displayName = 'InputMask';

export { InputMask };
```

### 2.6 Обновить index.ts

**Путь**: `src/lib/forms/components/index.ts`

```typescript
export { FormField } from './form-field';
export { Input } from './input';
export { Select } from './select';
export { Textarea } from './textarea';
export { Checkbox } from './checkbox';
export { RadioGroup } from './radio-group';
export { InputMask } from './input-mask';

// Псевдонимы для удобства
export { Input as InputNumber } from './input'; // type="number"
export { Input as InputDate } from './input'; // type="date"
export { Input as InputEmail } from './input'; // type="email"
export { InputMask as InputPhone } from './input-mask';
```

**Статус**: ✅ Все компоненты созданы (Textarea, Checkbox, RadioGroup, InputMask)

---

## Шаг 3: Создание словарей для Select и RadioGroup

### 3.1 Создать файл с константами

**Путь**: `src/domains/credit-applications/_shared/constants/credit-application.ts`

```typescript
export const LOAN_TYPES = [
  { value: 'consumer', label: 'Потребительский кредит' },
  { value: 'mortgage', label: 'Ипотека' },
  { value: 'car', label: 'Автокредит' },
  { value: 'business', label: 'Кредит для бизнеса' },
  { value: 'refinancing', label: 'Рефинансирование' },
];

export const EMPLOYMENT_STATUSES = [
  { value: 'employed', label: 'Работаю по найму' },
  { value: 'selfEmployed', label: 'Индивидуальный предприниматель' },
  { value: 'unemployed', label: 'Не работаю' },
  { value: 'retired', label: 'Пенсионер' },
  { value: 'student', label: 'Студент' },
];

export const MARITAL_STATUSES = [
  { value: 'single', label: 'Холост/Не замужем' },
  { value: 'married', label: 'Женат/Замужем' },
  { value: 'divorced', label: 'Разведен(а)' },
  { value: 'widowed', label: 'Вдовец/Вдова' },
];

export const EDUCATIONS = [
  { value: 'secondary', label: 'Среднее' },
  { value: 'specialized', label: 'Среднее специальное' },
  { value: 'higher', label: 'Высшее' },
  { value: 'postgraduate', label: 'Послевузовское' },
];

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Квартира' },
  { value: 'house', label: 'Дом' },
  { value: 'car', label: 'Автомобиль' },
  { value: 'land', label: 'Земельный участок' },
  { value: 'none', label: 'Нет' },
];

export const GENDERS = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
];
```

**Статус**: ✅ Словари созданы и размещены в domain structure

---

## Шаг 4: Создание компонентов шагов

### 4.1 Создать структуру директорий

```
src/domains/credit-applications/form/components/
  ├── CreditApplicationForm.tsx    # Главный компонент с логикой формы
  ├── Step1BasicInfo.tsx
  ├── Step2PersonalData.tsx        # TODO
  ├── Step3ContactInfo.tsx         # TODO
  ├── Step4Employment.tsx          # TODO
  ├── Step5Additional.tsx          # TODO
  ├── Step6Confirmation.tsx        # TODO
  ├── StepIndicator.tsx
  └── NavigationButtons.tsx
```

### 4.2 Создать Step1BasicInfo

**Путь**: `src/domains/credit-applications/form/components/Step1BasicInfo.tsx`

```typescript
import { useSignals } from '@preact/signals-react/runtime';
import type { FormStore } from '@/lib/forms/core/form-store';
import type { CreditApplicationForm } from '../../_shared/types/credit-application';
import { FormField } from '@/lib/forms/components';

interface Step1Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step1BasicInfo({ form }: Step1Props) {
  useSignals();

  const loanType = form.controls.loanType.value;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Основная информация о кредите</h2>

      <FormField control={form.controls.loanType} />
      <FormField control={form.controls.loanAmount} />
      <FormField control={form.controls.loanTerm} />
      <FormField control={form.controls.loanPurpose} />

      {/* Специфичные поля для ипотеки */}
      {loanType === 'mortgage' && (
        <>
          <h3 className="text-lg font-semibold mt-4">Информация о недвижимости</h3>
          <FormField control={form.controls.propertyValue!} />
          <FormField control={form.controls.initialPayment!} />
        </>
      )}

      {/* Специфичные поля для автокредита */}
      {loanType === 'car' && (
        <>
          <h3 className="text-lg font-semibold mt-4">Информация об автомобиле</h3>
          <FormField control={form.controls.carBrand!} />
          <FormField control={form.controls.carModel!} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.controls.carYear!} />
            <FormField control={form.controls.carPrice!} />
          </div>
        </>
      )}
    </div>
  );
}
```

### 4.3 Создать остальные компоненты шагов

Создайте аналогичные компоненты для Step2-Step6, используя структуру из документации `docs/signals-in-angular/CREDIT_APPLICATION_USAGE.md`.

### 4.4 Создать StepIndicator

**Путь**: `src/domains/credit-applications/form/components/StepIndicator.tsx`

```typescript
interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

const STEPS = [
  { number: 1, title: 'Кредит', icon: '💰' },
  { number: 2, title: 'Данные', icon: '👤' },
  { number: 3, title: 'Контакты', icon: '📞' },
  { number: 4, title: 'Работа', icon: '💼' },
  { number: 5, title: 'Доп. инфо', icon: '📋' },
  { number: 6, title: 'Подтверждение', icon: '✓' },
];

export function StepIndicator({ currentStep, completedSteps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-8 p-4 bg-gray-100 rounded-lg">
      {STEPS.map((step, index) => {
        const isCompleted = completedSteps.includes(step.number);
        const isCurrent = currentStep === step.number;
        const canClick = step.number === 1 || completedSteps.includes(step.number - 1);

        return (
          <div key={step.number} className="flex items-center flex-1">
            <div
              className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all cursor-pointer
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
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### 4.5 Создать NavigationButtons

**Путь**: `src/domains/credit-applications/form/components/NavigationButtons.tsx`

```typescript
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
          className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
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
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          disabled={isSubmitting}
        >
          Далее →
        </button>
      )}

      {currentStep === 6 && (
        <button
          type="button"
          onClick={onSubmit}
          className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
        </button>
      )}
    </div>
  );
}
```

**Статус**: ✅ Step1BasicInfo, StepIndicator, NavigationButtons созданы. Step2-6 ожидают реализации.

---

## Шаг 5: Создание схемы формы (FormStore)

**Примечание**: Схема формы интегрирована в `CreditApplicationForm.tsx` для соответствия domain-driven архитектуре проекта (аналогично UsersForm).

### 5.1 Создать фабрику формы внутри компонента

**Путь**: `src/domains/credit-applications/form/components/CreditApplicationForm.tsx`

Функция `createCreditApplicationForm()` создает FormStore с полями формы:

```typescript
import { FormStore } from '@/lib/forms/core/form-store';
import type { CreditApplicationForm } from '@/types/credit-application';
import { Input, Select, Textarea } from '@/lib/forms/components';
import { LOAN_TYPES } from '@/constants/credit-application';

export function createCreditApplicationForm() {
  return new FormStore<CreditApplicationForm>({
    // Метаданные формы
    currentStep: {
      value: 1,
      component: () => null,
      componentProps: {},
    },
    completedSteps: {
      value: [],
      component: () => null,
      componentProps: {},
    },

    // Шаг 1: Основная информация
    loanType: {
      value: 'consumer',
      component: Select,
      componentProps: {
        label: 'Тип кредита',
        placeholder: 'Выберите тип кредита',
        options: LOAN_TYPES,
      },
    },

    loanAmount: {
      value: 0,
      component: Input,
      componentProps: {
        label: 'Сумма кредита',
        placeholder: 'Введите сумму',
        type: 'number',
        min: 50000,
        max: 10000000,
        step: 10000,
      },
    },

    loanTerm: {
      value: 12,
      component: Input,
      componentProps: {
        label: 'Срок кредита (месяцев)',
        placeholder: 'Введите срок',
        type: 'number',
        min: 6,
        max: 240,
      },
    },

    loanPurpose: {
      value: '',
      component: Textarea,
      componentProps: {
        label: 'Цель кредита',
        placeholder: 'Опишите, на что планируете потратить средства',
        rows: 4,
        maxLength: 500,
      },
    },

    // Специфичные поля для ипотеки
    propertyValue: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Стоимость недвижимости',
        placeholder: 'Введите стоимость',
        type: 'number',
        min: 1000000,
        step: 100000,
      },
    },

    initialPayment: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Первоначальный взнос',
        placeholder: 'Введите сумму',
        type: 'number',
        min: 0,
        step: 10000,
      },
    },

    // Специфичные поля для автокредита
    carBrand: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Марка автомобиля',
        placeholder: 'Например: Toyota',
      },
    },

    carModel: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Модель автомобиля',
        placeholder: 'Например: Camry',
      },
    },

    carYear: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Год выпуска',
        placeholder: '2020',
        type: 'number',
        min: 2000,
        max: new Date().getFullYear() + 1,
      },
    },

    carPrice: {
      value: undefined,
      component: Input,
      componentProps: {
        label: 'Стоимость автомобиля',
        placeholder: 'Введите стоимость',
        type: 'number',
        min: 300000,
        step: 10000,
      },
    },

    // TODO: Добавить остальные поля для шагов 2-6
    // Для начала используйте заглушки:

    personalData: {
      value: {
        lastName: '',
        firstName: '',
        middleName: '',
        birthDate: '',
        birthPlace: '',
        gender: 'male',
      },
      component: () => null,
      componentProps: {},
    },

    passportData: {
      value: {
        series: '',
        number: '',
        issueDate: '',
        issuedBy: '',
        departmentCode: '',
      },
      component: () => null,
      componentProps: {},
    },

    inn: {
      value: '',
      component: Input,
      componentProps: {
        label: 'ИНН',
        placeholder: '123456789012',
      },
    },

    snils: {
      value: '',
      component: Input,
      componentProps: {
        label: 'СНИЛС',
        placeholder: '123-456-789 00',
      },
    },

    // ... остальные поля (добавьте по мере необходимости)

  } as any); // Временно используем 'as any' пока не добавлены все поля
}
```

**Статус**: ✅ Схема формы создана внутри CreditApplicationForm.tsx (следует паттерну UsersForm)

---

## Шаг 6: Реализация Form2Page

### 6.1 Обновить Form2Page.tsx

**Путь**: `src/pages/Form2Page.tsx`

**Новая архитектура**: Form2Page теперь следует паттерну FormPage - простой wrapper с заголовком и импортом компонента формы:

```typescript
import CreditApplicationForm from '@/domains/credit-applications/form/components/CreditApplicationForm';

function Form2Page() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Заявка на кредит</h1>
      <CreditApplicationForm />
    </>
  );
}

export default Form2Page;
```

**Вся логика формы** (навигация, валидация, отправка) находится в `CreditApplicationForm.tsx`.

**Статус**: ✅ Form2Page реализован по domain-driven архитектуре

---

## Шаг 7: Проверка и тестирование

### 7.1 Запустить dev-сервер

```bash
npm run dev
```

### 7.2 Открыть страницу Form2Page в браузере

Перейти по маршруту, где находится Form2Page.

### 7.3 Проверить функционал

- ✅ Отображение полей шага 1
- ✅ Условные поля (для ипотеки/автокредита)
- ✅ Индикатор шагов
- ⏸️ Навигация между шагами (только для шага 1)
- ⏸️ Валидация полей (требует добавления валидаторов)

**Статус**: ✅ Базовая версия протестирована, dev-сервер работает без ошибок

---

## Следующие шаги (TODO)

### Шаг 8: Завершить реализацию всех шагов

1. **Добавить поля для шагов 2-6** в `credit-application-form.ts`
2. **Создать компоненты** Step2PersonalData, Step3ContactInfo, Step4Employment, Step5Additional, Step6Confirmation
3. **Добавить компоненты в Form2Page.tsx** для отображения соответствующих шагов

### Шаг 9: Добавить валидацию

1. **Создать файл с валидаторами** `src/lib/forms/validators.ts`
2. **Реализовать синхронные валидаторы** (required, minLength, email, pattern, и т.д.)
3. **Реализовать асинхронные валидаторы** (validateAsync)
4. **Добавить валидаторы в схему формы**

### Шаг 10: Добавить вложенные формы (опционально)

1. **Расширить FieldController** для поддержки вложенных объектов
2. **Создать отдельные компоненты** для вложенных форм (PersonalDataForm, PassportDataForm, AddressForm)
3. **Обновить схему формы** для использования вложенных контроллеров

### Шаг 11: Добавить массивы вложенных форм (опционально)

1. **Создать компонент FormArrayManager**
2. **Создать компоненты элементов** (PropertyForm, ExistingLoanForm, CoBorrowerForm)
3. **Интегрировать в соответствующие шаги**

---

## Резюме текущего статуса

✅ **Шаг 1**: Типы данных созданы в `src/domains/credit-applications/_shared/types/`
✅ **Шаг 2**: Все компоненты созданы (Textarea, Checkbox, RadioGroup, InputMask)
✅ **Шаг 3**: Словари созданы в `src/domains/credit-applications/_shared/constants/`
✅ **Шаг 4**: Step1BasicInfo, StepIndicator, NavigationButtons реализованы
✅ **Шаг 5**: Схема формы создана внутри CreditApplicationForm.tsx
✅ **Шаг 6**: Form2Page реализован по domain-driven паттерну
✅ **Шаг 7**: Базовая версия работает, dev-сервер без ошибок
⏸️ **Шаг 8**: Завершить все шаги (Step2-6 ожидают реализации)
⏸️ **Шаг 9**: Валидация (не начато)
⏸️ **Шаг 10**: Вложенные формы (не начато)
⏸️ **Шаг 11**: Массивы вложенных форм (не начато)

**Прогресс**: 64% (7/11 шагов выполнено полностью)

---

## Точки восстановления

**Текущая точка**: ✅ Базовая реализация завершена

Следующие шаги для продолжения работы:

1. **Шаг 8**: Реализовать компоненты Step2-6 (PersonalData, ContactInfo, Employment, Additional, Confirmation)
2. **Шаг 9**: Добавить валидацию (синхронную и асинхронную)
3. **Шаг 10**: Реализовать вложенные формы (PersonalData, PassportData, Address как отдельные form groups)
4. **Шаг 11**: Реализовать массивы вложенных форм (properties, existingLoans, coBorrowers)

---

## Дополнительные замечания

- **Текущее состояние**: ✅ Базовая версия формы работает (Шаг 1 полностью функционален)
- **Архитектура**: Код организован по domain-driven принципу, аналогично UsersForm
- **Готово к использованию**: Форма поддерживает условные поля (для ипотеки/автокредита), навигацию по шагам
- **Следующие задачи**: Реализация шагов 2-6, валидация, вложенные формы
- **Рекомендации**:
  1. Реализовывать шаги 2-6 по одному, тестируя каждый
  2. Сначала создать простые поля, затем добавлять валидацию
  3. Вложенные формы и массивы - финальный этап

---

**Конец инструкции**