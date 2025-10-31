# Реализация методов-помощников для реактивности (Фаза 1)

**Дата**: 2025-10-31
**Статус**: ✅ Завершено
**Объем**: ~150 строк нового кода + документация + примеры

---

## Обзор

Реализована **Фаза 1** из [PROMT.md](../PROMT.md) - методы-помощники для реактивного поведения форм. Все методы используют `@preact/signals` для автоматической подписки на изменения и возвращают функцию отписки для cleanup.

---

## Реализованные методы

### 1. FieldNode

#### `watch(callback): () => void`

**Назначение**: Подписка на изменения значения поля

**Сигнатура**:
```typescript
watch(callback: (value: T) => void | Promise<void>): () => void
```

**Использование**:
```typescript
const unsubscribe = form.email.watch((value) => {
  console.log('Email changed:', value);
});

// Cleanup
useEffect(() => unsubscribe, []);
```

**Файл**: [src/lib/forms/core/nodes/field-node.ts:325-330](../src/lib/forms/core/nodes/field-node.ts#L325-L330)

---

#### `computeFrom(sources, computeFn): () => void`

**Назначение**: Автоматическое вычисление значения поля из других полей

**Сигнатура**:
```typescript
computeFrom<TSource extends any[]>(
  sources: ReadonlySignal<TSource[number]>[],
  computeFn: (...values: TSource) => T
): () => void
```

**Использование**:
```typescript
// Автоматический расчет первоначального взноса (20%)
const dispose = form.initialPayment.computeFrom(
  [form.propertyValue.value],
  (propertyValue) => propertyValue ? propertyValue * 0.2 : null
);

form.propertyValue.setValue(1000000);
console.log(form.initialPayment.value.value); // 200000

// Cleanup
useEffect(() => dispose, []);
```

**Файл**: [src/lib/forms/core/nodes/field-node.ts:354-368](../src/lib/forms/core/nodes/field-node.ts#L354-L368)

---

### 2. GroupNode

#### `linkFields(sourceKey, targetKey, transform?): () => void`

**Назначение**: Связь двух полей с опциональной трансформацией

**Сигнатура**:
```typescript
linkFields<K1 extends keyof T, K2 extends keyof T>(
  sourceKey: K1,
  targetKey: K2,
  transform?: (value: T[K1]) => T[K2]
): () => void
```

**Использование**:
```typescript
// Автоматический расчет максимальной суммы кредита от дохода
const dispose = form.linkFields(
  'monthlyIncome',
  'maxLoanAmount',
  (income) => income ? income * 0.5 * 12 * 10 : null
);

form.monthlyIncome.setValue(100000);
console.log(form.maxLoanAmount.value.value); // 6000000

// Cleanup
useEffect(() => dispose, []);
```

**Файл**: [src/lib/forms/core/nodes/group-node.ts:462-487](../src/lib/forms/core/nodes/group-node.ts#L462-L487)

---

#### `watchField(fieldPath, callback): () => void`

**Назначение**: Подписка на изменения вложенного поля по строковому пути

**Сигнатура**:
```typescript
watchField<K extends keyof T>(
  fieldPath: K extends string ? K : string,
  callback: (value: any) => void | Promise<void>
): () => void
```

**Использование**:
```typescript
// Подписка на изменение страны для загрузки городов
const dispose = form.watchField(
  'registrationAddress.country',
  async (countryCode) => {
    if (countryCode) {
      const cities = await fetchCitiesByCountry(countryCode);
      form.registrationAddress.city.updateComponentProps({
        options: cities
      });
    }
  }
);

// Cleanup
useEffect(() => dispose, []);
```

**Файл**: [src/lib/forms/core/nodes/group-node.ts:516-533](../src/lib/forms/core/nodes/group-node.ts#L516-L533)

---

### 3. ArrayNode

#### `watchItems(fieldKey, callback): () => void`

**Назначение**: Подписка на изменения конкретного поля во всех элементах массива

**Сигнатура**:
```typescript
watchItems<K extends keyof T>(
  fieldKey: K,
  callback: (values: Array<T[K] | undefined>) => void | Promise<void>
): () => void
```

**Использование**:
```typescript
// Автоматический пересчет общей стоимости недвижимости
const dispose = form.properties.watchItems(
  'estimatedValue',
  (values) => {
    const total = values.reduce((sum, v) => sum + (v || 0), 0);
    form.totalValue.setValue(total);
  }
);

form.properties.push({ title: 'Квартира', estimatedValue: 5000000 });
// totalValue автоматически станет 5000000

// Cleanup
useEffect(() => dispose, []);
```

**Файл**: [src/lib/forms/core/nodes/array-node.ts:328-344](../src/lib/forms/core/nodes/array-node.ts#L328-L344)

---

#### `watchLength(callback): () => void`

**Назначение**: Подписка на изменение длины массива

**Сигнатура**:
```typescript
watchLength(callback: (length: number) => void | Promise<void>): () => void
```

**Использование**:
```typescript
// Автоматическое обновление счетчика элементов
const dispose = form.existingLoans.watchLength((length) => {
  form.loanCount.setValue(length);
  console.log(`Количество кредитов: ${length}`);
});

form.existingLoans.push({ bank: 'Сбербанк', amount: 500000 });
// loanCount автоматически станет 1

// Cleanup
useEffect(() => dispose, []);
```

**Файл**: [src/lib/forms/core/nodes/array-node.ts:368-373](../src/lib/forms/core/nodes/array-node.ts#L368-L373)

---

## Ключевые особенности

### 1. Автоматическая подписка через @preact/signals

Все методы используют `effect()` из @preact/signals для автоматического отслеживания изменений:

```typescript
watch(callback: (value: T) => void): () => void {
  return effect(() => {
    const currentValue = this.value.value; // track changes
    callback(currentValue);
  });
}
```

### 2. Защита от циклических зависимостей

При программном обновлении используется `{ emitEvent: false }`:

```typescript
computeFrom(sources, computeFn): () => void {
  return effect(() => {
    const values = sources.map(s => s.value);
    const newValue = computeFn(...values);

    // Избегаем циклов
    this.setValue(newValue, { emitEvent: false });
  });
}
```

### 3. Возврат функции cleanup

Все методы возвращают функцию отписки для правильного cleanup:

```typescript
const dispose = form.email.watch(callback);

// В React компоненте
useEffect(() => dispose, []);

// Или вручную
dispose();
```

### 4. Типобезопасность

TypeScript корректно выводит типы для всех операций:

```typescript
// K1 и K2 - это keyof T, TypeScript знает типы полей
form.linkFields('monthlyIncome', 'maxLoanAmount', (income: number) => {
  return income * 0.5 * 12 * 10; // TypeScript знает, что income - number
});
```

### 5. Dev режим предупреждения

В режиме разработки выводятся предупреждения при ошибках:

```typescript
if (import.meta.env.DEV) {
  console.warn(`GroupNode.linkFields: field "${sourceKey}" not found`);
}
return () => {}; // noop функция отписки
```

---

## Примеры использования

Полные примеры доступны в файле [src/examples/behavior-helpers-example.ts](../src/examples/behavior-helpers-example.ts)

### Пример 1: Простая подписка

```typescript
const form = new GroupNode({
  email: { value: '', component: Input },
});

const unsubscribe = form.email.watch((value) => {
  console.log('Email:', value);
});
```

### Пример 2: Вычисляемое поле

```typescript
const form = new GroupNode({
  propertyValue: { value: null, component: Input },
  initialPayment: { value: null, component: Input },
});

const dispose = form.initialPayment.computeFrom(
  [form.propertyValue.value],
  (value) => value ? value * 0.2 : null
);
```

### Пример 3: Каскадные зависимости

```typescript
// loanType → interestRate
form.linkFields('loanType', 'interestRate', (type) => {
  return { mortgage: 8.5, auto: 12.0, consumer: 15.5 }[type];
});

// interestRate + loanAmount + loanTerm → monthlyPayment
form.monthlyPayment.computeFrom(
  [form.loanAmount.value, form.loanTerm.value, form.interestRate.value],
  (amount, term, rate) => calculatePayment(amount, term, rate)
);
```

### Пример 4: Массивы форм

```typescript
// Автоматический пересчет суммы при изменении любого элемента
form.existingLoans.watchItems('remainingAmount', (amounts) => {
  const total = amounts.reduce((sum, amount) => sum + (amount || 0), 0);
  form.totalDebt.setValue(total);
});
```

---

## Тестирование

### Проверка компиляции

```bash
npm run build
# ✅ Без ошибок TypeScript
```

### Запуск примеров

```typescript
import { runAllExamples } from '@/examples/behavior-helpers-example';

runAllExamples();
// Выведет результаты работы всех 7 примеров
```

---

## Использование в React компонентах

### С useEffect для cleanup

```typescript
function MyForm() {
  const form = useMemo(() => createMyForm(), []);

  useEffect(() => {
    // Подписка
    const dispose = form.propertyValue.watch((value) => {
      console.log('Property value:', value);
    });

    // Cleanup при unmount
    return () => dispose();
  }, [form]);

  return <div>...</div>;
}
```

### Множественные подписки

```typescript
function MyForm() {
  const form = useMemo(() => createMyForm(), []);

  useEffect(() => {
    const disposables = [
      form.email.watch(callback1),
      form.linkFields('source', 'target', transform),
      form.array.watchItems('field', callback2),
    ];

    // Cleanup всех подписок
    return () => disposables.forEach(dispose => dispose());
  }, [form]);

  return <div>...</div>;
}
```

---

## Сравнение с императивным подходом

### До (императивно)

```typescript
function MyForm() {
  const form = useMemo(() => createMyForm(), []);

  // Нужно вручную отслеживать изменения
  useEffect(() => {
    const propertyValue = form.propertyValue.value.value;
    const initialPayment = propertyValue ? propertyValue * 0.2 : null;
    form.initialPayment.setValue(initialPayment, { emitEvent: false });
  }, [form.propertyValue.value.value]);

  return <div>...</div>;
}
```

### После (с методами-помощниками)

```typescript
function MyForm() {
  const form = useMemo(() => createMyForm(), []);

  useEffect(() => {
    // Просто описываем зависимость
    const dispose = form.initialPayment.computeFrom(
      [form.propertyValue.value],
      (value) => value ? value * 0.2 : null
    );

    return () => dispose();
  }, [form]);

  return <div>...</div>;
}
```

---

## Следующие шаги

Фаза 1 завершена ✅

**Фаза 2** (Декларативный Behavior Schema API):
- [ ] Создать `src/lib/forms/behaviors/behavior-registry.ts`
- [ ] Создать `src/lib/forms/behaviors/behavior-context.ts`
- [ ] Создать `src/lib/forms/behaviors/schema-behaviors.ts`
- [ ] Добавить `applyBehaviorSchema()` в GroupNode
- [ ] Реализовать функции: `copyFrom`, `enableWhen`, `computeFrom`, `watchField`, `revalidateWhen`, `syncFields`

**Фаза 3** (React хуки - опционально):
- [ ] Создать `src/lib/forms/hooks/useFormEffect.ts`
- [ ] Создать `src/lib/forms/hooks/useComputedField.ts`
- [ ] Создать `src/lib/forms/hooks/useCopyField.ts`
- [ ] Создать `src/lib/forms/hooks/useEnableWhen.ts`

---

## Обратная совместимость

✅ Все изменения полностью обратно совместимы:
- Не изменен существующий API
- Добавлены только новые методы
- Не требуется миграция существующего кода
- TypeScript компиляция проходит без ошибок

---

## Производительность

- ✅ Использование `effect()` оптимизировано через signals
- ✅ Подписки автоматически очищаются при dispose
- ✅ Использование `{ emitEvent: false }` предотвращает циклы
- ✅ Нет лишних ререндеров благодаря fine-grained reactivity

---

## Итого

**Реализовано**:
- ✅ 6 новых методов (watch, computeFrom, linkFields, watchField, watchItems, watchLength)
- ✅ ~150 строк кода с полной документацией
- ✅ 7 рабочих примеров использования
- ✅ Типобезопасность и автоматический cleanup
- ✅ Полная обратная совместимость

**Готово к использованию** в production коде! 🎉
