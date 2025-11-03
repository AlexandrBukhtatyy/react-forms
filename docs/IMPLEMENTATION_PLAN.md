# План доработок React Forms Library

**Дата создания**: 2025-11-03
**На основе**: [CODE_REVIEW.md](CODE_REVIEW.md) от 2025-11-02
**Версия**: 1.0
**Статус**: Draft

---

## Executive Summary

Этот план описывает пошаговую реализацию исправлений и улучшений для библиотеки React Forms на основе проведенного код-ревью. План разбит на 3 фазы с четкими приоритетами и оценками трудозатрат.

### Общая статистика

- **Всего задач**: 23 (3 критические, 8 важных, 12 предложений)
- **Общая оценка**: 12-14 недель для 1 разработчика
- **Фаза 1 (P0)**: 1-2 недели (критично для production)
- **Фаза 2 (P1)**: 2-3 недели (важные улучшения)
- **Фаза 3 (P2-P3)**: 8-10 недель (опциональные features)

### Метрики успеха

После выполнения всех задач:
- Memory leaks: 0 (через Chrome DevTools)
- Type safety: 100% для публичного API
- Test coverage: 90%+ unit, 20+ integration
- Performance: +30% для больших форм (50+ полей)

---

# ФАЗА 1: Критические исправления (P0)

**Timeline**: Week 1-2
**Estimated effort**: 60-80 часов (1.5-2 недели для 1 dev)
**Goal**: Исправить блокирующие production проблемы

---

## 1. Исправить Memory Leak в реактивных методах

**Приоритет**: P0 (Critical)
**Оценка трудозатрат**: High (20-24 часа)
**Затрагиваемые файлы**:
- [src/lib/forms/core/nodes/field-node.ts](../src/lib/forms/core/nodes/field-node.ts#L325-L368) - добавить disposers массив
- [src/lib/forms/core/nodes/group-node.ts](../src/lib/forms/core/nodes/group-node.ts#L578-L649) - аналогично
- [src/lib/forms/core/nodes/array-node.ts](../src/lib/forms/core/nodes/array-node.ts#L404-L449) - аналогично
- [src/lib/forms/core/nodes/form-node.ts](../src/lib/forms/core/nodes/form-node.ts) - добавить dispose() в базовый класс
- Новый файл: [src/examples/cleanup-example.tsx](../src/examples/cleanup-example.tsx)

**Проблема**:
Методы `watch()`, `computeFrom()`, `linkFields()`, `watchField()` не имеют централизованного cleanup механизма. При unmount React компонента subscriptions не очищаются, что приводит к memory leak и "zombie subscriptions". На больших формах с 50+ полями утечка значительна.

**Решение**:

1. **FieldNode.ts** (5 часов):
   - [ ] Добавить `private disposers: Array<() => void> = []`
   - [ ] Обновить `watch()`: регистрировать disposer в массиве, возвращать обертку для удаления
   - [ ] Обновить `computeFrom()`: аналогично
   - [ ] Реализовать `dispose()`: очистить все disposers + debounce timer
   - [ ] Написать unit тесты на cleanup (5 тестов)

2. **GroupNode.ts** (7 часов):
   - [ ] Добавить `private disposers: Array<() => void> = []`
   - [ ] Обновить `linkFields()`: регистрировать disposer
   - [ ] Обновить `watchField()`: регистрировать disposer
   - [ ] Реализовать `dispose()`: очистить disposers + рекурсивно дочерние узлы
   - [ ] Написать unit тесты на рекурсивный cleanup (7 тестов)

3. **ArrayNode.ts** (5 часов):
   - [ ] Добавить `private disposers: Array<() => void> = []`
   - [ ] Обновить `watchItems()`, `watchLength()`: регистрировать disposers
   - [ ] Реализовать `dispose()`: очистить disposers + элементы массива
   - [ ] Написать unit тесты (5 тестов)

4. **FormNode.ts** (2 часа):
   - [ ] Добавить абстрактный метод `dispose?(): void` в интерфейс
   - [ ] Обновить JSDoc с примерами использования

5. **Integration тесты** (5 часов):
   - [ ] Тест: unmount React компонента → проверить, что subscriptions очищены
   - [ ] Тест: большая форма с 50+ полями → проверить отсутствие leak через Chrome DevTools
   - [ ] Тест: динамическое добавление/удаление полей → проверить cleanup
   - [ ] Тест: вложенные формы (3 уровня) → проверить рекурсивный cleanup
   - [ ] Тест: массивы полей → проверить cleanup элементов

**Критерии приемки**:
- [ ] Все disposers регистрируются в централизованном массиве
- [ ] `dispose()` очищает все subscriptions
- [ ] Рекурсивный cleanup работает для вложенных форм
- [ ] Unit тесты: 95%+ coverage для новой логики
- [ ] Integration тест: memory leak не обнаружен через Chrome DevTools (Heap Snapshot)
- [ ] No breaking changes (метод `dispose()` опциональный)
- [ ] Backward compatibility: старые disposers продолжают работать

**Зависимости**:
- Блокирует: #2, #3 (нужно сначала исправить memory leak)
- Зависит от: нет

**Performance impact**:
- Memory usage: -30% для больших форм с 50+ полями
- CPU usage: без изменений (overhead < 1%)
- Метрики:
  - Количество subscriptions после unmount → должно быть 0
  - Memory growth rate → должен быть 0 при mount/unmount цикле

**Documentation**:
- [ ] Обновить [MIGRATION.md](../src/lib/forms/MIGRATION.md) - добавить раздел "Cleanup and Memory Management"
- [ ] Обновить [CLAUDE.md](../CLAUDE.md) - добавить примеры использования dispose()
- [ ] Добавить example: [cleanup-example.tsx](../src/examples/cleanup-example.tsx) - 3 сценария

**Risks & Mitigation**:
- **Риск**: Breaking change для пользователей, использующих disposers напрямую
  - **Mitigation**: Disposer должен быть backward compatible (возвращать обертку, а не оригинал)
  - **Rollback**: Реверсия commit, использовать feature flag
- **Риск**: Performance overhead от хранения disposers в массиве
  - **Mitigation**: Массив disposers + cleanup дешевле, чем memory leak
  - **Benchmark**: Измерить overhead (должен быть < 1%)

---

## 2. Исправить Type Safety в ValidationContext

**Приоритет**: P0 (Critical)
**Оценка трудозатрат**: Medium (12-16 часов)
**Затрагиваемые файлы**:
- [src/lib/forms/validators/validation-context.ts](../src/lib/forms/validators/validation-context.ts#L28-L78) - улучшить типизацию getField/setField
- [src/tests/unit/forms/validators/validation-context.test.ts](../src/tests/unit/forms/validators/validation-context.test.ts) - обновить тесты

**Проблема**:
Использование `any` в методах `getField()` и `setField()` теряет type safety. TypeScript не может отловить ошибки обращения к несуществующим полям, автокомплит не работает, refactoring не безопасен.

**Решение**:

1. **ValidationContextImpl** (6 часов):
   - [ ] Улучшить типизацию `getField<K extends keyof TForm>(path: K | string)`
   - [ ] Улучшить типизацию `setField<K extends keyof TForm>(path: K | string, value)`
   - [ ] Добавить type guard `private isFormNode(value: any): value is FormNode<any>`
   - [ ] Реализовать `private resolveNestedPath(path: string): any` для string paths
   - [ ] Реализовать `private setNestedPath(path: string, value: any): void`
   - [ ] Добавить dev-mode warnings для несуществующих путей

2. **TreeValidationContextImpl** (4 часа):
   - [ ] Применить те же улучшения типизации
   - [ ] Переиспользовать type guards и helpers

3. **Unit тесты** (4 часа):
   - [ ] Тест: type-safe key access с автокомплитом
   - [ ] Тест: string path для вложенных полей ('address.city')
   - [ ] Тест: несуществующий путь → должен вернуть undefined + warning
   - [ ] Тест: type guard корректно определяет FormNode
   - [ ] Тест: setField с type-safe ключами
   - [ ] Тест: setField с string path

4. **Type tests** (2 часа):
   - [ ] Добавить type-level тесты (tsd или dtslint)
   - [ ] Проверить, что TypeScript отлавливает ошибки

**Критерии приемки**:
- [ ] Zero использований `any` в getField/setField (кроме fallback для string paths)
- [ ] Type guards используются вместо duck typing
- [ ] TypeScript автокомплит работает для ключей
- [ ] Dev-mode warnings для несуществующих путей
- [ ] Unit тесты: 100% coverage для новой логики
- [ ] Type-level тесты проходят

**Зависимости**:
- Блокирует: нет
- Зависит от: #1 (лучше делать после исправления memory leak)

**Performance impact**:
- Runtime performance: без изменений
- Compile time: +5-10% (более строгая типизация)
- Developer productivity: +20% (автокомплит, type checking)

**Documentation**:
- [ ] Обновить JSDoc для getField/setField с примерами
- [ ] Добавить пример type-safe кросс-полевой валидации
- [ ] Обновить [validation-example.ts](../src/examples/validation-example.ts)

**Risks & Mitigation**:
- **Риск**: Breaking change, если кто-то использовал внутренние any типы
  - **Mitigation**: Внутренняя имплементация, public API остается совместимым
- **Риск**: TypeScript ошибки в существующем коде
  - **Mitigation**: Постепенная миграция, добавить `@ts-expect-error` временно

---

## 3. Исправить Race Condition в async валидации

**Приоритет**: P0 (Critical)
**Оценка трудозатрат**: Medium (10-14 часов)
**Затрагиваемые файлы**:
- [src/lib/forms/core/nodes/field-node.ts](../src/lib/forms/core/nodes/field-node.ts#L192-L245) - добавить проверки validationId
- [src/tests/unit/forms/core/field-node-validation.test.ts](../src/tests/unit/forms/core/field-node-validation.test.ts) - тесты на race conditions

**Проблема**:
Multiple concurrent async validations могут привести к race condition: результаты старых валидаций перезаписывают результаты новых. Критично для debounced async валидации и быстрого ввода.

**Решение**:

1. **validateImmediate()** (4 часа):
   - [ ] Добавить проверку `validationId` после синхронной валидации (перед установкой errors)
   - [ ] Добавить проверку перед установкой `_pending.value = true`
   - [ ] Добавить проверку после `Promise.all()` (перед установкой `_pending.value = false`)
   - [ ] Добавить проверку перед обработкой asyncResults
   - [ ] Добавить финальную проверку перед очисткой errors

2. **validate() с debounce** (3 часа):
   - [ ] Запоминать `validationId` до выполнения валидации
   - [ ] Проверять после debounce timeout, не была ли запущена новая валидация
   - [ ] Resolve promise только если validation актуальна

3. **Unit тесты** (5 часов):
   - [ ] Тест: быстрое изменение значения (5 изменений за 100ms) → только последняя валидация применяется
   - [ ] Тест: медленная async валидация (500ms) → результат игнорируется если было новое изменение
   - [ ] Тест: debounced валидация → старые debounce cancellируются
   - [ ] Тест: параллельные валидации (разные поля) → не влияют друг на друга
   - [ ] Тест: validationId increment корректно работает

4. **Integration тесты** (2 часа):
   - [ ] Тест: real-world сценарий с typing в input → проверить финальное состояние
   - [ ] Тест: network delay симуляция → проверить корректный порядок

**Критерии приемки**:
- [ ] Проверка `validationId` перед КАЖДЫМ изменением state
- [ ] Старые валидации не перезаписывают новые
- [ ] Debounce корректно cancellирует старые validations
- [ ] Unit тесты: 100% coverage для race condition scenarios
- [ ] Integration тесты: real-world сценарии работают корректно
- [ ] No breaking changes

**Зависимости**:
- Блокирует: нет
- Зависит от: #1 (желательно, но не обязательно)

**Performance impact**:
- Validation speed: без изменений
- Race conditions: 0 (было: 30-40% при быстром вводе)
- User experience: значительное улучшение (актуальные ошибки)

**Documentation**:
- [ ] Обновить JSDoc для validate() с объяснением race protection
- [ ] Добавить example: async-validation-race-example.tsx
- [ ] Обновить [validation-example.ts](../src/examples/validation-example.ts)

**Risks & Mitigation**:
- **Риск**: Излишние проверки могут замедлить валидацию
  - **Mitigation**: Проверка validationId - это O(1) операция
  - **Benchmark**: Измерить overhead (должен быть < 0.1ms)
- **Риск**: Edge cases с очень быстрым вводом
  - **Mitigation**: Комплексные integration тесты

---

# ФАЗА 2: Важные улучшения (P1)

**Timeline**: Week 3-5
**Estimated effort**: 80-100 часов (2-2.5 недели для 1 dev)
**Goal**: Улучшить архитектуру и API completeness

---

## 4. Добавить disable/enable в ArrayNode

**Приоритет**: P1
**Оценка трудозатрат**: Low (4-6 часов)
**Затрагиваемые файлы**:
- [src/lib/forms/core/nodes/array-node.ts](../src/lib/forms/core/nodes/array-node.ts#L33-L450) - добавить методы

**Проблема**:
ArrayNode не имплементирует опциональные методы `disable()` и `enable()` из FormNode. Нарушается Liskov Substitution Principle, невозможно отключить весь массив полей программно.

**Решение**:

1. **ArrayNode.ts** (3 часа):
   - [ ] Реализовать `disable()`: итерация по items + вызов disable() для каждого
   - [ ] Реализовать `enable()`: аналогично
   - [ ] Добавить type guard проверку перед вызовом методов
   - [ ] Обновить JSDoc с примерами

2. **Unit тесты** (2 часа):
   - [ ] Тест: disable() отключает все элементы массива
   - [ ] Тест: enable() включает все элементы
   - [ ] Тест: вложенные массивы - рекурсивный disable/enable
   - [ ] Тест: disable/enable на пустом массиве (edge case)

**Критерии приемки**:
- [ ] `disable()` и `enable()` реализованы
- [ ] Рекурсивно работает для вложенных структур
- [ ] Unit тесты: 100% coverage
- [ ] No breaking changes
- [ ] API consistency с FieldNode и GroupNode

**Зависимости**:
- Блокирует: нет
- Зависит от: #1 (для dispose в тестах)

**Performance impact**:
- Performance: O(n) где n - количество элементов (ожидаемо)
- Memory: без изменений

**Documentation**:
- [ ] Обновить JSDoc для ArrayNode
- [ ] Добавить пример в [group-node-config-example.ts](../src/examples/group-node-config-example.ts)

---

## 5. Оптимизировать GroupNode.value (reference equality)

**Приоритет**: P1
**Оценка трудозатрат**: Medium (12-16 часов)
**Затрагиваемые файлы**:
- [src/lib/forms/core/nodes/group-node.ts](../src/lib/forms/core/nodes/group-node.ts#L132-L138) - оптимизировать computed
- Новый файл: [src/lib/forms/utils/shallow-compare.ts](../src/lib/forms/utils/shallow-compare.ts)

**Проблема**:
`value` computed создает новый объект при каждом чтении, нарушая reference equality. React components re-render даже если значения не изменились, `useMemo`/`useEffect` dependencies считают значение всегда новым.

**Решение**:

**Подход 1: Shallow comparison** (рекомендуется для начала):

1. **GroupNode.ts** (6 часов):
   - [ ] Добавить `private _cachedValue: Signal<T | null> = signal(null)`
   - [ ] Добавить `private _cachedFieldValues: Map<keyof T, any> = new Map()`
   - [ ] Обновить `value` computed: проверять изменения через shallow comparison
   - [ ] Возвращать кэшированный объект если нет изменений
   - [ ] Создавать новый объект только при реальных изменениях

2. **Unit тесты** (4 часа):
   - [ ] Тест: reference equality при отсутствии изменений
   - [ ] Тест: новый reference при изменении любого поля
   - [ ] Тест: cache hit rate > 95% для типичных сценариев
   - [ ] Тест: вложенные GroupNode - каждый свой кэш

3. **Performance benchmark** (3 часа):
   - [ ] Benchmark: форма с 50 полями, 100 render cycles
   - [ ] Измерить cache hit rate
   - [ ] Сравнить с предыдущей версией (ожидается -50% re-renders)

4. **Integration тесты** (3 часа):
   - [ ] Тест: React useEffect с form.value в dependencies
   - [ ] Тест: useMemo не пересчитывается при отсутствии изменений

**Подход 2: Immer structural sharing** (опционально, для будущего):
- [ ] Исследовать использование Immer produce для structural sharing
- [ ] Сравнить performance с Подходом 1

**Критерии приемки**:
- [ ] Reference equality сохраняется при отсутствии изменений
- [ ] Cache hit rate > 95% для типичных форм
- [ ] React re-renders сокращаются на 50%+
- [ ] Unit тесты: 100% coverage
- [ ] Performance benchmark показывает улучшение
- [ ] No breaking changes

**Зависимости**:
- Блокирует: нет
- Зависит от: #1 (для корректной работы с subscriptions)

**Performance impact**:
- React re-renders: -50% для форм без изменений
- Memory: +O(n) для кэша (незначительно)
- CPU: +O(n) для shallow comparison (амортизируется)
- Метрики:
  - Cache hit rate: > 95%
  - Re-render count: -50%

**Documentation**:
- [ ] Обновить [CLAUDE.md](../CLAUDE.md) - объяснить caching behavior
- [ ] Добавить example: performance-optimization-example.tsx
- [ ] Добавить раздел "Performance" в README

**Risks & Mitigation**:
- **Риск**: Cache invalidation bugs (кэш не обновляется)
  - **Mitigation**: Comprehensive unit тесты на все edge cases
- **Риск**: Memory overhead от кэша
  - **Mitigation**: Кэш только для value, не для intermediate results

---

## 6. Добавить form-level validation (errors)

**Приоритет**: P1
**Оценка трудозатрат**: Medium (10-14 часов)
**Затрагиваемые файлы**:
- [src/lib/forms/core/nodes/group-node.ts](../src/lib/forms/core/nodes/group-node.ts#L259-L261) - реализовать setErrors/clearErrors

**Проблема**:
`setErrors()` в GroupNode просто комментарий, нет поддержки form-level validation errors. Невозможно установить ошибки на уровне формы (например, server-side errors не связанные с конкретным полем).

**Решение**:

1. **GroupNode.ts** (6 часов):
   - [ ] Добавить `private _formErrors: Signal<ValidationError[]> = signal([])`
   - [ ] Реализовать `setErrors(errors: ValidationError[]): void`
   - [ ] Обновить `clearErrors()`: очищать form-level + field-level errors
   - [ ] Обновить computed `errors`: включать form-level errors
   - [ ] Обновить computed `valid`: учитывать form-level errors
   - [ ] Добавить JSDoc с примерами

2. **Unit тесты** (3 часа):
   - [ ] Тест: setErrors устанавливает form-level errors
   - [ ] Тест: clearErrors очищает все errors
   - [ ] Тест: computed errors включает form-level + field-level
   - [ ] Тест: computed valid учитывает form-level errors
   - [ ] Тест: вложенные GroupNode - каждый свои form-level errors

3. **Integration тесты** (3 часа):
   - [ ] Тест: submit с server-side error → setErrors → отображение в UI
   - [ ] Тест: field-specific + form-level errors одновременно
   - [ ] Тест: clearErrors перед повторным submit

4. **Example** (2 часа):
   - [ ] Создать пример с server-side validation
   - [ ] Показать обработку form-level + field-level errors

**Критерии приемки**:
- [ ] `setErrors()` реализован и работает
- [ ] `clearErrors()` очищает все типы errors
- [ ] Form-level errors включены в computed `errors`
- [ ] `valid` учитывает form-level errors
- [ ] Unit тесты: 100% coverage
- [ ] Integration тест: server-side validation сценарий
- [ ] No breaking changes

**Зависимости**:
- Блокирует: нет
- Зависит от: нет (можно делать параллельно)

**Performance impact**:
- Performance: без изменений (один дополнительный signal)
- Memory: +O(1) для _formErrors signal

**Documentation**:
- [ ] Обновить [validation-example.ts](../src/examples/validation-example.ts)
- [ ] Добавить пример server-side validation
- [ ] Обновить JSDoc для submit()

---

## 7. Добавить debounce в BehaviorContext.watchField

**Приоритет**: P1
**Оценка трудозатрат**: Low (6-8 часов)
**Затрагиваемые файлы**:
- [src/lib/forms/behaviors/schema-behaviors.ts](../src/lib/forms/behaviors/schema-behaviors.ts) - добавить options
- [src/lib/forms/behaviors/behavior-registry.ts](../src/lib/forms/behaviors/behavior-registry.ts) - реализовать debounce

**Проблема**:
`watchField()` в behavior schema не поддерживает debounce для async операций. Async операции (загрузка справочников) вызываются слишком часто, нет API consistency с validation (где есть debounce).

**Решение**:

1. **schema-behaviors.ts** (2 часа):
   - [ ] Добавить `options?: { debounce?: number }` в watchField signature
   - [ ] Обновить JSDoc с примером debounce
   - [ ] Передавать options в BehaviorRegistry

2. **behavior-registry.ts** (3 часа):
   - [ ] Обновить `endRegistration()`: обрабатывать debounce option
   - [ ] Реализовать debounce через setTimeout
   - [ ] Cleanup timeout при dispose
   - [ ] Cancellation старых timeouts при новых вызовах

3. **Unit тесты** (2 часа):
   - [ ] Тест: watchField без debounce - вызывается немедленно
   - [ ] Тест: watchField с debounce 300ms - вызывается через 300ms
   - [ ] Тест: быстрые изменения - только последнее срабатывает
   - [ ] Тест: dispose очищает timeout

4. **Example** (1 час):
   - [ ] Обновить [behavior-schema-example.ts](../src/examples/behavior-schema-example.ts)
   - [ ] Добавить пример с debounced async загрузкой справочника

**Критерии приемки**:
- [ ] `watchField()` поддерживает `debounce` option
- [ ] Debounce корректно cancellирует старые вызовы
- [ ] Cleanup timeout при dispose
- [ ] Unit тесты: 100% coverage
- [ ] API consistency с validation debounce
- [ ] No breaking changes (option опциональная)

**Зависимости**:
- Блокирует: нет
- Зависит от: #1 (для корректного cleanup)

**Performance impact**:
- API requests: -70% для типичных сценариев (debounce 300ms)
- CPU: незначительное улучшение (меньше callbacks)

**Documentation**:
- [ ] Обновить JSDoc для watchField
- [ ] Добавить пример в behavior-schema-example.ts
- [ ] Обновить [CLAUDE.md](../CLAUDE.md)

---

## 8. Добавить type guards для FormNode типов

**Приоритет**: P1
**Оценка трудозатрат**: Low (4-6 часов)
**Затрагиваемые файлы**:
- [src/lib/forms/core/nodes/form-node.ts](../src/lib/forms/core/nodes/form-node.ts) - добавить type guards
- [src/lib/forms/core/nodes/array-node.ts](../src/lib/forms/core/nodes/array-node.ts#L284) - использовать type guards

**Проблема**:
Нет type guards для проверки типов узлов (FieldNode, GroupNode, ArrayNode) в runtime. Duck typing менее надежен, TypeScript не может помочь с narrowing.

**Решение**:

1. **form-node.ts** (2 часа):
   - [ ] Реализовать `isFieldNode<T>(node: FormNode): node is FieldNode<T>`
   - [ ] Реализовать `isGroupNode<T>(node: FormNode): node is GroupNode<T>`
   - [ ] Реализовать `isArrayNode<T>(node: FormNode): node is ArrayNode<T>`
   - [ ] Экспортировать type guards
   - [ ] Добавить JSDoc с примерами

2. **Использование в коде** (2 часа):
   - [ ] Заменить duck typing на type guards в array-node.ts
   - [ ] Заменить в других местах кодовой базы
   - [ ] Grep поиск `'applyValidationSchema' in` и заменить

3. **Unit тесты** (2 часа):
   - [ ] Тест: isFieldNode корректно определяет FieldNode
   - [ ] Тест: isGroupNode корректно определяет GroupNode
   - [ ] Тест: isArrayNode корректно определяет ArrayNode
   - [ ] Тест: false negatives для других типов
   - [ ] Тест: TypeScript type narrowing работает

**Критерии приемки**:
- [ ] Type guards реализованы и экспортированы
- [ ] Duck typing заменен на type guards
- [ ] TypeScript type narrowing работает
- [ ] Unit тесты: 100% coverage
- [ ] No breaking changes

**Зависимости**:
- Блокирует: нет
- Зависит от: нет (можно делать параллельно)

**Performance impact**:
- Runtime performance: без изменений (type guards - это простые проверки)
- Developer experience: улучшение (type narrowing)

**Documentation**:
- [ ] Добавить JSDoc для type guards
- [ ] Добавить пример использования в [group-node-config-example.ts](../src/examples/group-node-config-example.ts)

---

## 9. Добавить error handling в async validators

**Приоритет**: P1
**Оценка трудозатрат**: Low (4-6 часов)
**Затрагиваемые файлы**:
- [src/lib/forms/core/nodes/field-node.ts](../src/lib/forms/core/nodes/field-node.ts#L214-L216) - обернуть в try-catch

**Проблема**:
Если async validator выбрасывает исключение, валидация ломается без уведомления пользователя. `Promise.all()` отклоняется и весь процесс валидации останавливается.

**Решение**:

1. **field-node.ts** (2 часа):
   - [ ] Обернуть каждый async validator в try-catch
   - [ ] При ошибке логировать в dev-mode (`import.meta.env.DEV`)
   - [ ] Возвращать ValidationError вместо throw
   - [ ] Добавить error code: 'validator_error'

2. **Unit тесты** (2 часа):
   - [ ] Тест: validator выбрасывает Error → форма invalid с validator_error
   - [ ] Тест: один validator ломается → другие продолжают работать
   - [ ] Тест: dev-mode console.error вызывается
   - [ ] Тест: production mode - нет console.error

3. **Integration тест** (2 часа):
   - [ ] Тест: network timeout в async validator
   - [ ] Тест: malformed response от API
   - [ ] Тест: несколько validators, один ломается

**Критерии приемки**:
- [ ] Async validators обернуты в try-catch
- [ ] Ошибки логируются в dev-mode
- [ ] Validation продолжается при ошибке в одном validator
- [ ] Unit тесты: 100% coverage
- [ ] No breaking changes

**Зависимости**:
- Блокирует: нет
- Зависит от: #3 (хорошо комбинируется с race condition fix)

**Performance impact**:
- Performance: без изменений (try-catch overhead минимален)
- Reliability: значительное улучшение

**Documentation**:
- [ ] Обновить JSDoc для asyncValidators
- [ ] Добавить best practices для error handling
- [ ] Обновить [validation-example.ts](../src/examples/validation-example.ts)

---

## 10. Сделать getFieldByPath публичным методом

**Приоритет**: P1
**Оценка трудозатрат**: Low (4-6 часов)
**Затрагиваемые файлы**:
- [src/lib/forms/core/nodes/group-node.ts](../src/lib/forms/core/nodes/group-node.ts#L381-L395) - сделать публичным

**Проблема**:
`getFieldByPath()` приватный, но может быть полезен для динамических форм, integration с внешними библиотеками, debugging.

**Решение**:

1. **group-node.ts** (2 часа):
   - [ ] Изменить `private` на `public`
   - [ ] Добавить поддержку array index: "items[0].name"
   - [ ] Улучшить типизацию возвращаемого значения
   - [ ] Обновить JSDoc с примерами и edge cases

2. **Unit тесты** (2 часа):
   - [ ] Тест: simple path "email" → FieldNode
   - [ ] Тест: nested path "address.city" → FieldNode
   - [ ] Тест: array index "items[0]" → FormNode
   - [ ] Тест: complex path "items[0].address.city" → FieldNode
   - [ ] Тест: несуществующий путь → undefined
   - [ ] Тест: invalid array index "items[999]" → undefined

3. **Example** (2 часа):
   - [ ] Добавить пример динамической формы с getFieldByPath
   - [ ] Показать use case для external libraries

**Критерии приемки**:
- [ ] Метод публичный и экспортирован
- [ ] Поддержка array index синтаксиса
- [ ] Unit тесты: 100% coverage для edge cases
- [ ] JSDoc с подробными примерами
- [ ] No breaking changes (метод был приватным)

**Зависимости**:
- Блокирует: нет
- Зависит от: нет

**Performance impact**:
- Performance: O(n) где n - глубина пути (ожидаемо)

**Documentation**:
- [ ] JSDoc с 3-4 примерами
- [ ] Добавить в [group-node-config-example.ts](../src/examples/group-node-config-example.ts)

---

## 11. Добавить валидацию в ArrayNode.setValue()

**Приоритет**: P1
**Оценка трудозатрат**: Low (3-4 часа)
**Затрагиваемые файлы**:
- [src/lib/forms/core/nodes/array-node.ts](../src/lib/forms/core/nodes/array-node.ts#L190-L193) - добавить validate() call

**Проблема**:
`setValue()` в ArrayNode не вызывает валидацию после установки значений. Inconsistency с FieldNode, форма может быть invalid но статус valid.

**Решение**:

1. **array-node.ts** (1 час):
   - [ ] Вызывать `this.validate()` после `values.forEach`
   - [ ] Проверять `options?.emitEvent !== false`
   - [ ] Fire and forget (не ждать результат)

2. **Unit тесты** (2 часа):
   - [ ] Тест: setValue вызывает валидацию
   - [ ] Тест: setValue с `emitEvent: false` не вызывает валидацию
   - [ ] Тест: статус обновляется корректно после setValue
   - [ ] Тест: async validators выполняются

**Критерии приемки**:
- [ ] Валидация вызывается после setValue
- [ ] Опция `emitEvent: false` работает
- [ ] API consistency с FieldNode
- [ ] Unit тесты: 100% coverage
- [ ] No breaking changes (behavior улучшается)

**Зависимости**:
- Блокирует: нет
- Зависит от: #3 (хорошо комбинируется с race condition fix)

**Performance impact**:
- Performance: может быть медленнее если много validators (ожидаемо)
- Correctness: значительное улучшение

**Documentation**:
- [ ] Обновить JSDoc для setValue
- [ ] Упомянуть validation behavior

---

# ФАЗА 3: Дополнительные улучшения (P2-P3)

**Timeline**: Week 6+
**Estimated effort**: 60-80 часов (опционально, инкрементально)
**Goal**: Nice-to-have features для улучшения DX

## Краткий список задач (12-23)

Эти задачи опциональные и могут быть реализованы по мере необходимости на основе пользовательского feedback:

### 12. Добавить метод isDirty для конкретных полей
**Оценка**: Low (3-4 часа)
**Польза**: Conditional save для больших форм

### 13. Добавить метод touchAll()
**Оценка**: Low (2-3 часа)
**Польза**: Shortcut для показа всех ошибок перед submit

### 14. Добавить метод getErrors() с фильтрацией
**Оценка**: Medium (6-8 часов)
**Польза**: Фильтрация ошибок по кодам/полям для summary

### 15. Добавить snapshot/restore для отмены изменений
**Оценка**: Medium (8-10 часов)
**Польза**: Реализация Cancel кнопки, undo/redo

### 16. Добавить метод compareWith() для diff
**Оценка**: Medium (6-8 часов)
**Польза**: PATCH вместо PUT при сохранении

### 17. Добавить setValidateOn для dynamic trigger change
**Оценка**: Low (4-6 часов)
**Польза**: Адаптивная валидация (после submit → instant feedback)

### 18. Добавить batch updates
**Оценка**: High (12-16 часов)
**Польза**: Группировка изменений и одна валидация

### 19. Добавить focus management (focusFirstInvalid)
**Оценка**: Medium (8-10 часов)
**Польза**: UX улучшение при submit с ошибками

### 20. Добавить resetToInitial()
**Оценка**: Low (4-6 часов)
**Польза**: Различие между reset() и resetToInitial()

### 21. Dependency injection для validators/behaviors
**Оценка**: High (16-20 часов)
**Польза**: Улучшение testability

### 22. Custom error formatter
**Оценка**: Medium (8-10 часов)
**Польза**: Кастомизация ValidationError формата

### 23. Debug mode
**Оценка**: Medium (10-12 часов)
**Польза**: Подробное логирование всех изменений

---

# ROADMAP TIMELINE

## Week 1-2: Фаза 1 - Критические исправления (P0)

**Week 1**:
- [ ] День 1-3: #1 Memory Leak (20-24h)
- [ ] День 4-5: #2 Type Safety в ValidationContext (12-16h)

**Week 2**:
- [ ] День 1-2: #3 Race Condition в async валидации (10-14h)
- [ ] День 3: Code review и integration testing
- [ ] День 4-5: Bug fixes и stabilization

**Deliverable**: Production-ready библиотека без критических багов

---

## Week 3-5: Фаза 2 - Важные улучшения (P1)

**Week 3**:
- [ ] День 1: #4 disable/enable в ArrayNode (4-6h) ✓
- [ ] День 1-2: #5 Оптимизация GroupNode.value (12-16h)
- [ ] День 3-4: #6 Form-level validation (10-14h)
- [ ] День 5: #7 Debounce в watchField (6-8h) ✓

**Week 4** (параллельное выполнение):
- [ ] День 1-2: #8 Type guards (4-6h) + #9 Error handling (4-6h)
- [ ] День 3: #10 getFieldByPath публичный (4-6h) + #11 Валидация в setValue (3-4h)
- [ ] День 4-5: Integration testing для всех P1 задач

**Week 5**:
- [ ] День 1-3: Code review, documentation updates
- [ ] День 4-5: Performance benchmarks, bug fixes

**Deliverable**: Полнофункциональная библиотека с отличным DX

---

## Week 6+: Фаза 3 - Опциональные улучшения (P2-P3)

Реализация по необходимости на основе пользовательского feedback:
- [ ] Приоритет: #15 (snapshot/restore), #16 (compareWith), #19 (focusFirstInvalid)
- [ ] По запросу: остальные задачи из списка 12-23

---

# КРИТЕРИИ УСПЕХА

## После Фазы 1 (P0)

**Code Quality**:
- [ ] Zero memory leaks (проверено через Chrome DevTools)
- [ ] Zero race conditions в async валидации
- [ ] Zero `any` в ValidationContext

**Testing**:
- [ ] Unit test coverage: 90%+
- [ ] Integration tests: 10+ сценариев

**Performance**:
- [ ] Memory usage после unmount: 0 subscriptions
- [ ] Async validation: корректный порядок результатов в 100% случаев

---

## После Фазы 2 (P1)

**API Completeness**:
- [ ] ArrayNode имеет disable/enable
- [ ] GroupNode имеет form-level errors
- [ ] Type guards для всех типов узлов
- [ ] Debounce в behavior schema

**Performance**:
- [ ] GroupNode.value reference equality: 95%+ cache hit rate
- [ ] React re-renders: -50% для форм без изменений

**Testing**:
- [ ] Integration tests: 20+ сценариев
- [ ] E2E tests: 5+ реальных форм

**Documentation**:
- [ ] 100% публичных методов с JSDoc
- [ ] 10+ примеров использования
- [ ] Migration guide обновлен

---

## После Фазы 3 (P2-P3)

**Developer Experience**:
- [ ] Utility методы для всех частых use cases
- [ ] Debug mode для troubleshooting
- [ ] Focus management для UX

**Advanced Features**:
- [ ] Snapshot/restore для undo/redo
- [ ] Batch updates для performance
- [ ] DI для testability

---

# РИСКИ И MITIGATION

## Высокие риски

### 1. Breaking changes для пользователей
**Mitigation**:
- Все изменения должны быть backward compatible
- Feature flags для новой функциональности
- Подробный MIGRATION.md

### 2. Performance regression
**Mitigation**:
- Benchmarks до и после каждой оптимизации
- Performance budget: overhead < 5%
- Continuous performance monitoring

### 3. Недостаточное тестирование
**Mitigation**:
- Минимум 90% coverage для новой логики
- Integration tests для критических сценариев
- E2E tests для реальных форм

## Средние риски

### 4. Scope creep в Фазе 3
**Mitigation**:
- Строгая приоритизация
- User feedback перед реализацией
- Инкрементальный подход

### 5. Сложность поддержки кэша
**Mitigation**:
- Comprehensive unit тесты
- Clear documentation
- Simple implementation (shallow comparison)

---

# СЛЕДУЮЩИЕ ШАГИ

## Немедленные действия

1. **Review этого плана**:
   - [ ] Команда reviews план
   - [ ] Утверждение приоритетов
   - [ ] Согласование timeline

2. **Setup инфраструктуры**:
   - [ ] Настроить Chrome DevTools для memory leak тестирования
   - [ ] Настроить performance benchmarking
   - [ ] Создать шаблоны для PR и issues

3. **Начать Фазу 1**:
   - [ ] Создать feature branch для #1 Memory Leak
   - [ ] Начать имплементацию
   - [ ] Daily standups для tracking прогресса

---

**План подготовил**: Claude (AI Assistant)
**Дата**: 2025-11-03
**Базируется на**: CODE_REVIEW.md от 2025-11-02
**Следующий review**: После завершения Фазы 1