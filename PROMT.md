# Задача: Миграция формы кредитной заявки на новый API

## Цель

Мигрировать **существующую форму кредитной заявки** на новый GroupNode API с автоматическим применением Behavior Schema и Validation Schema, демонстрируя **максимум возможностей** реактивного поведения форм.

## Контекст

### Существующая форма

**Файл**: [src/domains/credit-applications/form/schema/create-credit-application-form.ts](src/domains/credit-applications/form/schema/create-credit-application-form.ts)

**Текущее состояние**:
- ✅ Использует GroupNode (старый API без схем)
- ✅ Имеет 6 шагов заполнения (основная информация, персональные данные, контакты, занятость, дополнительная информация, согласия)
- ✅ Имеет вложенные формы (personalData, passportData, registrationAddress, residenceAddress)
- ✅ Имеет массивы форм (properties, existingLoans, coBorrowers)
- ✅ ~50+ полей

**Что НЕ реализовано**:
- ❌ Новый GroupNode конструктор с `{ form, behavior, validation }`
- ❌ Behavior Schema (copyFrom, enableWhen, computeFrom, watchField)
- ❌ Validation Schema в декларативном виде
- ❌ Вычисляемые поля (процентная ставка, ежемесячный платеж, возраст и т.д.)
- ❌ Условное включение полей на основе типа кредита и занятости
- ❌ Динамическая загрузка данных (регионы, города, модели авто)

## Контекст проекта

### Доступные возможности

**Behavior Schema API** (декларативное реактивное поведение):
- `copyFrom()` - копирование значений между полями с условиями и трансформацией
- `enableWhen()` / `disableWhen()` - условное включение/выключение полей
- `showWhen()` / `hideWhen()` - условное отображение/скрытие полей
- `computeFrom()` - автоматическое вычисление значений из других полей
- `watchField()` - подписка на изменения с доступом к контексту (для динамической загрузки данных)
- `revalidateWhen()` - перевалидация поля при изменении других полей
- `syncFields()` - двусторонняя синхронизация полей

**Validation Schema API**:
- Синхронные валидаторы: `required()`, `email()`, `minLength()`, `maxLength()`, `pattern()`, `min()`, `max()`
- Асинхронные валидаторы: `validateAsync()`, `customAsync()`
- Условная валидация: `applyWhen()`
- Кросс-полевая валидация: `validateTree()`

**GroupNode с автоматическим применением схем**:
```typescript
const form = new GroupNode({
  form: { /* структура полей */ },
  behavior: (path) => { /* behavior schema */ },
  validation: (path) => { /* validation schema */ },
});
```

### Полезные файлы для изучения

**Документация**:
- [docs/BEHAVIOR_SCHEMA_IMPLEMENTATION.md](docs/BEHAVIOR_SCHEMA_IMPLEMENTATION.md) - полная документация Behavior Schema API
- [docs/BEHAVIOR_HELPERS_IMPLEMENTATION.md](docs/BEHAVIOR_HELPERS_IMPLEMENTATION.md) - helper методы для реактивности
- [docs/REACT_HOOKS_IMPLEMENTATION.md](docs/REACT_HOOKS_IMPLEMENTATION.md) - React хуки для форм
- [docs/GROUP_NODE_CONSTRUCTOR_OVERLOAD.md](docs/GROUP_NODE_CONSTRUCTOR_OVERLOAD.md) - новый API GroupNode

**Примеры**:
- [src/examples/behavior-schema-example.ts](src/examples/behavior-schema-example.ts) - 8 примеров Behavior Schema
- [src/examples/group-node-config-example.ts](src/examples/group-node-config-example.ts) - 7 примеров нового GroupNode API
- [src/examples/validation-example.ts](src/examples/validation-example.ts) - примеры валидации

**Исходный код**:
- [src/lib/forms/behaviors/schema-behaviors.ts](src/lib/forms/behaviors/schema-behaviors.ts) - реализация behavior функций
- [src/lib/forms/validators/](src/lib/forms/validators/) - реализация валидаторов
- [src/lib/forms/core/nodes/group-node.ts](src/lib/forms/core/nodes/group-node.ts) - GroupNode с новым API

---

## Требования к миграции

### 1. Behavior Schema - Обязательные behaviors (минимум 15)

#### 1.1. `copyFrom()` - Копирование (2 примера)
- **Адреса**: Копировать `registrationAddress` → `residenceAddress` при `sameAsRegistration === true`
- **Email**: Копировать `email` → `emailAdditional` при добавлении флага `sameEmail === true`

#### 1.2. `enableWhen()` / `disableWhen()` - Условное включение (минимум 7)
- **Ипотека**: Включать `propertyValue`, `initialPayment` только при `loanType === 'mortgage'`
- **Автокредит**: Включать `carBrand`, `carModel`, `carYear`, `carPrice` только при `loanType === 'car'`
- **Трудоустроен**: Включать `companyName`, `companyInn`, `companyPhone`, `companyAddress`, `position` только при `employmentStatus === 'employed'`
- **ИП**: Включать `businessType`, `businessInn`, `businessActivity` только при `employmentStatus === 'selfEmployed'`
- **Адрес проживания**: Включать `residenceAddress` только при `sameAsRegistration === false`
- **Имущество**: Включать массив `properties` только при `hasProperty === true`
- **Существующие кредиты**: Включать массив `existingLoans` только при `hasExistingLoans === true`
- **Созаемщики**: Включать массив `coBorrowers` только при `hasCoBorrower === true`

#### 1.3. `computeFrom()` - Вычисляемые поля (минимум 8)
1. **Процентная ставка** - вычисляется на основе типа кредита и дополнительных условий:
   - Ипотека: базовая ставка + надбавка по региону
   - Автокредит: базовая ставка - скидка за КАСКО
   - Потребительский: базовая ставка - скидка за обеспечение

2. **Ежемесячный платеж** - вычисляется по формуле аннуитетного платежа:
   ```
   monthlyPayment = loanAmount * (r * (1 + r)^n) / ((1 + r)^n - 1)
   где r = monthRate / 12 / 100, n = term
   ```

3. **Первоначальный взнос** (для ипотеки) - 20% от стоимости недвижимости

4. **Полное имя** - конкатенация "Фамилия Имя Отчество"

5. **Возраст** - вычисляется из даты рождения

6. **Общий доход** - monthlyIncome + additionalIncome

7. **Процент платежа от дохода** - (monthlyPayment / totalIncome) * 100

8. **Общий доход по созаемщикам** - сумма доходов всех созаемщиков

#### 1.4. `watchField()` - Динамическая загрузка (минимум 3)
1. **Загрузка регионов** при изменении страны (для `registrationAddress` и `residenceAddress`)
2. **Загрузка городов** при изменении региона (для обоих адресов)
3. **Загрузка моделей автомобилей** при изменении марки (для автокредита)

#### 1.5. `revalidateWhen()` - Перевалидация (минимум 2)
- Перевалидировать `monthlyIncome` при изменении `monthlyPayment`
- Перевалидировать `initialPayment` при изменении `propertyValue`

---

### 2. Validation Schema - ПРИМЕНИТЬ СУЩЕСТВУЮЩУЮ

**ВАЖНО**: Validation схема уже существует и полностью готова!

**Файл**: [src/domains/credit-applications/form/validation/credit-application-validation.ts](src/domains/credit-applications/form/validation/credit-application-validation.ts)

**Что уже есть**:
- ✅ Базовые валидации (`required`, `email`, `min`, `max`, `minLength`, `maxLength`, `pattern`)
- ✅ Условная валидация через `applyWhen()` (для ипотеки, автокредита, занятости)
- ✅ Кросс-полевая валидация через `validateTree()` (первоначальный взнос, стоимость авто)
- ✅ Модульная структура по шагам (basicInfoValidation, personalDataValidation и т.д.)

**Что нужно сделать**:
1. **ИМПОРТИРОВАТЬ** существующую схему: `import creditApplicationValidation from '../validation/credit-application-validation'`
2. **ПРИМЕНИТЬ** через новый API в секции `validation`
3. **ДОПОЛНИТЬ** новыми validateTree для вычисляемых полей:
   - Платежеспособность: `paymentToIncomeRatio <= 50%`
   - Возраст заемщика: `18 <= age <= 70`
   - Первоначальный взнос >= 20% (если ещё нет)

---

### 3. Новый GroupNode API - Обязательное использование

Форма **MUST** быть создана с использованием **нового GroupNode конструктора** с автоматическим применением схем:

```typescript
const loanApplicationForm = new GroupNode<LoanApplicationForm>({
  form: {
    // Структура полей
  },
  behavior: (path) => {
    // Все behaviors здесь
    copyFrom(...);
    enableWhen(...);
    computeFrom(...);
    watchField(...);
    revalidateWhen(...);
  },
  validation: (path) => {
    // Все валидации здесь
    required(...);
    email(...);
    applyWhen(...);
    validateTree(...);
  },
});
```

---

### 4. Вспомогательные функции - Создать новый файл

**Создать файл**: [src/domains/credit-applications/form/utils/form-helpers.ts](src/domains/credit-applications/form/utils/form-helpers.ts)

```typescript
// API имитации для watchField
export async function fetchRegions(country: string): Promise<Option[]>;
export async function fetchCities(region: string): Promise<Option[]>;
export async function fetchCarModels(brand: string): Promise<Option[]>;

// Compute функции для computeFrom
export function computeInterestRate(values: Record<string, any>): number;
export function computeMonthlyPayment(values: Record<string, any>): number;

// Validator функции для validateTree
export function validateInitialPayment(ctx: TreeValidationContext): ValidationError | null;
export function validatePaymentToIncome(ctx: TreeValidationContext): ValidationError | null;
export function validateAge(ctx: TreeValidationContext): ValidationError | null;

interface Option {
  value: string;
  label: string;
}
```

---

### 5. Структура миграции

**Файл для миграции**: [src/domains/credit-applications/form/schema/create-credit-application-form.ts](src/domains/credit-applications/form/schema/create-credit-application-form.ts)

**Было** (старый API):
```typescript
const schema: DeepFormSchema<CreditApplicationForm> = {
  loanType: { value: 'consumer', component: Select, ... },
  loanAmount: { value: null, component: Input, ... },
  // ... остальные 50+ полей
};

export const createCreditApplicationForm = () => {
  const form = new GroupNode(schema);
  return form;
};
```

**Стало** (новый API с behavior и validation):
```typescript
import creditApplicationValidation from '../validation/credit-application-validation';
import { validateTree } from '@/lib/forms/validators';

export const createCreditApplicationForm = () => {
  return new GroupNode<CreditApplicationForm>({
    form: {
      // ВСЕ существующие поля из schema
      loanType: { value: 'consumer', component: Select, ... },
      loanAmount: { value: null, component: Input, ... },
      // ... остальные ~50 полей

      // НОВЫЕ вычисляемые поля (добавить):
      interestRate: { value: 0, component: Input, componentProps: { readonly: true, label: 'Процентная ставка (%)' } },
      monthlyPayment: { value: 0, component: Input, componentProps: { readonly: true, label: 'Ежемесячный платеж (₽)' } },
      fullName: { value: '', component: Input, componentProps: { readonly: true, label: 'Полное имя' } },
      age: { value: null, component: Input, componentProps: { readonly: true, label: 'Возраст' } },
      totalIncome: { value: 0, component: Input, componentProps: { readonly: true, label: 'Общий доход (₽)' } },
      paymentToIncomeRatio: { value: 0, component: Input, componentProps: { readonly: true, label: 'Процент от дохода (%)' } },
      coBorrowersIncome: { value: 0, component: Input, componentProps: { readonly: true, label: 'Доход созаемщиков (₽)' } },
      sameEmail: { value: false, component: Checkbox, componentProps: { label: 'Дублировать email' } },
    },

    behavior: (path) => {
      // ===================================================================
      // 1. copyFrom() - Копирование
      // ===================================================================
      copyFrom(path.residenceAddress, path.registrationAddress, {
        when: (form) => form.sameAsRegistration === true,
        fields: 'all',
      });

      copyFrom(path.emailAdditional, path.email, {
        when: (form) => form.sameEmail === true,
      });

      // ===================================================================
      // 2. enableWhen() - Условное включение
      // ===================================================================
      // Ипотека
      enableWhen(path.propertyValue, path.loanType, {
        condition: (type) => type === 'mortgage',
        resetOnDisable: true,
      });
      enableWhen(path.initialPayment, path.loanType, {
        condition: (type) => type === 'mortgage',
        resetOnDisable: true,
      });

      // Автокредит
      enableWhen(path.carBrand, path.loanType, {
        condition: (type) => type === 'car',
        resetOnDisable: true,
      });
      // ... остальные enableWhen

      // ===================================================================
      // 3. computeFrom() - Вычисляемые поля
      // ===================================================================
      computeFrom(path.interestRate, [path.loanType, path.loanTerm], computeInterestRate);
      computeFrom(path.monthlyPayment, [path.loanAmount, path.loanTerm, path.interestRate], computeMonthlyPayment);
      computeFrom(path.initialPayment, [path.propertyValue], computeInitialPayment);
      computeFrom(path.fullName, [path.personalData.lastName, path.personalData.firstName, path.personalData.middleName], computeFullName);
      computeFrom(path.age, [path.personalData.birthDate], computeAge);
      computeFrom(path.totalIncome, [path.monthlyIncome, path.additionalIncome], computeTotalIncome);
      computeFrom(path.paymentToIncomeRatio, [path.monthlyPayment, path.totalIncome], computePaymentRatio);

      // ===================================================================
      // 4. watchField() - Динамическая загрузка
      // ===================================================================
      watchField(path.registrationAddress.country, loadRegionsForRegistration, { immediate: false, debounce: 300 });
      watchField(path.registrationAddress.region, loadCitiesForRegistration, { immediate: false, debounce: 300 });
      watchField(path.carBrand, loadCarModels, { immediate: false, debounce: 300 });

      // ===================================================================
      // 5. revalidateWhen() - Перевалидация
      // ===================================================================
      revalidateWhen(path.monthlyIncome, [path.monthlyPayment]);
      revalidateWhen(path.initialPayment, [path.propertyValue]);
    },

    validation: (path) => {
      // ===================================================================
      // 1. ПРИМЕНЯЕМ СУЩЕСТВУЮЩУЮ validation схему
      // ===================================================================
      creditApplicationValidation(path);

      // ===================================================================
      // 2. ДОПОЛНЯЕМ новыми validateTree для вычисляемых полей
      // ===================================================================

      // Платежеспособность (процент платежа от дохода <= 50%)
      validateTree((ctx) => {
        const paymentRatio = ctx.getField('paymentToIncomeRatio');
        if (!paymentRatio) return null;

        if (paymentRatio > 50) {
          return {
            code: 'paymentTooHigh',
            message: `Ежемесячный платеж не должен превышать 50% дохода (сейчас ${paymentRatio}%)`,
          };
        }
        return null;
      }, { targetField: 'monthlyPayment' });

      // Возраст заемщика (18-70 лет)
      validateTree((ctx) => {
        const age = ctx.getField('age');
        if (!age) return null;

        if (age < 18) {
          return { code: 'ageTooYoung', message: 'Заемщик должен быть старше 18 лет' };
        }
        if (age > 70) {
          return { code: 'ageTooOld', message: 'Заемщик должен быть младше 70 лет' };
        }
        return null;
      }, { targetField: 'age' });
    },
  });
};
```

**Дополнительно создать**: [src/domains/credit-applications/form/utils/form-helpers.ts](src/domains/credit-applications/form/utils/form-helpers.ts) - вспомогательные функции для behaviors и validations

---

## Критерии успеха миграции

Миграция считается успешной, если:

✅ **Новый API**: Использует GroupNode конструктор с `{ form, behavior, validation }`
✅ **Behaviors**: Реализовано минимум 15 behaviors (2 copyFrom, 7+ enableWhen, 8 computeFrom, 3 watchField, 2 revalidateWhen)
✅ **Validation**: Импортирована и применена существующая схема `creditApplicationValidation`, дополнена 2 новыми validateTree
✅ **Вычисляемые поля**: Добавлены 8 новых полей (interestRate, monthlyPayment, fullName, age, totalIncome, paymentToIncomeRatio, coBorrowersIncome, sameEmail)
✅ **Динамическая загрузка**: Реализованы 3 watchField для загрузки регионов, городов и моделей авто
✅ **Типы**: Обновлен интерфейс CreditApplicationForm с новыми полями
✅ **Вспомогательные функции**: Создан файл form-helpers.ts с compute функциями и API имитациями
✅ **TypeScript**: Полностью типизировано, компилируется без ошибок
✅ **Обратная совместимость**: React компонент CreditApplicationForm.tsx продолжает работать без изменений
✅ **Комментарии**: Добавлены JSDoc комментарии для всех behavior и compute функций

---

## Дополнительные требования

### Стиль кода
- Использовать русские комментарии
- Группировать behaviors по типам (copyFrom, enableWhen, computeFrom, watchField, revalidateWhen)
- Группировать валидации по типам (базовые, условные, кросс-полевые)
- Вынести сложные функции в form-helpers.ts
- Добавить JSDoc комментарии для compute и validator функций

### Демонстрация возможностей
- Каждый behavior должен быть **функционально оправдан** (решает реальную бизнес-задачу)
- Вычисления должны быть **реалистичными** (формула аннуитета, процент от дохода)
- Условная логика должна быть **сложной** (зависимости от типа кредита, занятости)
- Динамическая загрузка должна быть **асинхронной** (имитация API запросов)

### Тестирование после миграции
Убедиться, что после миграции:
1. **Ипотека**: При выборе loanType === 'mortgage' автоматически вычисляются interestRate, monthlyPayment, initialPayment
2. **Копирование адресов**: При установке sameAsRegistration === true адрес копируется автоматически
3. **Динамическая загрузка**: При изменении страны загружаются регионы, при изменении региона — города
4. **Валидация**: При попытке submit с некорректными данными показываются ошибки валидации
5. **Платежеспособность**: При превышении 50% платежа от дохода показывается ошибка

---

## Итоговая задача

**МИГРИРОВАТЬ существующую форму кредитной заявки** ([src/domains/credit-applications/form/schema/create-credit-application-form.ts](src/domains/credit-applications/form/schema/create-credit-application-form.ts)) **на новый GroupNode API с Behavior Schema и Validation Schema.**

Миграция должна:
- 📋 **Сохранить всю существующую структуру** (6 шагов, ~50+ полей, вложенные формы, массивы)
- 🆕 **Добавить новые вычисляемые поля** (interestRate, monthlyPayment, fullName, age, totalIncome, paymentToIncomeRatio, coBorrowersIncome)
- 🎯 **Реализовать минимум 15 behaviors** (copyFrom, enableWhen, computeFrom, watchField, revalidateWhen)
- ✅ **Реализовать полную валидацию** (базовая + условная + кросс-полевая)
- 🚀 **Использовать новый GroupNode конструктор** с `{ form, behavior, validation }`
- 📝 **Добавить подробные комментарии** для каждого behavior и validation

**Время на выполнение**: Не ограничено, качество важнее скорости.

**Важно**: Используй все доступные файлы документации и примеров для изучения API!
