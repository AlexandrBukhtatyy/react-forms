# Анализ и предложения: Реактивное поведение форм с подпиской на изменения

**Дата**: 2025-10-29
**Задача**: Реализация механизма подписки на изменения полей формы для автоматизации поведения (копирование значений, условное enable/disable, вычисляемые поля, динамические справочники)

---

## Анализ текущей архитектуры

### Что уже реализовано

- ✅ **Signal-based реактивность** для состояния полей
- ✅ **Computed signals** для производных значений (`valid`, `invalid`, `shouldShowError`)
- ✅ **ValidationContext** с доступом к другим полям (`ctx.getField()`)
- ✅ **Условная валидация** через `applyWhen()`
- ✅ **Динамическое обновление пропсов** через `updateComponentProps()`
- ✅ **Поддержка вложенных путей** (`registrationAddress.city`)

### Что отсутствует

- ❌ Подписка на изменения полей (effect/watch)
- ❌ Автоматическое копирование значений между полями
- ❌ Условное enable/disable полей на основе других полей
- ❌ Каскадные изменения (при изменении A → обновить B)
- ❌ Автоматический пересчет вычисляемых полей

### Ключевые файлы для анализа

- [src/lib/forms/core/nodes/field-node.ts](../src/lib/forms/core/nodes/field-node.ts) - FieldNode с валидацией и состоянием
- [src/lib/forms/core/nodes/group-node.ts](../src/lib/forms/core/nodes/group-node.ts) - GroupNode с поддержкой вложенности
- [src/lib/forms/validators/schema-validators.ts](../src/lib/forms/validators/schema-validators.ts) - Валидаторы и apply()
- [src/domains/credit-applications/form/hooks/useLoadCreditApplication.ts](../src/domains/credit-applications/form/hooks/useLoadCreditApplication.ts) - Обновление справочников

---

## Требуемые сценарии

### Сценарий 1: Cross-field зависимости

**Описание**: Копирование адреса регистрации в адрес проживания при включении флага `sameAsRegistration`

**Текущая реализация**: Вручную в компоненте через условный рендеринг

**Желаемое поведение**:
```typescript
// При sameAsRegistration === true
// Автоматически копировать registrationAddress → residenceAddress
// При изменении registrationAddress → обновлять residenceAddress
```

### Сценарий 2: Условное отображение полей

**Описание**: Показывать поля `propertyValue` и `initialPayment` только для ипотеки (`loanType === 'mortgage'`)

**Текущая реализация**: Условный рендеринг в JSX

**Желаемое поведение**:
```typescript
// При loanType === 'mortgage' → enable поля
// При loanType !== 'mortgage' → disable поля
```

### Сценарий 3: Автозаполнение вычисляемых полей

**Описание**: Автоматический расчет минимального взноса (20% от стоимости недвижимости)

**Текущая реализация**: Отсутствует

**Желаемое поведение**:
```typescript
// При изменении propertyValue → пересчитать initialPayment
// initialPayment = propertyValue * 0.2
```

### Сценарий 4: Валидация с зависимостями

**Описание**: При изменении `propertyValue` перевалидировать связанное поле `initialPayment`

**Текущая реализация**: ValidationContext позволяет читать другие поля, но не реагирует автоматически

**Желаемое поведение**:
```typescript
// При изменении propertyValue → автоматически перевалидировать initialPayment
// Если initialPayment < propertyValue * 0.2 → показать ошибку
```

### Сценарий 5: Динамическое обновление справочников

**Описание**: При изменении страны загружать список городов и обновлять опции в Select

**Текущая реализация**: Частично в `useLoadCreditApplication` (только при первой загрузке)

**Желаемое поведение**:
```typescript
// При изменении registrationAddress.country → загрузить города
// Обновить componentProps.options в registrationAddress.city
// Сбросить значение registrationAddress.city
```

---

## Вариант 1: Декларативный подход через Schema Extensions

### Концепция

Расширить текущий Validation Schema API новыми декларативными функциями для описания поведения форм. Логика выполняется автоматически при применении схемы.

### API использования

```typescript
import {
  copyFrom,
  computeFrom,
  enableWhen,
  watchField
} from '@/lib/forms/validators';

const behaviorSchema: ValidationSchemaFn<CreditApplicationForm> = (path) => {

  // 1. Cross-field зависимости: копирование значений
  copyFrom(
    path.residenceAddress,
    path.registrationAddress,
    {
      when: (form) => form.sameAsRegistration === true,
      fields: 'all' // или ['city', 'street', 'zipCode']
    }
  );

  // 2. Условное отображение/enable полей
  enableWhen(path.propertyValue, (form) => form.loanType === 'mortgage');
  enableWhen(path.initialPayment, (form) => form.loanType === 'mortgage');

  enableWhen(path.carBrand, (form) => form.loanType === 'auto');
  enableWhen(path.carModel, (form) => form.loanType === 'auto');

  // 3. Автозаполнение и каскадные изменения
  computeFrom(
    path.initialPayment,
    [path.propertyValue],
    ({ propertyValue }) => {
      // Минимальный взнос - 20% от стоимости
      return propertyValue ? propertyValue * 0.2 : null;
    },
    { trigger: 'change', debounce: 300 }
  );

  // 4. Динамическое обновление справочников
  watchField(path.registrationAddress.country, async (value, ctx) => {
    const cities = await fetchCitiesByCountry(value);
    ctx.updateComponentProps(path.registrationAddress.city, {
      options: cities
    });
  });

  // 5. Комплексный сценарий: пересчет ежемесячного платежа
  computeFrom(
    path.monthlyPayment, // вычисляемое поле
    [path.loanAmount, path.loanTerm, path.loanType],
    ({ loanAmount, loanTerm, loanType }) => {
      if (!loanAmount || !loanTerm) return null;

      const rate = loanType === 'mortgage' ? 0.08 : 0.12;
      const monthlyRate = rate / 12;
      const payment =
        (loanAmount * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -loanTerm));

      return Math.round(payment);
    },
    { trigger: 'change', debounce: 500 }
  );
};

// Применение схемы
form.applyBehaviorSchema(behaviorSchema);
```

### Где размещается логика

**В FieldNode/GroupNode:**
- Новый метод `applyBehaviorSchema(schema)` аналогично `applyValidationSchema()`
- Хранение эффектов в `BehaviorRegistry` (аналог `ValidationRegistry`)

**Новые модули:**
```
src/lib/forms/behaviors/
  ├── behavior-registry.ts      # Регистрация эффектов
  ├── behavior-context.ts       # Контекст для эффектов
  ├── schema-behaviors.ts       # copyFrom, computeFrom, enableWhen, watchField
  └── index.ts
```

### Как работает подписка

1. **Инициализация**: При вызове `applyBehaviorSchema()`:
   ```typescript
   // В GroupNode.ts
   applyBehaviorSchema(schemaFn: BehaviorSchemaFn<T>): void {
     BehaviorRegistry.beginRegistration();
     const path = createFieldPath<T>();
     schemaFn(path);
     const behaviors = BehaviorRegistry.endRegistration(this);

     // Подписка на изменения через effect
     this.subscribeToEffects(behaviors);
   }
   ```

2. **Подписка через Preact effect**:
   ```typescript
   import { effect } from '@preact/signals-react';

   private subscribeToEffects(behaviors: BehaviorRegistration[]): void {
     behaviors.forEach(behavior => {
       if (behavior.type === 'watch') {
         // Подписка на изменение поля
         effect(() => {
           const value = behavior.sourceField.value.value; // track
           behavior.callback(value, behavior.context);
         });
       }

       if (behavior.type === 'compute') {
         // Подписка на массив полей
         effect(() => {
           const values = behavior.sourceFields.map(f => f.value.value);
           const result = behavior.computeFn(...values);
           behavior.targetField.setValue(result, { emitEvent: false });
         });
       }
     });
   }
   ```

3. **Auto-cleanup**: Preact автоматически очищает подписки при unmount

### Преимущества

- ✅ **Декларативность**: поведение описывается в одном месте вместе с валидацией
- ✅ **Типобезопасность**: TypeScript выводит типы через FieldPath
- ✅ **Консистентность**: API похож на существующий ValidationSchema
- ✅ **Удобство**: не нужно писать useEffect вручную в компонентах
- ✅ **Централизация**: вся логика формы в одном файле

### Недостатки

- ❌ **Сложность реализации**: нужен новый registry и effect management
- ❌ **Debugging**: сложнее отследить, откуда пришло изменение
- ❌ **Ограниченность**: декларативный API может быть недостаточно гибким для сложных кейсов
- ❌ **Производительность**: много автоматических подписок могут замедлить форму

### Совместимость с текущей архитектурой

✅ **Полностью совместимо**:
- Использует существующую инфраструктуру (FieldPath, Registry pattern)
- Работает с текущими Signals
- Не ломает API форм

---

## Вариант 2: Императивный подход через Hooks/Effects

### Концепция

Использовать React hooks и композицию для управления поведением формы. Логика размещается в кастомных хуках, которые подписываются на изменения через `computed` и `effect`.

### API использования

```typescript
import { useFormEffect, useComputedField, useCopyField } from '@/lib/forms/hooks';

function CreditApplicationForm() {
  const form = useMemo(() => createCreditApplicationForm(), []);

  // 1. Cross-field зависимости: копирование адреса
  useCopyField(
    form.registrationAddress,
    form.residenceAddress,
    {
      enabled: computed(() => form.sameAsRegistration.value.value),
      fields: 'all'
    }
  );

  // 2. Условное enable/disable полей
  useFormEffect(() => {
    const isMortgage = form.loanType.value.value === 'mortgage';

    if (isMortgage) {
      form.propertyValue.enable();
      form.initialPayment.enable();
    } else {
      form.propertyValue.disable();
      form.initialPayment.disable();
    }
  }, [form.loanType.value.value]);

  // 3. Автозаполнение: минимальный взнос
  useComputedField(
    form.initialPayment,
    () => {
      const propertyValue = form.propertyValue.value.value;
      return propertyValue ? propertyValue * 0.2 : null;
    },
    [form.propertyValue.value.value]
  );

  // 4. Динамическое обновление справочников
  useFormEffect(async () => {
    const country = form.registrationAddress.country.value.value;

    if (country) {
      const cities = await fetchCitiesByCountry(country);
      form.registrationAddress.city.updateComponentProps({
        options: cities
      });
    }
  }, [form.registrationAddress.country.value.value]);

  // 5. Пересчет ежемесячного платежа
  useComputedField(
    form.monthlyPayment,
    () => {
      const { loanAmount, loanTerm, loanType } = form.value.value;

      if (!loanAmount || !loanTerm) return null;

      const rate = loanType === 'mortgage' ? 0.08 : 0.12;
      const monthlyRate = rate / 12;
      const payment =
        (loanAmount * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -loanTerm));

      return Math.round(payment);
    },
    [
      form.loanAmount.value.value,
      form.loanTerm.value.value,
      form.loanType.value.value
    ]
  );

  return <div>...</div>;
}
```

### Где размещается логика

**В React компонентах**:
- Логика размещается непосредственно в компонентах через хуки
- Можно выносить в кастомные хуки для переиспользования

**Новые хуки:**
```
src/lib/forms/hooks/
  ├── useFormEffect.ts          # Эффект с подпиской на signals
  ├── useComputedField.ts       # Вычисляемое поле
  ├── useCopyField.ts           # Копирование между полями
  ├── useEnableWhen.ts          # Условное enable/disable
  └── index.ts
```

### Как работает подписка

1. **useFormEffect** - обертка над useEffect для работы с signals:
   ```typescript
   import { useEffect } from 'react';
   import { effect } from '@preact/signals-react';

   export function useFormEffect(
     callback: () => void | (() => void),
     deps?: any[]
   ): void {
     useEffect(() => {
       // Создаем effect из @preact/signals
       const dispose = effect(() => {
         callback();
       });

       return () => dispose(); // cleanup
     }, deps);
   }
   ```

2. **useComputedField** - автоматическое обновление поля:
   ```typescript
   export function useComputedField<T>(
     field: FieldNode<T>,
     computeFn: () => T,
     deps: any[]
   ): void {
     useEffect(() => {
       const dispose = effect(() => {
         const value = computeFn();
         field.setValue(value, { emitEvent: false });
       });

       return () => dispose();
     }, deps);
   }
   ```

3. **useCopyField** - копирование значений между группами:
   ```typescript
   export function useCopyField<T extends Record<string, any>>(
     source: GroupNode<T>,
     target: GroupNode<T>,
     options: { enabled: ReadonlySignal<boolean>; fields: keyof T[] | 'all' }
   ): void {
     useEffect(() => {
       const dispose = effect(() => {
         if (!options.enabled.value) return;

         const sourceValue = source.getValue();
         const fieldsToСopy =
           options.fields === 'all'
             ? Object.keys(sourceValue)
             : options.fields;

         const patch: Partial<T> = {};
         fieldsToСopy.forEach(key => {
           patch[key] = sourceValue[key];
         });

         target.patchValue(patch);
       });

       return () => dispose();
     }, [source, target, options.enabled]);
   }
   ```

### Преимущества

- ✅ **Простота**: стандартный React подход, знакомый всем
- ✅ **Гибкость**: можно написать любую логику, не ограничены API
- ✅ **Debugging**: легко отследить через React DevTools
- ✅ **Изоляция**: логика размещается рядом с UI, легко понять связь
- ✅ **Переиспользование**: можно создавать кастомные хуки для типовых сценариев

### Недостатки

- ❌ **Распыление логики**: поведение формы размазано по компонентам
- ❌ **Дублирование**: одинаковые паттерны нужно писать в каждой форме
- ❌ **React-зависимость**: логика привязана к React компонентам
- ❌ **Тестирование**: сложнее тестировать логику форм отдельно от компонентов

### Совместимость с текущей архитектурой

✅ **Полностью совместимо**:
- Использует существующие Signal API
- Не требует изменений в FieldNode/GroupNode
- Добавляет только новые хуки

---

## Вариант 3: Гибридный подход (рекомендуется)

### Концепция

Комбинация декларативного и императивного подходов:
- **Типовые паттерны** описываются декларативно в схеме
- **Кастомная логика** пишется императивно через хуки
- Добавить **методы-помощники** прямо в FieldNode/GroupNode для частых операций

### API использования

#### 3.1. Декларативно для типовых паттернов

```typescript
// В validation-файле рядом с валидацией
const creditApplicationBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  // Копирование адреса
  copyFrom(path.residenceAddress, path.registrationAddress, {
    when: (form) => form.sameAsRegistration === true
  });

  // Условное отображение
  enableWhen(path.propertyValue, (form) => form.loanType === 'mortgage');
  enableWhen(path.initialPayment, (form) => form.loanType === 'mortgage');

  // Минимальный взнос - 20%
  computeFrom(path.initialPayment, [path.propertyValue],
    ({ propertyValue }) => propertyValue ? propertyValue * 0.2 : null
  );
};

form.applyBehaviorSchema(creditApplicationBehavior);
```

#### 3.2. Императивно для кастомной логики

```typescript
function CreditApplicationForm() {
  const form = useMemo(() => {
    const f = createCreditApplicationForm();
    f.applyBehaviorSchema(creditApplicationBehavior);
    return f;
  }, []);

  // Кастомная логика: динамическая загрузка справочников
  useFormEffect(async () => {
    const country = form.registrationAddress.country.value.value;

    if (country) {
      const [cities, regions] = await Promise.all([
        fetchCitiesByCountry(country),
        fetchRegionsByCountry(country)
      ]);

      form.registrationAddress.city.updateComponentProps({
        options: cities
      });

      // Автозаполнение региона по первому городу
      if (cities.length > 0) {
        form.registrationAddress.region.setValue(regions[0].value);
      }
    }
  }, [form.registrationAddress.country.value.value]);

  return <div>...</div>;
}
```

#### 3.3. Методы-помощники в FieldNode/GroupNode

```typescript
// Добавить в FieldNode
class FieldNode<T> {
  // ... существующий код

  /**
   * Подписка на изменения поля
   * Возвращает функцию отписки
   */
  watch(callback: (value: T) => void | Promise<void>): () => void {
    return effect(() => {
      const value = this.value.value; // track changes
      callback(value);
    });
  }

  /**
   * Вычисляемое значение из других полей
   */
  computeFrom<S extends any[]>(
    sources: ReadonlySignal<S>,
    computeFn: (...values: S) => T
  ): () => void {
    return effect(() => {
      const result = computeFn(...sources.value);
      this.setValue(result, { emitEvent: false });
    });
  }
}

// Добавить в GroupNode
class GroupNode<T> {
  // ... существующий код

  /**
   * Связать два поля: при изменении source → обновить target
   */
  linkFields<K1 extends keyof T, K2 extends keyof T>(
    sourceKey: K1,
    targetKey: K2,
    transform?: (value: T[K1]) => T[K2]
  ): () => void {
    const source = this.fields.get(sourceKey);
    const target = this.fields.get(targetKey);

    if (!source || !target) return () => {};

    return effect(() => {
      const value = source.value.value;
      const transformed = transform ? transform(value) : value;
      target.setValue(transformed as any, { emitEvent: false });
    });
  }
}

// Использование методов-помощников
const unsubscribe = form.propertyValue.watch(async (value) => {
  // Обновить подсказку о ежемесячном платеже
  const payment = calculatePayment(value, form.loanTerm.value.value);
  console.log('Ежемесячный платеж:', payment);
});

// Связать поля
const dispose = form.linkFields('propertyValue', 'initialPayment',
  (propertyValue) => propertyValue ? propertyValue * 0.2 : null
);

// Cleanup
useEffect(() => dispose, []);
```

### Где размещается логика

1. **Декларативные схемы**: в `validation/` рядом с валидацией
2. **Хуки**: в компонентах для кастомной логики
3. **Методы-помощники**: прямо в FieldNode/GroupNode для удобства

**Структура:**
```
src/lib/forms/
  ├── behaviors/              # Декларативный API
  │   ├── schema-behaviors.ts
  │   └── behavior-registry.ts
  ├── hooks/                  # Императивный API
  │   ├── useFormEffect.ts
  │   ├── useComputedField.ts
  │   └── useCopyField.ts
  └── core/nodes/
      ├── field-node.ts       # +watch(), +computeFrom()
      └── group-node.ts       # +linkFields(), +applyBehaviorSchema()
```

### Как работает подписка

- **Декларативно**: через effect при применении схемы (как в Варианте 1)
- **Императивно**: через хуки в компонентах (как в Варианте 2)
- **Методы-помощники**: возвращают dispose функцию для cleanup

### Преимущества

- ✅ **Лучшее из обоих миров**: декларативность + гибкость
- ✅ **Прогрессивное усложнение**: простые кейсы решаются декларативно, сложные - императивно
- ✅ **Удобство**: методы-помощники упрощают частые операции
- ✅ **Переиспользование**: типовые паттерны переиспользуются через схему
- ✅ **Тестируемость**: декларативную часть легко тестировать без React

### Недостатки

- ❌ **Больше API surface**: нужно знать 3 способа делать одно и то же
- ❌ **Потенциальная путаница**: когда использовать декларативный, когда императивный?
- ❌ **Сложность реализации**: нужно реализовать оба подхода

### Совместимость с текущей архитектурой

✅ **Полностью совместимо**:
- Расширяет существующие классы новыми методами
- Добавляет новые модули без ломающих изменений
- Использует тот же паттерн, что и ValidationSchema

---

## Сравнительная таблица

| Критерий | Вариант 1 (Декларативный) | Вариант 2 (Императивный) | Вариант 3 (Гибридный) |
|----------|---------------------------|--------------------------|----------------------|
| **Простота использования** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Гибкость** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Типобезопасность** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Debugging** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Переиспользование** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Тестируемость** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Производительность** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Совместимость** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Сложность реализации** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## Интеграция с ValidationSchema API

Все три варианта могут интегрироваться с существующим Validation Schema:

```typescript
// Применение валидации и поведения в одном месте
form.applyValidationSchema(creditApplicationValidation);
form.applyBehaviorSchema(creditApplicationBehavior); // Вариант 1 или 3

// Или объединить в один метод
form.applySchema({
  validation: creditApplicationValidation,
  behavior: creditApplicationBehavior
});
```

---

## Избежание циклических зависимостей

### Проблема

Поле A зависит от B, а B зависит от A → бесконечный цикл.

### Решение 1: Граф зависимостей

```typescript
class DependencyGraph {
  detectCycle(behaviors: BehaviorRegistration[]): string[] {
    // Алгоритм поиска циклов
    // Бросить ошибку в dev mode если цикл найден
  }
}

// При применении схемы
if (import.meta.env.DEV) {
  const cycles = DependencyGraph.detectCycle(behaviors);
  if (cycles.length > 0) {
    throw new Error(`Циклические зависимости: ${cycles.join(' -> ')}`);
  }
}
```

### Решение 2: Флаг emitEvent: false

```typescript
// При программном обновлении - не триггерить валидацию/эффекты
target.setValue(value, { emitEvent: false });
```

### Решение 3: Guard в эффектах

```typescript
let isUpdating = false;

effect(() => {
  if (isUpdating) return;

  isUpdating = true;
  // обновления
  isUpdating = false;
});
```

---

## Тестирование

### Декларативный подход (Вариант 1, 3)

```typescript
describe('CreditApplicationForm behavior', () => {
  it('should copy registration address to residence when sameAsRegistration is true', () => {
    const form = createCreditApplicationForm();
    form.applyBehaviorSchema(creditApplicationBehavior);

    // Устанавливаем адрес регистрации
    form.registrationAddress.patchValue({
      city: 'Moscow',
      street: 'Tverskaya',
      zipCode: '101000'
    });

    // Включаем флаг
    form.sameAsRegistration.setValue(true);

    // Проверяем, что адрес скопирован
    expect(form.residenceAddress.city.value.value).toBe('Moscow');
    expect(form.residenceAddress.street.value.value).toBe('Tverskaya');
  });

  it('should enable propertyValue when loanType is mortgage', () => {
    const form = createCreditApplicationForm();
    form.applyBehaviorSchema(creditApplicationBehavior);

    form.loanType.setValue('mortgage');

    expect(form.propertyValue.status.value).toBe('valid'); // not disabled

    form.loanType.setValue('consumer');

    expect(form.propertyValue.status.value).toBe('disabled');
  });
});
```

### Императивный подход (Вариант 2)

```typescript
import { renderHook } from '@testing-library/react';

describe('useComputedField', () => {
  it('should recompute field when dependencies change', () => {
    const form = createCreditApplicationForm();

    renderHook(() => {
      useComputedField(
        form.initialPayment,
        () => {
          const value = form.propertyValue.value.value;
          return value ? value * 0.2 : null;
        },
        [form.propertyValue.value.value]
      );
    });

    form.propertyValue.setValue(1000000);

    expect(form.initialPayment.value.value).toBe(200000);
  });
});
```

---

## Примеры для CreditApplicationForm

### Сценарий 1: Копирование адреса регистрации в адрес проживания

**Текущее состояние**: вручную копируется в компоненте

**С Вариантом 3 (гибридный)**:
```typescript
// В credit-application-behavior.ts
copyFrom(path.residenceAddress, path.registrationAddress, {
  when: (form) => form.sameAsRegistration === true,
  fields: 'all'
});
```

### Сценарий 2: Условное отображение полей ипотеки

**Текущее состояние**: условный рендер в JSX

**С Вариантом 3**:
```typescript
// В схеме
enableWhen(path.propertyValue, (form) => form.loanType === 'mortgage');
enableWhen(path.initialPayment, (form) => form.loanType === 'mortgage');

// В компоненте
{form.propertyValue.status.value !== 'disabled' && (
  <FormField control={form.propertyValue} />
)}
```

### Сценарий 3: Автозаполнение минимального взноса

**Новая функциональность**:
```typescript
// В схеме
computeFrom(
  path.initialPayment,
  [path.propertyValue],
  ({ propertyValue }) => propertyValue ? propertyValue * 0.2 : null,
  { trigger: 'change', debounce: 300 }
);
```

### Сценарий 4: Валидация с зависимостями

**Текущее состояние**: уже реализовано через validateTree

**Дополнительно**: автоматически перевалидировать зависимые поля
```typescript
// При изменении propertyValue → перевалидировать initialPayment
watchField(path.propertyValue, (value, ctx) => {
  ctx.validateField(path.initialPayment);
});
```

### Сценарий 5: Динамическое обновление справочников

**Текущее состояние**: реализовано в useLoadCreditApplication

**Улучшение**: автоматическая загрузка при изменении страны
```typescript
// В компоненте (кастомная логика)
useFormEffect(async () => {
  const country = form.registrationAddress.country.value.value;

  if (country) {
    const cities = await fetchCitiesByCountry(country);
    form.registrationAddress.city.updateComponentProps({
      options: cities
    });

    // Сброс города при смене страны
    form.registrationAddress.city.reset();
  }
}, [form.registrationAddress.country.value.value]);
```

---

## Сложный сценарий: Массивы форм с каскадными изменениями

**Задача из README.md**:
> "обновляем поле из одного массива что то меняется в других полях других массивов"

### Пример: При изменении суммы существующих кредитов → пересчитать максимальную сумму нового кредита

```typescript
// Вариант 1: Декларативно
watchField(path.existingLoans, async (loans, ctx) => {
  // Суммируем все существующие кредиты
  const totalExistingDebt = loans.reduce((sum, loan) => {
    return sum + (loan.remainingAmount || 0);
  }, 0);

  // Получаем доход
  const monthlyIncome = ctx.getField('monthlyIncome').value;

  // Максимальная сумма кредита = 50% дохода - существующие платежи
  const maxLoanAmount = (monthlyIncome * 0.5 * 12 * 10) - totalExistingDebt;

  // Обновляем подсказку и валидацию
  ctx.updateComponentProps(path.loanAmount, {
    max: maxLoanAmount,
    helperText: `Максимальная сумма с учетом существующих кредитов: ${maxLoanAmount} ₽`
  });

  // Если текущая сумма превышает максимум → установить ошибку
  const currentAmount = ctx.getField('loanAmount').value;
  if (currentAmount > maxLoanAmount) {
    ctx.setErrors(path.loanAmount, [{
      code: 'maxLoanAmount',
      message: `Сумма кредита не может превышать ${maxLoanAmount} ₽`
    }]);
  }
});

// Вариант 2: Императивно через хук
function CreditApplicationForm() {
  const form = useMemo(() => createCreditApplicationForm(), []);

  // Подписка на изменения массива existingLoans
  useFormEffect(() => {
    const loans = form.existingLoans.value.value;
    const totalDebt = loans.reduce((sum, loan) =>
      sum + (loan.remainingAmount || 0), 0
    );

    const monthlyIncome = form.monthlyIncome.value.value;
    const maxLoanAmount = (monthlyIncome * 0.5 * 12 * 10) - totalDebt;

    form.loanAmount.updateComponentProps({
      max: maxLoanAmount,
      helperText: `Максимум: ${maxLoanAmount} ₽`
    });
  }, [
    form.existingLoans.length.value, // отслеживаем длину массива
    form.monthlyIncome.value.value
  ]);

  // Дополнительно: подписка на изменения внутри массива
  form.existingLoans.forEach((loan, index) => {
    useFormEffect(() => {
      const remainingAmount = loan.remainingAmount.value.value;
      // Пересчитать общую сумму при изменении любого кредита
      // ...
    }, [loan.remainingAmount.value.value]);
  });

  return <div>...</div>;
}

// Вариант 3: Метод-помощник в ArrayNode
class ArrayNode<T> {
  /**
   * Подписка на изменения любого элемента массива
   */
  watchItems<K extends keyof T>(
    fieldKey: K,
    callback: (values: T[K][], index: number) => void
  ): () => void {
    return effect(() => {
      this.controls.forEach((item, index) => {
        const field = item.fields.get(fieldKey);
        if (field) {
          field.value.value; // track
        }
      });

      const values = this.controls.map(item => {
        const field = item.fields.get(fieldKey);
        return field?.value.value;
      });

      callback(values, -1);
    });
  }
}

// Использование
const dispose = form.existingLoans.watchItems('remainingAmount', (amounts) => {
  const totalDebt = amounts.reduce((sum, amount) => sum + (amount || 0), 0);
  // Обновить максимальную сумму кредита
  const maxLoanAmount = calculateMaxLoan(totalDebt);
  form.loanAmount.updateComponentProps({ max: maxLoanAmount });
});
```

---

## Рекомендация

**Вариант 3 (Гибридный)** является оптимальным решением:

### Фаза 1: Реализовать методы-помощники

**Приоритет**: Высокий
**Сложность**: Низкая
**Польза**: Немедленная

Добавить в `FieldNode`:
- ✅ `watch(callback)` - подписка на изменения
- ✅ `computeFrom(sources, computeFn)` - вычисляемое значение

Добавить в `GroupNode`:
- ✅ `linkFields(source, target, transform?)` - связь полей
- ✅ `watchField(fieldPath, callback)` - подписка на вложенное поле

Добавить в `ArrayNode`:
- ✅ `watchItems(fieldKey, callback)` - подписка на элементы массива
- ✅ `watchLength(callback)` - подписка на изменение длины

**Объем работы**: ~100-200 строк кода

### Фаза 2: Добавить декларативный API

**Приоритет**: Средний
**Сложность**: Средняя
**Польза**: Для переиспользования паттернов

Реализовать:
- ✅ `copyFrom(target, source, options)` - копирование значений
- ✅ `enableWhen(field, condition)` - условное enable/disable
- ✅ `computeFrom(target, sources, computeFn)` - вычисляемые поля
- ✅ `watchField(field, callback)` - подписка с контекстом
- ✅ `BehaviorRegistry` - регистрация и применение эффектов
- ✅ `applyBehaviorSchema(schema)` - метод в GroupNode

**Объем работы**: ~500-700 строк кода

### Фаза 3: Опционально добавить хуки

**Приоритет**: Низкий
**Сложность**: Низкая
**Польза**: Для React-разработчиков

Реализовать:
- ✅ `useFormEffect(callback, deps)` - обертка над effect
- ✅ `useComputedField(field, computeFn, deps)` - вычисляемое поле
- ✅ `useCopyField(source, target, options)` - копирование через хук
- ✅ `useEnableWhen(field, condition)` - условное enable через хук

**Объем работы**: ~200-300 строк кода

---

## Итого

**Общий объем работы**: ~800-1200 строк нового кода для полноценного решения всех 5 сценариев.

**Преимущества подхода**:
- ✅ Прогрессивная реализация (можно внедрять по фазам)
- ✅ Полная обратная совместимость
- ✅ Гибкость (декларативно + императивно)
- ✅ Типобезопасность на всех уровнях
- ✅ Минимум breaking changes

**Следующие шаги**:
1. Начать с Фазы 1 (методы-помощники) - быстрая польза
2. Протестировать на CreditApplicationForm
3. Собрать feedback от использования
4. Перейти к Фазе 2 если нужна декларативность
5. Фаза 3 - опционально для удобства React-разработчиков
