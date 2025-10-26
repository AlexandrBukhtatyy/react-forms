# Решения: Автоматическая валидация при исправлении ошибки

## Проблема

**Текущее поведение**:
- Валидация срабатывает только при `updateOn: 'change'` или явном вызове `validate()`
- Если у поля есть ошибка, она не исчезает автоматически при изменении значения

**Желаемое поведение**:
- Ошибка показывается при blur или submit
- При изменении значения поля (если есть ошибка) → автоматически запускается валидация
- Ошибка исчезает сразу, если значение стало валидным

---

## Решение 1: Автоматическая валидация при наличии ошибок ⭐ **РЕКОМЕНДУЕТСЯ**

### Описание

Самый простой и понятный подход: если у поля есть ошибки, то при изменении значения автоматически запускается валидация.

### Реализация

```typescript
// src/lib/forms/core/nodes/field-node.ts

setValue(value: T, options?: SetValueOptions): void {
  this._value.value = value;
  this._dirty.value = true;

  // Условия для автоматической валидации:
  // 1. Стандартное поведение: updateOn === 'change'
  // 2. НОВОЕ: Есть ошибки → валидируем для их исчезновения
  const shouldValidate =
    options?.emitEvent !== false &&
    (this.updateOn === 'change' || this._errors.value.length > 0);

  if (shouldValidate) {
    this.validate();
  }
}
```

### Пример использования

```typescript
const emailField = new FieldNode({
  value: '',
  component: Input,
  validators: [required, email],
  updateOn: 'blur', // Валидация при blur
});

// 1. Пользователь вводит "test" и покидает поле
await emailField.validate(); // blur → ошибка "Invalid email"

// 2. Пользователь начинает исправлять: вводит "test@"
emailField.setValue('test@');
// ✅ Автоматически запускается валидация
// Ошибка остается (еще не валидный email)

// 3. Пользователь дописывает: "test@mail.com"
emailField.setValue('test@mail.com');
// ✅ Автоматически запускается валидация
// Ошибка исчезает! 🎉
```

### Плюсы

✅ **Простота**: одна строчка кода
✅ **Интуитивность**: работает именно так, как ожидает пользователь
✅ **Обратная совместимость**: не ломает существующее поведение
✅ **Производительность**: валидация только когда нужно
✅ **Работает с любым updateOn**: `blur`, `submit`, `change`

### Минусы

❌ **Нельзя отключить**: всегда включено для всех полей

---

## Решение 2: Настраиваемый режим validateOnErrorFix

### Описание

Добавляем опцию в `FieldConfig` для гибкого управления поведением.

### Реализация

```typescript
// src/lib/forms/types/index.ts

export interface FieldConfig<T = any> {
  value: T;
  component?: ComponentType<any>;
  componentProps?: Record<string, any>;
  validators?: ValidatorFn<T>[];
  asyncValidators?: AsyncValidatorFn<T>[];
  disabled?: boolean;

  /**
   * Когда запускать валидацию
   * @default 'change'
   */
  updateOn?: 'change' | 'blur' | 'submit';

  /**
   * Автоматически валидировать при исправлении ошибки
   * Если true и у поля есть ошибки, валидация запустится при изменении значения
   * @default true
   */
  validateOnErrorFix?: boolean;

  debounce?: number;
}
```

```typescript
// src/lib/forms/core/nodes/field-node.ts

export class FieldNode<T = any> extends FormNode<T> {
  private validateOnErrorFix: boolean;

  constructor(config: FieldConfig<T>) {
    super();

    // ... остальная инициализация

    this.validateOnErrorFix = config.validateOnErrorFix ?? true; // По умолчанию включено
  }

  setValue(value: T, options?: SetValueOptions): void {
    this._value.value = value;
    this._dirty.value = true;

    const shouldValidate =
      options?.emitEvent !== false &&
      (this.updateOn === 'change' ||
        (this.validateOnErrorFix && this._errors.value.length > 0));

    if (shouldValidate) {
      this.validate();
    }
  }
}
```

### Пример использования

```typescript
// Включено по умолчанию
const emailField = new FieldNode({
  value: '',
  component: Input,
  validators: [required, email],
  updateOn: 'blur',
  // validateOnErrorFix: true, // По умолчанию
});

// Можно отключить для конкретного поля
const usernameField = new FieldNode({
  value: '',
  component: Input,
  validators: [required, minLength(3)],
  updateOn: 'blur',
  validateOnErrorFix: false, // Отключено
});
```

### Плюсы

✅ **Гибкость**: можно включать/выключать для конкретных полей
✅ **Обратная совместимость**: по умолчанию включено
✅ **Явность**: поведение задано в конфигурации
✅ **Контроль**: можно отключить для сложных кейсов

### Минусы

❌ **Дополнительная опция**: усложняет API
❌ **Нужно документировать**: пользователи должны знать об опции

---

## Решение 3: Расширенный updateOn с режимом 'blur-then-change'

### Описание

Добавляем новый режим `updateOn: 'blur-then-change'` как в Angular Forms.

### Реализация

```typescript
// src/lib/forms/types/index.ts

export interface FieldConfig<T = any> {
  value: T;
  component?: ComponentType<any>;
  componentProps?: Record<string, any>;
  validators?: ValidatorFn<T>[];
  asyncValidators?: AsyncValidatorFn<T>[];
  disabled?: boolean;

  /**
   * Когда запускать валидацию:
   * - 'change': при каждом изменении
   * - 'blur': только при потере фокуса
   * - 'submit': только при отправке формы
   * - 'blur-then-change': при blur, затем при каждом change (если есть ошибки)
   * @default 'change'
   */
  updateOn?: 'change' | 'blur' | 'submit' | 'blur-then-change';

  debounce?: number;
}
```

```typescript
// src/lib/forms/core/nodes/field-node.ts

export class FieldNode<T = any> extends FormNode<T> {
  private updateOn: 'change' | 'blur' | 'submit' | 'blur-then-change';
  private hasBeenValidated: boolean = false;

  constructor(config: FieldConfig<T>) {
    super();

    this.updateOn = config.updateOn || 'change';
    // ... остальная инициализация
  }

  setValue(value: T, options?: SetValueOptions): void {
    this._value.value = value;
    this._dirty.value = true;

    if (options?.emitEvent === false) {
      return;
    }

    // Логика валидации
    const shouldValidate =
      this.updateOn === 'change' ||
      (this.updateOn === 'blur-then-change' &&
       (this.hasBeenValidated && this._errors.value.length > 0));

    if (shouldValidate) {
      this.validate();
    }
  }

  async validate(options?: { debounce?: number }): Promise<boolean> {
    this.hasBeenValidated = true; // Отмечаем что валидация была запущена

    // ... остальная логика валидации
  }

  markAsTouched(): void {
    this._touched.value = true;

    // При blur запускаем валидацию для 'blur' и 'blur-then-change'
    if (this.updateOn === 'blur' || this.updateOn === 'blur-then-change') {
      this.validate();
    }
  }
}
```

### Пример использования

```typescript
// Классическое поведение: валидация при blur, затем при каждом change
const emailField = new FieldNode({
  value: '',
  component: Input,
  validators: [required, email],
  updateOn: 'blur-then-change', // ✨ Новый режим
});

// 1. Пользователь вводит "test" → валидации нет
// 2. Пользователь покидает поле (blur) → валидация, ошибка
// 3. Пользователь исправляет → валидация при каждом change
```

### Плюсы

✅ **Стандартный подход**: как в Angular Forms
✅ **Понятная семантика**: название режима говорит само за себя
✅ **Гибкость**: можно выбрать нужный режим
✅ **Расширяемость**: можно добавить другие режимы

### Минусы

❌ **Breaking change**: новый тип для `updateOn`
❌ **Сложность**: дополнительное состояние `hasBeenValidated`
❌ **Нужно обновлять типы**: везде где используется `updateOn`

---

## Решение 4: Hybrid - Комбинация Решения 1 и 2

### Описание

Используем простую логику из Решения 1, но добавляем возможность отключения через опцию.

### Реализация

```typescript
// src/lib/forms/types/index.ts

export interface FieldConfig<T = any> {
  // ... существующие поля

  /**
   * Автоматически валидировать при исправлении ошибки
   * @default true
   */
  revalidateOnChange?: boolean;
}
```

```typescript
// src/lib/forms/core/nodes/field-node.ts

export class FieldNode<T = any> extends FormNode<T> {
  private revalidateOnChange: boolean;

  constructor(config: FieldConfig<T>) {
    super();
    this.revalidateOnChange = config.revalidateOnChange ?? true;
  }

  setValue(value: T, options?: SetValueOptions): void {
    this._value.value = value;
    this._dirty.value = true;

    if (options?.emitEvent === false) {
      return;
    }

    // Простая и понятная логика
    const shouldRevalidate =
      this.revalidateOnChange && this._errors.value.length > 0;

    const shouldValidate =
      this.updateOn === 'change' || shouldRevalidate;

    if (shouldValidate) {
      this.validate();
    }
  }
}
```

### Пример использования

```typescript
// По умолчанию включено
const emailField = new FieldNode({
  value: '',
  component: Input,
  validators: [required, email],
  updateOn: 'blur',
});

// Можно отключить
const passwordField = new FieldNode({
  value: '',
  component: Input,
  validators: [required, minLength(8)],
  updateOn: 'blur',
  revalidateOnChange: false, // Отключаем ревалидацию
});
```

### Плюсы

✅ **Простота реализации**: комбинирует лучшее из Решения 1 и 2
✅ **Понятное название**: `revalidateOnChange` - говорящее имя
✅ **Обратная совместимость**: включено по умолчанию
✅ **Гибкость**: можно отключить при необходимости

### Минусы

❌ **Еще одна опция**: увеличивает API

---

## Сравнительная таблица

| Критерий | Решение 1<br/>(Авто) | Решение 2<br/>(validateOnErrorFix) | Решение 3<br/>(blur-then-change) | Решение 4<br/>(Hybrid) |
|----------|---------------------|-----------------------------------|----------------------------------|----------------------|
| **Простота** | ⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐⭐ |
| **Гибкость** | ⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Обратная совместимость** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ |
| **Понятность API** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Стандартность** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

---

## Рекомендация

### 🏆 **Решение 1 (Автоматическая валидация)** - для быстрого старта

**Используйте если**:
- Нужно быстро улучшить UX
- Не требуется гибкая настройка
- Большинство полей должны вести себя одинаково

**Пример**:
```typescript
// Одна строчка кода - и готово!
const shouldValidate =
  options?.emitEvent !== false &&
  (this.updateOn === 'change' || this._errors.value.length > 0);
```

---

### 🎯 **Решение 4 (Hybrid)** - для production

**Используйте если**:
- Нужен баланс между простотой и гибкостью
- Некоторые поля требуют особого поведения
- Важна обратная совместимость

**Пример**:
```typescript
const emailField = new FieldNode({
  value: '',
  validators: [required, email],
  updateOn: 'blur',
  // revalidateOnChange: true, // По умолчанию
});
```

---

### 📚 **Решение 3 (blur-then-change)** - для сложных форм

**Используйте если**:
- Нужен стандартный подход (как в Angular)
- Требуется явное управление поведением
- Планируется много разных режимов валидации

**Пример**:
```typescript
const field = new FieldNode({
  value: '',
  validators: [required],
  updateOn: 'blur-then-change', // Явный режим
});
```

---

## Миграционный путь

### Для Решения 1 (Авто)

1. Изменить метод `setValue()` в FieldNode
2. Протестировать на существующих формах
3. Обновить документацию

### Для Решения 4 (Hybrid)

1. Добавить опцию `revalidateOnChange` в `FieldConfig`
2. Обновить конструктор FieldNode
3. Изменить метод `setValue()`
4. Добавить примеры в документацию

### Для Решения 3 (blur-then-change)

1. Расширить тип `updateOn` в `FieldConfig`
2. Добавить состояние `hasBeenValidated` в FieldNode
3. Обновить логику в `setValue()` и `validate()`
4. Обновить `markAsTouched()` для поддержки нового режима
5. Обновить все существующие формы
