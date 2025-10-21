# Полные примеры пошаговой формы заявки на кредит

> **Сравнение Варианта 2 (FormGroup) и Варианта 5 (Proxy)**
> **Включает**: Вложенные формы, массивы форм, валидацию, React компоненты

---

## Обзор формы

**Функциональность**:
- ✅ 6 шагов с навигацией
- ✅ Вложенные формы (PersonalData, PassportData, Address)
- ✅ Массивы форм (Properties, ExistingLoans, CoBorrowers)
- ✅ Условная валидация (в зависимости от типа кредита)
- ✅ Cross-field валидация
- ✅ Асинхронная валидация
- ✅ Прогресс-бар
- ✅ Автосохранение

**Структура формы**:
```
CreditApplicationForm
├── Step 1: Основная информация
│   ├── loanType (select)
│   ├── loanAmount (number)
│   └── loanTerm (number)
│
├── Step 2: Персональные данные (вложенные формы)
│   ├── personalData (FormGroup)
│   │   ├── firstName
│   │   ├── lastName
│   │   └── birthDate
│   └── passportData (FormGroup)
│       ├── series
│       ├── number
│       └── issueDate
│
├── Step 3: Контактная информация (вложенные формы)
│   ├── phone
│   ├── email
│   └── registrationAddress (FormGroup)
│       ├── city
│       ├── street
│       └── postalCode
│
├── Step 4: Занятость
│   ├── employmentStatus
│   └── monthlyIncome
│
├── Step 5: Дополнительная информация (массивы форм)
│   ├── properties (FormArray)
│   │   └── [0..n]
│   │       ├── type
│   │       ├── value
│   │       └── description
│   │
│   ├── existingLoans (FormArray)
│   │   └── [0..n]
│   │       ├── bank
│   │       ├── amount
│   │       └── monthlyPayment
│   │
│   └── coBorrowers (FormArray)
│       └── [0..n]
│           ├── personalData (FormGroup - вложенная форма внутри массива!)
│           │   ├── firstName
│           │   └── lastName
│           └── monthlyIncome
│
└── Step 6: Подтверждение
    ├── agreeTerms
    └── confirmAccuracy
```

---

# Вариант 2: FormGroup Controller

## 1. Типы данных

```typescript
// src/domains/credit-applications/_shared/types/credit-application.ts

export type LoanType = 'consumer' | 'mortgage' | 'car' | 'business';
export type EmploymentStatus = 'employed' | 'selfEmployed' | 'unemployed';
export type PropertyType = 'apartment' | 'house' | 'car' | 'land';

// ============================================================================
// Вложенные интерфейсы (для FormGroup)
// ============================================================================

export interface PersonalData {
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
  gender: 'male' | 'female';
}

export interface PassportData {
  series: string;
  number: string;
  issueDate: string;
  issuedBy: string;
  departmentCode: string;
}

export interface Address {
  region: string;
  city: string;
  street: string;
  house: string;
  apartment?: string;
  postalCode: string;
}

// ============================================================================
// Элементы массивов (для FormArray)
// ============================================================================

export interface PropertyItem {
  type: PropertyType;
  description: string;
  estimatedValue: number;
  hasEncumbrance: boolean;
}

export interface ExistingLoan {
  bank: string;
  type: string;
  amount: number;
  remainingAmount: number;
  monthlyPayment: number;
  maturityDate: string;
}

export interface CoBorrower {
  personalData: PersonalData; // Вложенная форма внутри элемента массива!
  relationship: string;
  monthlyIncome: number;
}

// ============================================================================
// Главная форма
// ============================================================================

export interface CreditApplicationForm {
  // Метаданные
  currentStep: number;
  completedSteps: number[];

  // Step 1: Основная информация
  loanType: LoanType;
  loanAmount: number;
  loanTerm: number;
  loanPurpose: string;

  // Step 2: Персональные данные (вложенные формы)
  personalData: PersonalData;
  passportData: PassportData;
  inn: string;
  snils: string;

  // Step 3: Контактная информация
  phoneMain: string;
  email: string;
  registrationAddress: Address;

  // Step 4: Занятость
  employmentStatus: EmploymentStatus;
  companyName?: string;
  position?: string;
  monthlyIncome: number;

  // Step 5: Дополнительная информация (массивы форм)
  hasProperty: boolean;
  properties: PropertyItem[];
  hasExistingLoans: boolean;
  existingLoans: ExistingLoan[];
  hasCoBorrower: boolean;
  coBorrowers: CoBorrower[];

  // Step 6: Согласия
  agreePersonalData: boolean;
  agreeCreditHistory: boolean;
  agreeTerms: boolean;
  confirmAccuracy: boolean;
}
```

## 2. Создание схемы формы (Вариант 2)

```typescript
// src/domains/credit-applications/form/schema/credit-form-schema.ts

import { FormGroup, FormArray } from '@/lib/forms/helpers';
import { Input, Select, Textarea, Checkbox } from '@/lib/forms/components';
import type { FormSchema, FormGroupSchema, FormArrayConfig } from '@/lib/forms/types';
import type {
  CreditApplicationForm,
  PersonalData,
  PassportData,
  Address,
  PropertyItem,
  ExistingLoan,
  CoBorrower,
} from '../_shared/types/credit-application';
import {
  LOAN_TYPES,
  EMPLOYMENT_STATUSES,
  PROPERTY_TYPES,
} from '../_shared/constants/credit-application';

// ============================================================================
// Схемы для вложенных форм (переиспользуемые)
// ============================================================================

export const personalDataSchema: FormGroupSchema<PersonalData> = {
  firstName: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Имя',
      placeholder: 'Введите имя',
    },
  },
  lastName: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Фамилия',
      placeholder: 'Введите фамилию',
    },
  },
  middleName: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Отчество',
      placeholder: 'Введите отчество',
    },
  },
  birthDate: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Дата рождения',
      type: 'date',
    },
  },
  gender: {
    value: 'male',
    component: Select,
    componentProps: {
      label: 'Пол',
      options: [
        { value: 'male', label: 'Мужской' },
        { value: 'female', label: 'Женский' },
      ],
    },
  },
};

export const passportDataSchema: FormGroupSchema<PassportData> = {
  series: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Серия паспорта',
      placeholder: '0000',
      maxLength: 4,
    },
  },
  number: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Номер паспорта',
      placeholder: '000000',
      maxLength: 6,
    },
  },
  issueDate: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Дата выдачи',
      type: 'date',
    },
  },
  issuedBy: {
    value: '',
    component: Textarea,
    componentProps: {
      label: 'Кем выдан',
      rows: 3,
    },
  },
  departmentCode: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Код подразделения',
      placeholder: '000-000',
    },
  },
};

export const addressSchema: FormGroupSchema<Address> = {
  region: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Регион',
    },
  },
  city: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Город',
    },
  },
  street: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Улица',
    },
  },
  house: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Дом',
    },
  },
  apartment: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Квартира',
    },
  },
  postalCode: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Индекс',
      maxLength: 6,
    },
  },
};

// ============================================================================
// Фабрики для элементов массивов
// ============================================================================

export const createPropertyItemSchema = (): FormGroupSchema<PropertyItem> => ({
  type: {
    value: 'apartment',
    component: Select,
    componentProps: {
      label: 'Тип имущества',
      options: PROPERTY_TYPES,
    },
  },
  description: {
    value: '',
    component: Textarea,
    componentProps: {
      label: 'Описание',
      rows: 3,
    },
  },
  estimatedValue: {
    value: 0,
    component: Input,
    componentProps: {
      label: 'Оценочная стоимость (₽)',
      type: 'number',
      min: 0,
    },
  },
  hasEncumbrance: {
    value: false,
    component: Checkbox,
    componentProps: {
      label: 'Имеется обременение',
    },
  },
});

export const createExistingLoanSchema = (): FormGroupSchema<ExistingLoan> => ({
  bank: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Банк',
    },
  },
  type: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Тип кредита',
    },
  },
  amount: {
    value: 0,
    component: Input,
    componentProps: {
      label: 'Сумма кредита (₽)',
      type: 'number',
    },
  },
  remainingAmount: {
    value: 0,
    component: Input,
    componentProps: {
      label: 'Остаток долга (₽)',
      type: 'number',
    },
  },
  monthlyPayment: {
    value: 0,
    component: Input,
    componentProps: {
      label: 'Ежемесячный платеж (₽)',
      type: 'number',
    },
  },
  maturityDate: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Дата погашения',
      type: 'date',
    },
  },
});

export const createCoBorrowerSchema = (): FormGroupSchema<CoBorrower> => ({
  // Вложенная форма внутри элемента массива!
  personalData: FormGroup<PersonalData>(personalDataSchema),

  relationship: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Степень родства',
    },
  },
  monthlyIncome: {
    value: 0,
    component: Input,
    componentProps: {
      label: 'Ежемесячный доход (₽)',
      type: 'number',
    },
  },
});

// ============================================================================
// Главная схема формы
// ============================================================================

export const createCreditApplicationSchema = (): FormSchema<CreditApplicationForm> => ({
  // Метаданные
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

  // ========================================================================
  // Step 1: Основная информация
  // ========================================================================

  loanType: {
    value: 'consumer',
    component: Select,
    componentProps: {
      label: 'Тип кредита',
      options: LOAN_TYPES,
    },
  },

  loanAmount: {
    value: 0,
    component: Input,
    componentProps: {
      label: 'Сумма кредита (₽)',
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
      rows: 4,
      maxLength: 500,
    },
  },

  // ========================================================================
  // Step 2: Персональные данные (вложенные формы)
  // ========================================================================

  personalData: FormGroup<PersonalData>(personalDataSchema),
  passportData: FormGroup<PassportData>(passportDataSchema),

  inn: {
    value: '',
    component: Input,
    componentProps: {
      label: 'ИНН',
      maxLength: 12,
    },
  },

  snils: {
    value: '',
    component: Input,
    componentProps: {
      label: 'СНИЛС',
      placeholder: '000-000-000 00',
    },
  },

  // ========================================================================
  // Step 3: Контактная информация
  // ========================================================================

  phoneMain: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Телефон',
      type: 'tel',
      placeholder: '+7 (___) ___-__-__',
    },
  },

  email: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Email',
      type: 'email',
    },
  },

  registrationAddress: FormGroup<Address>(addressSchema),

  // ========================================================================
  // Step 4: Занятость
  // ========================================================================

  employmentStatus: {
    value: 'employed',
    component: Select,
    componentProps: {
      label: 'Статус занятости',
      options: EMPLOYMENT_STATUSES,
    },
  },

  companyName: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Название компании',
    },
  },

  position: {
    value: '',
    component: Input,
    componentProps: {
      label: 'Должность',
    },
  },

  monthlyIncome: {
    value: 0,
    component: Input,
    componentProps: {
      label: 'Ежемесячный доход (₽)',
      type: 'number',
      min: 0,
    },
  },

  // ========================================================================
  // Step 5: Дополнительная информация (массивы форм)
  // ========================================================================

  hasProperty: {
    value: false,
    component: Checkbox,
    componentProps: {
      label: 'Имеется имущество',
    },
  },

  properties: FormArray<PropertyItem>({
    factory: createPropertyItemSchema,
    initial: [],
  }),

  hasExistingLoans: {
    value: false,
    component: Checkbox,
    componentProps: {
      label: 'Имеются кредиты',
    },
  },

  existingLoans: FormArray<ExistingLoan>({
    factory: createExistingLoanSchema,
    initial: [],
  }),

  hasCoBorrower: {
    value: false,
    component: Checkbox,
    componentProps: {
      label: 'Добавить созаемщика',
    },
  },

  coBorrowers: FormArray<CoBorrower>({
    factory: createCoBorrowerSchema,
    initial: [],
  }),

  // ========================================================================
  // Step 6: Согласия
  // ========================================================================

  agreePersonalData: {
    value: false,
    component: Checkbox,
    componentProps: {
      label: 'Согласие на обработку персональных данных',
    },
  },

  agreeCreditHistory: {
    value: false,
    component: Checkbox,
    componentProps: {
      label: 'Согласие на проверку кредитной истории',
    },
  },

  agreeTerms: {
    value: false,
    component: Checkbox,
    componentProps: {
      label: 'Согласие с условиями кредитования',
    },
  },

  confirmAccuracy: {
    value: false,
    component: Checkbox,
    componentProps: {
      label: 'Подтверждаю достоверность введенных данных',
    },
  },
});
```

## 3. Валидация (Вариант 2)

```typescript
// src/domains/credit-applications/form/validation/credit-form-validation.ts

import type { ValidationSchemaFn, FieldPath } from '@/lib/forms/types';
import type { CreditApplicationForm } from '../_shared/types/credit-application';
import {
  required,
  minLength,
  maxLength,
  email,
  pattern,
  min,
  max,
  validate,
  validateAsync,
  validateTree,
  applyWhen,
} from '@/lib/forms/validators';

export const creditApplicationValidation: ValidationSchemaFn<CreditApplicationForm> = (
  path: FieldPath<CreditApplicationForm>
) => {
  // ============================================================================
  // Step 1: Основная информация
  // ============================================================================

  required(path.loanType);
  required(path.loanAmount);
  min(path.loanAmount, 50000, { message: 'Минимальная сумма: 50 000 ₽' });
  max(path.loanAmount, 10000000, { message: 'Максимальная сумма: 10 000 000 ₽' });

  required(path.loanTerm);
  min(path.loanTerm, 6);
  max(path.loanTerm, 240);

  required(path.loanPurpose);
  minLength(path.loanPurpose, 10, { message: 'Минимум 10 символов' });

  // ============================================================================
  // Step 2: Персональные данные (валидация вложенных форм)
  // ============================================================================

  // Личные данные
  required(path.personalData.firstName);
  minLength(path.personalData.firstName, 2);
  pattern(path.personalData.firstName, /^[А-ЯЁа-яё\s-]+$/, {
    message: 'Только русские буквы',
  });

  required(path.personalData.lastName);
  minLength(path.personalData.lastName, 2);
  pattern(path.personalData.lastName, /^[А-ЯЁа-яё\s-]+$/, {
    message: 'Только русские буквы',
  });

  required(path.personalData.middleName);
  minLength(path.personalData.middleName, 2);

  required(path.personalData.birthDate);
  required(path.personalData.gender);

  // Валидация возраста
  validate(path.personalData.birthDate, (ctx) => {
    const birthDate = new Date(ctx.value());
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 18) {
      return {
        code: 'tooYoung',
        message: 'Возраст должен быть не менее 18 лет',
      };
    }

    if (age > 75) {
      return {
        code: 'tooOld',
        message: 'Максимальный возраст: 75 лет',
      };
    }

    return null;
  });

  // Паспортные данные
  required(path.passportData.series);
  pattern(path.passportData.series, /^\d{4}$/, {
    message: 'Серия должна содержать 4 цифры',
  });

  required(path.passportData.number);
  pattern(path.passportData.number, /^\d{6}$/, {
    message: 'Номер должен содержать 6 цифр',
  });

  required(path.passportData.issueDate);
  required(path.passportData.issuedBy);
  minLength(path.passportData.issuedBy, 10);

  required(path.passportData.departmentCode);
  pattern(path.passportData.departmentCode, /^\d{3}-\d{3}$/, {
    message: 'Формат: 123-456',
  });

  // Cross-field валидация между вложенными формами
  validateTree(
    (ctx) => {
      const form = ctx.formValue();
      const issueDate = new Date(form.passportData.issueDate);
      const birthDate = new Date(form.personalData.birthDate);

      if (issueDate < birthDate) {
        return {
          code: 'issueDateBeforeBirth',
          message: 'Дата выдачи паспорта не может быть раньше даты рождения',
        };
      }

      return null;
    },
    { targetField: 'passportData.issueDate' }
  );

  // ИНН
  required(path.inn);
  pattern(path.inn, /^\d{12}$/, { message: 'ИНН должен содержать 12 цифр' });

  // Асинхронная валидация ИНН
  validateAsync(
    path.inn,
    async (ctx) => {
      const inn = ctx.value();
      if (!inn || inn.length !== 12) return null;

      try {
        const response = await fetch('/api/validate-inn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inn }),
        });
        const data = await response.json();

        if (!data.valid) {
          return {
            code: 'invalidInn',
            message: 'ИНН не найден в базе ФНС',
          };
        }

        return null;
      } catch {
        return null;
      }
    },
    { debounce: 1000 }
  );

  // СНИЛС
  required(path.snils);
  pattern(path.snils, /^\d{3}-\d{3}-\d{3} \d{2}$/, {
    message: 'Формат: 123-456-789 00',
  });

  // ============================================================================
  // Step 3: Контактная информация (валидация вложенной формы Address)
  // ============================================================================

  required(path.phoneMain);
  pattern(path.phoneMain, /^\+7\d{10}$/, {
    message: 'Формат: +7XXXXXXXXXX',
  });

  required(path.email);
  email(path.email);

  // Адрес (вложенная форма)
  required(path.registrationAddress.region);
  required(path.registrationAddress.city);
  required(path.registrationAddress.street);
  required(path.registrationAddress.house);

  required(path.registrationAddress.postalCode);
  pattern(path.registrationAddress.postalCode, /^\d{6}$/, {
    message: 'Индекс должен содержать 6 цифр',
  });

  // ============================================================================
  // Step 4: Занятость
  // ============================================================================

  required(path.employmentStatus);

  // Условная валидация для работающих
  applyWhen(
    path.employmentStatus,
    (status) => status === 'employed',
    (path) => {
      required(path.companyName, { message: 'Укажите название компании' });
      required(path.position, { message: 'Укажите должность' });
    }
  );

  required(path.monthlyIncome);
  min(path.monthlyIncome, 10000, { message: 'Минимальный доход: 10 000 ₽' });

  // ============================================================================
  // Step 5: Дополнительная информация (валидация массивов)
  // ============================================================================

  // Валидация массива имущества
  applyWhen(
    path.hasProperty,
    (value) => value === true,
    (path) => {
      // Проверяем, что массив не пуст
      validate(path.properties as any, (ctx) => {
        const properties = ctx.value();

        if (!properties || properties.length === 0) {
          return {
            code: 'noProperties',
            message: 'Добавьте хотя бы один объект имущества',
          };
        }

        return null;
      });
    }
  );

  // Валидация массива кредитов
  applyWhen(
    path.hasExistingLoans,
    (value) => value === true,
    (path) => {
      validate(path.existingLoans as any, (ctx) => {
        const loans = ctx.value();

        if (!loans || loans.length === 0) {
          return {
            code: 'noLoans',
            message: 'Добавьте информацию о кредитах',
          };
        }

        // Проверка кредитной нагрузки
        const totalPayment = loans.reduce(
          (sum: number, loan: any) => sum + (loan.monthlyPayment || 0),
          0
        );

        const income = ctx.getField('monthlyIncome') || 0;

        if (totalPayment > income * 0.5) {
          return {
            code: 'highDebtBurden',
            message: 'Кредитная нагрузка превышает 50% дохода',
          };
        }

        return null;
      });
    }
  );

  // Валидация созаемщиков (массив с вложенными формами!)
  applyWhen(
    path.hasCoBorrower,
    (value) => value === true,
    (path) => {
      validate(path.coBorrowers as any, (ctx) => {
        const coBorrowers = ctx.value();

        if (!coBorrowers || coBorrowers.length === 0) {
          return {
            code: 'noCoBorrowers',
            message: 'Добавьте хотя бы одного созаемщика',
          };
        }

        return null;
      });
    }
  );

  // ============================================================================
  // Step 6: Согласия
  // ============================================================================

  required(path.agreePersonalData);
  validate(path.agreePersonalData, (ctx) => {
    if (ctx.value() !== true) {
      return { code: 'mustAgree', message: 'Необходимо дать согласие' };
    }
    return null;
  });

  required(path.agreeCreditHistory);
  validate(path.agreeCreditHistory, (ctx) => {
    if (ctx.value() !== true) {
      return { code: 'mustAgree', message: 'Необходимо дать согласие' };
    }
    return null;
  });

  required(path.agreeTerms);
  validate(path.agreeTerms, (ctx) => {
    if (ctx.value() !== true) {
      return { code: 'mustAgree', message: 'Необходимо принять условия' };
    }
    return null;
  });

  required(path.confirmAccuracy);
  validate(path.confirmAccuracy, (ctx) => {
    if (ctx.value() !== true) {
      return { code: 'mustConfirm', message: 'Необходимо подтвердить' };
    }
    return null;
  });
};
```

## 4. React компоненты (Вариант 2)

### Главный компонент формы

```typescript
// src/domains/credit-applications/form/components/CreditApplicationForm.tsx

import { useState, useEffect } from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { FormStore } from '@/lib/forms/core/form-store';
import { createCreditApplicationSchema } from '../schema/credit-form-schema';
import { creditApplicationValidation } from '../validation/credit-form-validation';
import { StepIndicator } from './StepIndicator';
import { ProgressBar } from './ProgressBar';
import { NavigationButtons } from './NavigationButtons';
import {
  Step1BasicInfo,
  Step2PersonalInfo,
  Step3ContactInfo,
  Step4Employment,
  Step5Additional,
  Step6Confirmation,
} from './steps';
import type { CreditApplicationForm as CreditFormType } from '../../_shared/types/credit-application';

export function CreditApplicationForm() {
  useSignals();

  // Создаем форму
  const [form] = useState(() => {
    const formStore = new FormStore<CreditFormType>(
      createCreditApplicationSchema()
    );

    // Применяем валидацию
    formStore.applyValidationSchema(creditApplicationValidation);

    // Автосохранение
    const autosave = setInterval(() => {
      const values = formStore.getValue();
      localStorage.setItem('creditForm', JSON.stringify(values));
    }, 30000); // Каждые 30 секунд

    return { formStore, autosave };
  });

  // Восстановление из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('creditForm');
    if (saved) {
      try {
        const values = JSON.parse(saved);
        form.formStore.setValue(values);
      } catch (e) {
        console.error('Failed to restore form:', e);
      }
    }

    return () => clearInterval(form.autosave);
  }, []);

  const currentStep = form.formStore.controls.currentStep.value;
  const totalSteps = 6;

  // Навигация по шагам
  const goToStep = (step: number) => {
    form.formStore.controls.currentStep.value = step;
  };

  const nextStep = async () => {
    // Валидация текущего шага
    const isValid = await validateCurrentStep();

    if (isValid) {
      // Добавляем шаг в завершенные
      const completed = form.formStore.controls.completedSteps.value;
      if (!completed.includes(currentStep)) {
        form.formStore.controls.completedSteps.value = [
          ...completed,
          currentStep,
        ];
      }

      // Переходим на следующий шаг
      if (currentStep < totalSteps) {
        goToStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    // Валидируем только поля текущего шага
    const stepFields = getStepFields(currentStep);
    let isValid = true;

    for (const fieldName of stepFields) {
      const control = (form.formStore.controls as any)[fieldName];
      if (control) {
        const valid = await control.validate();
        if (!valid) {
          isValid = false;
          control.markAsTouched();
        }
      }
    }

    return isValid;
  };

  const getStepFields = (step: number): string[] => {
    switch (step) {
      case 1:
        return ['loanType', 'loanAmount', 'loanTerm', 'loanPurpose'];
      case 2:
        return ['personalData', 'passportData', 'inn', 'snils'];
      case 3:
        return ['phoneMain', 'email', 'registrationAddress'];
      case 4:
        return ['employmentStatus', 'companyName', 'position', 'monthlyIncome'];
      case 5:
        return ['properties', 'existingLoans', 'coBorrowers'];
      case 6:
        return [
          'agreePersonalData',
          'agreeCreditHistory',
          'agreeTerms',
          'confirmAccuracy',
        ];
      default:
        return [];
    }
  };

  const handleSubmit = async () => {
    // Финальная валидация всей формы
    const isValid = await form.formStore.validate();

    if (!isValid) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    // Отправка формы
    const result = await form.formStore.submit(async (values) => {
      console.log('Submitting form:', values);

      const response = await fetch('/api/credit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      return response.json();
    });

    if (result) {
      alert('Заявка успешно отправлена!');
      localStorage.removeItem('creditForm');
    }
  };

  return (
    <div className="credit-application-form">
      {/* Прогресс */}
      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        completedSteps={form.formStore.controls.completedSteps.value}
      />

      {/* Индикатор шагов */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepClick={goToStep}
        completedSteps={form.formStore.controls.completedSteps.value}
      />

      {/* Содержимое шага */}
      <div className="step-content">
        {currentStep === 1 && <Step1BasicInfo form={form.formStore} />}
        {currentStep === 2 && <Step2PersonalInfo form={form.formStore} />}
        {currentStep === 3 && <Step3ContactInfo form={form.formStore} />}
        {currentStep === 4 && <Step4Employment form={form.formStore} />}
        {currentStep === 5 && <Step5Additional form={form.formStore} />}
        {currentStep === 6 && <Step6Confirmation form={form.formStore} />}
      </div>

      {/* Навигация */}
      <NavigationButtons
        currentStep={currentStep}
        totalSteps={totalSteps}
        onPrev={prevStep}
        onNext={nextStep}
        onSubmit={handleSubmit}
        isSubmitting={form.formStore.submitting}
      />
    </div>
  );
}
```

### Шаг с вложенными формами

```typescript
// src/domains/credit-applications/form/components/steps/Step2PersonalInfo.tsx

import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/form-field';
import type { FormStore } from '@/lib/forms/core/form-store';
import type { CreditApplicationForm } from '../../../_shared/types/credit-application';

interface Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step2PersonalInfo({ form }: Props) {
  useSignals();

  // Доступ к вложенным формам через controls
  const personalData = form.controls.personalData;
  const passportData = form.controls.passportData;

  return (
    <div className="step step-2">
      <h2>Шаг 2: Персональные данные</h2>

      {/* Вложенная форма: Личные данные */}
      <section className="personal-data-section">
        <h3>Личные данные</h3>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={personalData.controls.lastName} />
          <FormField control={personalData.controls.firstName} />
          <FormField control={personalData.controls.middleName} />
          <FormField control={personalData.controls.birthDate} />
          <FormField control={personalData.controls.gender} />
        </div>
      </section>

      {/* Вложенная форма: Паспортные данные */}
      <section className="passport-data-section">
        <h3>Паспортные данные</h3>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={passportData.controls.series} />
          <FormField control={passportData.controls.number} />
          <FormField control={passportData.controls.issueDate} />
          <FormField control={passportData.controls.issuedBy} />
          <FormField control={passportData.controls.departmentCode} />
        </div>
      </section>

      {/* Документы */}
      <section className="documents-section">
        <h3>Документы</h3>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.controls.inn} />
          <FormField control={form.controls.snils} />
        </div>
      </section>
    </div>
  );
}
```

### Шаг с массивами форм

```typescript
// src/domains/credit-applications/form/components/steps/Step5Additional.tsx

import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/form-field';
import type { FormStore } from '@/lib/forms/core/form-store';
import type { CreditApplicationForm } from '../../../_shared/types/credit-application';

interface Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step5Additional({ form }: Props) {
  useSignals();

  const hasProperty = form.controls.hasProperty.value;
  const hasExistingLoans = form.controls.hasExistingLoans.value;
  const hasCoBorrower = form.controls.hasCoBorrower.value;

  const properties = form.controls.properties;
  const existingLoans = form.controls.existingLoans;
  const coBorrowers = form.controls.coBorrowers;

  return (
    <div className="step step-5">
      <h2>Шаг 5: Дополнительная информация</h2>

      {/* ====================================================================== */}
      {/* Массив форм: Имущество */}
      {/* ====================================================================== */}

      <section className="properties-section">
        <FormField control={form.controls.hasProperty} />

        {hasProperty && (
          <div className="array-items">
            <h3>Имущество</h3>

            {/* Список элементов */}
            {properties.controls.value.map((propertyForm, index) => (
              <div key={index} className="array-item card">
                <div className="item-header">
                  <h4>Объект #{index + 1}</h4>
                  <button
                    onClick={() => properties.removeAt(index)}
                    className="btn-danger"
                  >
                    Удалить
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={propertyForm.controls.type} />
                  <FormField control={propertyForm.controls.estimatedValue} />
                  <FormField
                    control={propertyForm.controls.description}
                    className="col-span-2"
                  />
                  <FormField control={propertyForm.controls.hasEncumbrance} />
                </div>
              </div>
            ))}

            {/* Кнопка добавления */}
            <button
              onClick={() => properties.push()}
              className="btn-primary"
            >
              + Добавить имущество
            </button>

            <div className="info">
              Всего объектов: {properties.length.value}
            </div>
          </div>
        )}
      </section>

      {/* ====================================================================== */}
      {/* Массив форм: Существующие кредиты */}
      {/* ====================================================================== */}

      <section className="existing-loans-section">
        <FormField control={form.controls.hasExistingLoans} />

        {hasExistingLoans && (
          <div className="array-items">
            <h3>Существующие кредиты</h3>

            {existingLoans.controls.value.map((loanForm, index) => (
              <div key={index} className="array-item card">
                <div className="item-header">
                  <h4>Кредит #{index + 1}</h4>
                  <button
                    onClick={() => existingLoans.removeAt(index)}
                    className="btn-danger"
                  >
                    Удалить
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={loanForm.controls.bank} />
                  <FormField control={loanForm.controls.type} />
                  <FormField control={loanForm.controls.amount} />
                  <FormField control={loanForm.controls.remainingAmount} />
                  <FormField control={loanForm.controls.monthlyPayment} />
                  <FormField control={loanForm.controls.maturityDate} />
                </div>
              </div>
            ))}

            <button
              onClick={() => existingLoans.push()}
              className="btn-primary"
            >
              + Добавить кредит
            </button>
          </div>
        )}
      </section>

      {/* ====================================================================== */}
      {/* Массив форм с вложенными формами: Созаемщики */}
      {/* ====================================================================== */}

      <section className="co-borrowers-section">
        <FormField control={form.controls.hasCoBorrower} />

        {hasCoBorrower && (
          <div className="array-items">
            <h3>Созаемщики</h3>

            {coBorrowers.controls.value.map((coBorrowerForm, index) => (
              <div key={index} className="array-item card">
                <div className="item-header">
                  <h4>Созаемщик #{index + 1}</h4>
                  <button
                    onClick={() => coBorrowers.removeAt(index)}
                    className="btn-danger"
                  >
                    Удалить
                  </button>
                </div>

                {/* Вложенная форма внутри элемента массива! */}
                <div className="nested-group">
                  <h5>Личные данные</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={
                        coBorrowerForm.controls.personalData.controls.firstName
                      }
                    />
                    <FormField
                      control={
                        coBorrowerForm.controls.personalData.controls.lastName
                      }
                    />
                    <FormField
                      control={
                        coBorrowerForm.controls.personalData.controls.middleName
                      }
                    />
                    <FormField
                      control={
                        coBorrowerForm.controls.personalData.controls.birthDate
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={coBorrowerForm.controls.relationship} />
                  <FormField control={coBorrowerForm.controls.monthlyIncome} />
                </div>
              </div>
            ))}

            <button
              onClick={() => coBorrowers.push()}
              className="btn-primary"
            >
              + Добавить созаемщика
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
```

---

# Вариант 5: Proxy-based Deep Access

## 1. Схема с массивами (Вариант 5)

```typescript
// src/domains/credit-applications/form/schema/credit-form-schema-v5.ts

import type { DeepFormSchema } from '@/lib/forms/types';
import type { CreditApplicationForm } from '../_shared/types/credit-application';
import { Input, Select, Textarea, Checkbox } from '@/lib/forms/components';
import {
  LOAN_TYPES,
  EMPLOYMENT_STATUSES,
  PROPERTY_TYPES,
} from '../_shared/constants/credit-application';

export const creditApplicationSchemaV5: DeepFormSchema<CreditApplicationForm> = {
  // Метаданные
  currentStep: {
    value: 1,
    component: () => null,
  },
  completedSteps: {
    value: [],
    component: () => null,
  },

  // ========================================================================
  // Step 1: Основная информация
  // ========================================================================

  loanType: {
    value: 'consumer',
    component: Select,
    componentProps: { label: 'Тип кредита', options: LOAN_TYPES },
  },

  loanAmount: {
    value: 0,
    component: Input,
    componentProps: {
      label: 'Сумма кредита (₽)',
      type: 'number',
      min: 50000,
    },
  },

  loanTerm: {
    value: 12,
    component: Input,
    componentProps: { label: 'Срок (месяцев)', type: 'number' },
  },

  loanPurpose: {
    value: '',
    component: Textarea,
    componentProps: { label: 'Цель кредита', rows: 4 },
  },

  // ========================================================================
  // Step 2: Персональные данные (вложенные объекты как группы)
  // ========================================================================

  personalData: {
    firstName: {
      value: '',
      component: Input,
      componentProps: { label: 'Имя' },
    },
    lastName: {
      value: '',
      component: Input,
      componentProps: { label: 'Фамилия' },
    },
    middleName: {
      value: '',
      component: Input,
      componentProps: { label: 'Отчество' },
    },
    birthDate: {
      value: '',
      component: Input,
      componentProps: { label: 'Дата рождения', type: 'date' },
    },
    gender: {
      value: 'male',
      component: Select,
      componentProps: {
        label: 'Пол',
        options: [
          { value: 'male', label: 'Мужской' },
          { value: 'female', label: 'Женский' },
        ],
      },
    },
  },

  passportData: {
    series: {
      value: '',
      component: Input,
      componentProps: { label: 'Серия', maxLength: 4 },
    },
    number: {
      value: '',
      component: Input,
      componentProps: { label: 'Номер', maxLength: 6 },
    },
    issueDate: {
      value: '',
      component: Input,
      componentProps: { label: 'Дата выдачи', type: 'date' },
    },
    issuedBy: {
      value: '',
      component: Textarea,
      componentProps: { label: 'Кем выдан', rows: 3 },
    },
    departmentCode: {
      value: '',
      component: Input,
      componentProps: { label: 'Код подразделения' },
    },
  },

  inn: {
    value: '',
    component: Input,
    componentProps: { label: 'ИНН' },
  },

  snils: {
    value: '',
    component: Input,
    componentProps: { label: 'СНИЛС' },
  },

  // ========================================================================
  // Step 3: Контактная информация
  // ========================================================================

  phoneMain: {
    value: '',
    component: Input,
    componentProps: { label: 'Телефон', type: 'tel' },
  },

  email: {
    value: '',
    component: Input,
    componentProps: { label: 'Email', type: 'email' },
  },

  registrationAddress: {
    region: {
      value: '',
      component: Input,
      componentProps: { label: 'Регион' },
    },
    city: {
      value: '',
      component: Input,
      componentProps: { label: 'Город' },
    },
    street: {
      value: '',
      component: Input,
      componentProps: { label: 'Улица' },
    },
    house: {
      value: '',
      component: Input,
      componentProps: { label: 'Дом' },
    },
    apartment: {
      value: '',
      component: Input,
      componentProps: { label: 'Квартира' },
    },
    postalCode: {
      value: '',
      component: Input,
      componentProps: { label: 'Индекс' },
    },
  },

  // ========================================================================
  // Step 4: Занятость
  // ========================================================================

  employmentStatus: {
    value: 'employed',
    component: Select,
    componentProps: { label: 'Статус', options: EMPLOYMENT_STATUSES },
  },

  companyName: {
    value: '',
    component: Input,
    componentProps: { label: 'Компания' },
  },

  position: {
    value: '',
    component: Input,
    componentProps: { label: 'Должность' },
  },

  monthlyIncome: {
    value: 0,
    component: Input,
    componentProps: { label: 'Доход (₽)', type: 'number' },
  },

  // ========================================================================
  // Step 5: Дополнительная информация (массивы)
  // ========================================================================

  hasProperty: {
    value: false,
    component: Checkbox,
    componentProps: { label: 'Имеется имущество' },
  },

  properties: {
    type: 'array',
    factory: {
      type: {
        value: 'apartment',
        component: Select,
        componentProps: { label: 'Тип', options: PROPERTY_TYPES },
      },
      description: {
        value: '',
        component: Textarea,
        componentProps: { label: 'Описание', rows: 3 },
      },
      estimatedValue: {
        value: 0,
        component: Input,
        componentProps: { label: 'Стоимость (₽)', type: 'number' },
      },
      hasEncumbrance: {
        value: false,
        component: Checkbox,
        componentProps: { label: 'Обременение' },
      },
    },
    initial: [],
  },

  hasExistingLoans: {
    value: false,
    component: Checkbox,
    componentProps: { label: 'Имеются кредиты' },
  },

  existingLoans: {
    type: 'array',
    factory: {
      bank: {
        value: '',
        component: Input,
        componentProps: { label: 'Банк' },
      },
      type: {
        value: '',
        component: Input,
        componentProps: { label: 'Тип кредита' },
      },
      amount: {
        value: 0,
        component: Input,
        componentProps: { label: 'Сумма (₽)', type: 'number' },
      },
      remainingAmount: {
        value: 0,
        component: Input,
        componentProps: { label: 'Остаток (₽)', type: 'number' },
      },
      monthlyPayment: {
        value: 0,
        component: Input,
        componentProps: { label: 'Платеж (₽)', type: 'number' },
      },
      maturityDate: {
        value: '',
        component: Input,
        componentProps: { label: 'Дата погашения', type: 'date' },
      },
    },
    initial: [],
  },

  hasCoBorrower: {
    value: false,
    component: Checkbox,
    componentProps: { label: 'Добавить созаемщика' },
  },

  // Массив с вложенными формами!
  coBorrowers: {
    type: 'array',
    factory: {
      // Вложенная группа внутри массива
      personalData: {
        firstName: {
          value: '',
          component: Input,
          componentProps: { label: 'Имя' },
        },
        lastName: {
          value: '',
          component: Input,
          componentProps: { label: 'Фамилия' },
        },
        middleName: {
          value: '',
          component: Input,
          componentProps: { label: 'Отчество' },
        },
        birthDate: {
          value: '',
          component: Input,
          componentProps: { label: 'Дата рождения', type: 'date' },
        },
        gender: {
          value: 'male',
          component: Select,
          componentProps: {
            label: 'Пол',
            options: [
              { value: 'male', label: 'Мужской' },
              { value: 'female', label: 'Женский' },
            ],
          },
        },
      },
      relationship: {
        value: '',
        component: Input,
        componentProps: { label: 'Родство' },
      },
      monthlyIncome: {
        value: 0,
        component: Input,
        componentProps: { label: 'Доход (₽)', type: 'number' },
      },
    },
    initial: [],
  },

  // ========================================================================
  // Step 6: Согласия
  // ========================================================================

  agreePersonalData: {
    value: false,
    component: Checkbox,
    componentProps: { label: 'Согласие на обработку данных' },
  },

  agreeCreditHistory: {
    value: false,
    component: Checkbox,
    componentProps: { label: 'Согласие на проверку КИ' },
  },

  agreeTerms: {
    value: false,
    component: Checkbox,
    componentProps: { label: 'Согласие с условиями' },
  },

  confirmAccuracy: {
    value: false,
    component: Checkbox,
    componentProps: { label: 'Подтверждаю достоверность' },
  },
};
```

## 2. React компоненты (Вариант 5)

### Шаг с вложенными формами (элегантный доступ)

```typescript
// src/domains/credit-applications/form/components/steps/Step2PersonalInfoV5.tsx

import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/form-field';
import type { FormStore } from '@/lib/forms/core/form-store';
import type { CreditApplicationForm } from '../../../_shared/types/credit-application';

interface Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step2PersonalInfoV5({ form }: Props) {
  useSignals();

  return (
    <div className="step step-2">
      <h2>Шаг 2: Персональные данные</h2>

      {/* Вложенная форма: Личные данные */}
      {/* Обратите внимание на элегантный доступ через точку! */}
      <section className="personal-data-section">
        <h3>Личные данные</h3>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.controls.personalData.lastName} />
          <FormField control={form.controls.personalData.firstName} />
          <FormField control={form.controls.personalData.middleName} />
          <FormField control={form.controls.personalData.birthDate} />
          <FormField control={form.controls.personalData.gender} />
        </div>
      </section>

      {/* Вложенная форма: Паспортные данные */}
      <section className="passport-data-section">
        <h3>Паспортные данные</h3>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.controls.passportData.series} />
          <FormField control={form.controls.passportData.number} />
          <FormField control={form.controls.passportData.issueDate} />
          <FormField control={form.controls.passportData.issuedBy} />
          <FormField control={form.controls.passportData.departmentCode} />
        </div>
      </section>

      {/* Документы */}
      <section className="documents-section">
        <h3>Документы</h3>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.controls.inn} />
          <FormField control={form.controls.snils} />
        </div>
      </section>
    </div>
  );
}
```

### Шаг с массивами форм (элегантный доступ по индексу)

```typescript
// src/domains/credit-applications/form/components/steps/Step5AdditionalV5.tsx

import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/form-field';
import type { FormStore } from '@/lib/forms/core/form-store';
import type { CreditApplicationForm } from '../../../_shared/types/credit-application';

interface Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step5AdditionalV5({ form }: Props) {
  useSignals();

  const hasProperty = form.controls.hasProperty.value;
  const hasExistingLoans = form.controls.hasExistingLoans.value;
  const hasCoBorrower = form.controls.hasCoBorrower.value;

  const properties = form.controls.properties;
  const existingLoans = form.controls.existingLoans;
  const coBorrowers = form.controls.coBorrowers;

  return (
    <div className="step step-5">
      <h2>Шаг 5: Дополнительная информация</h2>

      {/* ====================================================================== */}
      {/* Массив форм: Имущество - доступ через индекс [i] */}
      {/* ====================================================================== */}

      <section className="properties-section">
        <FormField control={form.controls.hasProperty} />

        {hasProperty && (
          <div className="array-items">
            <h3>Имущество</h3>

            {properties.items.value.map((_, index) => (
              <div key={index} className="array-item card">
                <div className="item-header">
                  <h4>Объект #{index + 1}</h4>
                  <button
                    onClick={() => properties.remove(index)}
                    className="btn-danger"
                  >
                    Удалить
                  </button>
                </div>

                {/* Элегантный доступ через индекс! */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={properties[index].type} />
                  <FormField control={properties[index].estimatedValue} />
                  <FormField
                    control={properties[index].description}
                    className="col-span-2"
                  />
                  <FormField control={properties[index].hasEncumbrance} />
                </div>
              </div>
            ))}

            <button onClick={() => properties.push()} className="btn-primary">
              + Добавить имущество
            </button>

            <div className="info">
              Всего объектов: {properties.length.value}
            </div>
          </div>
        )}
      </section>

      {/* ====================================================================== */}
      {/* Массив форм: Существующие кредиты */}
      {/* ====================================================================== */}

      <section className="existing-loans-section">
        <FormField control={form.controls.hasExistingLoans} />

        {hasExistingLoans && (
          <div className="array-items">
            <h3>Существующие кредиты</h3>

            {existingLoans.items.value.map((_, index) => (
              <div key={index} className="array-item card">
                <div className="item-header">
                  <h4>Кредит #{index + 1}</h4>
                  <button
                    onClick={() => existingLoans.remove(index)}
                    className="btn-danger"
                  >
                    Удалить
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={existingLoans[index].bank} />
                  <FormField control={existingLoans[index].type} />
                  <FormField control={existingLoans[index].amount} />
                  <FormField control={existingLoans[index].remainingAmount} />
                  <FormField control={existingLoans[index].monthlyPayment} />
                  <FormField control={existingLoans[index].maturityDate} />
                </div>
              </div>
            ))}

            <button
              onClick={() => existingLoans.push()}
              className="btn-primary"
            >
              + Добавить кредит
            </button>
          </div>
        )}
      </section>

      {/* ====================================================================== */}
      {/* Массив с вложенными формами: Созаемщики */}
      {/* Самый сложный случай - массив + вложенная форма */}
      {/* ====================================================================== */}

      <section className="co-borrowers-section">
        <FormField control={form.controls.hasCoBorrower} />

        {hasCoBorrower && (
          <div className="array-items">
            <h3>Созаемщики</h3>

            {coBorrowers.items.value.map((_, index) => (
              <div key={index} className="array-item card">
                <div className="item-header">
                  <h4>Созаемщик #{index + 1}</h4>
                  <button
                    onClick={() => coBorrowers.remove(index)}
                    className="btn-danger"
                  >
                    Удалить
                  </button>
                </div>

                {/* Вложенная форма внутри массива! */}
                {/* Обратите внимание на элегантный доступ: */}
                {/* coBorrowers[index].personalData.firstName */}
                <div className="nested-group">
                  <h5>Личные данные</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={coBorrowers[index].personalData.firstName}
                    />
                    <FormField
                      control={coBorrowers[index].personalData.lastName}
                    />
                    <FormField
                      control={coBorrowers[index].personalData.middleName}
                    />
                    <FormField
                      control={coBorrowers[index].personalData.birthDate}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={coBorrowers[index].relationship} />
                  <FormField control={coBorrowers[index].monthlyIncome} />
                </div>
              </div>
            ))}

            <button onClick={() => coBorrowers.push()} className="btn-primary">
              + Добавить созаемщика
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
```

---

## Сравнение API для одного и того же кода

### Доступ к вложенной форме

```typescript
// Вариант 2 (FormGroup)
form.controls.personalData.controls.firstName.value = 'John';

// Вариант 5 (Proxy)
form.controls.personalData.firstName.value = 'John';
```

### Доступ к элементу массива

```typescript
// Вариант 2 (FormArray)
form.controls.properties.at(0).controls.type.value = 'apartment';

// Вариант 5 (Proxy Array)
form.controls.properties[0].type.value = 'apartment';
```

### Доступ к вложенной форме внутри массива

```typescript
// Вариант 2
form.controls.coBorrowers.at(0).controls.personalData.controls.firstName.value = 'John';

// Вариант 5
form.controls.coBorrowers[0].personalData.firstName.value = 'John';
```

### Управление массивом

```typescript
// Вариант 2
properties.push();
properties.removeAt(0);
properties.at(0);

// Вариант 5
properties.push();
properties.remove(0); // removeAt -> remove
properties[0]; // прямой доступ по индексу
```

---

## Итоговое сравнение

| Аспект | Вариант 2 (FormGroup) | Вариант 5 (Proxy) |
|--------|-----------------------|-------------------|
| **Вложенные формы** | `.controls.personalData.controls.firstName` | `.personalData.firstName` |
| **Массивы** | `.properties.at(0).controls.type` | `.properties[0].type` |
| **Читаемость** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Простота реализации** | ⭐⭐⭐⭐ | ⭐⭐ |
| **Типизация** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Отладка** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Production-ready** | ✅ Да | ⚠️ Экспериментально |

---

## Рекомендации

### Для production проектов
**Используйте Вариант 2 (FormGroup + FormArray)**:
- Надежная реализация
- Отличная типизация
- Легко отлаживать
- Проверенный паттерн из Angular

### Для экспериментов
**Попробуйте Вариант 5 (Proxy)**:
- Красивейший API
- Минимальный boilerplate
- Приятно работать

### Гибридный подход
Можно совместить лучшее из обоих миров:
1. Использовать FormGroup/FormArray для надежности
2. Добавить тонкий Proxy слой для удобного доступа

```typescript
// Внутри FormArray добавить Proxy для доступа по индексу
get proxy() {
  return new Proxy(this, {
    get(target, prop) {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        return target.at(parseInt(prop));
      }
      return target[prop];
    }
  });
}

// Использование
form.controls.properties.proxy[0].type.value = 'apartment';
```

Это даст вам и надежность Варианта 2, и удобство Варианта 5!
