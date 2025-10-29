# Декларативный Behavior Schema API - Полное руководство и примеры

**Дата**: 2025-10-29
**Вариант**: Вариант 1 - Декларативный подход через Schema Extensions

---

## Содержание

1. [Обзор и философия](#обзор-и-философия)
2. [API Reference](#api-reference)
3. [Базовые примеры](#базовые-примеры)
4. [Продвинутые примеры](#продвинутые-примеры)
5. [Дополнительные сценарии](#дополнительные-сценарии)
6. [Реализация API](#реализация-api)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Обзор и философия

### Что такое Behavior Schema?

**Behavior Schema** — это декларативный способ описания реактивного поведения формы через схему, аналогичную Validation Schema. Вместо написания императивных `useEffect` хуков в компонентах, вы описываете **что** должно происходить, а библиотека автоматически управляет подписками и обновлениями.

### Ключевые принципы

1. **Декларативность**: Описываете поведение, а не реализацию
2. **Централизация**: Вся логика в одном месте
3. **Типобезопасность**: TypeScript выводит типы через FieldPath
4. **Автоматизация**: Подписки и cleanup управляются автоматически
5. **Композиция**: Схемы можно комбинировать и переиспользовать

### Когда использовать?

✅ **Используйте Behavior Schema для:**
- Копирования значений между полями
- Условного enable/disable полей
- Вычисляемых полей с зависимостями
- Динамической загрузки справочников
- Автоматической валидации при изменениях
- Синхронизации массивов форм

❌ **Не используйте для:**
- Уникальной бизнес-логики конкретного компонента
- Логики с внешними побочными эффектами (навигация, уведомления)
- Сложной асинхронной оркестрации

---

## API Reference

### copyFrom

**Описание**: Копирует значения из одного поля/группы в другое при выполнении условия.

**Сигнатура**:
```typescript
function copyFrom<TForm, TSource, TTarget>(
  target: FieldPathNode<TForm, TTarget>,
  source: FieldPathNode<TForm, TSource>,
  options?: {
    when?: (form: TForm) => boolean;
    fields?: keyof TSource[] | 'all';
    transform?: (value: TSource) => TTarget;
    debounce?: number;
  }
): void
```

**Параметры**:
- `target` - куда копировать
- `source` - откуда копировать
- `options.when` - условие копирования (опционально)
- `options.fields` - какие поля копировать для групп (по умолчанию 'all')
- `options.transform` - функция преобразования значения (опционально)
- `options.debounce` - задержка в мс (опционально)

---

### enableWhen / disableWhen

**Описание**: Условное включение/выключение поля на основе значений других полей.

**Сигнатура**:
```typescript
function enableWhen<TForm>(
  field: FieldPathNode<TForm, any>,
  condition: (form: TForm) => boolean,
  options?: {
    resetOnDisable?: boolean;
    debounce?: number;
  }
): void

function disableWhen<TForm>(
  field: FieldPathNode<TForm, any>,
  condition: (form: TForm) => boolean,
  options?: {
    resetOnDisable?: boolean;
    debounce?: number;
  }
): void
```

**Параметры**:
- `field` - поле для включения/выключения
- `condition` - функция условия
- `options.resetOnDisable` - сбросить значение при disable (по умолчанию false)
- `options.debounce` - задержка в мс (опционально)

---

### showWhen / hideWhen

**Описание**: Условное отображение/скрытие поля (устанавливает hidden флаг).

**Сигнатура**:
```typescript
function showWhen<TForm>(
  field: FieldPathNode<TForm, any>,
  condition: (form: TForm) => boolean
): void

function hideWhen<TForm>(
  field: FieldPathNode<TForm, any>,
  condition: (form: TForm) => boolean
): void
```

---

### computeFrom

**Описание**: Автоматически вычисляет значение поля на основе других полей.

**Сигнатура**:
```typescript
function computeFrom<TForm, TTarget, TDeps extends any[]>(
  target: FieldPathNode<TForm, TTarget>,
  sources: FieldPathNode<TForm, any>[],
  computeFn: (values: { [K: string]: any }) => TTarget,
  options?: {
    trigger?: 'change' | 'blur';
    debounce?: number;
    condition?: (form: TForm) => boolean;
  }
): void
```

**Параметры**:
- `target` - поле для записи результата
- `sources` - массив полей-зависимостей
- `computeFn` - функция вычисления
- `options.trigger` - когда вычислять (по умолчанию 'change')
- `options.debounce` - задержка в мс (опционально)
- `options.condition` - условие применения (опционально)

---

### watchField

**Описание**: Выполняет callback при изменении поля.

**Сигнатура**:
```typescript
function watchField<TForm, TField>(
  field: FieldPathNode<TForm, TField>,
  callback: (value: TField, ctx: BehaviorContext<TForm>) => void | Promise<void>,
  options?: {
    debounce?: number;
    immediate?: boolean;
  }
): void
```

**Параметры**:
- `field` - поле для отслеживания
- `callback` - функция обратного вызова
- `options.debounce` - задержка в мс (опционально)
- `options.immediate` - вызвать сразу при инициализации (по умолчанию false)

---

### revalidateWhen

**Описание**: Перевалидирует поле при изменении других полей.

**Сигнатура**:
```typescript
function revalidateWhen<TForm>(
  target: FieldPathNode<TForm, any>,
  triggers: FieldPathNode<TForm, any>[],
  options?: {
    debounce?: number;
  }
): void
```

**Параметры**:
- `target` - поле для перевалидации
- `triggers` - поля-триггеры
- `options.debounce` - задержка в мс (опционально)

---

### syncFields

**Описание**: Двусторонняя синхронизация двух полей.

**Сигнатура**:
```typescript
function syncFields<TForm, T>(
  field1: FieldPathNode<TForm, T>,
  field2: FieldPathNode<TForm, T>,
  options?: {
    transform?: (value: T) => T;
    debounce?: number;
  }
): void
```

---

### BehaviorContext

**Интерфейс контекста** для callback функций:

```typescript
interface BehaviorContext<TForm> {
  // Получить значение поля
  getField<K extends keyof TForm>(path: string): any;

  // Установить значение поля
  setField<K extends keyof TForm>(path: string, value: any): void;

  // Обновить componentProps
  updateComponentProps(field: FieldPathNode<TForm, any>, props: Record<string, any>): void;

  // Перевалидировать поле
  validateField(field: FieldPathNode<TForm, any>): Promise<boolean>;

  // Установить ошибки
  setErrors(field: FieldPathNode<TForm, any>, errors: ValidationError[]): void;

  // Очистить ошибки
  clearErrors(field: FieldPathNode<TForm, any>): void;

  // Получить всю форму
  getForm(): TForm;
}
```

---

## Базовые примеры

### Пример 1: Копирование адреса регистрации в адрес проживания

**Задача**: При включении флага `sameAsRegistration` автоматически копировать адрес регистрации в адрес проживания.

```typescript
import { copyFrom } from '@/lib/forms/behaviors';

const addressBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  // Копирование всех полей адреса
  copyFrom(
    path.residenceAddress,
    path.registrationAddress,
    {
      when: (form) => form.sameAsRegistration === true,
      fields: 'all'
    }
  );
};

// Применение
form.applyBehaviorSchema(addressBehavior);

// Использование
form.registrationAddress.patchValue({
  city: 'Москва',
  street: 'Тверская',
  zipCode: '101000'
});

form.sameAsRegistration.setValue(true);

// ✅ residenceAddress автоматически заполнен:
// city: 'Москва', street: 'Тверская', zipCode: '101000'
```

**Вариант с выборочным копированием:**
```typescript
copyFrom(
  path.residenceAddress,
  path.registrationAddress,
  {
    when: (form) => form.sameAsRegistration === true,
    fields: ['city', 'street', 'zipCode'], // копируем только эти поля
  }
);
```

**Вариант с трансформацией:**
```typescript
copyFrom(
  path.residenceAddress.zipCode,
  path.registrationAddress.zipCode,
  {
    when: (form) => form.sameAsRegistration === true,
    transform: (zipCode) => {
      // Добавить суффикс к индексу
      return zipCode + '-COPY';
    }
  }
);
```

---

### Пример 2: Условное отображение полей ипотеки

**Задача**: Показывать поля `propertyValue` и `initialPayment` только когда `loanType === 'mortgage'`.

```typescript
const mortgageFieldsBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  // Включить поля для ипотеки
  enableWhen(path.propertyValue, (form) => form.loanType === 'mortgage', {
    resetOnDisable: true // сбросить значение при disable
  });

  enableWhen(path.initialPayment, (form) => form.loanType === 'mortgage', {
    resetOnDisable: true
  });

  // Включить поля для автокредита
  enableWhen(path.carBrand, (form) => form.loanType === 'auto');
  enableWhen(path.carModel, (form) => form.loanType === 'auto');
  enableWhen(path.carYear, (form) => form.loanType === 'auto');
  enableWhen(path.carPrice, (form) => form.loanType === 'auto');
};

// В JSX используем статус поля
{form.propertyValue.status.value !== 'disabled' && (
  <FormField control={form.propertyValue} />
)}
```

**Альтернатива - showWhen/hideWhen:**
```typescript
// Устанавливает hidden флаг вместо disabled
showWhen(path.propertyValue, (form) => form.loanType === 'mortgage');
showWhen(path.initialPayment, (form) => form.loanType === 'mortgage');

// В JSX
{!form.propertyValue.hidden?.value && (
  <FormField control={form.propertyValue} />
)}
```

---

### Пример 3: Автоматический расчет минимального взноса

**Задача**: При изменении стоимости недвижимости автоматически рассчитывать минимальный первоначальный взнос (20%).

```typescript
const initialPaymentBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  computeFrom(
    path.initialPayment,
    [path.propertyValue],
    ({ propertyValue }) => {
      if (!propertyValue) return null;

      // Минимальный взнос - 20%
      const minPayment = propertyValue * 0.2;
      return Math.round(minPayment);
    },
    {
      trigger: 'change',
      debounce: 300, // задержка 300мс
      condition: (form) => form.loanType === 'mortgage' // только для ипотеки
    }
  );
};

// Использование
form.propertyValue.setValue(5000000);

// ⏱️ Через 300мс:
// form.initialPayment.value.value === 1000000
```

---

### Пример 4: Перевалидация зависимых полей

**Задача**: При изменении стоимости недвижимости перевалидировать первоначальный взнос.

```typescript
const validationBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  // Перевалидировать initialPayment при изменении propertyValue
  revalidateWhen(
    path.initialPayment,
    [path.propertyValue],
    { debounce: 300 }
  );

  // Перевалидировать все поля занятости при изменении статуса
  revalidateWhen(
    path.companyName,
    [path.employmentStatus]
  );

  revalidateWhen(
    path.position,
    [path.employmentStatus]
  );
};
```

---

### Пример 5: Динамическая загрузка справочников

**Задача**: При изменении страны загружать список городов и обновлять опции в Select.

```typescript
const dictionaryBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  // Загрузка городов при изменении страны
  watchField(
    path.registrationAddress.country,
    async (country, ctx) => {
      if (!country) {
        // Сброс городов если страна не выбрана
        ctx.updateComponentProps(path.registrationAddress.city, {
          options: []
        });
        ctx.setField('registrationAddress.city', null);
        return;
      }

      // Загрузка городов
      const cities = await fetchCitiesByCountry(country);

      // Обновление опций
      ctx.updateComponentProps(path.registrationAddress.city, {
        options: cities,
        loading: false
      });

      // Сброс выбранного города
      ctx.setField('registrationAddress.city', null);
    },
    {
      debounce: 300,
      immediate: false // не вызывать при инициализации
    }
  );

  // Показать loading при изменении страны
  watchField(
    path.registrationAddress.country,
    (_, ctx) => {
      ctx.updateComponentProps(path.registrationAddress.city, {
        loading: true
      });
    }
  );
};
```

---

## Продвинутые примеры

### Пример 6: Каскадные зависимости (A → B → C)

**Задача**: При изменении типа кредита → обновить процентную ставку → пересчитать ежемесячный платеж.

```typescript
const cascadingBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  // Шаг 1: loanType → interestRate
  computeFrom(
    path.interestRate,
    [path.loanType],
    ({ loanType }) => {
      const rates = {
        mortgage: 8.5,
        auto: 12.0,
        consumer: 15.5
      };
      return rates[loanType] || 15.5;
    }
  );

  // Шаг 2: interestRate + loanAmount + loanTerm → monthlyPayment
  computeFrom(
    path.monthlyPayment,
    [path.loanAmount, path.loanTerm, path.interestRate],
    ({ loanAmount, loanTerm, interestRate }) => {
      if (!loanAmount || !loanTerm || !interestRate) return null;

      const monthlyRate = interestRate / 100 / 12;
      const payment =
        (loanAmount * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -loanTerm));

      return Math.round(payment);
    },
    { debounce: 500 }
  );

  // Шаг 3: monthlyPayment → отобразить подсказку
  watchField(path.monthlyPayment, (payment, ctx) => {
    if (payment) {
      const totalPayment = payment * ctx.getField('loanTerm');
      const overpayment = totalPayment - ctx.getField('loanAmount');

      ctx.updateComponentProps(path.monthlyPayment, {
        helperText: `Переплата: ${overpayment.toLocaleString('ru-RU')} ₽`
      });
    }
  });
};
```

---

### Пример 7: Условное копирование с валидацией

**Задача**: Копировать email дополнительного контакта из основного, но только если основной email валиден.

```typescript
const emailBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  copyFrom(
    path.emailAdditional,
    path.email,
    {
      when: (form) => {
        // Копировать только если:
        // 1. Флаг включен
        // 2. Основной email валиден
        return form.useMainEmail &&
               /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
      }
    }
  );

  // Показать подсказку если email невалиден
  watchField(path.email, (email, ctx) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValid && ctx.getField('useMainEmail')) {
      ctx.updateComponentProps(path.emailAdditional, {
        helperText: 'Исправьте основной email для автозаполнения',
        error: true
      });
    } else {
      ctx.updateComponentProps(path.emailAdditional, {
        helperText: null,
        error: false
      });
    }
  });
};
```

---

### Пример 8: Вычисления с множественными условиями

**Задача**: Рассчитать максимальную сумму кредита на основе дохода, существующих кредитов и семейного положения.

```typescript
const maxLoanBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  computeFrom(
    path.maxLoanAmount,
    [
      path.monthlyIncome,
      path.additionalIncome,
      path.existingLoans,
      path.maritalStatus,
      path.dependents
    ],
    (values) => {
      const {
        monthlyIncome,
        additionalIncome,
        existingLoans,
        maritalStatus,
        dependents
      } = values;

      if (!monthlyIncome) return null;

      // Общий доход
      const totalIncome = monthlyIncome + (additionalIncome || 0);

      // Существующие платежи
      const existingPayments = existingLoans.reduce((sum, loan) => {
        return sum + (loan.monthlyPayment || 0);
      }, 0);

      // Коэффициент в зависимости от семейного положения
      const familyCoeff = maritalStatus === 'married' ? 0.55 : 0.50;

      // Вычитаем расходы на иждивенцев (10000₽ на человека)
      const dependentsExpenses = dependents * 10000;

      // Доступный доход для платежа
      const availableIncome =
        totalIncome * familyCoeff - existingPayments - dependentsExpenses;

      // Максимальная сумма кредита (на 10 лет под 12% годовых)
      const monthlyRate = 0.12 / 12;
      const months = 120;
      const maxLoan =
        (availableIncome * (1 - Math.pow(1 + monthlyRate, -months))) /
        monthlyRate;

      return Math.max(0, Math.round(maxLoan));
    },
    { debounce: 500 }
  );

  // Показать подсказку с расчетом
  watchField(path.maxLoanAmount, (maxAmount, ctx) => {
    if (maxAmount) {
      ctx.updateComponentProps(path.loanAmount, {
        max: maxAmount,
        helperText: `Максимальная сумма: ${maxAmount.toLocaleString('ru-RU')} ₽`
      });
    }
  });
};
```

---

### Пример 9: Синхронизация массивов форм

**Задача**: При добавлении имущества в массив `properties` автоматически обновлять общую стоимость имущества.

```typescript
const propertiesBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  // Следим за изменениями массива properties
  watchField(path.properties, (properties, ctx) => {
    // Подсчитываем общую стоимость
    const totalValue = properties.reduce((sum, property) => {
      return sum + (property.estimatedValue || 0);
    }, 0);

    // Обновляем поле с общей стоимостью
    ctx.setField('totalPropertyValue', totalValue);

    // Обновляем подсказку
    ctx.updateComponentProps(path.totalPropertyValue, {
      helperText: `Количество объектов: ${properties.length}`,
      readOnly: true
    });
  });

  // При изменении значения ЛЮБОГО объекта недвижимости
  // пересчитать общую стоимость
  watchField(path.properties, (properties, ctx) => {
    properties.forEach((property, index) => {
      // Подписываемся на каждое поле estimatedValue
      watchField(path.properties[index].estimatedValue, (value, ctx) => {
        // Пересчитываем общую стоимость
        const total = ctx.getField('properties').reduce((sum: number, p: any) => {
          return sum + (p.estimatedValue || 0);
        }, 0);

        ctx.setField('totalPropertyValue', total);
      });
    });
  }, { immediate: true });
};
```

---

### Пример 10: Автоматическое форматирование значений

**Задача**: Автоматически форматировать номер телефона при вводе.

```typescript
const phoneBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  // Форматирование основного телефона
  watchField(path.phoneMain, (phone, ctx) => {
    if (!phone) return;

    // Удалить все нецифровые символы
    const digits = phone.replace(/\D/g, '');

    // Форматировать как +7 (XXX) XXX-XX-XX
    let formatted = '+7';
    if (digits.length > 1) {
      formatted += ' (' + digits.substring(1, 4);
    }
    if (digits.length > 4) {
      formatted += ') ' + digits.substring(4, 7);
    }
    if (digits.length > 7) {
      formatted += '-' + digits.substring(7, 9);
    }
    if (digits.length > 9) {
      formatted += '-' + digits.substring(9, 11);
    }

    // Обновить значение если оно изменилось
    if (formatted !== phone) {
      ctx.setField('phoneMain', formatted);
    }
  }, { debounce: 300 });
};
```

---

## Дополнительные сценарии

### Сценарий 11: Автосохранение в localStorage

**Задача**: Автоматически сохранять форму в localStorage при каждом изменении.

```typescript
const autoSaveBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  // Следим за всей формой
  watchField(path as any, (formValue, ctx) => {
    const serialized = JSON.stringify(formValue);
    localStorage.setItem('credit-application-draft', serialized);

    // Показать индикатор сохранения
    console.log('✅ Черновик сохранен');
  }, { debounce: 1000 }); // сохранять через 1 секунду после изменения
};

// Восстановление из localStorage при загрузке
const loadDraftFromLocalStorage = (form: GroupNode<CreditApplicationForm>) => {
  const draft = localStorage.getItem('credit-application-draft');
  if (draft) {
    try {
      const parsed = JSON.parse(draft);
      form.patchValue(parsed);
    } catch (e) {
      console.error('Failed to restore draft:', e);
    }
  }
};
```

---

### Сценарий 12: Логирование изменений для аудита

**Задача**: Логировать все изменения критических полей для аудита.

```typescript
interface AuditLog {
  timestamp: Date;
  field: string;
  oldValue: any;
  newValue: any;
  user: string;
}

const auditBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  const auditLogs: AuditLog[] = [];

  // Список критических полей для аудита
  const criticalFields = [
    path.loanAmount,
    path.loanTerm,
    path.personalData.lastName,
    path.passportData.series,
    path.passportData.number,
    path.inn
  ];

  criticalFields.forEach(field => {
    let previousValue: any = null;

    watchField(field, (newValue, ctx) => {
      if (previousValue !== null && previousValue !== newValue) {
        const log: AuditLog = {
          timestamp: new Date(),
          field: (field as any).fieldPath,
          oldValue: previousValue,
          newValue: newValue,
          user: 'current-user-id' // получить из контекста
        };

        auditLogs.push(log);

        // Отправить на сервер
        sendAuditLog(log);

        console.log('📝 Audit:', log);
      }

      previousValue = newValue;
    });
  });
};
```

---

### Сценарий 13: Условная валидация на основе другого поля

**Задача**: Если возраст меньше 21 года, требовать созаемщика.

```typescript
const coBorrowerRequirementBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  // Вычисляем возраст из даты рождения
  computeFrom(
    path.age,
    [path.personalData.birthDate],
    ({ birthDate }) => {
      if (!birthDate) return null;

      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      return age;
    }
  );

  // Требовать созаемщика если возраст < 21
  watchField(path.age, (age, ctx) => {
    if (age && age < 21) {
      // Включить флаг обязательности созаемщика
      ctx.setField('requireCoBorrower', true);

      // Показать предупреждение
      ctx.updateComponentProps(path.hasCoBorrower, {
        helperText: '⚠️ Для заявителей младше 21 года требуется созаемщик',
        color: 'warning'
      });

      // Добавить валидацию
      if (!ctx.getField('hasCoBorrower')) {
        ctx.setErrors(path.hasCoBorrower, [{
          code: 'required',
          message: 'Обязательно для заявителей младше 21 года'
        }]);
      }
    } else {
      ctx.setField('requireCoBorrower', false);
      ctx.updateComponentProps(path.hasCoBorrower, {
        helperText: null
      });
      ctx.clearErrors(path.hasCoBorrower);
    }
  });
};
```

---

### Сценарий 14: Динамическая процентная ставка

**Задача**: Рассчитывать процентную ставку на основе кредитного рейтинга, суммы и срока кредита.

```typescript
const interestRateBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  computeFrom(
    path.finalInterestRate,
    [
      path.loanAmount,
      path.loanTerm,
      path.creditScore,
      path.hasProperty,
      path.employmentStatus
    ],
    (values) => {
      const {
        loanAmount,
        loanTerm,
        creditScore,
        hasProperty,
        employmentStatus
      } = values;

      // Базовая ставка по типу кредита
      let baseRate = 15.0;

      // Скидка за кредитный рейтинг
      if (creditScore > 700) {
        baseRate -= 2.0;
      } else if (creditScore > 600) {
        baseRate -= 1.0;
      }

      // Скидка за наличие имущества
      if (hasProperty) {
        baseRate -= 0.5;
      }

      // Скидка за официальное трудоустройство
      if (employmentStatus === 'employed') {
        baseRate -= 0.5;
      }

      // Скидка за большую сумму кредита
      if (loanAmount > 1000000) {
        baseRate -= 1.0;
      }

      // Надбавка за длительный срок
      if (loanTerm > 60) {
        baseRate += 1.0;
      }

      return Math.max(8.0, Math.min(20.0, baseRate)); // от 8% до 20%
    },
    { debounce: 500 }
  );

  // Показать подсказку с расчетом ставки
  watchField(path.finalInterestRate, (rate, ctx) => {
    if (rate) {
      ctx.updateComponentProps(path.finalInterestRate, {
        helperText: `Итоговая ставка: ${rate.toFixed(2)}% годовых`,
        color: rate < 12 ? 'success' : rate < 15 ? 'warning' : 'error'
      });
    }
  });
};
```

---

### Сценарий 15: Предупреждения о рисках

**Задача**: Показывать предупреждения если платеж превышает 40% дохода.

```typescript
const riskWarningBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  // Вычисляем отношение платежа к доходу (Payment-to-Income ratio)
  computeFrom(
    path.paymentToIncomeRatio,
    [path.monthlyPayment, path.monthlyIncome, path.additionalIncome],
    ({ monthlyPayment, monthlyIncome, additionalIncome }) => {
      if (!monthlyPayment || !monthlyIncome) return null;

      const totalIncome = monthlyIncome + (additionalIncome || 0);
      const ratio = (monthlyPayment / totalIncome) * 100;

      return Math.round(ratio);
    }
  );

  // Показать предупреждение если риск высокий
  watchField(path.paymentToIncomeRatio, (ratio, ctx) => {
    if (!ratio) return;

    let message = '';
    let color = 'default';
    let severity: 'info' | 'warning' | 'error' = 'info';

    if (ratio > 50) {
      message = `⛔ Критический риск! Платеж составляет ${ratio}% от дохода. Рекомендуется снизить сумму или увеличить срок кредита.`;
      color = 'error';
      severity = 'error';

      // Блокируем отправку формы
      ctx.setErrors(path.loanAmount, [{
        code: 'highRisk',
        message: 'Сумма кредита слишком велика для вашего дохода'
      }]);

    } else if (ratio > 40) {
      message = `⚠️ Высокий риск. Платеж составляет ${ratio}% от дохода. Убедитесь, что сможете комфортно платить.`;
      color = 'warning';
      severity = 'warning';

    } else if (ratio > 30) {
      message = `ℹ️ Умеренный риск. Платеж составляет ${ratio}% от дохода.`;
      color = 'info';
      severity = 'info';

    } else {
      message = `✅ Низкий риск. Платеж составляет ${ratio}% от дохода.`;
      color = 'success';
      severity = 'info';
    }

    // Показать предупреждение
    ctx.updateComponentProps(path.riskWarning, {
      message,
      color,
      severity,
      visible: true
    });
  });
};
```

---

### Сценарий 16: Автозаполнение на основе ИНН

**Задача**: При вводе ИНН автоматически загружать данные компании и заполнять поля.

```typescript
const innAutoFillBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  watchField(
    path.companyInn,
    async (inn, ctx) => {
      if (!inn || inn.length !== 10) return;

      // Показать загрузку
      ctx.updateComponentProps(path.companyName, { loading: true });
      ctx.updateComponentProps(path.companyAddress, { loading: true });

      try {
        // Загрузить данные компании по ИНН
        const companyData = await fetchCompanyByInn(inn);

        if (companyData) {
          // Заполнить поля компании
          ctx.setField('companyName', companyData.name);
          ctx.setField('companyAddress', companyData.address);
          ctx.setField('companyPhone', companyData.phone);

          // Показать успех
          ctx.updateComponentProps(path.companyInn, {
            helperText: `✅ Данные загружены: ${companyData.name}`,
            color: 'success'
          });
        } else {
          ctx.updateComponentProps(path.companyInn, {
            helperText: '⚠️ Компания не найдена в базе данных',
            color: 'warning'
          });
        }
      } catch (error) {
        ctx.updateComponentProps(path.companyInn, {
          helperText: '❌ Ошибка загрузки данных',
          color: 'error'
        });
      } finally {
        ctx.updateComponentProps(path.companyName, { loading: false });
        ctx.updateComponentProps(path.companyAddress, { loading: false });
      }
    },
    { debounce: 500 }
  );
};
```

---

### Сценарий 17: Умные подсказки и рекомендации

**Задача**: Показывать контекстные подсказки на основе введенных данных.

```typescript
const smartHintsBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  // Подсказка по сроку кредита
  watchField(path.loanTerm, (term, ctx) => {
    let hint = '';

    if (term < 12) {
      hint = '💡 Короткий срок = высокие платежи, но меньшая переплата';
    } else if (term > 60) {
      hint = '💡 Длинный срок = низкие платежи, но большая переплата';
    } else {
      hint = '💡 Оптимальный срок для большинства заемщиков';
    }

    ctx.updateComponentProps(path.loanTerm, {
      helperText: hint
    });
  });

  // Подсказка по сумме кредита
  watchField(
    path.loanAmount,
    (amount, ctx) => {
      const income = ctx.getField('monthlyIncome');

      if (!amount || !income) return;

      // Рекомендуемая сумма - 24 месячных дохода
      const recommended = income * 24;

      let hint = '';
      if (amount > recommended * 1.5) {
        hint = `⚠️ Сумма значительно превышает рекомендованную (${recommended.toLocaleString('ru-RU')} ₽)`;
      } else if (amount > recommended) {
        hint = `ℹ️ Сумма выше рекомендованной (${recommended.toLocaleString('ru-RU')} ₽)`;
      } else {
        hint = `✅ Сумма в пределах рекомендованной`;
      }

      ctx.updateComponentProps(path.loanAmount, {
        helperText: hint
      });
    },
    { debounce: 500 }
  );
};
```

---

### Сценарий 18: Условное отображение шагов формы

**Задача**: Показывать шаг "Созаемщик" только если он добавлен.

```typescript
const stepVisibilityBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  watchField(path.hasCoBorrower, (hasCoBorrower, ctx) => {
    // Скрыть/показать шаг с созаемщиком
    ctx.setField('steps.coBorrowerStep.visible', hasCoBorrower);

    // Пересчитать общее количество шагов
    const visibleSteps = ctx.getField('steps').filter((s: any) => s.visible);
    ctx.setField('totalSteps', visibleSteps.length);
  });

  watchField(path.hasProperty, (hasProperty, ctx) => {
    ctx.setField('steps.propertyStep.visible', hasProperty);
  });

  watchField(path.hasExistingLoans, (hasLoans, ctx) => {
    ctx.setField('steps.existingLoansStep.visible', hasLoans);
  });
};
```

---

### Сценарий 19: Автоматическая проверка дублей созаемщиков

**Задача**: При добавлении созаемщика проверять, не совпадают ли его данные с основным заемщиком.

```typescript
const coBorrowerValidationBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  watchField(path.coBorrowers, (coBorrowers, ctx) => {
    const mainBorrower = {
      lastName: ctx.getField('personalData.lastName'),
      firstName: ctx.getField('personalData.firstName'),
      middleName: ctx.getField('personalData.middleName'),
      birthDate: ctx.getField('personalData.birthDate'),
      phone: ctx.getField('phoneMain'),
      inn: ctx.getField('inn')
    };

    coBorrowers.forEach((coBorrower, index) => {
      // Проверка совпадения ФИО
      if (
        coBorrower.personalData.lastName === mainBorrower.lastName &&
        coBorrower.personalData.firstName === mainBorrower.firstName &&
        coBorrower.personalData.middleName === mainBorrower.middleName
      ) {
        ctx.setErrors(path.coBorrowers[index].personalData.lastName, [{
          code: 'duplicate',
          message: '⚠️ ФИО созаемщика совпадает с основным заемщиком'
        }]);
      }

      // Проверка совпадения даты рождения
      if (coBorrower.personalData.birthDate === mainBorrower.birthDate) {
        ctx.setErrors(path.coBorrowers[index].personalData.birthDate, [{
          code: 'duplicate',
          message: '⚠️ Дата рождения совпадает с основным заемщиком'
        }]);
      }

      // Проверка совпадения телефона
      if (coBorrower.phone === mainBorrower.phone) {
        ctx.setErrors(path.coBorrowers[index].phone, [{
          code: 'duplicate',
          message: '⚠️ Телефон совпадает с телефоном основного заемщика'
        }]);
      }

      // Проверка совпадения ИНН
      if (coBorrower.inn === mainBorrower.inn) {
        ctx.setErrors(path.coBorrowers[index].inn, [{
          code: 'duplicate',
          message: '❌ ИНН не может совпадать с ИНН основного заемщика'
        }]);
      }
    });
  });
};
```

---

### Сценарий 20: Прогресс-бар заполнения формы

**Задача**: Показывать прогресс заполнения формы в реальном времени.

```typescript
const progressBehavior: BehaviorSchemaFn<CreditApplicationForm> = (path) => {
  // Список обязательных полей
  const requiredFields = [
    path.loanAmount,
    path.loanTerm,
    path.personalData.lastName,
    path.personalData.firstName,
    path.personalData.birthDate,
    path.passportData.series,
    path.passportData.number,
    path.phoneMain,
    path.email,
    path.monthlyIncome,
    path.agreePersonalData,
    path.agreeCreditHistory
  ];

  // Следим за всеми обязательными полями
  requiredFields.forEach(field => {
    watchField(field, (value, ctx) => {
      // Подсчитываем заполненные поля
      const filledFields = requiredFields.filter(f => {
        const val = ctx.getField((f as any).fieldPath);
        return val !== null && val !== undefined && val !== '';
      });

      const progress = Math.round((filledFields.length / requiredFields.length) * 100);

      // Обновляем прогресс
      ctx.setField('formProgress', progress);

      // Обновляем UI индикатора
      ctx.updateComponentProps(path.progressIndicator, {
        value: progress,
        label: `${progress}% заполнено`,
        color: progress === 100 ? 'success' : 'primary'
      });
    });
  });
};
```

---

## Реализация API

### Реализация copyFrom

```typescript
export function copyFrom<TForm, TSource, TTarget>(
  target: FieldPathNode<TForm, TTarget>,
  source: FieldPathNode<TForm, TSource>,
  options: {
    when?: (form: TForm) => boolean;
    fields?: keyof TSource[] | 'all';
    transform?: (value: TSource) => TTarget;
    debounce?: number;
  } = {}
): void {
  const {
    when,
    fields = 'all',
    transform,
    debounce: debounceMs = 0
  } = options;

  BehaviorRegistry.register({
    type: 'copy',
    sourceField: source,
    targetField: target,
    condition: when,
    fields,
    transform,
    debounce: debounceMs,
    callback: (sourceValue, targetNode, context) => {
      // Проверка условия
      if (when) {
        const form = context.getForm();
        if (!when(form)) return;
      }

      // Трансформация значения
      const value = transform ? transform(sourceValue) : sourceValue;

      // Копирование
      if (fields === 'all') {
        targetNode.setValue(value, { emitEvent: false });
      } else {
        // Частичное копирование для GroupNode
        const patch: Partial<TTarget> = {};
        fields.forEach(key => {
          patch[key] = sourceValue[key];
        });
        targetNode.patchValue(patch);
      }
    }
  });
}
```

---

### Реализация enableWhen

```typescript
export function enableWhen<TForm>(
  field: FieldPathNode<TForm, any>,
  condition: (form: TForm) => boolean,
  options: {
    resetOnDisable?: boolean;
    debounce?: number;
  } = {}
): void {
  const { resetOnDisable = false, debounce: debounceMs = 0 } = options;

  BehaviorRegistry.register({
    type: 'enable',
    targetField: field,
    condition,
    debounce: debounceMs,
    callback: (_, fieldNode, context) => {
      const form = context.getForm();
      const shouldEnable = condition(form);

      if (shouldEnable) {
        fieldNode.enable();
      } else {
        fieldNode.disable();

        if (resetOnDisable) {
          fieldNode.reset();
        }
      }
    }
  });
}

export function disableWhen<TForm>(
  field: FieldPathNode<TForm, any>,
  condition: (form: TForm) => boolean,
  options?: { resetOnDisable?: boolean; debounce?: number }
): void {
  // Инвертируем условие
  enableWhen(field, (form) => !condition(form), options);
}
```

---

### Реализация computeFrom

```typescript
export function computeFrom<TForm, TTarget, TDeps extends any[]>(
  target: FieldPathNode<TForm, TTarget>,
  sources: FieldPathNode<TForm, any>[],
  computeFn: (values: Record<string, any>) => TTarget,
  options: {
    trigger?: 'change' | 'blur';
    debounce?: number;
    condition?: (form: TForm) => boolean;
  } = {}
): void {
  const {
    trigger = 'change',
    debounce: debounceMs = 0,
    condition
  } = options;

  BehaviorRegistry.register({
    type: 'compute',
    targetField: target,
    sourceFields: sources,
    computeFn,
    trigger,
    debounce: debounceMs,
    condition,
    callback: (sourceValues, targetNode, context) => {
      // Проверка условия
      if (condition) {
        const form = context.getForm();
        if (!condition(form)) return;
      }

      // Построение объекта значений
      const values: Record<string, any> = {};
      sources.forEach((source, index) => {
        const fieldPath = (source as any).fieldPath;
        values[fieldPath] = sourceValues[index];
      });

      // Вычисление нового значения
      const newValue = computeFn(values);

      // Установка значения без триггера событий
      targetNode.setValue(newValue, { emitEvent: false });
    }
  });
}
```

---

### Реализация watchField

```typescript
export function watchField<TForm, TField>(
  field: FieldPathNode<TForm, TField>,
  callback: (value: TField, ctx: BehaviorContext<TForm>) => void | Promise<void>,
  options: {
    debounce?: number;
    immediate?: boolean;
  } = {}
): void {
  const { debounce: debounceMs = 0, immediate = false } = options;

  BehaviorRegistry.register({
    type: 'watch',
    sourceField: field,
    callback,
    debounce: debounceMs,
    immediate,
    handler: (value, context) => {
      callback(value, context);
    }
  });
}
```

---

### Реализация BehaviorRegistry

```typescript
import { effect } from '@preact/signals-react';

interface BehaviorRegistration {
  type: 'copy' | 'enable' | 'compute' | 'watch';
  sourceField?: FieldPathNode<any, any>;
  sourceFields?: FieldPathNode<any, any>[];
  targetField?: FieldPathNode<any, any>;
  condition?: (form: any) => boolean;
  callback: (value: any, node: any, context: BehaviorContext<any>) => void | Promise<void>;
  debounce?: number;
  immediate?: boolean;
}

class BehaviorRegistryClass {
  private registrations: BehaviorRegistration[] = [];
  private isRegistering = false;

  beginRegistration(): void {
    this.isRegistering = true;
    this.registrations = [];
  }

  register(registration: BehaviorRegistration): void {
    if (!this.isRegistering) {
      throw new Error('BehaviorRegistry: call beginRegistration() first');
    }

    this.registrations.push(registration);
  }

  endRegistration<T>(form: GroupNode<T>): BehaviorRegistration[] {
    this.isRegistering = false;

    // Создаем подписки для всех зарегистрированных поведений
    this.registrations.forEach(registration => {
      this.createEffect(registration, form);
    });

    return this.registrations;
  }

  private createEffect<T>(
    registration: BehaviorRegistration,
    form: GroupNode<T>
  ): void {
    const context = new BehaviorContextImpl(form);

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    effect(() => {
      // Отслеживаем изменения источника(ов)
      let sourceValue: any;

      if (registration.sourceField) {
        sourceValue = registration.sourceField.value.value;
      } else if (registration.sourceFields) {
        sourceValue = registration.sourceFields.map(f => f.value.value);
      }

      // Применяем debounce если указан
      if (registration.debounce && registration.debounce > 0) {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
          registration.callback(sourceValue, registration.targetField, context);
        }, registration.debounce);
      } else {
        registration.callback(sourceValue, registration.targetField, context);
      }
    });

    // Вызвать немедленно если immediate: true
    if (registration.immediate) {
      const sourceValue = registration.sourceField?.value.value;
      registration.callback(sourceValue, registration.targetField, context);
    }
  }
}

export const BehaviorRegistry = new BehaviorRegistryClass();
```

---

### Реализация BehaviorContext

```typescript
class BehaviorContextImpl<TForm> implements BehaviorContext<TForm> {
  constructor(private form: GroupNode<TForm>) {}

  getField<K extends keyof TForm>(path: string): any {
    const parts = path.split('.');
    let current: any = this.form;

    for (const part of parts) {
      if (current.fields && current.fields.has(part)) {
        current = current.fields.get(part);
      } else {
        return undefined;
      }
    }

    return current?.value.value;
  }

  setField<K extends keyof TForm>(path: string, value: any): void {
    const parts = path.split('.');
    let current: any = this.form;

    for (let i = 0; i < parts.length - 1; i++) {
      if (current.fields && current.fields.has(parts[i])) {
        current = current.fields.get(parts[i]);
      } else {
        return;
      }
    }

    const lastPart = parts[parts.length - 1];
    if (current.fields && current.fields.has(lastPart)) {
      const field = current.fields.get(lastPart);
      field.setValue(value, { emitEvent: false });
    }
  }

  updateComponentProps(
    field: FieldPathNode<TForm, any>,
    props: Record<string, any>
  ): void {
    // Получить node по field
    const node = this.resolveFieldNode(field);
    if (node && node.updateComponentProps) {
      node.updateComponentProps(props);
    }
  }

  async validateField(field: FieldPathNode<TForm, any>): Promise<boolean> {
    const node = this.resolveFieldNode(field);
    if (node) {
      return await node.validate();
    }
    return true;
  }

  setErrors(field: FieldPathNode<TForm, any>, errors: ValidationError[]): void {
    const node = this.resolveFieldNode(field);
    if (node) {
      node.setErrors(errors);
    }
  }

  clearErrors(field: FieldPathNode<TForm, any>): void {
    const node = this.resolveFieldNode(field);
    if (node) {
      node.clearErrors();
    }
  }

  getForm(): TForm {
    return this.form.getValue();
  }

  private resolveFieldNode(field: FieldPathNode<TForm, any>): FormNode<any> | undefined {
    const fieldPath = (field as any).fieldPath;
    if (!fieldPath) return undefined;

    const parts = fieldPath.split('.');
    let current: any = this.form;

    for (const part of parts) {
      if (current.fields && current.fields.has(part)) {
        current = current.fields.get(part);
      } else {
        return undefined;
      }
    }

    return current;
  }
}
```

---

## Best Practices

### 1. Группируйте связанные поведения

```typescript
// ✅ Хорошо: связанные поведения в одной функции
const mortgageBehaviors = (path: FieldPath<Form>) => {
  enableWhen(path.propertyValue, (f) => f.loanType === 'mortgage');
  enableWhen(path.initialPayment, (f) => f.loanType === 'mortgage');
  computeFrom(path.initialPayment, [path.propertyValue],
    ({ propertyValue }) => propertyValue * 0.2
  );
  revalidateWhen(path.initialPayment, [path.propertyValue]);
};

// ❌ Плохо: разбросаны по разным местам
```

### 2. Используйте debounce для частых изменений

```typescript
// ✅ Хорошо: debounce для вычислений
computeFrom(path.monthlyPayment, [path.loanAmount, path.loanTerm],
  calculatePayment,
  { debounce: 500 } // пересчитывать через 500мс после изменения
);

// ❌ Плохо: вычисления при каждом нажатии клавиши
```

### 3. Избегайте циклических зависимостей

```typescript
// ❌ Плохо: A зависит от B, B зависит от A
copyFrom(path.fieldA, path.fieldB);
copyFrom(path.fieldB, path.fieldA);

// ✅ Хорошо: односторонняя зависимость
copyFrom(path.fieldB, path.fieldA);
```

### 4. Используйте условия для сложной логики

```typescript
// ✅ Хорошо: условие внутри behavior
computeFrom(
  path.initialPayment,
  [path.propertyValue],
  ({ propertyValue }) => propertyValue * 0.2,
  { condition: (form) => form.loanType === 'mortgage' }
);

// ❌ Плохо: условие в computeFn
computeFrom(
  path.initialPayment,
  [path.propertyValue, path.loanType],
  ({ propertyValue, loanType }) => {
    if (loanType !== 'mortgage') return null;
    return propertyValue * 0.2;
  }
);
```

### 5. Делайте схемы композируемыми

```typescript
// ✅ Хорошо: разделение на модули
const addressBehaviors = (path: FieldPath<Form>) => { /* ... */ };
const mortgageBehaviors = (path: FieldPath<Form>) => { /* ... */ };
const validationBehaviors = (path: FieldPath<Form>) => { /* ... */ };

const fullBehaviorSchema = (path: FieldPath<Form>) => {
  addressBehaviors(path);
  mortgageBehaviors(path);
  validationBehaviors(path);
};

form.applyBehaviorSchema(fullBehaviorSchema);
```

---

## Troubleshooting

### Проблема 1: Поведение не срабатывает

**Симптомы**: Callback не вызывается при изменении поля

**Решения**:
1. Проверьте, что `applyBehaviorSchema()` вызван после создания формы
2. Убедитесь, что поле существует в форме
3. Проверьте условие `when` или `condition` - возможно оно возвращает false
4. Проверьте debounce - возможно нужно подождать

```typescript
// Дебаг
watchField(path.someField, (value) => {
  console.log('Field changed:', value);
});
```

---

### Проблема 2: Циклические обновления

**Симптомы**: Бесконечный цикл обновлений, браузер зависает

**Решения**:
1. Используйте `{ emitEvent: false }` при программных обновлениях
2. Добавьте условия для предотвращения циклов
3. Используйте debounce для "гашения" быстрых изменений

```typescript
// ❌ Плохо: возможен цикл
copyFrom(path.fieldA, path.fieldB);
copyFrom(path.fieldB, path.fieldA);

// ✅ Хорошо: используем условие
let isCopying = false;
watchField(path.fieldA, (value, ctx) => {
  if (isCopying) return;
  isCopying = true;
  ctx.setField('fieldB', value);
  isCopying = false;
});
```

---

### Проблема 3: Производительность

**Симптомы**: Форма тормозит при вводе

**Решения**:
1. Добавьте debounce для дорогих операций
2. Используйте `condition` чтобы пропускать ненужные вычисления
3. Оптимизируйте computeFn - избегайте сложных вычислений

```typescript
// ✅ Хорошо: debounce + condition
computeFrom(
  path.complexCalculation,
  [path.input1, path.input2],
  expensiveCalculation,
  {
    debounce: 1000,
    condition: (form) => form.enableCalculation
  }
);
```

---

### Проблема 4: TypeScript ошибки

**Симптомы**: TypeScript не выводит типы или показывает ошибки

**Решения**:
1. Убедитесь, что `FieldPath<T>` корректно определен
2. Используйте явные типы для callback функций
3. Проверьте, что форма имеет правильный generic тип

```typescript
// ✅ Хорошо: явные типы
const behavior: BehaviorSchemaFn<CreditApplicationForm> = (
  path: FieldPath<CreditApplicationForm>
) => {
  watchField(
    path.someField,
    (value: string, ctx: BehaviorContext<CreditApplicationForm>) => {
      // TypeScript знает типы
    }
  );
};
```

---

## Заключение

Декларативный Behavior Schema API предоставляет мощный и типобезопасный способ управления реактивным поведением форм. Ключевые преимущества:

- ✅ **Централизация логики** - вся логика в одном месте
- ✅ **Типобезопасность** - TypeScript выводит типы автоматически
- ✅ **Переиспользование** - схемы можно композировать и переиспользовать
- ✅ **Декларативность** - описываете "что", а не "как"
- ✅ **Автоматизация** - подписки и cleanup управляются автоматически

Используйте примеры из этого документа как отправную точку для создания собственных behavior схем!
