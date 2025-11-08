# Диаграмма классов src/lib/forms/core (для draw.io)

## Инструкция по использованию

1. Откройте [draw.io](https://app.diagrams.net/)
2. Создайте новую диаграмму
3. Выберите **Arrange** → **Insert** → **Advanced** → **Mermaid**
4. Скопируйте содержимое из файла `class-diagram-clean.mmd` и вставьте в окно Mermaid
5. Нажмите **Insert**

## Содержание диаграммы

### Классы узлов (Nodes)

#### FormNode (абстрактный)
Базовый класс для всех узлов формы. Определяет единый интерфейс:
- **Signals**: value, valid, invalid, touched, dirty, pending, errors, status
- **Методы**: getValue, setValue, patchValue, reset, validate, setErrors, clearErrors
- **Состояние**: markAsTouched, markAsUntouched, markAsDirty, markAsPristine

#### FieldNode
Узел для простого поля с валидацией:
- Синхронные и асинхронные валидаторы
- Debounce для async валидации
- Race condition protection (validationId)
- Computed signals
- updateOn: 'change' | 'blur' | 'submit'
- Методы: watch, computeFrom, dispose

#### GroupNode
Узел для группы полей:
- Map полей (FieldNode, GroupNode, ArrayNode)
- Proxy для прямого доступа: `form.email`
- Cached value для оптимизации
- Применение validation и behavior схем
- Методы: submit, applyValidationSchema, applyBehaviorSchema, getFieldByPath

#### ArrayNode
Узел для массива форм:
- CRUD: push, removeAt, insert, clear
- Типизированный доступ: at(index)
- Итерация: forEach, map
- Применение схем к элементам
- Методы: watchItems, watchLength

### Контексты

#### ValidationContextImpl
Контекст для валидации отдельного поля:
- Доступ к значениям: getField, setField
- Поддержка вложенных путей: "address.city"
- Ссылки на form и control

#### TreeValidationContextImpl
Контекст для кросс-полевой валидации:
- Валидация на уровне всей формы
- Доступ к любым полям

#### BehaviorContextImpl
Контекст для behavior схем:
- Методы реактивного поведения
- Доступ к formNode через Proxy
- updateComponentProps, validateField, setErrors, clearErrors

### Реестры (Singletons)

#### ValidationRegistryClass
Управление валидаторами:
- Стек контекстов (beginRegistration, endRegistration)
- WeakMap для связей форм и валидаторов
- Типы: sync, async, tree, array-items

#### RegistrationContext
Контекст регистрации валидаторов:
- Хранение валидаторов
- Стек условий (applyWhen)

#### BehaviorRegistryClass
Управление behaviors:
- Типы: copy, enable, show, compute, watch, revalidate, sync
- Создание effect подписок
- Debounce support

### Интерфейсы

#### Resource интерфейсы
- **ResourceItem**: id, label, value
- **ResourceResult**: items, totalCount
- **ResourceConfig**: type, load
- **ResourceLoadParams**: search, page, pageSize

#### Behavior интерфейсы
- **BehaviorContext**: методы для работы с формой
- **BehaviorRegistration**: регистрация behavior
- **CopyFromOptions**: опции копирования
- **EnableWhenOptions**: опции enable/disable
- **ComputeFromOptions**: опции вычислений
- **WatchFieldOptions**: опции подписки
- **RevalidateWhenOptions**: опции перевалидации
- **SyncFieldsOptions**: опции синхронизации

#### Validation интерфейсы
- **ValidationContext**: контекст валидации поля
- **TreeValidationContext**: контекст кросс-полевой валидации
- **ValidatorRegistration**: регистрация валидатора
- **ValidateOptions**: опции синхронной валидации
- **ValidateAsyncOptions**: опции async валидации
- **ValidateTreeOptions**: опции tree валидации

## Отношения

### Наследование
- FormNode ← FieldNode, GroupNode, ArrayNode
- ValidationContext ← ValidationContextImpl
- TreeValidationContext ← TreeValidationContextImpl
- BehaviorContext ← BehaviorContextImpl

### Композиция
- GroupNode содержит Map<K, FormNode> fields
- ArrayNode содержит Signal<FormNode[]> items
- ValidationRegistryClass содержит RegistrationContext[]
- RegistrationContext содержит ValidatorRegistration[]
- BehaviorRegistryClass содержит BehaviorRegistration[]

### Ассоциации
- GroupNode создаёт ValidationContextImpl, TreeValidationContextImpl, BehaviorContextImpl
- ValidationContextImpl → GroupNode (form), FieldNode (control)
- TreeValidationContextImpl → GroupNode (form)
- BehaviorContextImpl → GroupNode (form)
- ValidationRegistryClass управляет GroupNode
- BehaviorRegistryClass управляет GroupNode
- ResourceConfig возвращает ResourceResult, принимает ResourceLoadParams
- ResourceResult содержит ResourceItem[]

## Ключевые паттерны

1. **Наследование**: Единый интерфейс FormNode для всех типов узлов
2. **Композиция**: Рекурсивная структура (GroupNode → FormNode[])
3. **Singleton**: ValidationRegistry, BehaviorRegistry
4. **Proxy**: GroupNode возвращает Proxy для прямого доступа
5. **Computed Signals**: Производительность O(1) вместо O(n)
6. **Effect Subscriptions**: Реактивное поведение через @preact/signals
7. **Registry Pattern**: Централизованное управление валидаторами и behaviors
8. **Context Pattern**: Передача контекста в валидаторы и behaviors

## Статистика

- **Классы**: 12 (FormNode, FieldNode, GroupNode, ArrayNode, ValidationContextImpl, TreeValidationContextImpl, BehaviorContextImpl, ValidationRegistryClass, RegistrationContext, BehaviorRegistryClass)
- **Интерфейсы**: 17 (ResourceItem, ResourceResult, ResourceConfig, ResourceLoadParams, BehaviorContext, BehaviorRegistration, CopyFromOptions, EnableWhenOptions, ComputeFromOptions, WatchFieldOptions, RevalidateWhenOptions, SyncFieldsOptions, ValidationContext, TreeValidationContext, ValidatorRegistration, ValidateOptions, ValidateAsyncOptions, ValidateTreeOptions)
- **Всего сущностей**: 29
- **Отношений наследования**: 7
- **Отношений композиции**: 5
- **Отношений ассоциации**: 12