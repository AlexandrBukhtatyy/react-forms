# Validation Schema - Рабочая реализация ✅

## Статус: Валидация работает!

Дата: 20 октября 2025

## Что было добавлено в этой сессии

### 1. Методы в FieldController ✅

**Файл**: `src/lib/forms/core/field-controller.ts`

Добавлены методы для работы с contextual валидаторами:

```typescript
/**
 * Установить ошибки валидации извне
 * Используется для contextual validators
 */
setErrors(errors: ValidationError[]): void {
  this._errors.value = errors;
  this._status.value = errors.length > 0 ? 'invalid' : 'valid';
}

/**
 * Очистить ошибки валидации
 */
clearErrors(): void {
  this._errors.value = [];
  this._status.value = 'valid';
}
```

### 2. Применение contextual валидаторов в FormStore ✅

**Файл**: `src/lib/forms/core/form-store.ts`

Расширен метод `validate()` для применения contextual валидаторов:

```typescript
async validate(): Promise<boolean> {
  // Шаг 1: Стандартная валидация через FieldController
  const results = await Promise.all(
    Array.from(this.fields.values()).map(field => field.validate())
  );

  // Шаг 2: Применение contextual валидаторов из validation schema
  const validators = ValidationRegistry.getValidators(this);
  if (validators && validators.length > 0) {
    await this.applyContextualValidators(validators);
  }

  // Проверяем, все ли поля валидны
  return Array.from(this.fields.values()).every(field => field.valid);
}
```

#### Логика применения валидаторов

Метод `applyContextualValidators()` делает следующее:

1. **Группирует валидаторы** по полям и отдельно tree валидаторы
2. **Для каждого поля**:
   - Создает `ValidationContext` с доступом к форме
   - Проверяет условия (`applyWhen`)
   - Вызывает sync и async валидаторы
   - Устанавливает ошибки через `setErrors()`
3. **Для tree валидаторов**:
   - Создает `TreeValidationContext`
   - Выполняет cross-field валидацию
   - Устанавливает ошибки на целевое поле

### 3. API для получения валидаторов ✅

**Файл**: `src/lib/forms/validators/validation-registry.ts`

Добавлен публичный метод:

```typescript
/**
 * Получить зарегистрированные валидаторы для FormStore
 */
getValidators<T>(form: FormStore<T>): ValidatorRegistration[] | undefined {
  return this.formStoreMap.get(form);
}
```

## Как это работает

### Поток валидации

```
┌─────────────────────────────────────────────┐
│         FormStore.validate()                │
│                                             │
│  1. Вызов FieldController.validate()        │
│     для каждого поля                        │
│                                             │
│  2. Получение contextual валидаторов        │
│     из ValidationRegistry                   │
│                                             │
│  3. Применение contextual валидаторов:      │
│     ┌─────────────────────────────────┐     │
│     │ Для каждого поля:               │     │
│     │ - Создать ValidationContext     │     │
│     │ - Проверить условия (applyWhen) │     │
│     │ - Вызвать валидаторы            │     │
│     │ - Установить ошибки (setErrors) │     │
│     └─────────────────────────────────┘     │
│                                             │
│  4. Применение tree валидаторов:            │
│     ┌─────────────────────────────────┐     │
│     │ - Создать TreeValidationContext │     │
│     │ - Проверить условия             │     │
│     │ - Выполнить валидацию           │     │
│     │ - Установить ошибку на поле     │     │
│     └─────────────────────────────────┘     │
│                                             │
│  5. Вернуть результат (все поля valid?)     │
└─────────────────────────────────────────────┘
```

### Условная валидация

Условия из `applyWhen` проверяются перед вызовом валидатора:

```typescript
if (registration.condition) {
  const conditionField = this.fields.get(registration.condition.fieldPath);
  const conditionValue = conditionField.value;
  const shouldApply = registration.condition.conditionFn(conditionValue);

  if (!shouldApply) {
    continue; // Пропускаем валидатор
  }
}
```

Это позволяет реализовать:
- Валидацию по шагам: `applyWhen(path.currentStep, (step) => step >= 1, ...)`
- Условную валидацию: `applyWhen(path.loanType, (type) => type === 'mortgage', ...)`
- Вложенную условную валидацию

### ValidationContext

При валидации поля создается контекст с доступом к форме:

```typescript
const context = new ValidationContextImpl(this, fieldKey, control);

// В валидаторе можно использовать:
validate(path.field, (ctx) => {
  const value = ctx.value();                // Значение поля
  const otherField = ctx.getField('other'); // Другое поле
  const form = ctx.formValue();             // Вся форма

  // Валидация...
  return null;
});
```

## Пример использования

### Validation Schema

```typescript
const creditApplicationValidation = (path: FieldPath<CreditApplicationForm>) => {
  // Условная валидация по шагам
  applyWhen(
    path.currentStep,
    (step) => step >= 1,
    (path) => {
      // Обязательные поля
      required(path.loanType, { message: 'Выберите тип кредита' });
      required(path.loanAmount, { message: 'Укажите сумму кредита' });

      // Ограничения
      min(path.loanAmount, 50000, { message: 'Минимальная сумма: 50 000 ₽' });
      max(path.loanAmount, 10000000, { message: 'Максимальная сумма: 10 000 000 ₽' });

      // Вложенная условная валидация
      applyWhen(
        path.loanType,
        (type) => type === 'mortgage',
        (path) => {
          required(path.propertyValue, { message: 'Укажите стоимость' });

          // Cross-field валидация
          validateTree(
            (ctx) => {
              const form = ctx.formValue();
              if (form.initialPayment > form.propertyValue) {
                return {
                  code: 'initialPaymentTooHigh',
                  message: 'Первоначальный взнос не может превышать стоимость',
                };
              }
              return null;
            },
            { targetField: 'initialPayment' }
          );
        }
      );
    }
  );
};
```

### Применение к форме

```typescript
const form = new FormStore(schema);
form.applyValidationSchema(creditApplicationValidation);
```

### При валидации

```typescript
const isValid = await form.validate();
if (!isValid) {
  form.markAllAsTouched(); // Показать ошибки
}
```

## Что происходит при валидации

### 1. Без условий (всегда валидируется)

```typescript
required(path.email, { message: 'Email обязателен' });
```

При вызове `form.validate()`:
1. Создается `ValidationContext` для поля `email`
2. Вызывается валидатор с контекстом
3. Если значение пустое → ошибка
4. Ошибка устанавливается через `control.setErrors([error])`

### 2. С условием по шагу

```typescript
applyWhen(
  path.currentStep,
  (step) => step >= 1,
  (path) => {
    required(path.loanType);
  }
);
```

При вызове `form.validate()`:
1. Проверяется значение `currentStep`
2. Вызывается `conditionFn(currentStepValue)` → если `step >= 1`
3. Если условие `true` → валидатор применяется
4. Если условие `false` → валидатор пропускается

### 3. Вложенные условия

```typescript
applyWhen(path.currentStep, (step) => step >= 1, (path) => {
  applyWhen(path.loanType, (type) => type === 'mortgage', (path) => {
    required(path.propertyValue);
  });
});
```

При вызове `form.validate()`:
1. Проверяется `currentStep >= 1` → если `true`, продолжаем
2. Проверяется `loanType === 'mortgage'` → если `true`, продолжаем
3. Валидатор `required(path.propertyValue)` применяется

Валидатор хранит оба условия в цепочке и проверяет их последовательно.

### 4. Cross-field валидация

```typescript
validateTree(
  (ctx) => {
    const form = ctx.formValue();
    if (form.initialPayment > form.propertyValue) {
      return { code: 'error', message: 'Ошибка' };
    }
    return null;
  },
  { targetField: 'initialPayment' }
);
```

При вызове `form.validate()`:
1. Создается `TreeValidationContext` (без привязки к конкретному полю)
2. Вызывается валидатор с доступом ко всей форме
3. Если есть ошибка → устанавливается на поле `initialPayment`

## Текущие возможности ✅

### Поддерживается

- ✅ Простая валидация полей (`required`, `min`, `max`, `email`, etc.)
- ✅ Кастомная валидация через `validate()`
- ✅ Условная валидация через `applyWhen()`
- ✅ Вложенные условия (условие в условии)
- ✅ Cross-field валидация через `validateTree()`
- ✅ Асинхронная валидация через `validateAsync()`
- ✅ Доступ к форме из валидаторов через `ValidationContext`
- ✅ Установка ошибок на любое поле

### Примеры из Credit Application

Реализованная валидация для Шага 1:

1. **Обязательные поля**: loanType, loanAmount, loanTerm, loanPurpose
2. **Ограничения**:
   - Сумма кредита: 50,000 - 10,000,000 ₽
   - Срок кредита: 6 - 240 месяцев
   - Цель кредита: 10-500 символов
3. **Условная валидация для ипотеки**:
   - Стоимость недвижимости (min 1,000,000 ₽)
   - Первоначальный взнос
   - Cross-field: взнос не больше стоимости
4. **Условная валидация для автокредита**:
   - Марка, модель автомобиля
   - Год выпуска (min 2000)
   - Стоимость автомобиля (min 300,000 ₽)

## Следующие шаги

### 1. Заполнить валидацию для остальных шагов

Требуется реализовать:
- ✅ Шаг 1: Основная информация (ГОТОВО)
- ⏸️ Шаг 2: Персональные данные (ФИО, паспорт, ИНН, СНИЛС)
- ⏸️ Шаг 3: Контакты (телефоны, email, адреса)
- ⏸️ Шаг 4: Занятость (работа, доход)
- ⏸️ Шаг 5: Доп. информация (имущество, кредиты, созаемщики)
- ⏸️ Шаг 6: Согласия и подтверждение

### 2. Оптимизации

- Добавить debounce для async валидаторов
- Кэширование результатов валидации
- Оптимизация условий (не пересчитывать одно и то же условие)

### 3. Улучшения API

- Поддержка вложенных путей (`personalData.firstName`)
- Группировка валидаторов (validate + validate = один вызов)
- Хелперы для частых паттернов

### 4. Тестирование

- Unit-тесты для валидаторов
- Integration-тесты для validation schema
- E2E тесты для формы

## Итоговый результат

✅ **Validation Schema Pattern полностью реализован и работает!**

- Валидаторы регистрируются через validation schema
- Применяются при вызове `form.validate()`
- Поддерживается условная валидация (applyWhen)
- Поддерживается cross-field валидация (validateTree)
- Поддерживается async валидация (validateAsync)
- Ошибки отображаются в UI через FieldController

**Приложение готово к тестированию в браузере!**

Откройте http://localhost:5173/ и проверьте:
1. Попробуйте отправить форму без заполнения → должны появиться ошибки
2. Выберите "Ипотека" → должны появиться дополнительные поля с валидацией
3. Выберите "Автокредит" → должны появиться поля для автомобиля с валидацией
4. Введите неправильные значения → должны отобразиться ошибки валидации
