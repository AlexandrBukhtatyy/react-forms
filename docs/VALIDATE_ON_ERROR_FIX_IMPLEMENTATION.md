# Имплементация: Автоматическая валидация при исправлении ошибки

## ✅ Выполнено

Реализовано **"Умная" валидация при изменении значения** с поддержкой ValidationSchema API.

### Финальная логика поведения

**updateOn: 'change'**:
- Валидация запускается при каждом изменении
- Ошибки обновляются сразу (стандартное поведение)

**updateOn: 'blur' или 'submit'** + **поле имеет ошибки**:
- ✅ При вводе **корректного значения** → ошибка **исчезает сразу** (позитивная обратная связь)
- ✅ При вводе **некорректного значения** → ошибка **остается без изменений** (не раздражаем пользователя)
- ✅ При **blur/submit** → запускается полная валидация с обновлением ошибок

**Без ошибок**:
- Валидация срабатывает только согласно `updateOn` (blur/submit)

---

## 🐛 Проблема

### Исходная проблема
Если у поля есть ошибка, она не исчезает автоматически при изменении значения (кроме случая `updateOn: 'change'`).

### Критический баг после первой имплементации
После первой реализации Решения 1 обнаружился баг:

**Симптомы**:
- Поле имеет ошибку (установленную через ValidationSchema)
- При очистке поля или вводе некорректных значений ошибка **исчезает**
- Это неправильное поведение - ошибка должна оставаться

**Причина**:
При использовании ValidationSchema API:
1. Валидация происходит на уровне `GroupNode`
2. Ошибки устанавливаются на поля через `setErrors()`
3. Массивы `this.validators` и `this.asyncValidators` у полей **пустые**
4. При вызове `validate()` метод `validateImmediate()` не находит валидаторов
5. Проходит все проверки и очищает ошибки: `this._errors.value = []` (строка 230)
6. **Результат**: Ошибки от ValidationSchema стираются полевой валидацией

---

## ✅ Решение

### Концепция "Умной" валидации

При изменении значения поля (setValue):

1. **updateOn === 'change'**:
   - Запускается полная валидация
   - Ошибки обновляются (стандартное поведение)

2. **updateOn !== 'change' && поле имеет ошибки && есть собственные валидаторы**:
   - Запускается валидация в фоне
   - **Если валидация успешна** → ошибки очищаются (позитивный UX)
   - **Если валидация не успешна** → старые ошибки восстанавливаются (не раздражаем пользователя)

3. **Нет ошибок или нет собственных валидаторов**:
   - Валидация не запускается
   - Ждем события согласно updateOn (blur/submit)

### Два источника валидации

Поле должно различать:

1. **Собственные валидаторы** (field-level):
   - Переданы в `FieldConfig.validators` и `FieldConfig.asyncValidators`
   - Хранятся в `this.validators` и `this.asyncValidators`
   - Поле **управляет** этими ошибками через умную валидацию

2. **Внешние валидаторы** (form-level ValidationSchema):
   - Применяются на уровне `GroupNode` через `applyValidationSchema()`
   - Ошибки устанавливаются через `setErrors()`
   - Массивы валидаторов **пустые** → умная валидация не срабатывает
   - Поле **не должно** вмешиваться в эти ошибки

### Проверка наличия собственных валидаторов

```typescript
const hasOwnValidators =
  this.validators.length > 0 ||
  this.asyncValidators.length > 0;
```

---

## 📝 Реализация

### 1. Финальная версия setValue()

**Файл**: [src/lib/forms/core/nodes/field-node.ts](../src/lib/forms/core/nodes/field-node.ts#L130-L164)

```typescript
setValue(value: T, options?: SetValueOptions): void {
  this._value.value = value;
  this._dirty.value = true;

  if (options?.emitEvent === false) {
    return;
  }

  const hasOwnValidators = this.validators.length > 0 || this.asyncValidators.length > 0;
  const hasErrors = this._errors.value.length > 0;

  // 1. Если updateOn === 'change' → всегда валидируем
  if (this.updateOn === 'change') {
    this.validate();
    return;
  }

  // 2. Если у поля есть ошибки и собственные валидаторы
  //    → запускаем "умную" валидацию:
  //    - Если значение стало валидным → очищаем ошибки (UX: пользователь видит успех)
  //    - Если значение невалидно → оставляем старые ошибки (UX: не раздражаем во время ввода)
  if (hasErrors && hasOwnValidators) {
    const currentErrors = [...this._errors.value];

    this.validate().then((isValid) => {
      // Если валидация не прошла, восстанавливаем старые ошибки
      // (не показываем новые ошибки до blur/submit)
      if (!isValid) {
        this._errors.value = currentErrors;
        this._status.value = 'invalid';
      }
      // Если валидация прошла, ошибки уже очищены методом validate()
    });
  }
}
```

**Ключевые изменения**:
- ✅ Разделение логики для `updateOn === 'change'` и других режимов
- ✅ "Умная" валидация: сохранение/восстановление ошибок
- ✅ Очистка ошибок только при успешной валидации
- ✅ ValidationSchema ошибки не затрагиваются (hasOwnValidators = false)

---

### 2. Исправление validateImmediate()

**Файл**: [src/lib/forms/core/nodes/field-node.ts](../src/lib/forms/core/nodes/field-node.ts#L225-L235)

```typescript
private async validateImmediate(): Promise<boolean> {
  const validationId = ++this.currentValidationId;

  // Синхронная валидация
  const syncErrors: ValidationError[] = [];
  for (const validator of this.validators) {
    const error = validator(this._value.value);
    if (error) syncErrors.push(error);
  }

  if (syncErrors.length > 0) {
    this._errors.value = syncErrors;
    this._status.value = 'invalid';
    return false;
  }

  // Асинхронная валидация
  if (this.asyncValidators.length > 0) {
    this._pending.value = true;
    this._status.value = 'pending';

    const asyncResults = await Promise.all(
      this.asyncValidators.map((validator) => validator(this._value.value))
    );

    if (validationId !== this.currentValidationId) {
      return false; // Эта валидация устарела
    }

    this._pending.value = false;

    const asyncErrors = asyncResults.filter(Boolean) as ValidationError[];
    if (asyncErrors.length > 0) {
      this._errors.value = asyncErrors;
      this._status.value = 'invalid';
      return false;
    }
  }

  // ✅ ИСПРАВЛЕНИЕ: Очищаем ошибки только если у поля есть собственные валидаторы
  // Если валидаторов нет, значит используется ValidationSchema на уровне формы
  // и ошибки устанавливаются извне через setErrors()
  const hasOwnValidators =
    this.validators.length > 0 ||
    this.asyncValidators.length > 0;

  if (hasOwnValidators) {
    this._errors.value = [];
    this._status.value = 'valid';
  }

  return this._errors.value.length === 0;
}
```

**Ключевые изменения**:
- ✅ Добавлена проверка `hasOwnValidators` перед очисткой ошибок
- ✅ ValidationSchema ошибки **не очищаются** полевой валидацией
- ✅ Ошибки от ValidationSchema управляются только через `setErrors()` на уровне формы

---

## 🎯 Поведение после исправления

### Сценарий 1: Поле с собственными валидаторами (updateOn: 'blur')

```typescript
const emailField = new FieldNode({
  value: '',
  component: Input,
  validators: [required, email], // ✅ Есть собственные валидаторы
  updateOn: 'blur', // ⚠️ Валидация на blur
});

// 1. Пользователь вводит "test" и покидает поле (blur)
await emailField.validate();
// ❌ Ошибка: "Invalid email format"

// 2. Пользователь начинает исправлять: вводит "test@"
emailField.setValue('test@');
// ✅ Запускается "умная" валидация:
//    - Валидация выполняется в фоне
//    - Результат: невалидно (неполный email)
//    - Действие: старая ошибка остается БЕЗ изменений
// ❌ Ошибка: "Invalid email format" (НЕ изменилась)

// 3. Пользователь вводит пустое значение ""
emailField.setValue('');
// ✅ Умная валидация:
//    - Результат: невалидно (required)
//    - Действие: старая ошибка остается
// ❌ Ошибка: "Invalid email format" (НЕ "Field is required")

// 4. Пользователь исправляет: "test@mail.com"
emailField.setValue('test@mail.com');
// ✅ Умная валидация:
//    - Результат: ВАЛИДНО!
//    - Действие: ошибки очищаются
// ✅ Ошибка исчезла! (пользователь видит успех немедленно)

// 5. Если пользователь снова введет невалидное значение и покинет поле
emailField.setValue('wrong');
// ❌ Ошибки нет (умная валидация не добавляет новые ошибки)
await emailField.validate(); // Вызвано через onBlur в Input компоненте
// ❌ Ошибка: "Invalid email format" (показана после blur)
```

### Сценарий 1b: Поле с собственными валидаторами (updateOn: 'change')

```typescript
const emailField = new FieldNode({
  value: '',
  component: Input,
  validators: [required, email],
  updateOn: 'change', // ⚠️ Валидация при каждом изменении
});

// При updateOn: 'change' умная валидация НЕ применяется
// Каждое изменение запускает полную валидацию с обновлением ошибок

emailField.setValue('test');
// ✅ Валидация запускается
// ❌ Ошибка: "Invalid email format" (обновляется сразу)

emailField.setValue('test@mail.com');
// ✅ Валидация запускается
// ✅ Ошибка исчезает
```

---

### Сценарий 2: Поле с ValidationSchema (form-level validation)

```typescript
const form = new GroupNode({
  email: {
    value: '',
    component: Input,
    // ❌ НЕТ validators - используется ValidationSchema
  },
});

// Применяем ValidationSchema на уровне формы
form.applyValidationSchema((path) => {
  required(path.email);
  email(path.email);
});

// 1. Валидация формы (например, при blur)
await form.validate();
// ❌ form.email имеет ошибку (установлена через setErrors())

// 2. Пользователь начинает исправлять: вводит "test@"
form.email.setValue('test@');
// ⚠️ Ревалидация НЕ запускается (hasOwnValidators = false)
// ❌ Ошибка остается (это правильно - ждем следующей валидации формы)

// 3. Пользователь покидает поле (blur) или переходит к следующему шагу
await form.validate();
// ❌ Ошибка остается (email все еще невалиден)

// 4. Пользователь исправляет: "test@mail.com"
form.email.setValue('test@mail.com');

// 5. Пользователь покидает поле (blur)
await form.validate();
// ✅ Ошибка исчезает! (ValidationSchema не нашла ошибок, setErrors([]))
```

---

## 🔍 Ключевая разница

| Аспект | Field-level validators | Form-level ValidationSchema |
|--------|----------------------|----------------------------|
| **Где определены** | `FieldConfig.validators` | `form.applyValidationSchema()` |
| **Где хранятся** | `this.validators`, `this.asyncValidators` | ValidationRegistry → применяются через `applyContextualValidators()` |
| **Как устанавливаются ошибки** | `validate()` → `validateImmediate()` | `form.validate()` → `setErrors()` |
| **updateOn: 'change'** | ✅ Валидация при каждом изменении | ❌ Не применяется (нет валидаторов) |
| **updateOn: 'blur', есть ошибки** | ✅ Умная валидация (только очистка при успехе) | ❌ Не применяется (нет валидаторов) |
| **updateOn: 'blur', нет ошибок** | ❌ Валидация не запускается до blur | ❌ Валидация не запускается |
| **Кто очищает ошибки** | Само поле (умная валидация или validate()) | Форма (`form.validate()` → `setErrors([])`) |

---

## ✅ Преимущества решения

### 1. Превосходный UX
**Позитивная обратная связь**:
- ✅ Ошибка исчезает **сразу**, когда пользователь вводит корректное значение
- ✅ Пользователь **видит успех немедленно** - не нужно ждать blur

**Ненавязчивая валидация**:
- ✅ При вводе некорректного значения старая ошибка **не обновляется**
- ✅ Не раздражаем пользователя во время ввода
- ✅ Новая ошибка показывается только на blur/submit (согласно updateOn)

### 2. Правильное разделение ответственности
- **Field-level validation**: Управляет своими ошибками через умную валидацию
- **Form-level validation**: Ошибки контролируются только формой
- **updateOn: 'change'**: Стандартное поведение (валидация при каждом изменении)

### 3. Поддержка обоих подходов
```typescript
// Подход 1: Field-level validators (умная валидация работает)
const field1 = new FieldNode({
  value: '',
  validators: [required, email], // ✅ hasOwnValidators = true
  updateOn: 'blur',
});

// Подход 2: Form-level ValidationSchema (умная валидация не вмешивается)
const form = new GroupNode({
  email: { value: '' }, // ❌ hasOwnValidators = false
});
form.applyValidationSchema((path) => {
  email(path.email); // ✅ Работает, ошибки через setErrors()
});
```

### 4. Защита от race conditions
- Асинхронная валидация не блокирует UI
- Восстановление ошибок происходит после завершения валидации
- Использование `currentValidationId` для отмены устаревших валидаций (уже было)

### 5. Обратная совместимость
- ✅ Не ломает существующий код
- ✅ Улучшает UX для всех форм с field-level validators
- ✅ ValidationSchema продолжает работать как раньше
- ✅ updateOn: 'change' работает как раньше

---

## 📚 Связанные документы

- [VALIDATE_ON_ERROR_FIX_SOLUTIONS.md](VALIDATE_ON_ERROR_FIX_SOLUTIONS.md) - все варианты решения
- [STEP_FORM_IMPLEMENTATION.md](STEP_FORM_IMPLEMENTATION.md) - имплементация useStepForm
- [CLAUDE.md](../CLAUDE.md) - общая архитектура проекта

---

## 🚀 Результат

Dev-сервер работает: **http://localhost:5173**

Все изменения применены:
- ✅ Автоматическая валидация при исправлении ошибки
- ✅ Поддержка field-level и form-level валидации
- ✅ Ошибки от ValidationSchema не стираются
- ✅ Правильное поведение для обоих подходов
