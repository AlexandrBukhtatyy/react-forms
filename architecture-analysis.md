# Анализ архитектуры: Проблемные места и рекомендации

## Контекст

Анализ диаграммы классов библиотеки форм на основе @preact/signals-react. Цель: выявить проблемные места и дать рекомендации по улучшению архитектуры.

---

## 🔴 Критические проблемы

### 1. **God Class - GroupNode** (нарушение SRP)

**Проблема**: [GroupNode](src/lib/forms/core/nodes/group-node.ts) имеет слишком много ответственностей (11+ методов, 9 полей):
- Управление структурой (fields Map, Proxy)
- Кеширование (_cachedValue, _cachedFieldValues)
- Фабрика узлов (createNode, isFieldConfig, isGroupConfig)
- Парсинг путей (parsePathWithArrays, getFieldByPath)
- Применение схем (applyValidationSchema, applyBehaviorSchema)
- Submit логика
- Создание контекстов (ValidationContext, BehaviorContext)

**Рекомендации**:
```typescript
// ✅ Разделить на отдельные классы
class FieldPathResolver {
  parsePathWithArrays(path: string): string[]
  getFieldByPath(form: GroupNode, path: string): FormNode
}

class NodeFactory {
  createNode(config: FormConfig): FormNode
  isFieldConfig(config): boolean
  isGroupConfig(config): boolean
}

class FormValueCache {
  getCachedValue(fields: Map): T
  invalidate(): void
}

class GroupNode {
  private fields: Map
  private pathResolver = new FieldPathResolver()
  private factory = new NodeFactory()
  // Только управление полями и координация
}
```

**Выигрыш**:
- ✅ Каждый класс имеет одну ответственность
- ✅ Легче тестировать отдельные части
- ✅ Переиспользование (например, FieldPathResolver для ValidationContext)

---

### 2. **Singleton паттерн - ValidationRegistry & BehaviorRegistry** (анти-паттерн)

**Проблема**:
- Глобальное состояние затрудняет изоляцию форм
- Тестирование требует очистки состояния между тестами
- Race conditions при параллельной регистрации
- Невозможность создать независимые экземпляры

**Текущий код**:
```typescript
// ❌ Singleton
export const ValidationRegistry = new ValidationRegistryClass();

// Проблема: две формы создаются параллельно
const form1 = new GroupNode({ email: ... });
const form2 = new GroupNode({ password: ... }); // может перепутать регистрации!
```

**Рекомендации**:
```typescript
// ✅ Композиция - каждая форма владеет своими реестрами
class ValidationRegistryClass {
  private contextStack: RegistrationContext[] = [];
  private validators: ValidatorRegistration[] = [];

  // Убрать глобальное состояние, работать только с локальными данными
  beginRegistration() { /* ... */ }
  endRegistration() { /* ... */ }
}

class BehaviorRegistryClass {
  private registrations: BehaviorRegistration[] = [];

  beginRegistration() { /* ... */ }
  endRegistration() { /* ... */ }
}

class GroupNode {
  // ✅ Каждый экземпляр формы имеет собственные реестры
  private readonly validationRegistry = new ValidationRegistryClass()
  private readonly behaviorRegistry = new BehaviorRegistryClass()

  constructor(config: GroupNodeConfig<T>) {
    // Инициализация формы
    this.createFields(config);
  }

  applyValidationSchema(schemaFn: ValidationSchemaFn<T>) {
    // Работа с локальным реестром
    this.validationRegistry.beginRegistration();
    schemaFn(createFieldPath(this));
    this.validationRegistry.endRegistration();
  }

  applyBehaviorSchema(schemaFn: BehaviorSchemaFn<T>) {
    // Работа с локальным реестром
    this.behaviorRegistry.beginRegistration();
    schemaFn(createFieldPath(this));
    return this.behaviorRegistry.endRegistration(this);
  }
}

// Каждая форма автоматически изолирована
const form1 = new GroupNode({ email: { value: '' } });
const form2 = new GroupNode({ password: { value: '' } }); // ✅ независимые реестры
```

**Выигрыш**:
- ✅ Полная изоляция форм (каждая форма = собственные реестры)
- ✅ Простое тестирование (не нужно очищать глобальное состояние)
- ✅ Нет race conditions (нет общих данных между формами)
- ✅ Принцип композиции: GroupNode владеет своими зависимостями
- ✅ Простой API (не нужно передавать реестры извне)

---

### 3. **Тайтовая связанность контекстов с GroupNode**

**Проблема**: ValidationContext, TreeValidationContext, BehaviorContext жестко завязаны на GroupNode:
```typescript
class ValidationContextImpl {
  private form: GroupNode  // ❌ жесткая зависимость
  private control: FieldNode
}

class GroupNode {
  applyValidationSchema(schemaFn) {
    const ctx = new ValidationContextImpl(this, ...); // ❌ создает напрямую
  }
}
```

**Рекомендации**:
```typescript
// ✅ Работа с интерфейсом вместо конкретного класса
interface FormNodeAccessor {
  getField(path: string): any
  setField(path: string, value: any): void
  getFieldNode(path: string): FormNode
}

class ValidationContextImpl implements ValidationContext {
  constructor(
    private accessor: FormNodeAccessor, // ✅ зависимость от интерфейса
    private fieldKey: string,
    private control: FieldNode
  ) {}
}

class GroupNode implements FormNodeAccessor {
  getField(path: string) { ... }
  setField(path: string, value: any) { ... }

  applyValidationSchema(schemaFn, contextFactory?: ContextFactory) {
    // ✅ внедрение зависимости
    const factory = contextFactory ?? defaultContextFactory;
    const ctx = factory.create(this, ...);
  }
}
```

**Выигрыш**:
- ✅ Loose coupling - контексты не зависят от GroupNode
- ✅ Можно использовать контексты с другими реализациями форм
- ✅ Проще мокировать при тестировании

---

## 🟡 Средние проблемы

### 4. **Дублирование логики управления состоянием**

**Проблема**: FieldNode, GroupNode, ArrayNode дублируют код:
```typescript
// ❌ В каждом классе повторяется
class FieldNode {
  disable() { this._status.value = 'DISABLED'; }
  enable() { this._status.value = 'VALID'; }
  markAsTouched() { this._touched.value = true; }
  // ...
}

class GroupNode {
  disable() { /* похожая логика */ }
  enable() { /* похожая логика */ }
  // ...
}
```

**Рекомендации**:
```typescript
// ✅ Общая логика в базовом классе
abstract class FormNode<T> {
  protected _touched = signal(false);
  protected _dirty = signal(false);
  protected _status = signal<FieldStatus>('VALID');

  markAsTouched() { this._touched.value = true; }
  markAsUntouched() { this._touched.value = false; }
  markAsDirty() { this._dirty.value = true; }
  markAsPristine() { this._dirty.value = false; }

  disable() {
    this._status.value = 'DISABLED';
    this.onDisable(); // hook для наследников
  }

  enable() {
    this._status.value = 'VALID';
    this.onEnable(); // hook для наследников
  }

  // Template Method паттерн
  protected abstract onDisable(): void;
  protected abstract onEnable(): void;
}

class FieldNode extends FormNode {
  protected onDisable() {
    // Специфичная логика для поля
  }
}

class GroupNode extends FormNode {
  protected onDisable() {
    // Рекурсивно disable всех полей
    this.fields.forEach(field => field.disable());
  }
}
```

**Выигрыш**:
- ✅ DRY - логика в одном месте
- ✅ Консистентное поведение
- ✅ Проще добавлять новые методы состояния

---

### 5. **Ручное кеширование в GroupNode**

**Проблема**:
```typescript
class GroupNode {
  private _cachedValue: T;
  private _cachedFieldValues = new Map();

  getValue(): T {
    // ❌ Ручная проверка изменений
    let hasChanged = false;
    for (const [key, field] of this.fields) {
      const value = field.getValue();
      if (this._cachedFieldValues.get(key) !== value) {
        hasChanged = true;
        this._cachedFieldValues.set(key, value);
      }
    }

    if (hasChanged) {
      this._cachedValue = /* создать объект */;
    }
    return this._cachedValue;
  }
}
```

**Проблемы**:
- Риск несинхронизации кеша
- O(n) сложность каждый раз
- Не реактивно

**Рекомендации**:
```typescript
// ✅ Использовать computed signal
class GroupNode {
  readonly value: ReadonlySignal<T> = computed(() => {
    const result = {} as T;
    for (const [key, field] of this.fields) {
      result[key] = field.value.value; // автоматическая реактивность
    }
    return result;
  });

  getValue(): T {
    return this.value.value; // O(1) благодаря memoization
  }
}
```

**Выигрыш**:
- ✅ Автоматическое кеширование signals
- ✅ O(1) сложность при повторных вызовах
- ✅ Реактивность "из коробки"
- ✅ Нет риска багов с синхронизацией

---

### 6. **BehaviorRegistry: 7 типов behaviors без абстракции**

**Проблема**:
```typescript
class BehaviorRegistryClass {
  // ❌ 7 почти одинаковых методов
  private createCopyEffect(...)    { /* 30 строк */ }
  private createEnableEffect(...)  { /* 25 строк */ }
  private createShowEffect(...)    { /* 25 строк */ }
  private createComputeEffect(...) { /* 35 строк */ }
  private createWatchEffect(...)   { /* 20 строк */ }
  private createRevalidateEffect(...) { /* 20 строк */ }
  private createSyncEffect(...)    { /* 30 строк */ }
}
```

**Рекомендации**:
```typescript
// ✅ Strategy паттерн
interface BehaviorStrategy {
  execute(context: BehaviorContext): void
  cleanup?: () => void
}

class CopyBehaviorStrategy implements BehaviorStrategy {
  execute(context) {
    // Логика копирования
  }
}

class EnableBehaviorStrategy implements BehaviorStrategy {
  execute(context) {
    // Логика enable/disable
  }
}

class BehaviorRegistry {
  private strategies = new Map<BehaviorType, BehaviorStrategy>([
    ['copy', new CopyBehaviorStrategy()],
    ['enable', new EnableBehaviorStrategy()],
    // ...
  ]);

  private createEffect(registration: BehaviorRegistration, form, context) {
    const strategy = this.strategies.get(registration.type);
    if (!strategy) throw new Error(`Unknown behavior: ${registration.type}`);

    // ✅ Общая логика debounce/immediate
    return this.wrapWithOptions(
      () => strategy.execute(context),
      registration
    );
  }

  private wrapWithOptions(fn, registration) {
    // Общая логика debounce, immediate, условий
  }
}
```

**Выигрыш**:
- ✅ Каждая стратегия - отдельный класс (SRP)
- ✅ Легко добавлять новые behaviors
- ✅ Общая логика debounce/immediate в одном месте
- ✅ Проще тестировать каждую стратегию отдельно

---

### 7. **Дублирование логики парсинга путей**

**Проблема**: Логика парсинга путей дублируется в 4 местах:
- GroupNode.parsePathWithArrays
- ValidationContextImpl.resolveNestedPath
- TreeValidationContextImpl.resolveNestedPath
- BehaviorContextImpl.resolveFieldNode

**Рекомендации**:
```typescript
// ✅ Централизованный сервис
class FieldPathNavigator {
  /**
   * Парсит путь вида "address.city" или "items[0].name"
   */
  parsePath(path: string): PathSegment[] {
    // Единая логика парсинга
  }

  /**
   * Получает значение по пути из объекта
   */
  getValueByPath(obj: any, path: string): any {
    const segments = this.parsePath(path);
    return segments.reduce((acc, seg) => acc?.[seg.key], obj);
  }

  /**
   * Устанавливает значение по пути
   */
  setValueByPath(obj: any, path: string, value: any): void {
    const segments = this.parsePath(path);
    // Логика установки значения
  }

  /**
   * Получает узел формы по пути
   */
  getNodeByPath(form: GroupNode, path: string): FormNode | null {
    const segments = this.parsePath(path);
    // Логика навигации по узлам
  }
}

// Использование
class ValidationContextImpl {
  constructor(
    private form: GroupNode,
    private fieldKey: string,
    private control: FieldNode,
    private pathNavigator = new FieldPathNavigator() // ✅ Композиция
  ) {}

  getField(path: string): any {
    return this.pathNavigator.getValueByPath(this.form.getValue(), path);
  }
}
```

**Выигрыш**:
- ✅ DRY - логика парсинга в одном месте
- ✅ Единообразное поведение
- ✅ Легко добавить поддержку новых синтаксисов (например, `items.*.name`)
- ✅ Проще тестировать

---

## 🟢 Рекомендации по улучшению архитектуры

### 8. **Разделение интерфейсов (ISP)**

**Проблема**: FormNode имеет слишком широкий интерфейс:
```typescript
abstract class FormNode {
  // ❌ disable/enable помечены как optional
  disable?(): void;
  enable?(): void;
  dispose?(): void;
}
```

**Рекомендации**:
```typescript
// ✅ Разделить на интерфейсы по ответственности
interface Validatable {
  validate(): Promise<boolean>
  setErrors(errors: ValidationError[]): void
  clearErrors(): void
  readonly valid: ReadonlySignal<boolean>
  readonly errors: ReadonlySignal<ValidationError[]>
}

interface Touchable {
  markAsTouched(): void
  markAsUntouched(): void
  readonly touched: ReadonlySignal<boolean>
}

interface Disableable {
  disable(): void
  enable(): void
  readonly disabled: ReadonlySignal<boolean>
}

interface Disposable {
  dispose(): void
}

// ✅ Композиция интерфейсов
abstract class FormNode<T> implements
  Validatable,
  Touchable,
  Disableable,
  Disposable
{
  // Реализация всех методов
}

// ✅ Для кастомных узлов можно реализовать только нужные интерфейсы
class ReadOnlyFieldNode implements Validatable, Touchable {
  // Не нужен disable/enable
}
```

**Выигрыш**:
- ✅ Явные контракты
- ✅ Меньше необязательных методов
- ✅ Проще создавать кастомные узлы

---

### 9. **Централизованное управление подписками**

**Проблема**:
```typescript
class FieldNode {
  private disposers: Function[] = []; // ❌ просто массив функций

  watch(callback) {
    const dispose = effect(() => callback(this.value.value));
    this.disposers.push(dispose); // ❌ нет контроля
    return dispose;
  }

  dispose() {
    this.disposers.forEach(d => d()); // ❌ может быть не все отписались
  }
}
```

**Рекомендации**:
```typescript
// ✅ Subscription Manager
class SubscriptionManager {
  private subscriptions = new Map<string, Function>();

  add(key: string, dispose: Function): void {
    if (this.subscriptions.has(key)) {
      console.warn(`Subscription "${key}" already exists, replacing`);
      this.subscriptions.get(key)?.();
    }
    this.subscriptions.set(key, dispose);
  }

  remove(key: string): boolean {
    const dispose = this.subscriptions.get(key);
    if (dispose) {
      dispose();
      this.subscriptions.delete(key);
      return true;
    }
    return false;
  }

  clear(): void {
    for (const dispose of this.subscriptions.values()) {
      dispose();
    }
    this.subscriptions.clear();
  }

  size(): number {
    return this.subscriptions.size;
  }
}

class FieldNode {
  private subscriptions = new SubscriptionManager();

  watch(callback: WatchCallback, key?: string): Function {
    const dispose = effect(() => callback(this.value.value));
    const subKey = key ?? `watch-${Date.now()}`;
    this.subscriptions.add(subKey, dispose);

    return () => this.subscriptions.remove(subKey);
  }

  dispose() {
    this.subscriptions.clear(); // ✅ контролируемая отписка
  }
}
```

**Выигрыш**:
- ✅ Явное управление подписками
- ✅ Отладка (можно посмотреть this.subscriptions.size())
- ✅ Нет утечек памяти
- ✅ Можно отписываться от конкретной подписки по ключу

---

### 10. **Разделение ответственностей в FieldNode**

**Проблема**: FieldNode смешивает слишком много:
```typescript
class FieldNode {
  // Валидация
  private validators: ValidatorFn[]
  private asyncValidators: AsyncValidatorFn[]

  // Debounce
  private validateDebounceTimer: Timer
  private validateDebounceResolve: Function

  // UI
  private _componentProps: Signal<Record>
  readonly shouldShowError: ReadonlySignal<boolean>

  // Состояние
  private _value, _errors, _touched, _dirty, _status, _pending

  // Подписки
  private disposers: Function[]
}
```

**Рекомендации**:
```typescript
// ✅ Разделить на композируемые части

// Валидация
class FieldValidator {
  constructor(
    private validators: ValidatorFn[],
    private asyncValidators: AsyncValidatorFn[],
    private debounceMs: number
  ) {}

  async validate(value: T, context: ValidationContext): Promise<ValidationError[]> {
    // Логика валидации с debounce
  }
}

// UI свойства
class ComponentPropsManager {
  private _props = signal<Record>({});
  readonly props = computed(() => this._props.value);

  update(props: Partial<Record>): void {
    this._props.value = { ...this._props.value, ...props };
  }
}

// Состояние поля
class FieldState<T> {
  readonly value = signal<T>(this.initialValue);
  readonly touched = signal(false);
  readonly dirty = signal(false);
  readonly errors = signal<ValidationError[]>([]);

  constructor(private initialValue: T) {}

  reset(value?: T): void {
    this.value.value = value ?? this.initialValue;
    this.touched.value = false;
    this.dirty.value = false;
    this.errors.value = [];
  }
}

// Композиция
class FieldNode<T> extends FormNode<T> {
  private state: FieldState<T>;
  private validator: FieldValidator;
  private componentPropsManager: ComponentPropsManager;

  constructor(config: FieldConfig<T>) {
    super();
    this.state = new FieldState(config.value);
    this.validator = new FieldValidator(
      config.validators ?? [],
      config.asyncValidators ?? [],
      config.debounceMs ?? 300
    );
    this.componentPropsManager = new ComponentPropsManager();
  }

  async validate(): Promise<boolean> {
    const errors = await this.validator.validate(
      this.state.value.value,
      this.createContext()
    );
    this.state.errors.value = errors;
    return errors.length === 0;
  }
}
```

**Выигрыш**:
- ✅ SRP - каждый класс имеет одну ответственность
- ✅ Переиспользование (например, FieldValidator в разных узлах)
- ✅ Легче тестировать отдельные части
- ✅ Проще расширять (добавить новые стратегии валидации)

---

## 📊 Итоговые рекомендации

### Приоритет 1 (критично)
1. **Разбить GroupNode на классы** (FieldPathResolver, NodeFactory, FormValueCache)
2. **Убрать Singleton** из ValidationRegistry/BehaviorRegistry → Композиция (каждая форма владеет своими реестрами)
3. **Перенести дублирующуюся логику** в FormNode (disable, enable, markAs*)

### Приоритет 2 (важно)
4. **Заменить ручное кеширование** на computed signals в GroupNode
5. **Применить Strategy паттерн** для BehaviorRegistry
6. **Централизовать парсинг путей** в FieldPathNavigator

### Приоритет 3 (желательно)
7. **Разделить интерфейсы** FormNode по ISP
8. **Добавить SubscriptionManager** для управления подписками
9. **Разделить FieldNode** на композируемые части (FieldValidator, ComponentPropsManager, FieldState)

### Метрики улучшения
- **Снижение сложности GroupNode**: с ~30 методов до ~15
- **Переиспользование кода**: устранение 4 дубликатов парсинга путей
- **Тестируемость**: изоляция форм → 100% покрытие тестами
- **Поддерживаемость**: каждый класс < 200 строк (SRP)

---

## 📝 Заключение

Текущая архитектура имеет хорошую основу (FormNode наследование, Signals для реактивности), но страдает от:
- **God Classes** (GroupNode, FieldNode)
- **Глобальное состояние** (Singleton реестры)
- **Дублирование кода** (парсинг путей, управление состоянием)
- **Tight coupling** (контексты ↔ GroupNode)

Предложенные рефакторинги следуют принципам SOLID и помогут сделать код:
- **Модульным**: каждый класс - одна ответственность
- **Тестируемым**: Композиция вместо Singleton (изоляция форм)
- **Расширяемым**: Strategy/Template Method паттерны
- **Понятным**: явные интерфейсы и контракты