# 🚀 Шпаргалка по миграции на ArrayNode

Краткий справочник по ключевым изменениям для миграции на ArrayNode.

---

## 📝 Основные изменения

### 1. Формат массива в schema

```typescript
// ✅ Формат ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ
properties: [propertyFormSchema]  // GroupNode автоматически создаст ArrayNode!

// Типы автоматически выводятся:
// control.properties → ArrayNode<Property>
```

---

### 2. Типы

```typescript
// TypeScript автоматически определяет правильные типы:

control.properties           // ArrayNode<Property>
control.properties.at(0)     // GroupNode<Property> | undefined
control.properties.length    // ReadonlySignal<number>
control.properties.value     // ReadonlySignal<Property[]>
```

---

### 3. API ArrayNode

#### Добавить элемент
```typescript
// Пустой объект с дефолтными значениями
control.properties.push()

// С начальными данными
control.properties.push({ type: 'apartment', description: '', estimatedValue: 0 })
```

#### Удалить элемент
```typescript
control.properties.removeAt(0)
```

#### Получить элемент
```typescript
const item = control.properties.at(0)  // GroupNode<Property> | undefined
if (item) {
  item.type.setValue('house')
}
```

#### Очистить массив
```typescript
control.properties.clear()
```

#### Получить длину
```typescript
const length = control.properties.length.value  // реактивный signal
```

#### Итерация
```typescript
control.properties.forEach((item, index) => {
  console.log(item.type.value.value)
})
```

---

### 4. Валидация элементов массива

```typescript
// Создать файл: property-validation.ts
export const propertyValidation = (path: FieldPath<Property>) => {
  required(path.type, { message: 'Укажите тип' });
  required(path.description);
  minLength(path.description, 10);
  min(path.estimatedValue, 10000);
};

// Применить validation в create-credit-application-form.ts:
export const createCreditApplicationForm = () => {
  const form = new GroupNode({ form: creditApplicationSchema });

  // Применяем validation к каждому ArrayNode
  form.properties.applyValidationSchema(propertyValidation);
  form.existingLoans.applyValidationSchema(existingLoanValidation);
  form.coBorrowers.applyValidationSchema(coBorrowerValidation);

  return form;
};
```

---

### 5. Валидация массива целиком

```typescript
// В additional-validation.ts:
applyWhen(path.hasProperty, value => value === true, (path) => {
  // Проверка что массив не пустой
  validate(path.properties, (ctx) => {
    if (ctx.value().length === 0) {
      return { code: 'empty', message: 'Добавьте хотя бы один объект' };
    }
    return null;
  });
});
```

---

### 6. Behavior schema для массивов

```typescript
// Автоочистка при снятии чекбокса
watchField(path.hasProperty, (hasProperty, form) => {
  if (!hasProperty && form.properties) {
    form.properties.clear();
  }
});
```

---

### 7. React компоненты

#### FormArrayManager (уже готов)
```tsx
<FormArrayManager
  control={control.properties}  // ArrayNode<Property>
  component={PropertyForm}
  itemLabel="Имущество"
/>
```

#### Кнопка добавления
```tsx
<button onClick={() => control.properties?.push()}>
  + Добавить имущество
</button>
```

#### Условный рендеринг
```tsx
{control.properties?.length.value === 0 && (
  <div>Массив пуст</div>
)}
```

---

## 🔧 Реализация в GroupNode

```typescript
// В конструкторе GroupNode добавить:
for (const [key, config] of Object.entries(schema)) {
  // Проверка на ArrayNodeConfig
  if ('schema' in config && 'initialItems' in config) {
    const arrayNode = new ArrayNode(config.schema, config.initialItems);
    if (config.validation) {
      arrayNode.applyValidationSchema(config.validation);
    }
    controls[key] = arrayNode;
  }
  // ... остальные проверки
}
```

---

## 📦 Структура файлов

```
src/domains/credit-applications/form/schemas/
├── validation/
│   ├── property-validation.ts          ✅ новый файл
│   ├── existing-loan-validation.ts     ✅ новый файл
│   ├── co-borrower-validation.ts       ✅ новый файл
│   └── additional-validation.ts        🔄 обновить (удалить legacy код)
├── credit-application-schema.ts        🔄 обновить (новый формат массивов)
└── credit-application-behavior.ts      🔄 обновить (добавить watchField)

src/lib/forms/
├── types/
│   └── deep-schema.ts                  🔄 обновить (добавить ArrayNodeConfig)
├── core/nodes/
│   ├── group-node.ts                   🔄 обновить (создание ArrayNode)
│   └── array-node.ts                   🔄 обновить (добавить clear())
```

---

## ⚡ Быстрый старт

### Шаг 1: Создать validation файлы
```bash
touch src/domains/credit-applications/form/schemas/validation/property-validation.ts
touch src/domains/credit-applications/form/schemas/validation/existing-loan-validation.ts
touch src/domains/credit-applications/form/schemas/validation/co-borrower-validation.ts
```

### Шаг 2: Скопировать код из MIGRATION_EXAMPLES.md
- Фаза 2.1 → `property-validation.ts`
- Фаза 2.2 → `existing-loan-validation.ts`
- Фаза 2.3 → `co-borrower-validation.ts`

### Шаг 3: ~~Обновить schema~~ НЕ ТРЕБУЕТСЯ!
```typescript
// ✅ credit-application-schema.ts ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ
properties: [propertyFormSchema],  // все как было!
```

### Шаг 4: Применить validation в create-credit-application-form.ts
```typescript
import { propertyValidation } from './validation/property-validation';
import { existingLoanValidation } from './validation/existing-loan-validation';
import { coBorrowerValidation } from './validation/co-borrower-validation';

export const createCreditApplicationForm = () => {
  const form = new GroupNode({
    form: creditApplicationSchema,
    behavior: creditApplicationBehavior,
    validation: creditApplicationValidation,
  });

  // Применяем validation к ArrayNode
  form.properties.applyValidationSchema(propertyValidation);
  form.existingLoans.applyValidationSchema(existingLoanValidation);
  form.coBorrowers.applyValidationSchema(coBorrowerValidation);

  return form;
};
```

### Шаг 5: Запустить тесты
```bash
npx tsc --noEmit  # Проверка TypeScript
npm run dev       # Запуск dev сервера
```

---

## 🐛 Частые ошибки

### ❌ Забыли импортировать validation
```typescript
// Ошибка: validation схема не применяется
properties: {
  schema: propertyFormSchema,
  initialItems: [],
  // validation: propertyValidation,  ← забыли!
}
```

### ❌ Неправильный формат
```typescript
// Ошибка: смешение старого и нового формата
properties: [{ schema: propertyFormSchema }]  // ❌ неправильно
```

### ❌ Не обновлен GroupNode
```typescript
// Если GroupNode еще не обновлен, массив не создастся
// Нужно сначала реализовать Фазу 1
```

---

## ✅ Чек-лист готовности

Перед миграцией:
- [ ] `ArrayNodeConfig<T>` добавлен в `deep-schema.ts`
- [ ] `GroupNode` создает `ArrayNode` из config
- [ ] `ArrayNode.clear()` реализован
- [ ] Созданы 3 файла validation

После миграции:
- [ ] `npx tsc --noEmit` проходит без ошибок
- [ ] Кнопка "+" добавляет элементы
- [ ] Кнопка "Удалить" работает
- [ ] Валидация отображается для каждого элемента
- [ ] При снятии чекбокса массив очищается

---

## 💡 Полезные ссылки

- **Полные примеры**: [MIGRATION_EXAMPLES.md](MIGRATION_EXAMPLES.md)
- **План миграции**: [PROMT.md](PROMT.md)
- **Документация FormNode**: [src/lib/forms/MIGRATION.md](src/lib/forms/MIGRATION.md)
- **Примеры использования**: [src/examples/group-node-config-example.ts](src/examples/group-node-config-example.ts)

---

## 🎯 Приоритет задач

1. **Критично** 🔴: Типы + GroupNode + Validation файлы
2. **Важно** 🟡: Behavior schema + clear()
3. **Опционально** 🟢: Документация + примеры

Начинайте с 🔴 критичных задач!
