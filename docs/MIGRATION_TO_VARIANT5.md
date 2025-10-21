# Миграция на Variant 5: Руководство

**Дата**: 2025-10-21

**Статус**: ✅ Прототип создан, готов к тестированию

---

## Обзор

Этот документ описывает процесс миграции существующих форм с `FormStore` (flat схема) на `DeepFormStore` (Variant 5 с вложенными формами).

---

## Что изменилось

### До (FormStore)

```typescript
const schema: FormSchema<Form> = {
  // Flat структура с префиксами
  personalData_firstName: { value: '', component: Input },
  personalData_lastName: { value: '', component: Input },
  passportData_series: { value: '', component: Input },

  // Заглушки для типов
  personalData: { value: {...}, component: () => null },
};

const form = new FormStore(schema);

// Доступ через flat ключи
form.controls.personalData_firstName.value = 'Иван';
```

### После (DeepFormStore - Variant 5)

```typescript
const schema: DeepFormSchema<Form> = {
  // Настоящие вложенные формы!
  personalData: {
    firstName: { value: '', component: Input },
    lastName: { value: '', component: Input },
  },

  passportData: {
    series: { value: '', component: Input },
  },

  // Массивы форм
  properties: [{
    type: { value: 'apartment', component: Select },
    description: { value: '', component: Textarea },
  }],
};

const form = new DeepFormStore(schema);

// Элегантный доступ к вложенным полям
form.controls.personalData.firstName.value = 'Иван';
form.controls.passportData.series.value = '1234';
form.controls.properties[0].type.value = 'house';
```

---

## Примеры миграции

### 1. CreditApplicationForm

#### Создано

- ✅ **CreditApplicationFormV5.tsx** - новая версия с DeepFormStore
- ✅ **PersonalInfoFormV5.tsx** - Step2 с вложенными формами
- ✅ **ContactInfoFormV5.tsx** - Step3 с вложенными адресами
- ✅ **AdditionalInfoFormV5.tsx** - Step5 с массивами (подготовлено)

#### Файлы

```
src/domains/credit-applications/form/components/
├── CreditApplicationForm.tsx       # Старая версия (FormStore)
├── CreditApplicationFormV5.tsx     # ✅ Новая версия (DeepFormStore)
└── steps/
    ├── step2/
    │   ├── PersonalInfoForm.tsx    # Старая версия
    │   └── PersonalInfoFormV5.tsx  # ✅ Новая версия
    ├── step3/
    │   ├── ContactInfoForm.tsx     # Старая версия
    │   └── ContactInfoFormV5.tsx   # ✅ Новая версия
    └── step5/
        ├── AdditionalInfoForm.tsx  # Старая версия
        └── AdditionalInfoFormV5.tsx # ✅ Новая версия (с массивами)
```

---

## Пошаговая инструкция миграции

### Шаг 1: Анализ текущей формы

Определите структуру данных:
- Какие поля можно объединить в группы?
- Где используются массивы?
- Есть ли условные поля?

**Пример для CreditApplicationForm:**
```typescript
// Группы
✅ personalData: firstName, lastName, middleName, birthDate, gender, birthPlace
✅ passportData: series, number, issueDate, issuedBy, departmentCode
✅ registrationAddress: region, city, street, house, apartment, postalCode
✅ residenceAddress: region, city, street, house, apartment, postalCode

// Массивы (будут добавлены)
⏳ properties: [{type, description, estimatedValue}]
⏳ existingLoans: [{bank, type, amount, monthlyPayment, maturityDate}]
⏳ coBorrowers: [{personalData, phone, email, relationship, monthlyIncome}]
```

### Шаг 2: Создание схемы DeepFormStore

```typescript
import { DeepFormStore, DeepFormSchema } from '@/lib/forms';

const schema: DeepFormSchema<YourForm> = {
  // Простые поля - без изменений
  loanType: {
    value: 'consumer',
    component: Select,
    componentProps: { ... },
  },

  // Вложенные формы
  personalData: {
    firstName: { value: '', component: Input },
    lastName: { value: '', component: Input },
    // ...
  },

  // Массивы (синтаксис [{...}])
  properties: [{
    type: { value: 'apartment', component: Select },
    description: { value: '', component: Textarea },
  }],
};

const form = new DeepFormStore(schema);
```

### Шаг 3: Обновление компонентов

#### 3.1 Изменить импорты

```typescript
// До
import type { FormStore } from '@/lib/forms/core/form-store';

// После
import type { DeepFormStore } from '@/lib/forms/core/deep-form-store';
```

#### 3.2 Обновить доступ к полям

```typescript
// До
<FormField control={form.controls.personalData_firstName} />

// После
<FormField control={form.controls.personalData.firstName} />
```

#### 3.3 Использовать возможности групп

```typescript
// Копирование адреса
const copyAddress = () => {
  const regAddress = form.controls.registrationAddress.getValue();
  form.controls.residenceAddress.setValue(regAddress);
};

// Валидация группы
const validatePersonalData = async () => {
  const isValid = await form.controls.personalData.validate();
  return isValid;
};

// Сброс группы
const resetAddress = () => {
  form.controls.residenceAddress.reset();
};
```

### Шаг 4: Работа с массивами (после обновления типов)

```typescript
// Добавление элемента
<Button onClick={() => form.controls.properties.push()}>
  Добавить имущество
</Button>

// Рендеринг массива
{form.controls.properties.map((property, index) => (
  <div key={index}>
    <FormField control={property.type} />
    <FormField control={property.description} />

    <Button onClick={() => form.controls.properties.remove(index)}>
      Удалить
    </Button>
  </div>
))}

// Массив с вложенными формами
{form.controls.coBorrowers.map((coBorrower, index) => (
  <div key={index}>
    {/* Доступ к вложенной группе personalData */}
    <FormField control={coBorrower.personalData.firstName} />
    <FormField control={coBorrower.personalData.lastName} />

    {/* Обычные поля */}
    <FormField control={coBorrower.phone} />
    <FormField control={coBorrower.email} />
  </div>
))}
```

---

## Преимущества миграции

### 1. Элегантный API

```typescript
// До
form.controls.personalData_firstName.value = 'Иван';

// После
form.controls.personalData.firstName.value = 'Иван';
```

### 2. Операции с группами

```typescript
// Получение значений группы
const personalData = form.controls.personalData.getValue();
// { firstName: 'Иван', lastName: 'Иванов', ... }

// Установка значений группы
form.controls.personalData.setValue({
  firstName: 'Петр',
  lastName: 'Петров',
});

// Валидация группы
const isValid = await form.controls.personalData.validate();

// Сброс группы
form.controls.personalData.reset();
```

### 3. CRUD для массивов

```typescript
// Добавить
form.controls.properties.push({ type: 'apartment' });

// Удалить
form.controls.properties.remove(0);

// Вставить
form.controls.properties.insert(1, { type: 'house' });

// Очистить
form.controls.properties.clear();

// Доступ по индексу
form.controls.properties[0].type.value = 'car';
```

### 4. Полная типизация

TypeScript автоматически выводит все типы:

```typescript
form.controls.personalData.firstName // ← autocomplete работает!
form.controls.properties[0].type      // ← autocomplete работает!
```

---

## Тестирование миграции

### 1. Запуск новой версии

```bash
npm run dev
```

Откройте форму и проверьте:
- ✅ Все поля отображаются
- ✅ Значения сохраняются
- ✅ Валидация работает
- ✅ Навигация между шагами работает

### 2. Сравнение с оригиналом

Создайте роут для обеих версий:
```typescript
// src/App.tsx
<Route path="/credit-form" element={<CreditApplicationForm />} />
<Route path="/credit-form-v5" element={<CreditApplicationFormV5 />} />
```

Сравните:
- Функциональность
- Производительность
- UX

### 3. Проверка данных

```typescript
// В обеих версиях
const values = form.getValue();
console.log('Form values:', values);

// Убедитесь, что структура данных одинакова
```

---

## Roadmap

### Выполнено ✅

- [x] Создан DeepFormStore с поддержкой вложенных форм
- [x] Создан GroupProxy для групп полей
- [x] Создан ArrayProxy для массивов форм
- [x] Создана новая версия CreditApplicationForm
- [x] Обновлены компоненты Step2, Step3, Step5
- [x] Написана документация

### В процессе ⏳

- [ ] Добавить массивы в схему (properties, existingLoans, coBorrowers)
- [ ] Обновить типы для совместимости с массивами
- [ ] Протестировать все шаги формы
- [ ] Добавить валидацию для вложенных форм

### Планируется 📋

- [ ] Миграция других форм (UsersForm)
- [ ] Performance тестирование
- [ ] Добавить unit тесты
- [ ] Обновить документацию проекта

---

## Troubleshooting

### Проблема: TypeScript ошибки

**Симптом**: `Property 'personalData' does not exist on type 'FieldController'`

**Решение**: Убедитесь что используете `DeepFormStore` и `DeepFormSchema`:
```typescript
import { DeepFormStore, DeepFormSchema } from '@/lib/forms';
const form = new DeepFormStore(schema); // не FormStore!
```

### Проблема: Массивы не работают

**Симптом**: `Cannot read property 'push' of undefined`

**Решение**: Массивы нужно добавить в схему с синтаксисом `[{...}]`:
```typescript
properties: [{  // обратите внимание на [ ]
  type: { value: '', component: Select },
}],
```

### Проблема: Доступ к вложенным полям не работает

**Симптом**: `Cannot read property 'firstName' of undefined`

**Решение**: Проверьте структуру схемы - группа должна быть объектом:
```typescript
personalData: {  // не массив, не FieldConfig!
  firstName: { value: '', component: Input },
}
```

---

## Примеры кода

### Полный пример миграции формы

См. файлы:
- [CreditApplicationFormV5.tsx](../src/domains/credit-applications/form/components/CreditApplicationFormV5.tsx)
- [PersonalInfoFormV5.tsx](../src/domains/credit-applications/form/components/steps/step2/PersonalInfoFormV5.tsx)
- [ContactInfoFormV5.tsx](../src/domains/credit-applications/form/components/steps/step3/ContactInfoFormV5.tsx)
- [AdditionalInfoFormV5.tsx](../src/domains/credit-applications/form/components/steps/step5/AdditionalInfoFormV5.tsx)

### Примеры из документации

- [VARIANT_5_README.md](./VARIANT_5_README.md) - полная документация API
- [variant5-basic-example.tsx](../src/examples/variant5-basic-example.tsx) - базовый пример
- [variant5-credit-application.tsx](../src/examples/variant5-credit-application.tsx) - комплексный пример

---

## Поддержка

При возникновении вопросов:
1. Проверьте [VARIANT_5_README.md](./VARIANT_5_README.md)
2. Изучите примеры в [src/examples/](../src/examples/)
3. Откройте issue в репозитории

---

**Обновлено**: 2025-10-21
**Автор**: Claude Code
