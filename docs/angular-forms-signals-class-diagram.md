# Диаграмма классов Angular Forms Signals

Анализ архитектуры системы сигнальных форм Angular на основе исходного кода из https://github.com/angular/angular/tree/main/packages/forms/signals

## Диаграмма классов

```plantuml
@startuml Angular Forms Signals Class Diagram

!theme plain

' Core Interfaces
interface FormUiControl {
  +errors: ModelSignal<ValidationErrors>
  +disabled: ModelSignal<boolean>
  +readonly: ModelSignal<boolean>
  +invalid: ModelSignal<boolean>
  +pending: ModelSignal<boolean>
  +touched: ModelSignal<boolean>
  +dirty: ModelSignal<boolean>
  +minlength: ModelSignal<number>
  +maxlength: ModelSignal<number>
  +pattern: ModelSignal<string>
  +min: ModelSignal<number>
  +max: ModelSignal<number>
}

interface FormValueControl<TValue> {
  +value: ModelSignal<TValue>
}

interface FormCheckboxControl {
  +checked: ModelSignal<boolean>
}

' Field Types
class Field<TValue> <<type>> {
  +value: TValue
  +state: FieldState
  +schema: Schema
}

interface FieldState {
  +value: Signal<TValue>
  +touched: Signal<boolean>
  +dirty: Signal<boolean>
  +errors: Signal<ValidationErrors>
  +valid: Signal<boolean>
  +invalid: Signal<boolean>
  +disabled: Signal<boolean>
  +readonly: Signal<boolean>
  +hidden: Signal<boolean>
}

class FieldPath <<type>> {
  +segments: string[]
}

' Core Classes
class FieldNode {
  +state: FieldNodeState
  +logic: FieldLogicNode
  +adapter: FieldAdapter
  +proxy: FieldProxy
  +context: FieldContext
  +markAsTouched(): void
  +markAsDirty(): void
  +reset(): void
  +createChild(): FieldNode
}

class FieldNodeState {
  +dirty: Signal<boolean>
  +touched: Signal<boolean>
  +disabled: Signal<boolean>
  +readonly: Signal<boolean>
  +hidden: Signal<boolean>
  +markTouched(): void
  +markUntouched(): void
  +markDirty(): void
  +markPristine(): void
}

class InteropNgControl {
  +control: AbstractControl
  +valid: boolean
  +invalid: boolean
  +pending: boolean
  +disabled: boolean
  +enabled: boolean
  +touched: boolean
  +untouched: boolean
  +dirty: boolean
  +pristine: boolean
  +errors: ValidationErrors
  +updateValueAndValidity(): void
  +markAsTouched(): void
  +markAsUntouched(): void
}

' Validation Types
class FieldValidator<TValue> <<type>> {
  +(value: TValue, context: FieldContext) => ValidationResult
}

class TreeValidator<TValue> <<type>> {
  +(value: TValue, context: FieldContext) => ValidationResult
}

class ValidationResult <<type>> {
  +ValidationErrors | null
}

interface Schema<TValue> {
  +validators: FieldValidator<TValue>[]
  +treeValidators: TreeValidator<TValue>[]
  +disabled: boolean
  +readonly: boolean
  +hidden: boolean
}

' Context and Support Classes
interface FieldContext {
  +value: Signal<TValue>
  +touched: Signal<boolean>
  +dirty: Signal<boolean>
  +errors: Signal<ValidationErrors>
  +lookup(): FieldNode
}

class FieldAdapter {
  +node: FieldNode
  +adapt(): void
}

class FieldLogicNode {
  +schema: Schema
  +execute(): void
}

class FieldProxy {
  +target: FieldNode
  +navigate(): FieldNode
}

' Relationships
FormValueControl --|> FormUiControl : extends
FormCheckboxControl --|> FormUiControl : extends

FieldNode *-- FieldNodeState : contains
FieldNode *-- FieldLogicNode : contains
FieldNode *-- FieldAdapter : contains
FieldNode *-- FieldProxy : contains
FieldNode *-- FieldContext : contains

Field --> FieldState : has
Field --> Schema : has

FieldContext --> FieldNode : lookup
FieldLogicNode --> Schema : uses

Schema --> FieldValidator : contains
Schema --> TreeValidator : contains

InteropNgControl --> FieldNode : adapts

FieldValidator --> ValidationResult : returns
TreeValidator --> ValidationResult : returns

@enduml
```

## Описание архитектуры

### Основные компоненты:

#### 1. Интерфейсы форм
- **FormUiControl** - базовый интерфейс с общими свойствами для всех элементов управления формой
- **FormValueControl<TValue>** - расширяет FormUiControl для стандартных полей ввода с значением
- **FormCheckboxControl** - специализированный интерфейс для чекбоксов с состоянием checked

#### 2. Ядро системы
- **FieldNode** - центральный узел управления полем формы, содержит состояние, логику и адаптеры
- **FieldNodeState** - управляет состоянием поля (dirty, touched, disabled, readonly, hidden)
- **FieldContext** - предоставляет контекст для доступа к состоянию поля и навигации

#### 3. Валидация
- **FieldValidator<TValue>** - функция валидации отдельных полей
- **TreeValidator<TValue>** - функция валидации дерева полей и их дочерних элементов
- **Schema<TValue>** - схема с правилами валидации и логикой поля
- **ValidationResult** - результат валидации (ошибки или null)

#### 4. Интероперабельность
- **InteropNgControl** - мост между новыми сигнальными формами и существующими реактивными формами Angular

#### 5. Вспомогательные классы
- **FieldAdapter** - адаптер для работы с узлами полей
- **FieldLogicNode** - узел для выполнения логики схемы
- **FieldProxy** - прокси для навигации по графу формы
- **FieldPath** - представляет путь к полю в дереве формы

### Ключевые особенности:

1. **Сигнально-ориентированная архитектура** - использует Angular Signals для реактивного управления состоянием
2. **Типобезопасность** - строгая типизация с поддержкой generics
3. **Иерархическая структура** - поддержка вложенных форм и полей
4. **Гибкая валидация** - поддержка валидации на уровне поля и дерева
5. **Обратная совместимость** - интеграция с существующими Angular формами через InteropNgControl
6. **Модульность** - четкое разделение ответственности между компонентами

Архитектура обеспечивает мощную и гибкую систему управления формами с современным подходом на основе сигналов Angular.