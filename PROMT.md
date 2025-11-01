# Промт для анализа библиотеки форм

## Контекст проекта

Библиотека форм на базе @preact/signals-react с архитектурой FormNode (аналог Angular AbstractControl).

**Текущее состояние**:
- ✅ FormNode, FieldNode, GroupNode, ArrayNode реализованы
- ✅ Validation Schema API (синхронная, асинхронная, кросс-полевая валидация)
- ✅ Behavior Schema API (copyFrom, enableWhen, computeFrom, watchField, revalidateWhen)
- ✅ Поддержка вложенных форм и массивов
- ✅ Computed signals для производительности
- ✅ GroupNode Proxy для прямого доступа к полям (form.email вместо form.controls.email)
- ✅ Новый API: все схемы (form, behavior, validation) в конструкторе GroupNode

**Последняя миграция** (2025-11-01):
- Мигрировали CreditApplicationForm на ArrayNode
- Создали модульные validation схемы для элементов массивов (property-validation.ts, existing-loan-validation.ts, co-borrower-validation.ts)
- Добавили `applyValidationSchema()` метод в ArrayNode
- Реализовали автоматическую очистку ArrayNode через watchField + ctx.formNode.clear()
- Исправили передачу Proxy-инстанса в BehaviorContext через _proxyInstance

**Известные проблемы**:
- ⚠️ В BehaviorRegistry.createWatchEffect было передано `callback(value, node, context)` вместо `callback(value, context)` - исправлено
- ⚠️ GroupNode._proxyInstance нужен для доступа к прокси в BehaviorContext

## Задачи для анализа

Проанализируй код модуля `src/lib/forms` и напиши рекомендации по:

1. **Архитектура и консистентность**:
   - Есть ли несоответствия между FormNode/FieldNode/GroupNode/ArrayNode API?
   - Правильно ли используется Proxy паттерн во всех местах?
   - Консистентна ли передача form/proxy в Registry классы?

2. **TypeScript типизация**:
   - Можно ли улучшить типы для GroupNodeWithControls?
   - Есть ли проблемы с `(form as any)._proxyInstance`?
   - Можно ли типизировать BehaviorContext.formNode без `any`?

3. **Производительность**:
   - Оптимальны ли computed signals?
   - Есть ли ненужные пересчёты в effects?
   - Правильно ли используется debounce в валидации и behaviors?

4. **Валидация**:
   - Корректна ли работа ValidationRegistry с вложенными путями?
   - Правильно ли применяются contextual validators?
   - Есть ли дублирование логики между sync/async валидаторами?

5. **Behavior Schema**:
   - Корректна ли реализация всех behavior функций (copyFrom, enableWhen, computeFrom, watchField, revalidateWhen)?
   - Правильно ли передаётся BehaviorContext во всех callbacks?
   - Есть ли потенциальные утечки памяти в cleanup функциях?

6. **ArrayNode**:
   - Правильно ли работает `applyValidationSchema()` для новых и существующих элементов?
   - Корректна ли реализация CRUD операций (push, removeAt, insert, clear)?
   - Есть ли проблемы с реактивностью при изменении массива?

7. **DX (Developer Experience)**:
   - Насколько интуитивен API для разработчиков?
   - Достаточно ли примеров и документации в комментариях?
   - Можно ли упростить создание форм?

## Формат ответа

**Для каждой категории**:
1. ✅ Что работает хорошо
2. ⚠️ Что требует внимания
3. 🔴 Критичные проблемы
4. 💡 Рекомендации по улучшению

**Приоритизация**: Укажи TOP-3 самых важных рефакторингов для следующей итерации.