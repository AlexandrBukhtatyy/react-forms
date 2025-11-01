# Примеры миграции на ArrayNode

Этот документ содержит полные примеры кода для миграции формы заявки на кредит на использование ArrayNode.

---

## 📋 Содержание

1. [Фаза 1: Типы и конфигурация](#фаза-1-типы-и-конфигурация)
2. [Фаза 2: Схемы валидации](#фаза-2-схемы-валидации)
3. [Фаза 3: Обновление формы](#фаза-3-обновление-формы)
4. [Фаза 4: UI компоненты](#фаза-4-ui-компоненты)

---

## Фаза 1: Типы и конфигурация

### 1.1. Обновить тип DeepFormSchema

**Файл**: `src/lib/forms/types/deep-schema.ts`

```typescript
// НИЧЕГО НЕ МЕНЯЕМ! Типы остаются как есть:

export type DeepFormSchema<T> = {
  [K in keyof T]:
    | FieldConfig<T[K]>
    | DeepFormSchema<T[K]>
    | DeepFormSchema<T[K]>[];  // ✅ Оставляем массив как [schema]
};

// ✅ Преимущество: не нужно менять существующий код!
// GroupNode будет автоматически создавать ArrayNode из массива
```

---

### 1.2. Обновить GroupNode конструктор

**Файл**: `src/lib/forms/core/nodes/group-node.ts`

```typescript
// БЫЛО (строки 70-90)
for (const [key, config] of Object.entries(schema)) {
  if (Array.isArray(config)) {
    // TODO: Legacy array support - будет удалено после миграции
    (controls as any)[key] = config;
  } else if (typeof config === 'object' && 'value' in config) {
    controls[key] = new FieldNode(config as FieldConfig);
  } else {
    controls[key] = new GroupNode(config as DeepFormSchema<any>);
  }
}

// СТАЛО (автоматическое создание ArrayNode из массива)
import { ArrayNode } from './array-node';

// ... в конструкторе GroupNode:
for (const [key, config] of Object.entries(schema)) {
  // 1. ✅ Массив [schema] → создаем ArrayNode
  if (Array.isArray(config)) {
    if (config.length === 1) {
      // Формат: properties: [propertyFormSchema]
      const itemSchema = config[0] as DeepFormSchema<any>;
      const arrayNode = new ArrayNode(itemSchema, []);
      controls[key] = arrayNode;
    } else {
      // Если массив содержит несколько элементов или пустой - это legacy
      console.warn(`Unexpected array format for "${key}". Expected single schema element.`);
      (controls as any)[key] = config;
    }
  }
  // 2. FieldNode
  else if (typeof config === 'object' && 'value' in config) {
    controls[key] = new FieldNode(config as FieldConfig);
  }
  // 3. Вложенный GroupNode
  else {
    controls[key] = new GroupNode(config as DeepFormSchema<any>);
  }
}
```

**Ключевое изменение**:
- ✅ `properties: [propertyFormSchema]` → автоматически создается `ArrayNode<Property>`
- ✅ Не нужно менять схему формы!
- ✅ Обратная совместимость сохранена

---

### 1.3. Обновить типы GroupNodeWithControls

**Файл**: `src/lib/forms/types/group-node-proxy.ts`

```typescript
// БЫЛО
export type GroupNodeWithControls<T> = GroupNode<T> & {
  [K in keyof T]: T[K] extends object
    ? GroupNodeWithControls<T[K]>
    : FieldNode<T[K]>;
};

// СТАЛО (добавлена поддержка ArrayNode в типах)
import type { ArrayNode } from '../core/nodes/array-node';

export type GroupNodeWithControls<T> = GroupNode<T> & {
  [K in keyof T]: T[K] extends Array<infer U>
    ? ArrayNode<U>  // Массив → ArrayNode
    : T[K] extends object
    ? GroupNodeWithControls<T[K]>  // Объект → GroupNode
    : FieldNode<T[K]>;  // Примитив → FieldNode
};
```

---

## Фаза 2: Схемы валидации

### 2.1. Создать валидацию для Property

**Файл**: `src/domains/credit-applications/form/schemas/validation/property-validation.ts`

```typescript
import type { FieldPath } from '@/lib/forms/types';
import {
  required,
  min,
  minLength,
  maxLength,
} from '@/lib/forms/validators';
import type { Property } from '../../components/nested-forms/PropertyForm';

/**
 * Схема валидации для элемента имущества
 * Применяется к каждому элементу массива properties
 */
export const propertyValidation = (path: FieldPath<Property>) => {
  // Тип имущества
  required(path.type, { message: 'Укажите тип имущества' });

  // Описание
  required(path.description, { message: 'Добавьте описание имущества' });
  minLength(path.description, 10, {
    message: 'Описание должно содержать минимум 10 символов'
  });
  maxLength(path.description, 500, {
    message: 'Описание не должно превышать 500 символов'
  });

  // Оценочная стоимость
  required(path.estimatedValue, { message: 'Укажите оценочную стоимость' });
  min(path.estimatedValue, 10000, {
    message: 'Минимальная стоимость имущества: 10 000 ₽'
  });

  // hasEncumbrance - boolean, валидация не требуется
};
```

---

### 2.2. Создать валидацию для ExistingLoan

**Файл**: `src/domains/credit-applications/form/schemas/validation/existing-loan-validation.ts`

```typescript
import type { FieldPath } from '@/lib/forms/types';
import {
  required,
  min,
  minLength,
  maxLength,
  validateTree,
  validate,
} from '@/lib/forms/validators';
import type { ExistingLoan } from '../../components/nested-forms/ExistingLoanForm';

/**
 * Схема валидации для существующего кредита
 * Применяется к каждому элементу массива existingLoans
 */
export const existingLoanValidation = (path: FieldPath<ExistingLoan>) => {
  // Название банка
  required(path.bank, { message: 'Укажите название банка' });
  minLength(path.bank, 3, { message: 'Минимум 3 символа' });
  maxLength(path.bank, 100, { message: 'Максимум 100 символов' });

  // Тип кредита
  required(path.type, { message: 'Укажите тип кредита' });

  // Сумма кредита
  required(path.amount, { message: 'Укажите сумму кредита' });
  min(path.amount, 1, { message: 'Сумма должна быть больше 0' });

  // Остаток долга
  required(path.remainingAmount, { message: 'Укажите остаток долга' });
  min(path.remainingAmount, 0, { message: 'Остаток не может быть отрицательным' });

  // Ежемесячный платеж
  required(path.monthlyPayment, { message: 'Укажите ежемесячный платеж' });
  min(path.monthlyPayment, 1, { message: 'Платеж должен быть больше 0' });

  // Дата погашения
  required(path.maturityDate, { message: 'Укажите дату погашения' });

  validate(path.maturityDate, (ctx) => {
    const maturityDate = new Date(ctx.value());
    const today = new Date();

    if (maturityDate < today) {
      return {
        code: 'maturityDateInPast',
        message: 'Дата погашения не может быть в прошлом',
      };
    }
    return null;
  });

  // Кросс-полевая валидация: остаток не может превышать сумму кредита
  validateTree(
    (ctx) => {
      const loan = ctx.formValue();

      if (loan.remainingAmount > loan.amount) {
        return {
          code: 'remainingExceedsAmount',
          message: 'Остаток долга не может превышать сумму кредита',
        };
      }
      return null;
    },
    { targetField: 'remainingAmount' }
  );
};
```

---

### 2.3. Создать валидацию для CoBorrower

**Файл**: `src/domains/credit-applications/form/schemas/validation/co-borrower-validation.ts`

```typescript
import type { FieldPath } from '@/lib/forms/types';
import {
  required,
  min,
  max,
  minLength,
  maxLength,
  pattern,
  email,
  validate,
} from '@/lib/forms/validators';
import type { CoBorrower } from '../../components/nested-forms/CoBorrowerForm';

/**
 * Схема валидации для созаемщика
 * Применяется к каждому элементу массива coBorrowers
 */
export const coBorrowerValidation = (path: FieldPath<CoBorrower>) => {
  // ========================================================================
  // Персональные данные (вложенная группа)
  // ========================================================================

  // Фамилия
  required(path.personalData.lastName, { message: 'Фамилия обязательна' });
  minLength(path.personalData.lastName, 2, { message: 'Минимум 2 символа' });
  maxLength(path.personalData.lastName, 50, { message: 'Максимум 50 символов' });
  pattern(path.personalData.lastName, /^[А-ЯЁа-яё\s-]+$/, {
    message: 'Только русские буквы, пробелы и дефис',
  });

  // Имя
  required(path.personalData.firstName, { message: 'Имя обязательно' });
  minLength(path.personalData.firstName, 2, { message: 'Минимум 2 символа' });
  maxLength(path.personalData.firstName, 50, { message: 'Максимум 50 символов' });
  pattern(path.personalData.firstName, /^[А-ЯЁа-яё\s-]+$/, {
    message: 'Только русские буквы, пробелы и дефис',
  });

  // Отчество
  required(path.personalData.middleName, { message: 'Отчество обязательно' });
  minLength(path.personalData.middleName, 2, { message: 'Минимум 2 символа' });
  maxLength(path.personalData.middleName, 50, { message: 'Максимум 50 символов' });
  pattern(path.personalData.middleName, /^[А-ЯЁа-яё\s-]+$/, {
    message: 'Только русские буквы, пробелы и дефис',
  });

  // Дата рождения
  required(path.personalData.birthDate, { message: 'Дата рождения обязательна' });

  validate(path.personalData.birthDate, (ctx) => {
    const birthDate = new Date(ctx.value());
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 18) {
      return {
        code: 'tooYoung',
        message: 'Созаемщику должно быть не менее 18 лет',
      };
    }

    if (age > 75) {
      return {
        code: 'tooOld',
        message: 'Максимальный возраст созаемщика: 75 лет',
      };
    }

    return null;
  });

  // ========================================================================
  // Контактные данные
  // ========================================================================

  // Телефон
  required(path.phone, { message: 'Телефон обязателен' });
  pattern(path.phone, /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/, {
    message: 'Формат: +7 (___) ___-__-__',
  });

  // Email
  required(path.email, { message: 'Email обязателен' });
  email(path.email);

  // ========================================================================
  // Дополнительная информация
  // ========================================================================

  // Отношение к заемщику
  required(path.relationship, { message: 'Укажите отношение к заемщику' });

  // Ежемесячный доход
  required(path.monthlyIncome, { message: 'Укажите ежемесячный доход' });
  min(path.monthlyIncome, 10000, { message: 'Минимальный доход: 10 000 ₽' });
  max(path.monthlyIncome, 10000000, { message: 'Максимальный доход: 10 000 000 ₽' });
};
```

---

### 2.4. Обновить additional-validation.ts

**Файл**: `src/domains/credit-applications/form/schemas/validation/additional-validation.ts`

```typescript
import type { FieldPath } from '@/lib/forms/types';
import {
  applyWhen,
  validate,
  required,
  min,
  max,
} from '@/lib/forms/validators';
import type { CreditApplicationForm } from '../../types/credit-application';

/**
 * Схема валидации для Шага 5: Дополнительная информация
 *
 * ✅ Валидация массивов вынесена в отдельные схемы:
 * - property-validation.ts
 * - existing-loan-validation.ts
 * - co-borrower-validation.ts
 */
export const additionalValidation = (path: FieldPath<CreditApplicationForm>) => {
  required(path.maritalStatus, { message: 'Укажите семейное положение' });

  required(path.dependents, { message: 'Укажите количество иждивенцев' });
  min(path.dependents, 0, { message: 'Количество не может быть отрицательным' });
  max(path.dependents, 10, { message: 'Максимальное количество иждивенцев: 10' });

  required(path.education, { message: 'Укажите уровень образования' });

  // ========================================================================
  // Валидация массива имущества
  // ========================================================================

  applyWhen(
    path.hasProperty,
    (value) => value === true,
    (path) => {
      // Проверяем что массив не пустой
      validate(path.properties, (ctx) => {
        const properties = ctx.value();
        if (!properties || properties.length === 0) {
          return {
            code: 'noProperties',
            message: 'Добавьте хотя бы один объект имущества',
          };
        }
        return null;
      });

      // ✅ Валидация элементов массива теперь в property-validation.ts
      // Применяется автоматически через ArrayNode
    }
  );

  // ========================================================================
  // Валидация массива существующих кредитов
  // ========================================================================

  applyWhen(
    path.hasExistingLoans,
    (value) => value === true,
    (path) => {
      // Проверяем что массив не пустой
      validate(path.existingLoans, (ctx) => {
        const loans = ctx.value();
        if (!loans || loans.length === 0) {
          return {
            code: 'noExistingLoans',
            message: 'Добавьте информацию о существующих кредитах',
          };
        }
        return null;
      });

      // ✅ Валидация элементов массива теперь в existing-loan-validation.ts
    }
  );

  // ========================================================================
  // Валидация массива созаемщиков
  // ========================================================================

  applyWhen(
    path.hasCoBorrower,
    (value) => value === true,
    (path) => {
      // Проверяем что массив не пустой
      validate(path.coBorrowers, (ctx) => {
        const coBorrowers = ctx.value();
        if (!coBorrowers || coBorrowers.length === 0) {
          return {
            code: 'noCoBorrowers',
            message: 'Добавьте информацию о созаемщике',
          };
        }
        return null;
      });

      // ✅ Валидация элементов массива теперь в co-borrower-validation.ts
    }
  );
};
```

---

## Фаза 3: Обновление формы

### 3.1. ~~Обновить credit-application-schema.ts~~ ✅ НЕ ТРЕБУЕТСЯ!

**Файл**: `src/domains/credit-applications/form/schemas/credit-application-schema.ts`

```typescript
import type { DeepFormSchema } from '@/lib/forms';
// ... остальные импорты

// ✅ НЕ НУЖНО импортировать схемы валидации здесь!
// Они будут применяться в ArrayNode напрямую

export const creditApplicationSchema: DeepFormSchema<CreditApplicationForm> = {
  // ... все существующие поля ...

  // ========================================================================
  // Шаг 5: Дополнительная информация
  // ========================================================================

  maritalStatus: { /* ... */ },
  dependents: { /* ... */ },
  education: { /* ... */ },
  hasProperty: { /* ... */ },

  // ✅ ОСТАВЛЯЕМ КАК ЕСТЬ:
  properties: [propertyFormSchema],  // GroupNode создаст ArrayNode автоматически

  hasExistingLoans: { /* ... */ },

  // ✅ ОСТАВЛЯЕМ КАК ЕСТЬ:
  existingLoans: [existingLoansFormSchema],

  hasCoBorrower: { /* ... */ },

  // ✅ ОСТАВЛЯЕМ КАК ЕСТЬ:
  coBorrowers: [coBorrowersFormSchema],

  // ... остальные поля ...
};
```

**Важно**: Схема формы вообще НЕ МЕНЯЕТСЯ! Вся магия происходит внутри GroupNode.

---

### 3.2. Добавить метод clear() в ArrayNode

**Файл**: `src/lib/forms/core/nodes/array-node.ts`

```typescript
export class ArrayNode<T = any> extends FormNode<T[]> {
  // ... существующий код ...

  /**
   * Очистить массив (удалить все элементы)
   */
  public clear(): void {
    this.items.value = [];
    this.markAsDirty();
  }

  /**
   * Валидация всех элементов массива
   */
  public async validate(): Promise<boolean> {
    const results = await Promise.all(
      this.items.value.map((item) => item.validate())
    );
    return results.every((valid) => valid);
  }

  /**
   * Пометить все элементы как touched
   */
  public markAllAsTouched(): void {
    this.items.value.forEach((item) => item.markAsTouched());
    this.markAsTouched();
  }

  /**
   * Сбросить все элементы в начальное состояние
   */
  public reset(): void {
    this.items.value.forEach((item) => item.reset());
    this.markAsPristine();
    this.markAsUntouched();
  }
}
```

---

### 3.3. Добавить behavior schema для автоочистки

**Файл**: `src/domains/credit-applications/form/schemas/credit-application-behavior.ts`

```typescript
// Добавить в существующую функцию creditApplicationBehavior:

export const creditApplicationBehavior = (path: FieldPath<CreditApplicationForm>) => {
  // ... существующие behaviors ...

  // ========================================================================
  // Автоочистка массивов при снятии чекбоксов
  // ========================================================================

  // Очищаем массив имущества при hasProperty = false
  watchField(path.hasProperty, (hasProperty, form) => {
    if (!hasProperty && form.properties && form.properties.length > 0) {
      form.properties.clear();
    }
  });

  // Очищаем массив кредитов при hasExistingLoans = false
  watchField(path.hasExistingLoans, (hasLoans, form) => {
    if (!hasLoans && form.existingLoans && form.existingLoans.length > 0) {
      form.existingLoans.clear();
    }
  });

  // Очищаем массив созаемщиков при hasCoBorrower = false
  watchField(path.hasCoBorrower, (hasCoBorrower, form) => {
    if (!hasCoBorrower && form.coBorrowers && form.coBorrowers.length > 0) {
      form.coBorrowers.clear();
    }
  });
};
```

---

## Фаза 4: UI компоненты

### 4.1. Проверка работы FormArrayManager

**Файл**: `src/lib/forms/components/form-array-manager.tsx`

Компонент уже должен корректно работать с ArrayNode. Проверьте:

```typescript
import type { ArrayNode } from '../core/nodes/array-node';

interface FormArrayManagerProps<T> {
  control: ArrayNode<T> | undefined;
  component: React.ComponentType<{ control: any }>;
  itemLabel?: string;
}

export function FormArrayManager<T>({ control, component: Component, itemLabel = 'Item' }: FormArrayManagerProps<T>) {
  if (!control) {
    return null;
  }

  return (
    <div className="space-y-4">
      {control.items.value.map((item, index) => (
        <div key={index} className="p-4 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium">{itemLabel} {index + 1}</h4>
            <button
              type="button"
              onClick={() => control.removeAt(index)}
              className="text-red-600 hover:text-red-800"
            >
              Удалить
            </button>
          </div>

          {/* Рендерим компонент формы для элемента */}
          <Component control={item} />
        </div>
      ))}
    </div>
  );
}
```

---

### 4.2. Использование в AdditionalInfoForm (уже готово)

**Файл**: `src/domains/credit-applications/form/components/steps/AdditionalInfoForm.tsx`

```typescript
export function AdditionalInfoForm({ control }: AdditionalInfoFormProps) {
  const hasProperty = control.hasProperty.value.value;
  const hasExistingLoans = control.hasExistingLoans.value.value;
  const hasCoBorrower = control.hasCoBorrower.value.value;

  return (
    <div className="space-y-6">
      {/* ... другие поля ... */}

      {/* Имущество */}
      <div className="space-y-4">
        <FormField control={control.hasProperty} />

        {hasProperty && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Имущество</h3>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => control.properties?.push()}  // ✅ ArrayNode.push()
              >
                + Добавить имущество
              </button>
            </div>

            {/* ✅ FormArrayManager работает с ArrayNode */}
            <FormArrayManager
              control={control.properties}  // ArrayNode<Property>
              component={PropertyForm}
              itemLabel="Имущество"
            />

            {/* ✅ ArrayNode.length - реактивный signal */}
            {control.properties?.length.value === 0 && (
              <div className="p-4 bg-gray-100 border border-gray-300 rounded text-center text-gray-600">
                Нажмите "Добавить имущество" для добавления информации
              </div>
            )}
          </div>
        )}
      </div>

      {/* Аналогично для existingLoans и coBorrowers */}
    </div>
  );
}
```

---

## 📊 Сравнение: До и После

### До миграции (Legacy)

```typescript
// Schema
properties: [propertyFormSchema],  // Массив как [schema]

// Валидация - в additional-validation.ts
validateTree((ctx) => {
  const form = ctx.formValue();
  form.properties.forEach((property: any, index: number) => {
    // Валидация каждого элемента вручную
    if (!property.type) errors.push(`Имущество ${index + 1}: укажите тип`);
    // ...
  });
}, { targetField: 'properties' });

// TypeScript
control.properties  // тип: any[] (нет типобезопасности)
```

### После миграции (ArrayNode)

```typescript
// Schema
properties: {
  schema: propertyFormSchema,
  initialItems: [],
  validation: propertyValidation,  // Схема применяется автоматически
},

// Валидация - в property-validation.ts
export const propertyValidation = (path: FieldPath<Property>) => {
  required(path.type, { message: 'Укажите тип имущества' });
  required(path.description, { message: 'Добавьте описание' });
  // ... остальная валидация
};

// TypeScript
control.properties  // тип: ArrayNode<Property> ✅
control.properties.at(0)  // тип: GroupNode<Property> | undefined ✅
control.properties.at(0)?.type  // тип: FieldNode<PropertyType> ✅
```

---

## ✅ Критерии готовности к миграции

Перед началом миграции убедитесь:

- [ ] `DeepFormSchema` поддерживает `ArrayNodeConfig<T>`
- [ ] `GroupNode` создает `ArrayNode` из `{ schema, initialItems }`
- [ ] `GroupNodeWithControls` корректно типизирует массивы
- [ ] Создано 3 файла валидации: `property-validation.ts`, `existing-loan-validation.ts`, `co-borrower-validation.ts`
- [ ] `ArrayNode` имеет метод `clear()`
- [ ] TypeScript компилируется без ошибок

---

## 🚀 Следующие шаги

1. Реализовать изменения из Фазы 1 (типы)
2. Создать схемы валидации из Фазы 2
3. Обновить форму (Фаза 3)
4. Протестировать UI (Фаза 4)
5. Удалить legacy код из `additional-validation.ts`
