# 📊 Диаграмма миграции на ArrayNode

Визуальное представление изменений в архитектуре формы.

---

## 🏗️ Архитектура ДО миграции (Legacy)

```
CreditApplicationForm (GroupNode)
│
├─ loanType: FieldNode<LoanType>
├─ loanAmount: FieldNode<number>
├─ personalData: GroupNode<PersonalData>
│  ├─ lastName: FieldNode<string>
│  ├─ firstName: FieldNode<string>
│  └─ birthDate: FieldNode<string>
│
├─ hasProperty: FieldNode<boolean>
├─ properties: any[]  ❌ Нет типобезопасности!
│  └─ [                ❌ Legacy формат
│       {
│         type: 'apartment',
│         description: '',
│         estimatedValue: 0,
│         hasEncumbrance: false
│       }
│     ]
│
├─ hasExistingLoans: FieldNode<boolean>
├─ existingLoans: any[]  ❌ Нет типобезопасности!
│
├─ hasCoBorrower: FieldNode<boolean>
└─ coBorrowers: any[]  ❌ Нет типобезопасности!
```

### ⚠️ Проблемы legacy подхода:

1. **Нет типобезопасности**: `properties: any[]`
2. **Нет валидации элементов**: валидация в `validateTree` с `any` типами
3. **Нет реактивности**: изменения в массиве не отслеживаются
4. **Нет CRUD методов**: нет `push()`, `removeAt()`, `clear()`
5. **Дублирование кода**: валидация каждого элемента в цикле

---

## 🚀 Архитектура ПОСЛЕ миграции (ArrayNode)

```
CreditApplicationForm (GroupNode)
│
├─ loanType: FieldNode<LoanType>
├─ loanAmount: FieldNode<number>
├─ personalData: GroupNode<PersonalData>
│  ├─ lastName: FieldNode<string>
│  ├─ firstName: FieldNode<string>
│  └─ birthDate: FieldNode<string>
│
├─ hasProperty: FieldNode<boolean>
├─ properties: ArrayNode<Property>  ✅ Типобезопасность!
│  │
│  ├─ [0]: GroupNode<Property>  ✅ Каждый элемент - полноценная форма
│  │  ├─ type: FieldNode<PropertyType>
│  │  ├─ description: FieldNode<string>
│  │  ├─ estimatedValue: FieldNode<number>
│  │  └─ hasEncumbrance: FieldNode<boolean>
│  │
│  ├─ [1]: GroupNode<Property>
│  │  ├─ type: FieldNode<PropertyType>
│  │  └─ ...
│  │
│  └─ validation: propertyValidation()  ✅ Применяется к каждому элементу
│
├─ hasExistingLoans: FieldNode<boolean>
├─ existingLoans: ArrayNode<ExistingLoan>  ✅ Типобезопасность!
│  │
│  ├─ [0]: GroupNode<ExistingLoan>
│  │  ├─ bank: FieldNode<string>
│  │  ├─ type: FieldNode<string>
│  │  ├─ amount: FieldNode<number>
│  │  ├─ remainingAmount: FieldNode<number>
│  │  ├─ monthlyPayment: FieldNode<number>
│  │  └─ maturityDate: FieldNode<string>
│  │
│  └─ validation: existingLoanValidation()  ✅
│
├─ hasCoBorrower: FieldNode<boolean>
└─ coBorrowers: ArrayNode<CoBorrower>  ✅ Типобезопасность!
   │
   ├─ [0]: GroupNode<CoBorrower>  ✅ Вложенная структура!
   │  ├─ personalData: GroupNode<PersonalData>  ✅ Вложенная группа
   │  │  ├─ lastName: FieldNode<string>
   │  │  ├─ firstName: FieldNode<string>
   │  │  ├─ middleName: FieldNode<string>
   │  │  └─ birthDate: FieldNode<string>
   │  ├─ phone: FieldNode<string>
   │  ├─ email: FieldNode<string>
   │  ├─ relationship: FieldNode<string>
   │  └─ monthlyIncome: FieldNode<number>
   │
   └─ validation: coBorrowerValidation()  ✅
```

### ✅ Преимущества нового подхода:

1. **Типобезопасность**: `ArrayNode<Property>` → `GroupNode<Property>` → `FieldNode<PropertyType>`
2. **Валидация элементов**: каждая схема в отдельном файле, применяется автоматически
3. **Реактивность**: `length.value`, `value.value` - reactive signals
4. **CRUD API**: `push()`, `removeAt()`, `at()`, `clear()`, `forEach()`
5. **Чистый код**: валидация декларативна, нет циклов с `any`

---

## 🔄 Поток данных

### Legacy (ДО)

```
User Action
    ↓
UI Component (кнопка "+")
    ↓
Manual array manipulation
    ↓
control.properties = [...control.properties, newItem]  ❌ Нет реактивности
    ↓
Manual validation in validateTree
    ↓
form.properties.forEach((item: any) => { ... })  ❌ Нет типов
    ↓
Manual error handling
```

### ArrayNode (ПОСЛЕ)

```
User Action
    ↓
UI Component (кнопка "+")
    ↓
ArrayNode API
    ↓
control.properties.push()  ✅ Реактивный метод
    ↓
Автоматическое создание GroupNode<Property>
    ↓
Автоматическое применение validation schema
    ↓
propertyValidation(path) { required(path.type), ... }  ✅ Типобезопасно
    ↓
Реактивное обновление UI через signals
```

---

## 📝 Схемы валидации

### Legacy (validateTree в additional-validation.ts)

```typescript
// ❌ БЫЛО: Монолитная валидация в одном месте (~100 строк кода)
validateTree((ctx) => {
  const form = ctx.formValue();
  const errors: string[] = [];

  // Валидация properties
  form.properties?.forEach((property: any, index: number) => {
    if (!property.type) errors.push(`Имущество ${index + 1}: тип`);
    if (!property.description) errors.push(`Имущество ${index + 1}: описание`);
    // ... ещё 20 строк валидации
  });

  // Валидация existingLoans
  form.existingLoans?.forEach((loan: any, index: number) => {
    if (!loan.bank) errors.push(`Кредит ${index + 1}: банк`);
    if (loan.remainingAmount > loan.amount) errors.push(`Кредит ${index + 1}: остаток`);
    // ... ещё 30 строк валидации
  });

  // Валидация coBorrowers
  form.coBorrowers?.forEach((coBorrower: any, index: number) => {
    if (!coBorrower.personalData?.lastName) errors.push(...);
    // ... ещё 50 строк валидации
  });

  return errors.length > 0 ? { code: 'failed', message: errors.join('; ') } : null;
}, { targetField: 'properties' });
```

**Проблемы**:
- 📝 ~100 строк кода в одном месте
- ❌ Нет типобезопасности (`any`)
- ❌ Тяжело поддерживать
- ❌ Невозможно переиспользовать

### ArrayNode (отдельные схемы)

```typescript
// ✅ СТАЛО: Модульная валидация в отдельных файлах

// property-validation.ts
export const propertyValidation = (path: FieldPath<Property>) => {
  required(path.type);
  required(path.description);
  minLength(path.description, 10);
  min(path.estimatedValue, 10000);
};

// existing-loan-validation.ts
export const existingLoanValidation = (path: FieldPath<ExistingLoan>) => {
  required(path.bank);
  required(path.amount);
  validateTree((ctx) => {
    const loan = ctx.formValue();
    if (loan.remainingAmount > loan.amount) {
      return { code: 'remainingExceedsAmount', message: '...' };
    }
    return null;
  }, { targetField: 'remainingAmount' });
};

// co-borrower-validation.ts
export const coBorrowerValidation = (path: FieldPath<CoBorrower>) => {
  required(path.personalData.lastName);
  minLength(path.personalData.lastName, 2);
  pattern(path.personalData.lastName, /^[А-ЯЁа-яё\s-]+$/);
  email(path.email);
  min(path.monthlyIncome, 10000);
};
```

---

## 🎨 Структура компонентов

### ДО (Legacy)

```tsx
// AdditionalInfoForm.tsx
{hasProperty && (
  <div>
    <button onClick={() => {
      // ❌ Ручное добавление в массив
      const newProperty = { type: '', description: '', estimatedValue: 0 };
      control.properties = [...(control.properties || []), newProperty];
    }}>
      + Добавить
    </button>

    {/* ❌ Ручной рендеринг с map */}
    {control.properties?.map((property, index) => (
      <div key={index}>
        <PropertyForm property={property} />
        <button onClick={() => {
          // ❌ Ручное удаление
          control.properties = control.properties.filter((_, i) => i !== index);
        }}>
          Удалить
        </button>
      </div>
    ))}
  </div>
)}
```

### ПОСЛЕ (ArrayNode)

```tsx
// AdditionalInfoForm.tsx
{hasProperty && (
  <div>
    {/* ✅ Простой API */}
    <button onClick={() => control.properties?.push()}>
      + Добавить
    </button>

    {/* ✅ Готовый компонент с типобезопасностью */}
    <FormArrayManager
      control={control.properties}  // ArrayNode<Property>
      component={PropertyForm}
      itemLabel="Имущество"
    />

    {/* ✅ Реактивная длина */}
    {control.properties?.length.value === 0 && (
      <div>Массив пуст</div>
    )}
  </div>
)}
```

---

## 🔍 TypeScript типы

### ДО (Legacy)

```typescript
// ❌ Нет типобезопасности
control.properties              // тип: any[]
control.properties[0]           // тип: any
control.properties[0].type      // тип: any
control.properties.length       // тип: number (не реактивный)
```

### ПОСЛЕ (ArrayNode)

```typescript
// ✅ Полная типобезопасность
control.properties                       // тип: ArrayNode<Property>
control.properties.at(0)                 // тип: GroupNode<Property> | undefined
control.properties.at(0)?.type           // тип: FieldNode<PropertyType>
control.properties.at(0)?.type.value     // тип: ReadonlySignal<PropertyType>
control.properties.length                // тип: ReadonlySignal<number>
control.properties.value                 // тип: ReadonlySignal<Property[]>
control.properties.valid                 // тип: ReadonlySignal<boolean>
control.properties.errors                // тип: ReadonlySignal<ValidationError[]>

// ✅ Автокомплит работает на всех уровнях!
control.properties.at(0)?.  // IDE предлагает: type, description, estimatedValue, hasEncumbrance
```

---

## 📊 Метрики улучшений

| Метрика | Legacy | ArrayNode | Улучшение |
|---------|--------|-----------|-----------|
| **Типобезопасность** | ❌ `any[]` | ✅ `ArrayNode<T>` | 100% |
| **Строк кода валидации** | ~200 строк | ~30 строк × 3 файла | -50% |
| **Переиспользование** | ❌ Нет | ✅ Да | +100% |
| **Автокомплит IDE** | ❌ Нет | ✅ Да | +100% |
| **Реактивность** | ❌ Ручная | ✅ Автоматическая | +100% |
| **Модульность** | ❌ Монолит | ✅ Модули | +100% |
| **Ошибки в runtime** | ⚠️ Высокий риск | ✅ Низкий риск | -80% |

---

## 🎯 Итоговое сравнение

### Legacy подход
- ❌ Нет типобезопасности (`any[]`)
- ❌ Ручное управление массивом
- ❌ Валидация в одном огромном файле
- ❌ Нет реактивности
- ❌ Дублирование кода
- ❌ Сложно тестировать

### ArrayNode подход
- ✅ Полная типобезопасность
- ✅ Declarative API (`push`, `removeAt`, `clear`)
- ✅ Модульные схемы валидации
- ✅ Reactive signals
- ✅ DRY принцип
- ✅ Легко тестировать
- ✅ Переиспользуемость схем
- ✅ Вложенные структуры (CoBorrower → PersonalData)

---

## 🚀 Миграция = 3 простых шага

```
1. Создать файлы validation ────────────────────┐
   - property-validation.ts                     │
   - existing-loan-validation.ts                │  30 минут
   - co-borrower-validation.ts                  │
                                                 ┘
2. Обновить GroupNode ──────────────────────────┐
   Добавить создание ArrayNode из [schema]      │  20 минут
   if (Array.isArray(config) && config.length === 1)
                                                 ┘
3. Применить validation ─────────────────────────┐
   form.properties.applyValidationSchema(...)   │  10 минут
   в create-credit-application-form.ts          │
                                                 ┘
4. Добавить clear() в ArrayNode ─────────────────┐
   public clear() { ... }                       │  5 минут
                                                 ┘

ИТОГО: ~1 час работы для значительных улучшений!

✅ БОНУС: Не нужно менять credit-application-schema.ts!
```

---

## ✨ Результат

После миграции вы получите:
- 🎯 Типобезопасный код
- 🧹 Чистую архитектуру
- 🔄 Реактивные массивы
- 📦 Модульную валидацию
- 🚀 Лучший DX (Developer Experience)
- 🐛 Меньше багов
