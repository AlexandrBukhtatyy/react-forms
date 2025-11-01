# План миграции на ArrayNode для формы заявки на кредит

## Текущее состояние

### Архитектура формы
- **Главная форма**: `GroupNode<CreditApplicationForm>` с 6 шагами
- **Вложенные группы**: `personalData`, `passportData`, `registrationAddress`, `residenceAddress`
- **Массивы**: `properties`, `existingLoans`, `coBorrowers` (в настоящее время используют legacy подход)

### Используемые компоненты
1. **PropertyForm** - карточка имущества (тип, описание, стоимость, обременение)
2. **ExistingLoanForm** - карточка существующего кредита (банк, тип, суммы, дата)
3. **CoBorrowerForm** - карточка созаемщика (personalData, контакты, доход) - содержит вложенную группу!

### Текущий UI для массивов
- `FormArrayManager` - компонент для рендеринга массива форм
- Кнопка "+" для добавления элемента через `control.properties?.push()`
- Кнопка удаления в каждой карточке
- Условное отображение при `hasProperty`, `hasExistingLoans`, `hasCoBorrower`

---

## Задачи для миграции на ArrayNode

### 🔴 Критичные (блокируют миграцию)

#### 1. Обновить схему создания массивов в `credit-application-schema.ts`
**Текущий код:**
```typescript
properties: [propertyFormSchema],  // массив из 1 элемента (legacy)
existingLoans: [existingLoansFormSchema],
coBorrowers: [coBorrowersFormSchema],
```

**Нужно изменить на:**
```typescript
properties: {
  schema: propertyFormSchema,
  initialItems: [],
},
existingLoans: {
  schema: existingLoansFormSchema,
  initialItems: [],
},
coBorrowers: {
  schema: coBorrowersFormSchema,
  initialItems: [],
},
```

**Файл**: `src/domains/credit-applications/form/schemas/credit-application-schema.ts`

---

#### 2. Обновить типы для массивов в `GroupNode`
**Проблема**: GroupNode должен корректно определять ArrayNode из schema

**Нужно**:
- Проверить типизацию в `GroupNode` для распознавания ArrayNode из schema
- Убедиться, что `GroupNodeWithControls` корректно типизирует массивы как `ArrayNode<T>`
- Проверить `DeepFormSchema` - должна поддерживать объект с `schema` и `initialItems`

**Файлы**:
- `src/lib/forms/core/nodes/group-node.ts`
- `src/lib/forms/types/group-node-proxy.ts`
- `src/lib/forms/types/deep-schema.ts`

---

#### 3. Добавить создание ArrayNode в конструкторе GroupNode
**Текущий код** (строка ~70-90 в `group-node.ts`):
```typescript
// Создать дочерние FieldNode для каждого поля
for (const [key, config] of Object.entries(schema)) {
  if (Array.isArray(config)) {
    // TODO: Legacy array support - будет удалено после миграции
    (controls as any)[key] = config;
  } else if (typeof config === 'object' && 'value' in config) {
    // Создать FieldNode
    controls[key] = new FieldNode(config as FieldConfig);
  } else {
    // Создать вложенный GroupNode
    controls[key] = new GroupNode(config as DeepFormSchema<any>);
  }
}
```

**Нужно добавить**:
```typescript
for (const [key, config] of Object.entries(schema)) {
  if ('schema' in config && 'initialItems' in config) {
    // Создать ArrayNode
    controls[key] = new ArrayNode(config.schema, config.initialItems || []);
  } else if (Array.isArray(config)) {
    // Legacy support (deprecated)
    (controls as any)[key] = config;
  } else if (typeof config === 'object' && 'value' in config) {
    // Создать FieldNode
    controls[key] = new FieldNode(config as FieldConfig);
  } else {
    // Создать вложенный GroupNode
    controls[key] = new GroupNode(config as DeepFormSchema<any>);
  }
}
```

**Файл**: `src/lib/forms/core/nodes/group-node.ts`

---

#### 4. Обновить validation schema для ArrayNode
**Текущий код** (`additional-validation.ts`, строки 46-76):
```typescript
validateTree((ctx) => {
  const form = ctx.formValue();
  if (!form.properties || form.properties.length === 0) return null;

  const errors: string[] = [];
  form.properties.forEach((property: any, index: number) => {
    // Валидация каждого элемента...
  });
  // ...
}, { targetField: 'properties' });
```

**Нужно создать отдельные схемы валидации**:

```typescript
// src/domains/credit-applications/form/schemas/validation/property-validation.ts
export const propertyValidation = (path: FieldPath<Property>) => {
  required(path.type, { message: 'Укажите тип имущества' });
  required(path.description, { message: 'Добавьте описание' });
  minLength(path.description, 10, { message: 'Минимум 10 символов' });
  maxLength(path.description, 500, { message: 'Максимум 500 символов' });
  required(path.estimatedValue, { message: 'Укажите стоимость' });
  min(path.estimatedValue, 10000, { message: 'Минимальная стоимость: 10 000 ₽' });
};

// src/domains/credit-applications/form/schemas/validation/existing-loan-validation.ts
export const existingLoanValidation = (path: FieldPath<ExistingLoan>) => {
  required(path.bank, { message: 'Укажите название банка' });
  minLength(path.bank, 3);
  maxLength(path.bank, 100);
  // ... остальная валидация

  validateTree((ctx) => {
    const loan = ctx.formValue();
    if (loan.remainingAmount > loan.amount) {
      return { code: 'remainingExceedsAmount', message: 'Остаток > суммы' };
    }
    return null;
  }, { targetField: 'remainingAmount' });
};

// src/domains/credit-applications/form/schemas/validation/co-borrower-validation.ts
export const coBorrowerValidation = (path: FieldPath<CoBorrower>) => {
  // ФИО
  required(path.personalData.lastName, { message: 'Фамилия обязательна' });
  minLength(path.personalData.lastName, 2);
  maxLength(path.personalData.lastName, 50);
  pattern(path.personalData.lastName, /^[А-ЯЁа-яё\s-]+$/);
  // ... остальная валидация
};
```

**Применить в schema**:
```typescript
// В credit-application-schema.ts
properties: {
  schema: propertyFormSchema,
  initialItems: [],
  validation: propertyValidation,  // Применяется к каждому элементу
},
```

**Файлы**:
- Создать: `src/domains/credit-applications/form/schemas/validation/property-validation.ts`
- Создать: `src/domains/credit-applications/form/schemas/validation/existing-loan-validation.ts`
- Создать: `src/domains/credit-applications/form/schemas/validation/co-borrower-validation.ts`
- Обновить: `src/domains/credit-applications/form/schemas/validation/additional-validation.ts` (удалить `validateTree` для массивов)

---

### 🟡 Важные (улучшают архитектуру)

#### 5. Обновить поддержку ArrayNode в FormArrayManager
**Проверить**: Компонент `FormArrayManager` должен корректно работать с `ArrayNode`

**Файл**: `src/lib/forms/components/form-array-manager.tsx`

**Что проверить**:
- `control.at(index)` - возвращает `GroupNode` элемента
- `control.push()` - добавляет новый элемент
- `control.removeAt(index)` - удаляет элемент
- `control.length.value` - реактивная длина массива

---

#### 6. Добавить behavior schema для массивов
**Что нужно**:
```typescript
// В credit-application-behavior.ts
export const creditApplicationBehavior = (path: FieldPath<CreditApplicationForm>) => {
  // Сбросить массив при отключении hasProperty
  watchField(path.hasProperty, (hasProperty, form) => {
    if (!hasProperty && form.properties && form.properties.length > 0) {
      form.properties.clear();  // Очистить массив
    }
  });

  // Аналогично для existingLoans и coBorrowers
  watchField(path.hasExistingLoans, (hasLoans, form) => {
    if (!hasLoans && form.existingLoans) {
      form.existingLoans.clear();
    }
  });

  watchField(path.hasCoBorrower, (hasCoBorrower, form) => {
    if (!hasCoBorrower && form.coBorrowers) {
      form.coBorrowers.clear();
    }
  });
};
```

**Файл**: `src/domains/credit-applications/form/schemas/credit-application-behavior.ts`

---

#### 7. Добавить метод `clear()` в ArrayNode
**Что добавить** в `array-node.ts`:
```typescript
public clear(): void {
  this.items.value = [];
  this.markAsDirty();
}
```

**Файл**: `src/lib/forms/core/nodes/array-node.ts`

---

### 🟢 Опциональные (дополнительные улучшения)

#### 8. Добавить методы валидации в ArrayNode
```typescript
// В ArrayNode
public async validate(): Promise<boolean> {
  const results = await Promise.all(
    this.items.value.map(item => item.validate())
  );
  return results.every(valid => valid);
}

public markAllAsTouched(): void {
  this.items.value.forEach(item => item.markAsTouched());
}
```

**Файл**: `src/lib/forms/core/nodes/array-node.ts`

---

#### 9. Типобезопасность для вложенных массивов
**Проверить**: CoBorrowerForm содержит вложенную группу `personalData`

**Убедиться**:
- `ArrayNode<CoBorrower>` → каждый элемент это `GroupNode<CoBorrower>`
- `element.personalData` → тоже `GroupNode<PersonalData>`
- Типы корректны на всех уровнях вложенности

---

#### 10. Обновить примеры и документацию
**Создать**:
- `src/examples/array-node-example.tsx` - примеры использования ArrayNode
- Обновить комментарии в `AdditionalInfoForm.tsx`
- Добавить JSDoc к методам ArrayNode

---

## Порядок выполнения

### Фаза 1: Подготовка типов и API (1-3 задачи)
1. ✅ Обновить `DeepFormSchema` для поддержки `{ schema, initialItems, validation? }`
2. ✅ Обновить `GroupNode` конструктор - добавить создание `ArrayNode`
3. ✅ Обновить типы `GroupNodeWithControls` - распознавание `ArrayNode`

### Фаза 2: Создание схем валидации (4 задача)
4. ✅ Создать `property-validation.ts`
5. ✅ Создать `existing-loan-validation.ts`
6. ✅ Создать `co-borrower-validation.ts`
7. ✅ Обновить `additional-validation.ts` - удалить legacy валидацию массивов

### Фаза 3: Миграция формы (1, 5-7 задачи)
8. ✅ Обновить `credit-application-schema.ts` - новый формат массивов
9. ✅ Проверить `FormArrayManager` - совместимость с ArrayNode
10. ✅ Добавить `clear()` метод в ArrayNode
11. ✅ Добавить behavior schema для сброса массивов

### Фаза 4: Тестирование и документация (8-10 задачи)
12. ✅ Добавить методы валидации в ArrayNode
13. ✅ Проверить типобезопасность вложенных структур
14. ✅ Создать примеры и обновить документацию
15. ✅ Протестировать все CRUD операции на UI

---

## Критерии успеха

### Функциональность
- ✅ Массивы корректно создаются через `new ArrayNode(schema, [])`
- ✅ CRUD операции работают: `push()`, `removeAt()`, `at()`, `clear()`
- ✅ Валидация применяется к каждому элементу массива
- ✅ Реактивность: изменения в элементах массива обновляют UI

### Типобезопасность
- ✅ `control.properties` имеет тип `ArrayNode<Property>`
- ✅ `control.properties.at(0)` имеет тип `GroupNode<Property> | undefined`
- ✅ Нет ошибок TypeScript в компиляции

### UI/UX
- ✅ Кнопка "+" добавляет элементы
- ✅ Кнопка удаления работает
- ✅ Валидация отображается для каждого элемента
- ✅ При снятии чекбокса массив очищается

---

## Риски и ограничения

### Риски
1. **Breaking changes** - изменение формата schema может сломать существующий код
2. **Типизация** - сложность с глубокой вложенностью типов (CoBorrower содержит PersonalData)
3. **Производительность** - большое количество элементов в массиве может замедлить рендер

### Ограничения
1. **Legacy code** - старый формат `[schema]` должен остаться для обратной совместимости
2. **Валидация** - нужно продумать как показывать ошибки массива в целом vs ошибки элементов

---

## Следующий шаг

**Начать с Фазы 1, задача 1**: Обновить `DeepFormSchema` для поддержки нового формата массивов.

Это позволит постепенно мигрировать без ломающих изменений.
