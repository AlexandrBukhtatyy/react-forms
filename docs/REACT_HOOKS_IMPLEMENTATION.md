# React Hooks для форм - Документация

## Обзор

**Phase 3** реализует набор React хуков для императивного использования реактивных форм. Эти хуки предоставляют удобный способ работы с формами на уровне компонентов, автоматически управляя жизненным циклом подписок.

### Когда использовать React хуки

- ✅ Локальная логика внутри React компонента
- ✅ Динамическая загрузка данных при изменении полей
- ✅ Интеграция с React lifecycle и hooks
- ✅ Побочные эффекты (логирование, аналитика, API вызовы)
- ✅ Условная логика, зависящая от props или state

### Когда использовать Behavior Schema

- ✅ Централизованное описание поведения формы
- ✅ Сложная бизнес-логика, не зависящая от UI
- ✅ Переиспользуемые схемы поведения
- ✅ Декларативный стиль кода

### Когда использовать Helper методы

- ✅ Императивная настройка вне React компонентов
- ✅ Динамическое создание подписок
- ✅ Продвинутые сценарии с ручным управлением cleanup

---

## Доступные хуки

### 1. `useFormEffect`

Базовый хук для создания реактивных эффектов на форме. Оборачивает `effect()` из `@preact/signals`.

#### Сигнатура

```typescript
function useFormEffect(
  callback: () => void | (() => void),
  deps?: React.DependencyList
): void
```

#### Параметры

- `callback` - Функция эффекта, выполняется при изменении любых signals внутри
- `deps` - (опционально) Зависимости React для useEffect

#### Возвращаемое значение

Ничего (cleanup управляется автоматически)

#### Пример

```typescript
function MyForm() {
  const form = useMemo(() => createLoginForm(), []);

  // Логирование изменений формы
  useFormEffect(() => {
    console.log('Form value:', form.value.value);
    console.log('Is valid:', form.valid.value);
  });

  return <FormRenderer form={form} />;
}
```

#### Особенности

- Автоматически отслеживает все signals, к которым обращается callback
- Автоматически выполняет cleanup при unmount компонента
- Поддерживает возврат cleanup функции из callback

---

### 2. `useComputedField`

Автоматически вычисляет значение поля на основе других полей. Требует явного указания зависимостей.

#### Сигнатура

```typescript
function useComputedField<T>(
  field: FieldNode<T>,
  computeFn: () => T,
  deps: React.DependencyList
): void
```

#### Параметры

- `field` - FieldNode для записи результата вычисления
- `computeFn` - Функция вычисления нового значения
- `deps` - Зависимости React (обычно включают signals, которые читает computeFn)

#### Пример

```typescript
function ProductForm() {
  const form = useMemo(() => createProductForm(), []);

  // Автоматический расчет total = price * quantity
  useComputedField(
    form.total,
    () => {
      const price = form.price.value.value || 0;
      const quantity = form.quantity.value.value || 0;
      return price * quantity;
    },
    [form.price.value.value, form.quantity.value.value]
  );

  return <FormRenderer form={form} />;
}
```

#### Особенности

- Записывает значение с `{ emitEvent: false }` для предотвращения циклов
- Требует явного указания зависимостей
- Подходит для простых вычислений

---

### 3. `useComputedFieldAuto`

Вариант `useComputedField` с **автоматическим отслеживанием зависимостей**. Не требует указания deps.

#### Сигнатура

```typescript
function useComputedFieldAuto<T>(
  field: FieldNode<T>,
  computeFn: () => T
): void
```

#### Параметры

- `field` - FieldNode для записи результата
- `computeFn` - Функция вычисления (автоматически отслеживает signals)

#### Пример

```typescript
function MortgageForm() {
  const form = useMemo(() => createMortgageForm(), []);

  // Автоматически отслеживает form.propertyValue.value
  useComputedFieldAuto(form.initialPayment, () => {
    const propertyValue = form.propertyValue.value.value;
    return propertyValue ? propertyValue * 0.2 : null;
  });

  return <FormRenderer form={form} />;
}
```

#### Особенности

- Signals отслеживаются автоматически через `effect()`
- Более удобен для сложных вычислений с множеством зависимостей
- В deps передается только `[field]`

---

### 4. `useCopyField`

Автоматически копирует значения из одной группы полей в другую. Поддерживает условия и трансформацию.

#### Сигнатура

```typescript
function useCopyField<T extends Record<string, any>>(
  source: GroupNode<T>,
  target: GroupNode<T>,
  options?: UseCopyFieldOptions<T>
): void

interface UseCopyFieldOptions<T> {
  /** Условие копирования (computed signal или function) */
  enabled?: ReadonlySignal<boolean> | (() => boolean);

  /** Какие поля копировать (для групп) */
  fields?: keyof T[] | 'all';

  /** Трансформация значения */
  transform?: (value: T) => T;
}
```

#### Параметры

- `source` - GroupNode-источник
- `target` - GroupNode-цель
- `options` - Опции копирования

#### Пример 1: Базовое копирование

```typescript
function AddressForm() {
  const form = useMemo(() => createAddressForm(), []);

  // Копировать адрес регистрации в адрес проживания
  useCopyField(
    form.registrationAddress,
    form.residenceAddress,
    {
      enabled: form.sameAsRegistration.value, // ReadonlySignal<boolean>
      fields: 'all'
    }
  );

  return <FormRenderer form={form} />;
}
```

#### Пример 2: Копирование с трансформацией

```typescript
useCopyField(
  form.sourceData,
  form.targetData,
  {
    transform: (value) => ({
      firstName: value.firstName?.toUpperCase() || '',
      lastName: value.lastName?.toUpperCase() || '',
    })
  }
);
```

#### Особенности

- Поддерживает частичное копирование через `fields: ['field1', 'field2']`
- Трансформация применяется перед записью
- Условие можно передать как Signal или функцию

---

### 5. `useEnableWhen`

Условно включает/выключает поле на основе условия.

#### Сигнатура

```typescript
function useEnableWhen(
  field: FormNode<any>,
  condition: ReadonlySignal<boolean> | (() => boolean),
  options?: UseEnableWhenOptions
): void

interface UseEnableWhenOptions {
  /** Сбросить значение при disable */
  resetOnDisable?: boolean;
}
```

#### Параметры

- `field` - Поле для включения/выключения
- `condition` - Условие (true = enable, false = disable)
- `options` - Опции

#### Пример 1: С функцией

```typescript
function LoanForm() {
  const form = useMemo(() => createLoanForm(), []);

  // Включить поле только для ипотеки
  useEnableWhen(
    form.propertyValue,
    () => form.loanType.value.value === 'mortgage',
    { resetOnDisable: true }
  );

  return <FormRenderer form={form} />;
}
```

#### Пример 2: С computed signal

```typescript
function LoanForm() {
  const form = useMemo(() => createLoanForm(), []);

  const isMortgage = computed(() =>
    form.loanType.value.value === 'mortgage'
  );

  useEnableWhen(form.propertyValue, isMortgage, { resetOnDisable: true });

  return <FormRenderer form={form} />;
}
```

#### Особенности

- `resetOnDisable: true` сбрасывает значение при disable
- Работает с любым FormNode (FieldNode, GroupNode, ArrayNode)
- Условие может быть Signal или функцией

---

### 6. `useDisableWhen`

Инверсия `useEnableWhen` - выключает поле при истинном условии.

#### Сигнатура

```typescript
function useDisableWhen(
  field: FormNode<any>,
  condition: ReadonlySignal<boolean> | (() => boolean),
  options?: UseEnableWhenOptions
): void
```

#### Параметры

Те же, что у `useEnableWhen`

#### Пример

```typescript
function LoanForm() {
  const form = useMemo(() => createLoanForm(), []);

  // Выключить поле для потребительского кредита
  useDisableWhen(
    form.propertyValue,
    () => form.loanType.value.value === 'consumer'
  );

  return <FormRenderer form={form} />;
}
```

#### Особенности

- Внутри просто инвертирует условие и вызывает `useEnableWhen`
- Более читаемый код в некоторых сценариях

---

### 7. `useWatchField`

Подписывается на изменения поля и выполняет callback.

#### Сигнатура

```typescript
function useWatchField<T>(
  field: FieldNode<T>,
  callback: (value: T) => void | Promise<void>,
  deps?: React.DependencyList
): void
```

#### Параметры

- `field` - Поле для отслеживания
- `callback` - Функция, вызываемая при изменении значения
- `deps` - (опционально) Зависимости React

#### Пример

```typescript
function LocationForm() {
  const form = useMemo(() => createLocationForm(), []);

  // Динамическая загрузка городов при изменении страны
  useWatchField(
    form.registrationAddress.country,
    async (country) => {
      if (country) {
        const cities = await fetchCities(country);
        form.registrationAddress.city.updateComponentProps({
          options: cities
        });
      }
    }
  );

  return <FormRenderer form={form} />;
}
```

#### Особенности

- Поддерживает async callback
- Вызывается при mount (immediate: true по умолчанию)
- Автоматически управляет cleanup

---

### 8. `useWatchFieldWithOptions`

Вариант `useWatchField` с **контролем immediate** - можно отключить вызов при mount.

#### Сигнатура

```typescript
function useWatchFieldWithOptions<T>(
  field: FieldNode<T>,
  callback: (value: T) => void | Promise<void>,
  options?: {
    immediate?: boolean;
    deps?: React.DependencyList;
  }
): void
```

#### Параметры

- `field` - Поле для отслеживания
- `callback` - Функция-обработчик
- `options.immediate` - Вызывать ли callback при mount (default: true)
- `options.deps` - Зависимости React

#### Пример

```typescript
function EmailForm() {
  const form = useMemo(() => createEmailForm(), []);

  // Не вызывать при mount (immediate: false)
  useWatchFieldWithOptions(
    form.email,
    (value) => {
      console.log('Email changed to:', value);
      // Отправить метрики, валидация на сервере и т.д.
    },
    { immediate: false }
  );

  return <FormRenderer form={form} />;
}
```

#### Особенности

- `immediate: false` пропускает первый вызов при mount
- Полезно для избежания лишних API вызовов
- Внутренний флаг `isFirst` отслеживает первый запуск

---

## Паттерны использования

### Паттерн 1: Комбинирование нескольких хуков

```typescript
function ProductForm() {
  const form = useMemo(() => createProductForm(), []);

  // 1. Вычисляем общую стоимость
  useComputedFieldAuto(form.total, () => {
    const price = form.price.value.value || 0;
    const quantity = form.quantity.value.value || 0;
    return price * quantity;
  });

  // 2. Вычисляем финальную цену с учетом скидки
  useComputedFieldAuto(form.finalPrice, () => {
    const total = form.total.value.value || 0;
    const discount = form.discount.value.value || 0;
    return total - total * (discount / 100);
  });

  // 3. Включаем скидку только для премиум-пользователей
  useEnableWhen(
    form.discount,
    () => form.userType.value.value === 'premium',
    { resetOnDisable: true }
  );

  // 4. Отслеживаем изменения финальной цены
  useWatchFieldWithOptions(
    form.finalPrice,
    (price) => {
      console.log('Final price updated:', price);
      sendAnalytics('price_updated', { price });
    },
    { immediate: false }
  );

  return <FormRenderer form={form} />;
}
```

### Паттерн 2: Условная логика с несколькими полями

```typescript
function EmploymentForm() {
  const form = useMemo(() => createEmploymentForm(), []);

  // Включаем companyName только для employed
  useEnableWhen(
    form.companyName,
    () => form.employmentType.value.value === 'employed',
    { resetOnDisable: true }
  );

  // Включаем INN только для self-employed
  useEnableWhen(
    form.inn,
    () => form.employmentType.value.value === 'self-employed',
    { resetOnDisable: true }
  );

  // Выключаем monthlyIncome для unemployed
  useDisableWhen(
    form.monthlyIncome,
    () => form.employmentType.value.value === 'unemployed'
  );

  return <FormRenderer form={form} />;
}
```

### Паттерн 3: Динамическая загрузка данных

```typescript
function CascadingSelects() {
  const form = useMemo(() => createLocationForm(), []);

  // Загружаем регионы при изменении страны
  useWatchField(form.country, async (country) => {
    if (country) {
      const regions = await fetchRegions(country);
      form.region.updateComponentProps({ options: regions });
      form.region.setValue(''); // Сбрасываем выбор
    }
  });

  // Загружаем города при изменении региона
  useWatchField(form.region, async (region) => {
    if (region) {
      const cities = await fetchCities(region);
      form.city.updateComponentProps({ options: cities });
      form.city.setValue(''); // Сбрасываем выбор
    }
  });

  return <FormRenderer form={form} />;
}
```

### Паттерн 4: Интеграция с React state

```typescript
function FormWithState() {
  const form = useMemo(() => createMyForm(), []);
  const [isLoading, setIsLoading] = useState(false);

  // Отслеживаем valid и обновляем state
  useFormEffect(() => {
    const valid = form.valid.value;
    console.log('Form valid:', valid);
  });

  // Асинхронная валидация с индикатором загрузки
  useWatchField(form.email, async (email) => {
    if (email) {
      setIsLoading(true);
      const isAvailable = await checkEmailAvailability(email);
      setIsLoading(false);

      if (!isAvailable) {
        form.email.setErrors({ emailTaken: 'Email уже используется' });
      }
    }
  });

  return (
    <div>
      {isLoading && <Spinner />}
      <FormRenderer form={form} />
    </div>
  );
}
```

---

## Сравнение подходов

### Пример: Копирование адресов

**1. Helper методы (императивно)**

```typescript
const form = createAddressForm();

const cleanup = form.registrationAddress.linkFields(
  form.sameAsRegistration,
  form.residenceAddress
);

// Ручной cleanup
cleanup();
```

**2. Behavior Schema (декларативно)**

```typescript
const form = createAddressForm();

form.applyBehaviorSchema((path) => {
  copyFrom(
    path.residenceAddress,
    path.registrationAddress,
    { enabled: path.sameAsRegistration }
  );
});
```

**3. React Hooks (императивно в компоненте)**

```typescript
function AddressForm() {
  const form = useMemo(() => createAddressForm(), []);

  useCopyField(
    form.registrationAddress,
    form.residenceAddress,
    { enabled: form.sameAsRegistration.value }
  );

  return <FormRenderer form={form} />;
}
```

### Когда что использовать?

| Подход | Когда использовать |
|--------|-------------------|
| **Helper методы** | Императивная настройка, динамическое управление, вне React |
| **Behavior Schema** | Централизованная бизнес-логика, переиспользование схем |
| **React Hooks** | Локальная логика компонента, интеграция с React lifecycle |

---

## Best Practices

### 1. Используйте `useMemo` для создания форм

```typescript
// ✅ Правильно
function MyForm() {
  const form = useMemo(() => createMyForm(), []);
  // ...
}

// ❌ Неправильно
function MyForm() {
  const form = createMyForm(); // Создается заново при каждом рендере!
  // ...
}
```

### 2. Предпочитайте `useComputedFieldAuto` для сложных вычислений

```typescript
// ✅ Правильно - автоматическое отслеживание
useComputedFieldAuto(form.total, () => {
  const a = form.a.value.value;
  const b = form.b.value.value;
  const c = form.c.value.value;
  return a + b + c;
});

// ❌ Неправильно - легко забыть зависимость
useComputedField(
  form.total,
  () => {
    const a = form.a.value.value;
    const b = form.b.value.value;
    const c = form.c.value.value;
    return a + b + c;
  },
  [form.a.value.value, form.b.value.value] // Забыли c!
);
```

### 3. Используйте `immediate: false` для избежания лишних вызовов

```typescript
// ✅ Правильно - не вызывать API при mount
useWatchFieldWithOptions(
  form.email,
  async (email) => {
    await checkEmailAvailability(email);
  },
  { immediate: false }
);

// ❌ Неправильно - вызовет API сразу при mount
useWatchField(form.email, async (email) => {
  await checkEmailAvailability(email); // Вызовется с пустым email!
});
```

### 4. Комбинируйте хуки для сложной логики

```typescript
function ComplexForm() {
  const form = useMemo(() => createForm(), []);

  // Несколько хуков работают вместе
  useComputedFieldAuto(form.total, () => /* ... */);
  useEnableWhen(form.discount, () => /* ... */);
  useWatchField(form.country, async () => /* ... */);
  useCopyField(form.source, form.target, { /* ... */ });

  return <FormRenderer form={form} />;
}
```

### 5. Используйте `resetOnDisable` для безопасности

```typescript
// ✅ Правильно - сбрасываем значение при disable
useEnableWhen(
  form.propertyValue,
  () => form.loanType.value.value === 'mortgage',
  { resetOnDisable: true } // Важно!
);

// ❌ Неправильно - значение останется при disable
useEnableWhen(
  form.propertyValue,
  () => form.loanType.value.value === 'mortgage'
);
```

---

## Реализованные файлы

### Структура

```
src/lib/forms/hooks/
├── index.ts                    # Экспорт всех хуков
├── useFormEffect.ts            # Базовый эффект
├── useComputedField.ts         # Вычисляемые поля (2 варианта)
├── useCopyField.ts             # Копирование полей
├── useEnableWhen.ts            # Условное enable/disable (2 варианта)
└── useWatchField.ts            # Отслеживание изменений (2 варианта)
```

### Экспорты

```typescript
// src/lib/forms/hooks/index.ts
export { useFormEffect } from './useFormEffect';
export {
  useComputedField,
  useComputedFieldAuto,
} from './useComputedField';
export {
  useCopyField,
  type UseCopyFieldOptions,
} from './useCopyField';
export {
  useEnableWhen,
  useDisableWhen,
  type UseEnableWhenOptions,
} from './useEnableWhen';
export {
  useWatchField,
  useWatchFieldWithOptions,
} from './useWatchField';
```

---

## Примеры

Полные рабочие примеры доступны в файле:

- [src/examples/react-hooks-example.tsx](../src/examples/react-hooks-example.tsx)

Примеры включают:

1. **useFormEffect** - Логирование изменений формы
2. **useComputedField** - Вычисление total = price * quantity
3. **useComputedFieldAuto** - То же, но с auto-tracking
4. **useCopyField** - Копирование адресов
5. **useCopyField с transform** - Копирование с преобразованием в UPPERCASE
6. **useEnableWhen** - Условное включение для ипотеки
7. **useDisableWhen** - Условное выключение для админов
8. **useWatchField** - Динамическая загрузка городов
9. **useWatchFieldWithOptions** - Отслеживание без immediate
10. **Комбинирование хуков** - Комплексная форма продукта
11. **useEnableWhen с computed** - Использование computed signal
12. **Сложная условная логика** - Управление несколькими полями

---

## Технические детали

### Управление жизненным циклом

Все хуки используют `useEffect` для управления cleanup:

```typescript
useEffect(() => {
  const dispose = effect(() => {
    // Реактивная логика
  });

  return () => dispose(); // Cleanup при unmount
}, deps);
```

### Предотвращение циклических зависимостей

При записи значений используется `{ emitEvent: false }`:

```typescript
field.setValue(newValue, { emitEvent: false });
```

Это предотвращает бесконечные циклы при взаимосвязанных полях.

### Интеграция с @preact/signals

Все хуки используют `effect()` из `@preact/signals-react` для тонкого отслеживания зависимостей:

```typescript
import { effect } from '@preact/signals-react';

effect(() => {
  const value = field.value.value; // Автоматическое отслеживание
  callback(value);
});
```

---

## Следующие шаги

### Завершено ✅

1. ✅ Phase 1: Helper методы (watch, computeFrom, linkFields и т.д.)
2. ✅ Phase 2: Declarative Behavior Schema API (copyFrom, enableWhen и т.д.)
3. ✅ Phase 3: React Hooks (useFormEffect, useComputedField и т.д.)

### Рекомендации для дальнейшего развития

1. **Добавить тесты** - Unit тесты для всех хуков
2. **Миграция примеров** - Перевести CreditApplicationForm на новые хуки
3. **Документация** - Добавить примеры в README
4. **Performance** - Профилирование и оптимизация
5. **DevTools** - Инструменты для отладки reactive flows

---

## Заключение

Phase 3 завершен! Теперь доступны три подхода к работе с реактивными формами:

1. **Helper методы** - Императивный low-level API
2. **Behavior Schema** - Декларативный high-level API
3. **React Hooks** - Императивный API для React компонентов

Все три подхода совместимы и могут использоваться вместе в одном проекте.

**Дата реализации**: 2025-10-31
**Версия**: 1.0.0
