# Диаграмма классов src/lib/forms/core

```mermaid
classDiagram
    %% ============================================================================
    %% Абстрактный базовый класс FormNode
    %% ============================================================================
    class FormNode~T~ {
        <<abstract>>
        +value: ReadonlySignal~T~
        +valid: ReadonlySignal~boolean~
        +invalid: ReadonlySignal~boolean~
        +touched: ReadonlySignal~boolean~
        +dirty: ReadonlySignal~boolean~
        +pending: ReadonlySignal~boolean~
        +errors: ReadonlySignal~ValidationError[]~
        +status: ReadonlySignal~FieldStatus~

        +getValue()* T
        +setValue(value: T, options?: SetValueOptions)* void
        +patchValue(value: Partial~T~)* void
        +reset(value?: T)* void
        +validate()* Promise~boolean~
        +setErrors(errors: ValidationError[])* void
        +clearErrors()* void
        +markAsTouched()* void
        +markAsUntouched()* void
        +markAsDirty()* void
        +markAsPristine()* void
        +touchAll() void
        +disable?() void
        +enable?() void
        +dispose?() void
    }

    %% ============================================================================
    %% FieldNode - узел для простого поля
    %% ============================================================================
    class FieldNode~T~ {
        -_value: Signal~T~
        -_errors: Signal~ValidationError[]~
        -_touched: Signal~boolean~
        -_dirty: Signal~boolean~
        -_status: Signal~FieldStatus~
        -_pending: Signal~boolean~
        -_componentProps: Signal~Record~
        -validators: ValidatorFn~T~[]
        -asyncValidators: AsyncValidatorFn~T~[]
        -updateOn: 'change' | 'blur' | 'submit'
        -initialValue: T
        -currentValidationId: number
        -debounceMs: number
        -validateDebounceTimer?: ReturnType~setTimeout~
        -validateDebounceResolve?: Function
        -disposers: Array~Function~
        +component: FieldConfig~T~['component']
        +componentProps: ReadonlySignal~Record~
        +shouldShowError: ReadonlySignal~boolean~

        +constructor(config: FieldConfig~T~)
        +getValue() T
        +setValue(value: T, options?: SetValueOptions) void
        +patchValue(value: Partial~T~) void
        +reset(value?: T) void
        +resetToInitial() void
        +validate(options?: {debounce?: number}) Promise~boolean~
        -validateImmediate() Promise~boolean~
        +setErrors(errors: ValidationError[]) void
        +clearErrors() void
        +markAsTouched() void
        +markAsUntouched() void
        +markAsDirty() void
        +markAsPristine() void
        +disable() void
        +enable() void
        +updateComponentProps(props: Partial~Record~) void
        +setUpdateOn(updateOn: 'change' | 'blur' | 'submit') void
        +watch(callback: Function) Function
        +computeFrom(sources: ReadonlySignal[], computeFn: Function) Function
        +dispose() void
    }

    %% ============================================================================
    %% GroupNode - узел для группы полей
    %% ============================================================================
    class GroupNode~T~ {
        -fields: Map~keyof T, FormNode~
        -_submitting: Signal~boolean~
        -_disabled: Signal~boolean~
        -_formErrors: Signal~ValidationError[]~
        -_cachedValue: T | null
        -_cachedFieldValues: Map~keyof T, any~
        -disposers: Array~Function~
        -_proxyInstance?: GroupNodeWithControls~T~
        +submitting: ReadonlySignal~boolean~

        +constructor(schema: FormSchema~T~)
        +constructor(config: GroupNodeConfig~T~)
        +getValue() T
        +setValue(value: T, options?: SetValueOptions) void
        +patchValue(value: Partial~T~) void
        +reset(value?: T) void
        +resetToInitial() void
        +validate() Promise~boolean~
        +setErrors(errors: ValidationError[]) void
        +clearErrors() void
        +markAsTouched() void
        +markAsUntouched() void
        +markAsDirty() void
        +markAsPristine() void
        +submit(onSubmit: Function) Promise
        +applyValidationSchema(schemaFn: ValidationSchemaFn~T~) void
        +applyBehaviorSchema(schemaFn: BehaviorSchemaFn~T~) Function
        +getFieldByPath(path: string) FormNode | undefined
        -parsePathWithArrays(path: string) string[]
        +applyContextualValidators(validators: any[]) Promise~void~
        -createNode(config: any) FormNode
        -extractValuesFromSchema(schema: any) any
        -isFieldConfig(config: any) boolean
        -isGroupConfig(config: any) boolean
        +linkFields(sourceKey: K1, targetKey: K2, transform?: Function) Function
        +watchField(fieldPath: string, callback: Function) Function
        +disable() void
        +enable() void
        +dispose() void
    }

    %% ============================================================================
    %% ArrayNode - узел для массива форм
    %% ============================================================================
    class ArrayNode~T~ {
        -items: Signal~FormNode~T~[]~
        -itemSchema: FormSchema~T~
        -initialItems: Partial~T~[]
        -disposers: Array~Function~
        -validationSchemaFn?: any
        -behaviorSchemaFn?: any
        +length: ReadonlySignal~number~

        +constructor(schema: FormSchema~T~, initialItems?: Partial~T~[])
        +push(initialValue?: Partial~T~) void
        +removeAt(index: number) void
        +insert(index: number, initialValue?: Partial~T~) void
        +clear() void
        +at(index: number) GroupNodeWithControls~T~ | undefined
        +getValue() T[]
        +setValue(values: T[], options?: SetValueOptions) void
        +patchValue(values: Partial~T~[]) void
        +reset(values?: T[]) void
        +resetToInitial() void
        +validate() Promise~boolean~
        +setErrors(errors: ValidationError[]) void
        +clearErrors() void
        +markAsTouched() void
        +markAsUntouched() void
        +markAsDirty() void
        +markAsPristine() void
        +forEach(callback: Function) void
        +map(callback: Function) Array
        -createItem(initialValue?: Partial~T~) FormNode~T~
        -isGroupSchema(schema: any) boolean
        +applyValidationSchema(schemaFn: any) void
        +applyBehaviorSchema(schemaFn: any) void
        +watchItems(fieldKey: K, callback: Function) Function
        +watchLength(callback: Function) Function
        +dispose() void
        +disable() void
        +enable() void
    }

    %% ============================================================================
    %% ValidationContextImpl - контекст валидации поля
    %% ============================================================================
    class ValidationContextImpl~TForm, TField~ {
        -form: GroupNode~TForm~
        -fieldKey: keyof TForm
        -control: FieldNode~TField~

        +constructor(form: GroupNode, fieldKey: keyof TForm, control: FieldNode)
        +value() TField
        +getField(path: K | string) any
        -resolveNestedPath(path: string) any
        +setField(path: string | K, value: any) void
        -setNestedPath(path: string, value: any) void
        +formValue() TForm
        +getControl() FieldNode~TField~
        +getForm() GroupNode~TForm~
    }

    %% ============================================================================
    %% TreeValidationContextImpl - контекст кросс-полевой валидации
    %% ============================================================================
    class TreeValidationContextImpl~TForm~ {
        -form: GroupNode~TForm~

        +constructor(form: GroupNode~TForm~)
        +getField(path: K | string) any
        -resolveNestedPath(path: string) any
        +formValue() TForm
        +getForm() GroupNode~TForm~
    }

    %% ============================================================================
    %% BehaviorContextImpl - контекст behavior схем
    %% ============================================================================
    class BehaviorContextImpl~TForm~ {
        -form: GroupNode~TForm~
        +formNode: GroupNodeWithControls~TForm~

        +constructor(form: GroupNode~TForm~)
        +getField(path: string) any
        +setField(path: string, value: any) void
        +updateComponentProps(field: FieldPathNode, props: Record) void
        +validateField(field: FieldPathNode) Promise~boolean~
        +setErrors(field: FieldPathNode, errors: ValidationError[]) void
        +clearErrors(field: FieldPathNode) void
        +getForm() TForm
        +getFieldNode(path: string) FormNode | undefined
        -resolveFieldNode(pathOrNode: string | FieldPathNode) FormNode | undefined
    }

    %% ============================================================================
    %% ValidationRegistryClass - реестр валидаторов (Singleton)
    %% ============================================================================
    class ValidationRegistryClass {
        -contextStack: RegistrationContext[]
        -formStoreMap: WeakMap~GroupNode, ValidatorRegistration[]~

        +beginRegistration() RegistrationContext
        +endRegistration(form: GroupNode) void
        +cancelRegistration() void
        +getCurrentContext() RegistrationContext | undefined
        +registerSync(fieldPath: string, validator: Function, options?: ValidateOptions) void
        +registerAsync(fieldPath: string, validator: Function, options?: ValidateAsyncOptions) void
        +registerTree(validator: TreeValidatorFn, options?: ValidateTreeOptions) void
        +enterCondition(fieldPath: string, conditionFn: ConditionFn) void
        +exitCondition() void
        +registerArrayItemValidation(fieldPath: string, itemSchemaFn: any) void
        +getValidators(form: GroupNode) ValidatorRegistration[] | undefined
        -applyValidators(form: GroupNode, validators: ValidatorRegistration[]) void
        -applyArrayItemValidators(form: GroupNode, validators: ValidatorRegistration[]) void
    }

    %% ============================================================================
    %% RegistrationContext - контекст регистрации валидаторов
    %% ============================================================================
    class RegistrationContext {
        -validators: ValidatorRegistration[]
        -conditionStack: Array~{fieldPath, conditionFn}~

        +addValidator(registration: ValidatorRegistration) void
        +enterCondition(fieldPath: string, conditionFn: ConditionFn) void
        +exitCondition() void
        +getValidators() ValidatorRegistration[]
    }

    %% ============================================================================
    %% BehaviorRegistryClass - реестр behaviors (Singleton)
    %% ============================================================================
    class BehaviorRegistryClass {
        -registrations: BehaviorRegistration[]
        -isRegistering: boolean

        +beginRegistration() void
        +register(registration: BehaviorRegistration) void
        +endRegistration(form: GroupNode) {behaviors, cleanup}
        -createEffect(registration: BehaviorRegistration, form: GroupNode, context: BehaviorContextImpl) Function | null
        -createCopyEffect(registration, form, context, withDebounce) Function
        -createEnableEffect(registration, form, context, withDebounce) Function
        -createShowEffect(registration, form, context, withDebounce) Function
        -createComputeEffect(registration, form, context, withDebounce) Function
        -createWatchEffect(registration, form, context, withDebounce) Function
        -createRevalidateEffect(registration, form, context, withDebounce) Function
        -createSyncEffect(registration, form, context, withDebounce) Function
        -resolveNode(form: GroupNode, fieldPath: string) FormNode | undefined
    }

    %% ============================================================================
    %% Отношения наследования
    %% ============================================================================
    FormNode <|-- FieldNode : extends
    FormNode <|-- GroupNode : extends
    FormNode <|-- ArrayNode : extends

    %% ============================================================================
    %% Композиция и ассоциации
    %% ============================================================================
    GroupNode *-- "0..*" FormNode : fields
    ArrayNode *-- "0..*" FormNode : items

    GroupNode ..> ValidationContextImpl : creates
    GroupNode ..> TreeValidationContextImpl : creates
    GroupNode ..> BehaviorContextImpl : creates

    ValidationContextImpl --> GroupNode : form
    ValidationContextImpl --> FieldNode : control
    TreeValidationContextImpl --> GroupNode : form
    BehaviorContextImpl --> GroupNode : form

    ValidationRegistryClass *-- "0..*" RegistrationContext : contextStack
    ValidationRegistryClass --> GroupNode : manages
    RegistrationContext *-- "0..*" ValidatorRegistration : validators

    BehaviorRegistryClass --> GroupNode : manages
    BehaviorRegistryClass *-- "0..*" BehaviorRegistration : registrations

    %% ============================================================================
    %% Сервисные классы используют контексты
    %% ============================================================================
    ValidationRegistryClass ..> ValidationContextImpl : uses
    ValidationRegistryClass ..> TreeValidationContextImpl : uses
    BehaviorRegistryClass ..> BehaviorContextImpl : uses

    %% ============================================================================
    %% Аннотации
    %% ============================================================================
    note for FormNode "Абстрактный базовый класс\nдля всех узлов формы.\nОпределяет единый интерфейс\nдля работы с полями,\nгруппами и массивами."

    note for FieldNode "Представляет одно поле\nс валидацией, debounce,\nasync валидаторами,\nи реактивным состоянием."

    note for GroupNode "Управляет группой полей.\nПоддерживает вложенность,\nvalidation schema,\nbehavior schema и Proxy\nдля прямого доступа к полям."

    note for ArrayNode "Массив форм с CRUD\nоперациями (push, remove,\ninsert). Поддерживает\nприменение схем к элементам."

    note for ValidationRegistryClass "Singleton для регистрации\nи применения валидаторов.\nРаботает как стек контекстов."

    note for BehaviorRegistryClass "Singleton для регистрации\nи применения behaviors.\nСоздаёт effect подписки."
```

## Описание архитектуры

### Иерархия классов узлов

- **FormNode<T>** - абстрактный базовый класс для всех узлов формы
  - Определяет общий интерфейс: `value`, `valid`, `errors`, `touched`, `dirty`, и т.д.
  - Методы: `getValue()`, `setValue()`, `validate()`, `reset()`, и т.д.

- **FieldNode<T>** - узел для простого поля
  - Валидация с синхронными и асинхронными валидаторами
  - Debounce для async валидации
  - Race condition protection через validationId
  - Computed signals для производительности

- **GroupNode<T>** - узел для группы полей
  - Управляет Map полей (FieldNode, GroupNode, ArrayNode)
  - Поддерживает вложенность
  - Proxy для прямого доступа к полям: `form.email` вместо `form.fields.get('email')`
  - Применение validation и behavior схем
  - Cached value для оптимизации

- **ArrayNode<T>** - узел для массива форм
  - CRUD операции: `push()`, `removeAt()`, `insert()`, `clear()`
  - Типизированный доступ через `at(index)`
  - Итерация: `forEach()`, `map()`
  - Применение схем к элементам

### Контексты

- **ValidationContextImpl** - контекст для валидации отдельного поля
  - Доступ к значениям полей: `getField()`, `setField()`
  - Поддержка вложенных путей: `"address.city"`

- **TreeValidationContextImpl** - контекст для кросс-полевой валидации
  - Валидация на уровне всей формы
  - Доступ к любым полям

- **BehaviorContextImpl** - контекст для behavior схем
  - Методы для реактивного поведения
  - Доступ к formNode через Proxy

### Реестры (Singletons)

- **ValidationRegistryClass** - управление валидаторами
  - Стек контекстов для вложенной регистрации
  - WeakMap для хранения связей форм и валидаторов
  - Поддержка sync, async, tree, array-items валидаторов

- **BehaviorRegistryClass** - управление behaviors
  - Регистрация behaviors: copy, enable, show, compute, watch, revalidate, sync
  - Создание effect подписок
  - Debounce support
  - Cleanup management

### Ключевые паттерны

1. **Наследование**: FieldNode, GroupNode, ArrayNode наследуют от FormNode
2. **Композиция**: GroupNode содержит Map узлов, ArrayNode содержит массив узлов
3. **Singleton**: ValidationRegistry, BehaviorRegistry
4. **Proxy**: GroupNode возвращает Proxy для прямого доступа к полям
5. **Computed Signals**: Использование computed для производительности (O(1) вместо O(n))
6. **Effect Subscriptions**: BehaviorRegistry создаёт effect подписки для реактивного поведения