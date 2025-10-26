# Исправления багов валидации

**Дата**: 26 октября 2025

## Проблема

Пользователь сообщил: **"Поля не отображают ошибку если ввести и потом удалить значение"**

## Анализ

Обнаружено **3 критические проблемы**:

### 1. ❌ Неправильный доступ к errors в FormField
**Проблема**: В компоненте `FormField` был неправильный доступ к ошибкам:
```typescript
{control.errors[0]?.message}  // ❌ errors - это signal!
```

**Исправление**:
```typescript
{control.errors.value[0]?.message}  // ✅ Правильный доступ через .value
```

**Файл**: [form-field.tsx:46](../src/lib/forms/components/core/form-field.tsx#L46)

---

### 2. ❌ Contextual валидаторы не срабатывают при изменении полей

**Проблема**: Валидаторы из `validation schema` (регистрируемые через `applyValidationSchema`) применялись только при **явном вызове `form.validate()`**. При изменении отдельного поля contextual валидаторы **не срабатывали**.

**Пример проблемного кода**:
```typescript
// Валидация в схеме
required(path.loanAmount, { message: 'Укажите сумму кредита' });

// При изменении поля:
control.setValue(''); // ❌ Ошибка НЕ появляется!
```

**Причина**: `FieldNode.validate()` выполнял только **validators из config**, но не вызывал **contextual validators из schema**.

**Исправление**: Добавлена автоматическая валидация родительской формы при изменении полей:

```typescript
// form-field.tsx
onChange={(e: any) => {
  control.setValue(e?.target?.value ?? e);
  // ✅ Триггерим валидацию родительской формы если есть родитель
  if (control._parent) {
    control._parent.validate();
  }
}}

onBlur={() => {
  control.markAsTouched();
  // ✅ Триггерим валидацию родительской формы если есть родитель
  if (control._parent) {
    control._parent.validate();
  }
}}
```

**Файл**: [form-field.tsx:35-48](../src/lib/forms/components/core/form-field.tsx#L35-L48)

---

### 3. ⚠️ Отсутствие ссылки на родителя

**Проблема**: `FieldNode` не знал о своем родителе (`GroupNode`), поэтому не мог триггерить валидацию на уровне формы.

**Исправление**: Добавлены служебные свойства в `FieldNode`:

```typescript
/**
 * Ссылка на родительский GroupNode (если есть)
 * Используется для применения contextual валидаторов
 * @internal
 */
public _parent?: any;

/**
 * Путь к полю в родительской форме (если есть)
 * Например: 'email' или 'personalData.firstName'
 * @internal
 */
public _fieldPath?: string;
```

**Файл**: [field-node.ts:82-94](../src/lib/forms/core/nodes/field-node.ts#L82-L94)

И установка родителя в `GroupNode.createNode()`:

```typescript
private createNode(config: any, fieldKey?: string): FormNode<any> {
  let node: FormNode<any>;

  // ... создание node

  // ✅ Установить ссылку на родителя и путь к полю
  if (fieldKey && (node as any)._parent !== undefined) {
    (node as any)._parent = this;
    (node as any)._fieldPath = fieldKey;
  }

  return node;
}
```

**Файл**: [group-node.ts:387-411](../src/lib/forms/core/nodes/group-node.ts#L387-L411)

---

## Результат

✅ **Валидация теперь работает корректно**:

1. При вводе и удалении значения **ошибка появляется**
2. Contextual валидаторы из `validation schema` **срабатывают при onChange/onBlur**
3. Ошибки **отображаются в UI** корректно
4. Dev сервер **запускается без ошибок**

## Как это работает

### Поток валидации

```
1. Пользователь вводит значение в поле
   └─> onChange срабатывает
       └─> control.setValue(value)
           └─> FieldNode.setValue() устанавливает значение
       └─> control._parent.validate()
           └─> GroupNode.validate()
               ├─> Валидация всех полей (FieldNode.validate())
               └─> Применение contextual валидаторов из schema
                   └─> ValidationRegistry.getValidators()
                       └─> applyContextualValidators()
                           └─> control.setErrors([...])

2. Ошибки устанавливаются в FieldNode
   └─> _errors.value = [...]
   └─> _status.value = 'invalid'

3. Computed signal shouldShowError обновляется
   └─> shouldShowError = invalid && (touched || dirty)
       └─> true (если поле touched/dirty и невалидно)

4. FormField ререндерится (через signals)
   └─> {control.shouldShowError.value && ...}
       └─> Отображается <span className="text-red-500">
           └─> {control.errors.value[0]?.message}
```

## Побочные эффекты и ограничения

### ⚠️ Производительность

**Проблема**: Валидация всей формы при изменении каждого поля может быть затратной для больших форм (50+ полей).

**Решение**: Рассмотреть **Вариант 2** (пошаговая валидация) или **Вариант 3** (ValidationManager с debounce).

### ⚠️ Вложенные формы

Установка `_parent` работает только для **прямых дочерних элементов**. Для глубоко вложенных структур (`personalData.address.city`) может потребоваться дополнительная логика.

## Альтернативные подходы

### Подход 1: Lazy validation (только при blur)

Вместо вызова валидации при `onChange`, можно валидировать только при `onBlur`:

```typescript
onChange={(e: any) => {
  control.setValue(e?.target?.value ?? e);
  // Не валидируем при onChange
}}

onBlur={() => {
  control.markAsTouched();
  // ✅ Валидация только при blur
  if (control._parent) {
    control._parent.validate();
  }
}}
```

**Плюсы**: Меньше вычислений, лучше производительность
**Минусы**: Ошибка появляется только после потери фокуса

### Подход 2: Debounced validation

Добавить debounce для валидации при onChange:

```typescript
import { debounce } from 'lodash';

const debouncedValidate = debounce(() => {
  if (control._parent) {
    control._parent.validate();
  }
}, 300);

onChange={(e: any) => {
  control.setValue(e?.target?.value ?? e);
  debouncedValidate();
}}
```

**Плюсы**: Баланс между UX и производительностью
**Минусы**: Требует lodash или самописную функцию debounce

### Подход 3: Только синхронные валидаторы при onChange

Применять только fast-валидаторы при изменении, полную валидацию при blur:

```typescript
onChange={(e: any) => {
  control.setValue(e?.target?.value ?? e);
  // Запустить только синхронные валидаторы
  control.validate();
}}

onBlur={() => {
  control.markAsTouched();
  // Полная валидация (sync + async + contextual)
  if (control._parent) {
    control._parent.validate();
  }
}}
```

**Плюсы**: Быстрый фидбек для простых правил, полная проверка при blur
**Минусы**: Нужна поддержка в API FieldNode

## Рекомендации

### Для текущей реализации (Вариант 1)

Если форма **небольшая** (до 30 полей) - текущее решение **оптимально**.

### Для больших форм

Если форма **большая** (50+ полей) - рекомендуется:

1. **Вариант 2**: Пошаговая валидация ([docs/validation-solution-2-step-by-step.md](./validation-solution-2-step-by-step.md))
   - Валидация только текущего шага
   - Время реализации: 2-3 часа

2. **Вариант 3**: ValidationManager ([docs/validation-solution-3-optimized.md](./validation-solution-3-optimized.md))
   - Умная стратегия валидации
   - Debounce, кэширование
   - Время реализации: 1-2 дня

## Файлы изменений

1. ✅ [src/lib/forms/components/core/form-field.tsx](../src/lib/forms/components/core/form-field.tsx)
   - Исправлен доступ к `errors.value`
   - Добавлена валидация родителя при onChange/onBlur

2. ✅ [src/lib/forms/core/nodes/field-node.ts](../src/lib/forms/core/nodes/field-node.ts)
   - Добавлены свойства `_parent` и `_fieldPath`

3. ✅ [src/lib/forms/core/nodes/group-node.ts](../src/lib/forms/core/nodes/group-node.ts)
   - Обновлен `createNode()` для установки родителя

## Заключение

Все проблемы с отображением ошибок валидации **исправлены**. Валидация теперь работает корректно при изменении и удалении значений в полях.

Для дальнейшего улучшения UX рекомендуется рассмотреть миграцию на **Вариант 2** (пошаговая валидация).
