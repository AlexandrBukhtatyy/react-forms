# Задача: Реализация Behavior Schema API для реактивных форм

## Контекст

Изучи следующие документы:
- [docs/DECLARATIVE_BEHAVIOR_SCHEMA_DETAILED.md](docs/DECLARATIVE_BEHAVIOR_SCHEMA_DETAILED.md) - полная спецификация API с примерами
- [docs/REACTIVE_FORM_BEHAVIOR_API_PROPOSALS.md](docs/REACTIVE_FORM_BEHAVIOR_API_PROPOSALS.md) - анализ и сравнение вариантов реализации

## Цель

Реализовать **Вариант 3 (Гибридный подход)** из документа REACTIVE_FORM_BEHAVIOR_API_PROPOSALS.md - комбинацию декларативного Behavior Schema API с методами-помощниками в классах форм.

## Приоритеты реализации

### Фаза 1: Методы-помощники (ВЫСОКИЙ ПРИОРИТЕТ)

**Модуль**: `src/lib/forms/core/nodes/`

**FieldNode** - добавить методы:
- `watch(callback: (value: T) => void): () => void` - подписка на изменения поля
- `computeFrom(sources, computeFn): () => void` - вычисляемое значение из других полей

**GroupNode** - добавить методы:
- `linkFields(source, target, transform?)` - связь двух полей
- `watchField(fieldPath, callback)` - подписка на вложенное поле по строковому пути

**ArrayNode** - добавить методы:
- `watchItems(fieldKey, callback)` - подписка на изменения элементов массива
- `watchLength(callback)` - подписка на изменение длины массива

### Фаза 2: Декларативный API (СРЕДНИЙ ПРИОРИТЕТ)

**Модуль**: `src/lib/forms/behaviors/`

Создать следующие файлы и функции:

**behavior-registry.ts**:
- `BehaviorRegistry` класс - регистрация и управление подписками

**behavior-context.ts**:
- `BehaviorContext<TForm>` интерфейс - контекст для callback функций
- `BehaviorContextImpl<TForm>` класс - реализация контекста

**schema-behaviors.ts**:
- `copyFrom(target, source, options)` - копирование значений между полями
- `enableWhen(field, condition)` / `disableWhen(field, condition)` - условное enable/disable
- `showWhen(field, condition)` / `hideWhen(field, condition)` - условное отображение
- `computeFrom(target, sources, computeFn, options)` - вычисляемые поля
- `watchField(field, callback, options)` - подписка на изменения с контекстом
- `revalidateWhen(target, triggers, options)` - перевалидация при изменении других полей
- `syncFields(field1, field2, options)` - двусторонняя синхронизация

**GroupNode** - добавить метод:
- `applyBehaviorSchema(schema: BehaviorSchemaFn<T>): void` - применение behavior схемы

### Фаза 3: React хуки (НИЗКИЙ ПРИОРИТЕТ, ОПЦИОНАЛЬНО)

**Модуль**: `src/lib/forms/hooks/`

Создать хуки для императивного использования в компонентах:
- `useFormEffect(callback, deps)` - обертка над effect для работ с signals
- `useComputedField(field, computeFn, deps)` - вычисляемое поле через хук
- `useCopyField(source, target, options)` - копирование через хук
- `useEnableWhen(field, condition)` - условное enable через хук

## Ключевые требования

1. **Использовать @preact/signals** для подписок через `effect()`
2. **Типобезопасность**: все функции должны корректно выводить типы через `FieldPath<T>`
3. **Обратная совместимость**: не ломать существующий API
4. **Auto-cleanup**: автоматическая очистка подписок при unmount
5. **Защита от циклов**: использовать `{ emitEvent: false }` при программных обновлениях
6. **Debounce поддержка**: для частых изменений (вычисления, валидация)
7. **Следовать паттернам**: аналогично ValidationSchema API

## Примеры использования

См. примеры 1-20 в [docs/DECLARATIVE_BEHAVIOR_SCHEMA_DETAILED.md](docs/DECLARATIVE_BEHAVIOR_SCHEMA_DETAILED.md)

Базовый пример:
```typescript
const behaviorSchema: BehaviorSchemaFn<MyForm> = (path) => {
  // Копирование адреса
  copyFrom(path.residenceAddress, path.registrationAddress, {
    when: (form) => form.sameAsRegistration === true
  });

  // Условное отображение
  enableWhen(path.propertyValue, (form) => form.loanType === 'mortgage');

  // Вычисляемое поле
  computeFrom(path.initialPayment, [path.propertyValue],
    ({ propertyValue }) => propertyValue * 0.2,
    { debounce: 300 }
  );
};

form.applyBehaviorSchema(behaviorSchema);
```

## Критерии успеха

- ✅ Все методы-помощники работают корректно (Фаза 1)
- ✅ Декларативный API реализован согласно спецификации (Фаза 2)
- ✅ Типы выводятся корректно в TypeScript
- ✅ Нет циклических зависимостей
- ✅ Подписки автоматически очищаются
- ✅ Работают все примеры из документации
- ✅ Добавлены unit тесты для основных сценариев
- ✅ Обратная совместимость сохранена

## Следующие шаги после реализации

1. Мигрировать CreditApplicationForm на новый API
2. Использовать для массивов (имущество, кредиты, созаемщики)
3. Собрать feedback и улучшить API при необходимости