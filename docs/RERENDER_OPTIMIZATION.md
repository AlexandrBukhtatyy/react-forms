# Оптимизация ререндеров в FormField

## Проблема

При изменении значения одного поля происходит ререндер других несвязанных полей, что негативно влияет на производительность, особенно в больших формах.

## Анализ причин

### 1. Множественное использование `useSignals()`
- В родительских компонентах (PersonalInfoForm, AdditionalInfoForm и т.д.)
- В компоненте `FormField`
- Это создает "каскадные" подписки на сигналы

### 2. `FormField` подписывается на ВСЕ сигналы контроллера

```typescript
useSignals(); // Подписывается на ВСЕ signals, к которым обращается компонент:
const safeValue = control.value;        // → _value signal
control.status                          // → _status signal
control.invalid                         // → _status signal (через геттер)
control.shouldShowError                 // → _status, _touched, _dirty signals
control.errors                          // → _errors signal
control.pending                         // → _pending signal
```

### 3. `shouldShowError` - составной геттер

```typescript
get shouldShowError(): boolean {
  return this.invalid && (this.touched || this.dirty);
}
```

Читает 3 разных сигнала (`_status`, `_touched`, `_dirty`), что усугубляет проблему.

---

## Решения

### Решение 1: React.memo + убрать useSignals из родителей (Быстрое)

**Сложность**: 🟢 Низкая
**Производительность**: 🟡 Средняя
**Плюсы**: Минимальные изменения, быстро реализуется
**Минусы**: Частичная оптимизация, не решает проблему полностью

#### Реализация

```typescript
// src/lib/forms/components/form-field.tsx
import { memo } from 'react';

export const FormField = memo<FormFieldProps>(({ control, className }) => {
  useSignals();

  const Component = control.component;
  const safeValue = control.value ?? '';

  return (
    <div className={className}>
      {control.componentProps.label && control.component !== Checkbox && (
        <label className="block mb-1 text-sm font-medium">
          {control.componentProps.label}
        </label>
      )}

      <Component
        value={safeValue}
        onChange={(e: any) => {
          control.value = e?.target?.value ?? e;
        }}
        onBlur={() => control.markAsTouched()}
        disabled={control.status === 'disabled'}
        aria-invalid={control.invalid}
        {...control.componentProps}
      />

      {control.shouldShowError && (
        <span className="text-red-500 text-sm mt-1 block">
          {control.errors[0]?.message}
        </span>
      )}

      {control.pending && (
        <span className="text-gray-500 text-sm mt-1 block">
          Проверка...
        </span>
      )}
    </div>
  );
}, (prev, next) => prev.control === next.control);
```

**Важно**: Убрать `useSignals()` из всех родительских компонентов (PersonalInfoForm, AdditionalInfoForm и т.д.), оставить только в FormField и других листовых компонентах.

---

### Решение 2: Использовать useComputed для подписок вручную (Средняя сложность)

**Сложность**: 🟡 Средняя
**Производительность**: 🟢 Хорошая
**Плюсы**: Точный контроль подписок, хорошая производительность
**Минусы**: Больше кода, нужно явно объявлять каждую подписку

#### Реализация

```typescript
// src/lib/forms/components/form-field.tsx
import { useComputed } from '@preact/signals-react';

export const FormField: React.FC<FormFieldProps> = ({ control, className }) => {
  // НЕ используем useSignals()!

  // Подписываемся только на нужные значения через useComputed
  const value = useComputed(() => control.value ?? '');
  const shouldShowError = useComputed(() => control.shouldShowError);
  const errors = useComputed(() => control.errors);
  const pending = useComputed(() => control.pending);
  const status = useComputed(() => control.status);
  const invalid = useComputed(() => control.invalid);

  const Component = control.component;

  return (
    <div className={className}>
      {control.componentProps.label && control.component !== Checkbox && (
        <label className="block mb-1 text-sm font-medium">
          {control.componentProps.label}
        </label>
      )}

      <Component
        value={value.value}
        onChange={(e: any) => control.value = e?.target?.value ?? e}
        onBlur={() => control.markAsTouched()}
        disabled={status.value === 'disabled'}
        aria-invalid={invalid.value}
        {...control.componentProps}
      />

      {shouldShowError.value && (
        <span className="text-red-500 text-sm mt-1 block">
          {errors.value[0]?.message}
        </span>
      )}

      {pending.value && (
        <span className="text-gray-500 text-sm mt-1 block">
          Проверка...
        </span>
      )}
    </div>
  );
};
```

---

### Решение 3: Разделить FormField на микро-компоненты (Средняя)

**Сложность**: 🟡 Средняя
**Производительность**: 🟢 Отличная
**Плюсы**: Изоляция подписок, каждый компонент ре-рендерится независимо
**Минусы**: Больше компонентов, более сложная структура

#### Реализация

```typescript
// src/lib/forms/components/field-error.tsx
import { useSignals } from '@preact/signals-react/runtime';
import type { FieldController } from '../core/field-controller';

export const FieldError = ({ control }: { control: FieldController }) => {
  useSignals();

  if (!control.shouldShowError) return null;

  return (
    <span className="text-red-500 text-sm mt-1 block">
      {control.errors[0]?.message}
    </span>
  );
};

// src/lib/forms/components/field-pending.tsx
import { useSignals } from '@preact/signals-react/runtime';
import type { FieldController } from '../core/field-controller';

export const FieldPending = ({ control }: { control: FieldController }) => {
  useSignals();

  if (!control.pending) return null;

  return (
    <span className="text-gray-500 text-sm mt-1 block">
      Проверка...
    </span>
  );
};

// src/lib/forms/components/form-field.tsx
import { useSignals } from '@preact/signals-react/runtime';
import { FieldError } from './field-error';
import { FieldPending } from './field-pending';

export const FormField: React.FC<FormFieldProps> = ({ control, className }) => {
  useSignals();

  const Component = control.component;
  const safeValue = control.value ?? '';

  return (
    <div className={className}>
      {control.componentProps.label && control.component !== Checkbox && (
        <label className="block mb-1 text-sm font-medium">
          {control.componentProps.label}
        </label>
      )}

      <Component
        value={safeValue}
        onChange={(e: any) => control.value = e?.target?.value ?? e}
        onBlur={() => control.markAsTouched()}
        disabled={control.status === 'disabled'}
        aria-invalid={control.invalid}
        {...control.componentProps}
      />

      {/* Эти компоненты ре-рендерятся независимо */}
      <FieldError control={control} />
      <FieldPending control={control} />
    </div>
  );
};
```

**Преимущества**:
- Когда меняется `value`, ре-рендерится только input
- Когда меняется статус валидации, ре-рендерится только `FieldError`
- Когда начинается async валидация, ре-рендерится только `FieldPending`

---

### Решение 4: Computed signals в FieldController (Рекомендуемое)

**Сложность**: 🟡 Средняя
**Производительность**: 🟢 Отличная
**Плюсы**: Правильная архитектура, минимум ре-рендеров, семантически правильно
**Минусы**: Требует изменений в FieldController

#### Реализация

```typescript
// src/lib/forms/core/field-controller.ts
import { signal, computed } from "@preact/signals-react";
import type { Signal, ReadonlySignal } from "@preact/signals-react";
import type { ValidatorFn, AsyncValidatorFn, ValidationError, FieldStatus, FieldConfig } from "../types";

export class FieldController<T = any> {
  // Приватные сигналы
  private _value: Signal<T>;
  private _errors: Signal<ValidationError[]>;
  private _touched: Signal<boolean>;
  private _dirty: Signal<boolean>;
  private _status: Signal<FieldStatus>;
  private _pending: Signal<boolean>;

  // Computed signals (вместо геттеров)
  public readonly shouldShowError: ReadonlySignal<boolean>;
  public readonly valid: ReadonlySignal<boolean>;
  public readonly invalid: ReadonlySignal<boolean>;

  // Конфигурация
  private validators: ValidatorFn<T>[];
  private asyncValidators: AsyncValidatorFn<T>[];
  private updateOn: 'change' | 'blur' | 'submit';

  public readonly component: FieldConfig<T>['component'];
  public readonly componentProps: Record<string, any>;

  constructor(config: FieldConfig<T>) {
    this._value = signal(config.value);
    this._errors = signal<ValidationError[]>([]);
    this._touched = signal(false);
    this._dirty = signal(false);
    this._status = signal<FieldStatus>(config.disabled ? 'disabled' : 'valid');
    this._pending = signal(false);

    // Создаем computed signals
    this.shouldShowError = computed(() =>
      this._status.value === 'invalid' &&
      (this._touched.value || this._dirty.value)
    );

    this.valid = computed(() => this._status.value === 'valid');
    this.invalid = computed(() => this._status.value === 'invalid');

    this.validators = config.validators || [];
    this.asyncValidators = config.asyncValidators || [];
    this.updateOn = config.updateOn || 'change';
    this.component = config.component;
    this.componentProps = config.componentProps || {};
  }

  // ============================================================================
  // Публичные геттеры/сеттеры
  // ============================================================================

  get value(): T {
    return this._value.value;
  }

  set value(newValue: T) {
    this._value.value = newValue;
    this._dirty.value = true;

    if (this.updateOn === 'change') {
      this.validate();
    }
  }

  get errors(): ValidationError[] {
    return this._errors.value;
  }

  get touched(): boolean {
    return this._touched.value;
  }

  get dirty(): boolean {
    return this._dirty.value;
  }

  get status(): FieldStatus {
    return this._status.value;
  }

  get pending(): boolean {
    return this._pending.value;
  }

  // Остальные методы без изменений...
}
```

#### Использование в FormField

```typescript
// src/lib/forms/components/form-field.tsx
export const FormField: React.FC<FormFieldProps> = ({ control, className }) => {
  useSignals();

  const Component = control.component;
  const safeValue = control.value ?? '';

  return (
    <div className={className}>
      {control.componentProps.label && control.component !== Checkbox && (
        <label className="block mb-1 text-sm font-medium">
          {control.componentProps.label}
        </label>
      )}

      <Component
        value={safeValue}
        onChange={(e: any) => control.value = e?.target?.value ?? e}
        onBlur={() => control.markAsTouched()}
        disabled={control.status === 'disabled'}
        aria-invalid={control.invalid.value} // .value для ReadonlySignal
        {...control.componentProps}
      />

      {/* control.shouldShowError теперь ReadonlySignal */}
      {control.shouldShowError.value && (
        <span className="text-red-500 text-sm mt-1 block">
          {control.errors[0]?.message}
        </span>
      )}

      {control.pending && (
        <span className="text-gray-500 text-sm mt-1 block">
          Проверка...
        </span>
      )}
    </div>
  );
};
```

**Почему это лучше**:
- Computed signals автоматически отслеживают зависимости
- Preact Signals оптимизирует вычисления и обновления
- Семантически правильно: производные значения = computed signals
- Минимум ре-рендеров из коробки

---

### Решение 5: useSignalEffect вместо useSignals() (Продвинутое)

**Сложность**: 🔴 Высокая
**Производительность**: 🟢 Отличная
**Плюсы**: Максимальный контроль, можно батчить обновления
**Минусы**: Самое сложное в реализации, можно получить баги с синхронизацией

#### Реализация

```typescript
// src/lib/forms/components/form-field.tsx
import { useSignal, useSignalEffect } from '@preact/signals-react';

export const FormField: React.FC<FormFieldProps> = ({ control, className }) => {
  // Локальные signals для React
  const localValue = useSignal(control.value);
  const localShouldShowError = useSignal(control.shouldShowError);
  const localErrors = useSignal(control.errors);
  const localPending = useSignal(control.pending);
  const localStatus = useSignal(control.status);
  const localInvalid = useSignal(control.invalid);

  // Синхронизируем с control через effects
  useSignalEffect(() => {
    localValue.value = control.value;
  });

  useSignalEffect(() => {
    localShouldShowError.value = control.shouldShowError;
  });

  useSignalEffect(() => {
    localErrors.value = control.errors;
  });

  useSignalEffect(() => {
    localPending.value = control.pending;
  });

  useSignalEffect(() => {
    localStatus.value = control.status;
  });

  useSignalEffect(() => {
    localInvalid.value = control.invalid;
  });

  const Component = control.component;

  return (
    <div className={className}>
      {control.componentProps.label && control.component !== Checkbox && (
        <label className="block mb-1 text-sm font-medium">
          {control.componentProps.label}
        </label>
      )}

      <Component
        value={localValue.value ?? ''}
        onChange={(e: any) => control.value = e?.target?.value ?? e}
        onBlur={() => control.markAsTouched()}
        disabled={localStatus.value === 'disabled'}
        aria-invalid={localInvalid.value}
        {...control.componentProps}
      />

      {localShouldShowError.value && (
        <span className="text-red-500 text-sm mt-1 block">
          {localErrors.value[0]?.message}
        </span>
      )}

      {localPending.value && (
        <span className="text-gray-500 text-sm mt-1 block">
          Проверка...
        </span>
      )}
    </div>
  );
};
```

**Когда использовать**: Только если нужен очень точный контроль над обновлениями или нужно интегрироваться с другими библиотеками.

---

## Рекомендации

### Для быстрого решения прямо сейчас
**Решение 1** (React.memo + удаление useSignals из родителей)
- Минимальные изменения
- Быстрая реализация
- Частичное улучшение производительности

### Для долгосрочного решения
**Решение 4** (Computed signals в FieldController)
- Правильная архитектура
- Соответствует философии Signals
- Отличная производительность
- Легче поддерживать

### Для больших форм с высокими требованиями к производительности
**Решение 3** (Микро-компоненты) + **Решение 4** (Computed signals)
- Максимальная изоляция ре-рендеров
- Каждый аспект поля обновляется независимо
- Лучшая производительность для сложных форм

---

## План реализации (Решение 4)

### Шаг 1: Обновить FieldController
1. Заменить геттеры `shouldShowError`, `valid`, `invalid` на computed signals
2. Протестировать, что всё работает

### Шаг 2: Обновить FormField
1. Добавить `.value` для обращения к computed signals
2. Убрать `useSignals()` из родительских компонентов

### Шаг 3: Протестировать
1. Проверить производительность с большой формой
2. Убедиться, что валидация работает корректно
3. Проверить кросс-полевую валидацию

### Шаг 4 (опционально): Добавить микро-компоненты
1. Создать `FieldError` компонент
2. Создать `FieldPending` компонент
3. Рефакторить `FormField`

---

## Измерение производительности

Для измерения эффекта оптимизаций используйте React DevTools Profiler:

```typescript
// Добавить в компонент для отладки
useEffect(() => {
  console.log('FormField render:', control.componentProps.label);
});
```

Или использовать React DevTools:
1. Открыть React DevTools
2. Перейти на вкладку Profiler
3. Начать запись
4. Изменить значение в поле
5. Остановить запись
6. Проанализировать, какие компоненты ре-рендерились

---

## Дополнительные оптимизации

### 1. Debounce для валидации
Если валидация тяжелая, добавьте debounce:

```typescript
set value(newValue: T) {
  this._value.value = newValue;
  this._dirty.value = true;

  if (this.updateOn === 'change') {
    // Debounce валидации на 300ms
    clearTimeout(this.validationTimeout);
    this.validationTimeout = setTimeout(() => {
      this.validate();
    }, 300);
  }
}
```

### 2. Ленивая валидация
Валидировать только видимые поля:

```typescript
// Добавить флаг isVisible в FieldController
// Валидировать только если isVisible === true
```

### 3. Виртуализация для больших массивов форм
Для массивов с большим количеством элементов использовать виртуализацию (react-window, react-virtual).

---

## Заключение

Проблема избыточных ре-рендеров связана с архитектурой использования сигналов. Правильное решение - использовать computed signals для производных значений (Решение 4), что соответствует best practices Preact Signals и даст отличную производительность с минимальными усилиями.

Для быстрого улучшения можно начать с Решения 1, а затем постепенно мигрировать на Решение 4.
