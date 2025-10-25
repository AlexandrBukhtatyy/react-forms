# Детальный анализ и рефакторинг модуля форм (@src/lib/forms)

## Цель
Провести комплексный рефакторинг модуля форм с фокусом на:
- **Производительность** (оптимизация signals)
- **Архитектуру** (паттерн FormNode из Angular Signal Forms)
- **API/DX** (упрощение доступа к контролам)
- **Типизацию** (строгая типобезопасность)
- **Тестируемость** (модульность и декомпозиция)

---

## 1. КРИТИЧНЫЕ ПРОБЛЕМЫ (требуют немедленного решения)

### 1.1 Нерабочая схема валидации
**Текущее состояние:**
- [src/lib/forms/validators/validation-registry.ts](src/lib/forms/validators/validation-registry.ts) - система регистрации валидаторов
- [src/lib/forms/types/validation-schema.ts](src/lib/forms/types/validation-schema.ts) - типы для validation schema
- [src/lib/forms/validators/schema-validators.ts](src/lib/forms/validators/schema-validators.ts) - функции validate(), applyWhen(), validateTree()

**Проблемы:**
- Валидация не работает через applyValidationSchema()
- ValidationContext не передается корректно в валидаторы
- Условная валидация (applyWhen) не срабатывает
- Отсутствует механизм декомпозиции схем валидации

**Требования к решению:**
1. **Контракт как в Angular Signal Forms:**
   - Функция `schema()` принимает callback с `path` параметром
   - `path.fieldName` возвращает FieldPathNode для навигации
   - Поддержка встроенных валидаторов: `required(path.email, { message: '...' })`
   - Поддержка кастомных валидаторов: `validate(path.email, (ctx) => { ... })`
   - Условная валидация: `applyWhen(path.type, (val) => val === 'mortgage', (path) => { ... })`
   - Cross-field валидация: `validateTree((ctx) => { ... }, { targetField: 'email' })`

2. **Декомпозиция схем:**
   ```typescript
   // Композируемые схемы валидации
   const personalDataValidation = <T extends { firstName: string, lastName: string }>(
     path: FieldPath<T>
   ) => {
     required(path.firstName, { message: 'Имя обязательно' });
     required(path.lastName, { message: 'Фамилия обязательна' });
   };

   const mainValidation = (path: FieldPath<MyForm>) => {
     // Переиспользуем схему
     personalDataValidation(path.personalData);
     // Добавляем свои правила
     required(path.email);
   };
   ```

3. **Корректная работа ValidationContext:**
   - `ctx.value()` - текущее значение поля
   - `ctx.getField('otherField')` - значение другого поля
   - `ctx.formValue()` - все значения формы
   - `ctx.getControl()` - доступ к FieldController
   - `ctx.getForm()` - доступ к FormStore

**Задача:** Проанализировать и исправить ValidationRegistry, ValidationContext, schema-validators для полной работоспособности.

---

### 1.2 Единый абстрактный класс FormNode

**Текущее состояние:**
- [src/lib/forms/core/form-store.ts](src/lib/forms/core/form-store.ts) - хранилище формы
- [src/lib/forms/core/field-controller.ts](src/lib/forms/core/field-controller.ts) - контроллер поля
- [src/lib/forms/core/deep-form-store.ts](src/lib/forms/core/deep-form-store.ts) - глубокие формы
- [src/lib/forms/core/array-proxy.ts](src/lib/forms/core/array-proxy.ts) - массивы форм
- [src/lib/forms/core/group-proxy.ts](src/lib/forms/core/group-proxy.ts) - группы полей

**Проблема:**
В Angular Signal Forms есть абстрактный класс `AbstractControl` который унифицирует:
- Поля (FormControl)
- Группы (FormGroup)
- Массивы (FormArray)

Это дает единый интерфейс для:
- Валидации (validate(), valid, invalid, errors)
- Состояния (touched, dirty, disabled, pending)
- Значений (value, setValue, patchValue, reset)
- Управления (markAsTouched, markAsDirty, disable, enable)

**Требуемая архитектура:**
```typescript
// Абстрактный базовый класс
abstract class FormNode<T = any> {
  abstract value: ReadonlySignal<T>;
  abstract valid: ReadonlySignal<boolean>;
  abstract invalid: ReadonlySignal<boolean>;
  abstract touched: ReadonlySignal<boolean>;
  abstract dirty: ReadonlySignal<boolean>;
  abstract errors: ReadonlySignal<ValidationError[]>;

  abstract getValue(): T;
  abstract setValue(value: T): void;
  abstract validate(): Promise<boolean>;
  abstract markAsTouched(): void;
  abstract reset(value?: T): void;
}

// Конкретные реализации
class FieldNode<T> extends FormNode<T> { ... }
class GroupNode<T> extends FormNode<T> { ... }
class ArrayNode<T> extends FormNode<T[]> { ... }
```

**Преимущества:**
1. Единый интерфейс для работы с любым узлом формы
2. Упрощение рекурсивных алгоритмов (валидация, reset)
3. Типобезопасность на уровне архитектуры
4. Простота расширения (новые типы узлов)

**Задача:** Спроектировать и реализовать иерархию FormNode классов.

---

### 1.3 Доступ к контролам без промежуточного .controls

**Текущее состояние:**
```typescript
// Сейчас
form.controls.email.value
form.controls.personalData.firstName.value

// Хочется
form.email.value
form.personalData.firstName.value
```

**Проблема:**
Промежуточный `.controls` затрудняет чтение кода и увеличивает вербозность.

**Требуемое решение:**
Прямой доступ к полям через Proxy на уровне FormStore:
```typescript
const form = new FormStore(schema);
// Прямой доступ
form.email.value = 'test@example.com';
form.personalData.firstName.markAsTouched();
```

**Важно:** При этом должны сохраниться:
- Типобезопасность (TypeScript inference)
- Computed signals для производных значений (form.valid, form.dirty)
- Методы FormStore (validate(), submit(), reset())

**Возможное решение:**
```typescript
class FormStore<T> extends FormNode<T> {
  private fields: Map<string, FormNode>;

  constructor(schema) {
    super();
    // ...
    return new Proxy(this, {
      get(target, prop) {
        // Если это поле - возвращаем FormNode
        if (target.fields.has(prop)) {
          return target.fields.get(prop);
        }
        // Иначе - свойство/метод FormStore
        return target[prop];
      }
    });
  }
}
```

**Задача:** Реализовать прозрачный доступ к полям на уровне FormStore с сохранением типизации.

---

## 2. АРХИТЕКТУРНЫЕ УЛУЧШЕНИЯ

### 2.1 Интеграция ресурсов с полями формы

**Текущее состояние:**
- [src/lib/forms/core/resources.ts](src/lib/forms/core/resources.ts) - стратегии ресурсов (static, preload, partial)
- Ресурсы определены, но НЕ интегрированы с FieldController

**Проблема:**
Ресурсы (для Select, Search, Files) существуют отдельно от схемы формы. Нет механизма их привязки к полям.

**Требуемая интеграция:**
```typescript
interface FieldConfig<T> {
  value: T;
  component: ComponentType;
  componentProps?: Record<string, any>;
  validators?: ValidatorFn<T>[];

  // Новое: поддержка ресурсов
  resource?: ResourceConfig<any>;
}

// Использование
const userForm = new FormStore({
  role: {
    value: null,
    component: Select,
    resource: preloadResource(async () => {
      return [
        { id: 1, label: 'Admin', value: 'admin' },
        { id: 2, label: 'User', value: 'user' },
      ];
    })
  },
  city: {
    value: null,
    component: Search,
    resource: partialResource(async (params) => {
      return fetch(`/api/cities?search=${params.search}`);
    })
  }
});
```

**Задача:**
1. Интегрировать ResourceConfig в FieldConfig
2. Добавить логику загрузки ресурсов в FieldController
3. Обновить компоненты (Select, Search, Files) для работы с ресурсами

### 2.2 Оптимизация производительности

**Текущие проблемы:**
1. **Избыточные пересчеты в computed signals:**
   - [form-store.ts:22-28](src/lib/forms/core/form-store.ts#L22-L28) - `value` computed пересчитывается при любом изменении
   - Нужна гранулярная реактивность

2. **Map итерации в геттерах:**
   - [form-store.ts:52-74](src/lib/forms/core/form-store.ts#L52-L74) - геттеры valid, dirty и т.д. не кешируются
   - При каждом доступе проходим по всем полям

3. **Валидация:**
   - Синхронные валидаторы выполняются последовательно
   - Можно параллелить независимые асинхронные валидаторы

**Рекомендации:**
1. Использовать computed signals для кеширования
2. Батчинг обновлений через batch() из signals
3. Lazy инициализация ArrayProxy
4. Мемоизация результатов валидации

---

## 3. ДЕТАЛЬНЫЙ АНАЛИЗ ПО ФАЙЛАМ

Требуется провести построчный анализ следующих файлов:

### Приоритет 1 (критичные)
- ✅ [src/lib/forms/core/form-store.ts](src/lib/forms/core/form-store.ts)
- ✅ [src/lib/forms/core/field-controller.ts](src/lib/forms/core/field-controller.ts)
- ✅ [src/lib/forms/validators/validation-registry.ts](src/lib/forms/validators/validation-registry.ts)
- ✅ [src/lib/forms/validators/schema-validators.ts](src/lib/forms/validators/schema-validators.ts)
- ✅ [src/lib/forms/validators/validation-context.ts](src/lib/forms/validators/validation-context.ts)

### Приоритет 2 (важные)
- ✅ [src/lib/forms/core/deep-form-store.ts](src/lib/forms/core/deep-form-store.ts)
- ✅ [src/lib/forms/core/array-proxy.ts](src/lib/forms/core/array-proxy.ts)
- ✅ [src/lib/forms/core/group-proxy.ts](src/lib/forms/core/group-proxy.ts)
- ✅ [src/lib/forms/core/resources.ts](src/lib/forms/core/resources.ts)

### Приоритет 3 (дополнительно)
- [ ] [src/lib/forms/validators/built-in.ts](src/lib/forms/validators/built-in.ts)
- [ ] [src/lib/forms/validators/field-path.ts](src/lib/forms/validators/field-path.ts)
- [ ] [src/lib/forms/types/deep-schema.ts](src/lib/forms/types/deep-schema.ts)

---

## 4. ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

### Документ рефакторинга должен содержать:

1. **Executive Summary** (1-2 страницы)
   - Краткий обзор текущих проблем
   - Топ-5 критичных рекомендаций
   - Оценка сложности рефакторинга

2. **Детальный анализ проблем** (по каждой проблеме)
   - Текущее состояние (с примерами кода)
   - Почему это проблема
   - Предложенное решение (с примерами)
   - План миграции

3. **Архитектурное решение FormNode**
   - UML диаграмма классов
   - Интерфейсы и абстрактные классы
   - Примеры реализации
   - Backward compatibility

4. **Исправление схемы валидации**
   - Новый API валидации
   - Примеры использования всех типов валидаторов
   - Тесты для валидации
   - Миграционный гайд

5. **Интеграция ресурсов**
   - Расширенный FieldConfig
   - Lifecycle ресурсов
   - Примеры использования
   - Обновление компонентов

6. **План поэтапной реализации**
   - Этап 1: FormNode (2-3 дня)
   - Этап 2: Валидация (3-4 дня)
   - Этап 3: Ресурсы (2-3 дня)
   - Этап 4: Оптимизация (1-2 дня)
   - Этап 5: Тесты и документация (2-3 дня)

---

## 5. ДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ

- Все примеры кода должны быть на TypeScript с полной типизацией
- Комментарии и описания на русском языке
- Ссылки на Angular Signal Forms где применимо
- Использовать существующие паттерны из кодовой базы
- Сохранить совместимость с текущими доменами (users, credit-applications)
- Учитывать работу с вложенными формами и массивами форм

---

## 6. КОНТЕКСТ ПРОЕКТА

- **Стек:** React, @preact/signals-react, Immer, TypeScript
- **Паттерн:** DDD (Domain-Driven Design)
- **Основные домены:** [src/domains/users/](src/domains/users/), [src/domains/credit-applications/](src/domains/credit-applications/)
- **Примеры:** [src/examples/validation-example.ts](src/examples/validation-example.ts)
- **Path alias:** `@/*` для `./src/*`

---

Начни с анализа файлов Приоритета 1 и предоставь детальный отчет по каждой проблеме.