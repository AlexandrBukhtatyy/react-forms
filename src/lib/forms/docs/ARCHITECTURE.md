# Архитектура библиотеки форм

## Обзор

Библиотека форм построена на основе **@preact/signals-react** для реактивного управления состоянием и использует **Immer** для иммутабельных обновлений. Основная идея - создать типобезопасную, масштабируемую систему управления формами с декларативной валидацией и поведением.

---

## Архитектура FormNode

### Иерархия классов

```
FormNode<T>                      # Абстрактный базовый класс
├── FieldNode<T>                 # Поле (примитив или объект)
├── GroupNode<T>                 # Группа полей (объект)
└── ArrayNode<T>                 # Массив форм
```

### FormNode<T> - Базовый класс

**Файл**: [src/lib/forms/core/nodes/form-node.ts](../src/lib/forms/core/nodes/form-node.ts)

Абстрактный базовый класс, определяющий единый интерфейс для всех узлов формы.

#### Публичные Signals (readonly)

```typescript
abstract class FormNode<T> {
  // Состояние
  abstract readonly value: ReadonlySignal<T>;
  abstract readonly valid: ReadonlySignal<boolean>;
  abstract readonly invalid: ReadonlySignal<boolean>;
  abstract readonly touched: ReadonlySignal<boolean>;
  abstract readonly dirty: ReadonlySignal<boolean>;
  abstract readonly pending: ReadonlySignal<boolean>;
  abstract readonly errors: ReadonlySignal<ValidationError[]>;
  abstract readonly status: ReadonlySignal<FieldStatus>;
}
```

**Ключевая особенность**: Все состояние - computed signals, обновляются автоматически **O(1)** вместо рекурсивного обхода дерева **O(n)**.

#### Абстрактные методы

```typescript
// Получение/установка значений
abstract getValue(): T;
abstract setValue(value: T, options?: SetValueOptions): void;
abstract patchValue(value: Partial<T>): void;
abstract reset(value?: T): void;

// Валидация
abstract validate(): Promise<boolean>;
abstract setErrors(errors: ValidationError[]): void;
abstract clearErrors(): void;

// Состояние
abstract markAsTouched(): void;
abstract markAsUntouched(): void;
abstract markAsDirty(): void;
abstract markAsPristine(): void;
```

---

### FieldNode<T> - Поле формы

**Файл**: [src/lib/forms/core/nodes/field-node.ts](../src/lib/forms/core/nodes/field-node.ts)

Узел для одного поля (примитив или объект).

#### Конструктор

```typescript
new FieldNode<T>(config: FieldConfig<T>)

interface FieldConfig<T> {
  value: T;                                    // Начальное значение
  component: ComponentType<any>;               // React компонент для рендера
  validators?: Validator<T>[];                 // Синхронные валидаторы
  asyncValidators?: AsyncValidator<T>[];       // Async валидаторы
  updateOn?: 'change' | 'blur' | 'submit';     // Когда обновлять
  debounce?: number;                           // Debounce для async валидации
  componentProps?: Record<string, any>;        // Пропсы для компонента
}
```

#### Внутренняя структура

```typescript
class FieldNode<T> {
  // Приватные writable signals
  private _value: Signal<T>;
  private _touched: Signal<boolean>;
  private _dirty: Signal<boolean>;
  private _errors: Signal<ValidationError[]>;
  private _pending: Signal<boolean>;

  // Публичные computed signals (автообновление)
  public readonly value: ReadonlySignal<T>;
  public readonly valid: ReadonlySignal<boolean>;
  public readonly invalid: ReadonlySignal<boolean>;
  public readonly touched: ReadonlySignal<boolean>;
  public readonly dirty: ReadonlySignal<boolean>;
  public readonly pending: ReadonlySignal<boolean>;
  public readonly errors: ReadonlySignal<ValidationError[]>;
  public readonly status: ReadonlySignal<FieldStatus>;
}
```

#### Валидация

**Синхронные валидаторы**:
```typescript
field.addValidator((value, ctx) => {
  if (!value) {
    return { code: 'required', message: 'Поле обязательно' };
  }
  return null;
});
```

**Async валидаторы** (с debounce):
```typescript
field.addAsyncValidator(async (value, ctx) => {
  const exists = await api.checkEmail(value);
  if (exists) {
    return { code: 'emailExists', message: 'Email уже занят' };
  }
  return null;
});
```

**Порядок выполнения**:
1. Синхронные валидаторы (последовательно)
2. Если есть ошибки → stop
3. Async валидаторы (параллельно через Promise.all)
4. Debounce применяется только к async валидаторам

#### Lifecycle

```typescript
// 1. Создание
const field = new FieldNode({ value: '', component: Input });

// 2. Изменение значения
field.setValue('new value');
// → _value.value = 'new value'
// → _dirty.value = true
// → valid.value пересчитывается автоматически

// 3. Валидация
await field.validate();
// → Запуск sync + async валидаторов
// → _errors.value обновляется
// → valid.value пересчитывается

// 4. Cleanup
field.dispose();
// → Очистка debounce таймеров
```

---

### GroupNode<T> - Группа полей

**Файл**: [src/lib/forms/core/nodes/group-node.ts](../src/lib/forms/core/nodes/group-node.ts)

Узел для объекта с полями. Поддерживает вложенность (рекурсивная композиция).

#### Конструктор (перегрузки)

**Способ 1: Простой (обратная совместимость)**
```typescript
new GroupNode<T>(schema: DeepFormSchema<T>)
```

**Способ 2: С конфигурацией (рекомендуется)**
```typescript
new GroupNode<T>({
  form: DeepFormSchema<T>,
  validation?: ValidationSchemaFn<T>,
  behavior?: BehaviorSchemaFn<T>,
})
```

#### Пример использования

```typescript
interface UserForm {
  email: string;
  password: string;
  address: {
    city: string;
    street: string;
  };
}

const form = new GroupNode<UserForm>({
  form: {
    email: { value: '', component: Input },
    password: { value: '', component: Input },
    address: {
      city: { value: '', component: Input },
      street: { value: '', component: Input },
    },
  },
  validation: (path) => {
    required(path.email);
    email(path.email);
    required(path.password);
    minLength(path.password, 8);
  },
  behavior: (path) => {
    // Auto-trim email
    computeFrom(path.email, [path.email], (values) =>
      values[0]?.trim()
    );
  },
});
```

#### Прямой доступ к полям через Proxy

```typescript
// ✅ Вместо form.controls.email (старый API)
form.email.setValue('test@mail.com');
form.address.city.setValue('Moscow');

// Proxy создается в конструкторе
private createProxy(): GroupNodeWithControls<T> {
  return new Proxy(this, {
    get(target, prop: string) {
      // Доступ к полям напрямую
      if (target.fields.has(prop)) {
        return target.fields.get(prop);
      }
      // Fallback на свойства GroupNode
      return target[prop];
    },
  });
}
```

#### Внутренняя структура

```typescript
class GroupNode<T> {
  // Хранилище полей
  public readonly fields: Map<string, FormNode<any>>;

  // Proxy instance для прямого доступа
  private _proxyInstance?: GroupNodeWithControls<T>;

  // Computed signals (агрегация от дочерних узлов)
  public readonly value: ReadonlySignal<T>;
  public readonly valid: ReadonlySignal<boolean>;
  public readonly touched: ReadonlySignal<boolean>;
  public readonly dirty: ReadonlySignal<boolean>;
  public readonly errors: ReadonlySignal<ValidationError[]>;
}
```

#### Computed signals - агрегация

```typescript
// value - собирает значения всех полей
this.value = computed(() => {
  const result: any = {};
  this.fields.forEach((field, key) => {
    result[key] = field.value.value;
  });
  return result as T;
});

// valid - AND всех дочерних полей
this.valid = computed(() => {
  for (const field of this.fields.values()) {
    if (!field.valid.value) return false;
  }
  return true;
});

// errors - concat всех ошибок
this.errors = computed(() => {
  const allErrors: ValidationError[] = [];
  this.fields.forEach((field) => {
    allErrors.push(...field.errors.value);
  });
  return allErrors;
});
```

**Производительность**: O(1) благодаря computed signals. При изменении одного поля пересчитываются только зависимые computed.

---

### ArrayNode<T> - Массив форм

**Файл**: [src/lib/forms/core/nodes/array-node.ts](../src/lib/forms/core/nodes/array-node.ts)

Узел для массива форм. Каждый элемент - GroupNode.

#### Конструктор

```typescript
new ArrayNode<T>(
  schema: DeepFormSchema<T>,
  initialItems: Partial<T>[] = []
)
```

#### CRUD операции

```typescript
const items = new ArrayNode<Item>({
  title: { value: '', component: Input },
  price: { value: 0, component: Input },
});

// Create
items.push({ title: 'Item 1', price: 100 });
items.insert(0, { title: 'Item 0', price: 50 });

// Read
const item = items.at(0);
console.log(item?.title.value.value);

// Update
items.at(0)?.title.setValue('Updated');

// Delete
items.removeAt(0);
items.clear();

// Iterate
items.forEach((item, index) => {
  console.log(item.title.value.value);
});

const prices = items.map((item) => item.price.value.value);
```

#### Auto-apply схем к новым элементам

```typescript
// 1. Применяем validation схему к массиву
items.applyValidationSchema((path) => {
  required(path.title);
  min(path.price, 0);
});

// 2. Добавляем новый элемент
items.push({ title: '', price: -10 });

// ✅ Validation схема автоматически применена к новому элементу!
await items.validate();
// → Ошибки для title и price
```

То же самое для behavior схем:
```typescript
items.applyBehaviorSchema((path) => {
  computeFrom(path.title, [path.title], (values) =>
    values[0]?.toUpperCase()
  );
});

items.push({ title: 'new item', price: 100 });
// ✅ Behavior автоматически применён
```

#### Реактивные helper методы

**watchItems** - отслеживание изменений поля во всех элементах:
```typescript
const dispose = items.watchItems('price', (prices) => {
  const total = prices.reduce((sum, p) => sum + (p || 0), 0);
  form.totalPrice.setValue(total);
});

// При изменении любого price → пересчитается total
items.at(0)?.price.setValue(200);

// Cleanup
dispose();
```

**watchLength** - отслеживание количества элементов:
```typescript
const dispose = items.watchLength((length) => {
  console.log(`Количество элементов: ${length}`);
  form.itemCount.setValue(length);
});

items.push({ title: 'New', price: 100 });
// → "Количество элементов: 1"
```

---

## Validation Schema API

**Файл**: [src/lib/forms/validators/](../src/lib/forms/validators/)

Декларативный API для валидации форм, вдохновлённый Angular Signal Forms.

### Основные концепции

#### 1. FieldPath - type-safe пути к полям

```typescript
const validationSchema: ValidationSchemaFn<MyForm> = (path) => {
  // path.email - FieldPathNode<MyForm, string>
  // path.address.city - FieldPathNode<MyForm, string>

  required(path.email);
  email(path.email);
  required(path.address.city);
};
```

**Реализация** ([create-field-path.ts](../src/lib/forms/validators/field-path.ts)):
```typescript
// Proxy для генерации путей
path.address.city
// → FieldPathNode { __path: 'address.city', __key: 'city' }
```

#### 2. Validation функции

**Синхронные** ([schema-validators.ts](../src/lib/forms/validators/schema-validators.ts)):
```typescript
required(path.email, { message: 'Email обязателен' });
email(path.email);
minLength(path.password, 8);
pattern(path.phone, /^\+7\d{10}$/);
```

**Async** (с debounce):
```typescript
validateAsync(
  path.email,
  async (value, ctx) => {
    const exists = await api.checkEmail(value);
    return exists ? { code: 'exists', message: 'Email занят' } : null;
  },
  { debounce: 300 }
);
```

**Кросс-полевая**:
```typescript
validate(
  [path.password, path.confirmPassword],
  (values, ctx) => {
    const [password, confirm] = values;
    if (password !== confirm) {
      return { code: 'mismatch', message: 'Пароли не совпадают' };
    }
    return null;
  },
  { targetField: 'confirmPassword' } // Куда добавить ошибку
);
```

**Tree-level** (валидация всей формы):
```typescript
validateTree((ctx) => {
  const email = ctx.getField('email');
  const phone = ctx.getField('phone');

  if (!email && !phone) {
    return {
      code: 'noContact',
      message: 'Укажите email или телефон'
    };
  }
  return null;
});
```

#### 3. ValidationContext - доступ к форме

```typescript
validate([path.startDate, path.endDate], (values, ctx) => {
  const [start, end] = values;

  // Доступ к другим полям
  const status = ctx.getField('status');

  // Вложенные пути
  const city = ctx.getField('address.city');

  // Установка других полей
  ctx.setField('duration', calculateDuration(start, end));

  // Вся форма
  const formValue = ctx.formValue();

  return start > end
    ? { code: 'invalidRange', message: 'Некорректный диапазон' }
    : null;
});
```

#### 4. Композиция validation схем

**toFieldPath** - переиспользование схем:
```typescript
// address-validation.ts
export const addressValidation: ValidationSchemaFn<Address> = (path) => {
  required(path.region);
  required(path.city);
  required(path.street);
};

// user-validation.ts
import { apply, toFieldPath } from '@/lib/forms/validators';

export const userValidation: ValidationSchemaFn<User> = (path) => {
  // ✅ Применить схему к вложенному полю
  addressValidation(toFieldPath(path.homeAddress));

  // ✅ Или через apply helper
  apply(path.homeAddress, addressValidation);

  // ✅ Применить к нескольким полям
  apply([path.homeAddress, path.workAddress], addressValidation);
};
```

**applyWhen** - условное применение:
```typescript
applyWhen(
  path.loanType,
  (type) => type === 'mortgage',
  (path) => {
    apply(path.property, propertyValidation);
    required(path.propertyValue);
  }
);
```

#### 5. Применение к форме

```typescript
// Способ 1: В конструкторе (рекомендуется)
const form = new GroupNode({
  form: { /* ... */ },
  validation: userValidation,
});

// Способ 2: После создания
const cleanup = form.applyValidationSchema(userValidation);

// Cleanup (отписка от всех валидаторов)
cleanup();
```

---

## Behavior Schema API

**Файл**: [src/lib/forms/behaviors/](../src/lib/forms/behaviors/)

Декларативный API для реактивного поведения форм.

### Behavior функции

#### copyFrom - копирование полей

```typescript
copyFrom(
  path.residenceAddress,      // Куда копировать
  path.registrationAddress,   // Откуда копировать
  {
    when: (form) => form.sameAsRegistration === true,
    debounce: 100,
  }
);
```

#### enableWhen - условное включение/выключение

```typescript
enableWhen(
  path.propertyValue,          // Какое поле
  path.loanType,               // Условие от какого поля
  {
    condition: (type) => type === 'mortgage',
    resetOnDisable: true,      // Очистить при выключении
  }
);
```

#### computeFrom - вычисляемое поле

```typescript
computeFrom(
  path.fullName,               // Результирующее поле
  [path.firstName, path.lastName], // Зависимости
  ({ firstName, lastName }) => `${firstName} ${lastName}`.trim()
);
```

#### watchField - реактивный callback

```typescript
watchField(
  path.country,
  async (country, ctx) => {
    if (country) {
      const regions = await fetchRegions(country);
      ctx.updateComponentProps(path.region, { options: regions });
      ctx.setField('region', ''); // Очистить регион
    }
  },
  {
    immediate: true,  // Вызвать сразу
    debounce: 300     // Debounce для async операций
  }
);
```

### BehaviorContext - доступ к форме

```typescript
watchField(path.email, (email, ctx) => {
  // Прямой доступ к форме через proxy
  ctx.formNode.password.setValue('');
  ctx.formNode.address.city.clearErrors();

  // Или через строковые пути
  ctx.setField('password', '');
  ctx.getField('address.city');

  // Обновление componentProps
  ctx.updateComponentProps(path.emailConfirm, {
    disabled: !email,
  });

  // Валидация
  await ctx.validateField(path.emailConfirm);

  // Ошибки
  ctx.setErrors(path.email, [{
    code: 'custom',
    message: 'Ошибка'
  }]);
  ctx.clearErrors(path.email);
});
```

### Композиция behavior схем

```typescript
// address-behavior.ts
export const addressBehavior: BehaviorSchemaFn<Address> = (path) => {
  watchField(path.region, async (region, ctx) => {
    const cities = await fetchCities(region);
    ctx.updateComponentProps(path.city, { options: cities });
    ctx.setField('city', '');
  });
};

// user-behavior.ts
import { apply, applyWhen, toBehaviorFieldPath } from '@/lib/forms/behaviors';

export const userBehavior: BehaviorSchemaFn<User> = (path) => {
  // ✅ Применить к вложенному полю
  addressBehavior(toBehaviorFieldPath(path.homeAddress));

  // ✅ Или через apply
  apply(path.homeAddress, addressBehavior);

  // ✅ Применить к нескольким полям
  apply([path.homeAddress, path.workAddress], addressBehavior);

  // ✅ Условное применение
  applyWhen(
    path.hasShipping,
    (value) => value === true,
    (path) => {
      apply(path.shippingAddress, addressBehavior);
    }
  );
};
```

### Применение к форме

```typescript
// Способ 1: В конструкторе (рекомендуется)
const form = new GroupNode({
  form: { /* ... */ },
  behavior: userBehavior,
});

// Способ 2: После создания
const cleanup = form.applyBehaviorSchema(userBehavior);

// Cleanup (отписка от всех effects)
cleanup();
```

---

## Реестры (Registries)

### ValidationRegistry

**Файл**: [src/lib/forms/validators/validation-registry.ts](../src/lib/forms/validators/validation-registry.ts)

Управляет валидаторами для форм.

```typescript
class ValidationRegistry {
  // WeakMap: форма → массив валидаторов
  private static validators = new WeakMap<
    GroupNode<any>,
    Array<ValidatorEntry>
  >();

  // Регистрация валидатора
  static register(form: GroupNode<any>, validator: ValidatorEntry): void;

  // Получение всех валидаторов формы
  static getValidators(form: GroupNode<any>): ValidatorEntry[];

  // Очистка (автоматически через WeakMap)
}
```

**Использование WeakMap**:
- Автоматическая очистка при garbage collection формы
- Нет memory leaks
- O(1) доступ

### BehaviorRegistry

**Файл**: [src/lib/forms/behaviors/behavior-registry.ts](../src/lib/forms/behaviors/behavior-registry.ts)

Управляет reactive behaviors для форм.

```typescript
class BehaviorRegistry {
  // WeakMap: форма → массив cleanup функций
  private static behaviors = new WeakMap<
    GroupNode<any>,
    Array<() => void>
  >();

  // Регистрация behavior с cleanup
  static register(
    form: GroupNode<any>,
    cleanup: () => void
  ): void;

  // Cleanup всех behaviors формы
  static cleanup(form: GroupNode<any>): void;
}
```

**Cleanup chain**:
1. User вызывает `cleanup = form.applyBehaviorSchema(schema)`
2. Schema регистрирует effects через `watchField`
3. `watchField` возвращает dispose функцию
4. Dispose функции собираются в BehaviorRegistry
5. При вызове `cleanup()` → все dispose вызываются → effects отписываются

---

## React Integration

### Hooks

**Файл**: [src/lib/forms/hooks/](../src/lib/forms/hooks/)

#### useFormEffect

Базовый хук для реактивных эффектов:

```typescript
useFormEffect(form.email.value, (email) => {
  console.log('Email changed:', email);
});

// С cleanup
useFormEffect(form.country.value, (country) => {
  const subscription = fetchRegions(country);

  return () => subscription.cancel();
});
```

#### useComputedField

Вычисляемое поле:

```typescript
useComputedField(
  form.fullName,
  [form.firstName.value, form.lastName.value],
  (firstName, lastName) => `${firstName} ${lastName}`.trim()
);
```

#### useCopyField

Копирование полей:

```typescript
useCopyField({
  target: form.residenceAddress,
  source: form.registrationAddress,
  when: () => form.sameAsRegistration.value.value === true,
});
```

#### useEnableWhen

Условное включение:

```typescript
useEnableWhen({
  field: form.propertyValue,
  condition: () => form.loanType.value.value === 'mortgage',
  resetOnDisable: true,
});
```

---

## Производительность

### Computed Signals - O(1) обновления

**Проблема классических форм**:
```typescript
// Angular FormGroup
get valid(): boolean {
  // O(n) - обход всех полей при каждом вызове
  return Object.values(this.controls).every(c => c.valid);
}
```

**Решение через computed**:
```typescript
// GroupNode
this.valid = computed(() => {
  // Вызывается только при изменении дочерних valid signals
  for (const field of this.fields.values()) {
    if (!field.valid.value) return false;
  }
  return true;
});
```

**Результат**: При изменении одного поля пересчитываются только зависимые computed signals, а не все дерево.

### Debounce для async валидации

```typescript
new FieldNode({
  value: '',
  component: Input,
  asyncValidators: [checkEmailUnique],
  debounce: 300, // ✅ Debounce только для async
});
```

**Реализация** ([field-node.ts:250-270](../src/lib/forms/core/nodes/field-node.ts#L250-270)):
- Sync валидаторы выполняются сразу
- Async валидаторы с debounce
- Cleanup debounce таймера при dispose

### Параллельное выполнение async валидаторов

```typescript
private async runAsyncValidators(): Promise<ValidationError[]> {
  // ✅ Promise.all - параллельное выполнение
  const results = await Promise.all(
    this.asyncValidators.map(validator =>
      validator(this._value.value, context)
    )
  );

  return results.filter(Boolean);
}
```

### WeakMap для автоматической очистки

```typescript
// ✅ Автоматическая очистка при GC формы
private static validators = new WeakMap<GroupNode<any>, ValidatorEntry[]>();
private static behaviors = new WeakMap<GroupNode<any>, (() => void)[]>();
```

---

## Примеры использования

### Простая форма логина

```typescript
interface LoginForm {
  email: string;
  password: string;
}

const form = new GroupNode<LoginForm>({
  form: {
    email: { value: '', component: Input },
    password: { value: '', component: Input },
  },
  validation: (path) => {
    required(path.email, { message: 'Email обязателен' });
    email(path.email);
    required(path.password);
    minLength(path.password, 8);
  },
});

// Использование
form.email.setValue('test@mail.com');
const isValid = await form.validate();

if (isValid) {
  await form.submit(async (values) => {
    await api.login(values);
  });
}
```

### Форма с вложенными объектами

```typescript
interface UserForm {
  name: string;
  address: {
    city: string;
    street: string;
  };
}

const form = new GroupNode<UserForm>({
  form: {
    name: { value: '', component: Input },
    address: {
      city: { value: '', component: Input },
      street: { value: '', component: Input },
    },
  },
  validation: (path) => {
    required(path.name);
    required(path.address.city);
    required(path.address.street);
  },
});

// Прямой доступ к вложенным полям
form.address.city.setValue('Moscow');
console.log(form.address.city.value.value); // 'Moscow'
```

### Форма с массивом

```typescript
interface TodoForm {
  title: string;
  items: Array<{
    text: string;
    done: boolean;
  }>;
}

const form = new GroupNode<TodoForm>({
  form: {
    title: { value: '', component: Input },
    items: [{
      text: { value: '', component: Input },
      done: { value: false, component: Checkbox },
    }],
  },
  validation: (path) => {
    required(path.title);
    // Validation для элементов массива
    form.items.applyValidationSchema((itemPath) => {
      required(itemPath.text);
    });
  },
});

// CRUD операции
form.items.push({ text: 'New task', done: false });
form.items.at(0)?.text.setValue('Updated task');
form.items.removeAt(0);
```

### Форма с условной валидацией

```typescript
interface LoanForm {
  loanType: 'personal' | 'mortgage';
  amount: number;
  propertyValue: number | null;
}

const form = new GroupNode<LoanForm>({
  form: {
    loanType: { value: 'personal', component: Select },
    amount: { value: 0, component: Input },
    propertyValue: { value: null, component: Input },
  },
  validation: (path) => {
    required(path.loanType);
    required(path.amount);
    min(path.amount, 10000);

    // ✅ Условная валидация
    applyWhen(
      path.loanType,
      (type) => type === 'mortgage',
      (path) => {
        required(path.propertyValue, {
          message: 'Укажите стоимость недвижимости'
        });
        min(path.propertyValue, 100000);
      }
    );
  },
  behavior: (path) => {
    // ✅ Условное включение поля
    enableWhen(
      path.propertyValue,
      path.loanType,
      {
        condition: (type) => type === 'mortgage',
        resetOnDisable: true,
      }
    );
  },
});
```

### Форма с кросс-полевой валидацией

```typescript
interface PasswordForm {
  password: string;
  confirmPassword: string;
}

const form = new GroupNode<PasswordForm>({
  form: {
    password: { value: '', component: Input },
    confirmPassword: { value: '', component: Input },
  },
  validation: (path) => {
    required(path.password);
    minLength(path.password, 8);
    required(path.confirmPassword);

    // ✅ Кросс-полевая валидация
    validate(
      [path.password, path.confirmPassword],
      (values, ctx) => {
        const [password, confirm] = values;
        if (password !== confirm) {
          return {
            code: 'mismatch',
            message: 'Пароли не совпадают'
          };
        }
        return null;
      },
      { targetField: 'confirmPassword' }
    );
  },
});
```

---

## Migration Guide

### От старой архитектуры к новой

**Было (legacy)**:
```typescript
import { FormStore } from '@/lib/forms/core/legacy/form-store.old';

const form = new FormStore({
  email: '',
  password: '',
});

// Доступ через controls
form.controls.email.setValue('test@mail.com');
form.controls.email.addValidator(requiredValidator);
```

**Стало (новая архитектура)**:
```typescript
import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { required, email } from '@/lib/forms/validators';

const form = new GroupNode({
  form: {
    email: { value: '', component: Input },
    password: { value: '', component: Input },
  },
  validation: (path) => {
    required(path.email);
    email(path.email);
    required(path.password);
  },
});

// ✅ Прямой доступ через proxy
form.email.setValue('test@mail.com');
```

**Преимущества**:
- ✅ Type-safe доступ к полям
- ✅ Декларативная валидация
- ✅ Лучшая производительность (computed signals)
- ✅ Единый API для всех узлов
- ✅ Композиция и переиспользование

---

## Диаграммы

### Иерархия классов

```
┌─────────────────────────────────────────────┐
│           FormNode<T>                       │
│  (abstract base class)                      │
│                                             │
│  + value: ReadonlySignal<T>                │
│  + valid: ReadonlySignal<boolean>          │
│  + touched: ReadonlySignal<boolean>        │
│  + errors: ReadonlySignal<ValidationError[]>│
│                                             │
│  # getValue(): T                            │
│  # setValue(value: T): void                 │
│  # validate(): Promise<boolean>             │
└─────────────────────────────────────────────┘
                    ▲
                    │
        ┌───────────┼───────────┐
        │           │           │
┌───────┴──────┐ ┌──┴────────┐ ┌┴────────────┐
│ FieldNode<T> │ │GroupNode  │ │ArrayNode<T> │
│              │ │    <T>    │ │             │
│ Одно поле    │ │           │ │ Массив форм │
│              │ │ Группа    │ │             │
│ + component  │ │ полей     │ │ + push()    │
│ + validators │ │           │ │ + removeAt()│
│ + debounce   │ │ + fields  │ │ + at()      │
└──────────────┘ │ + proxy   │ └─────────────┘
                 └───────────┘
```

### Поток данных (setValue)

```
User Input
    │
    ▼
field.setValue('new value')
    │
    ├─→ _value.value = 'new value'  (Signal update)
    │
    ├─→ _dirty.value = true          (Mark as dirty)
    │
    └─→ Computed signals автоматически пересчитываются:
        │
        ├─→ valid.value  (зависит от _errors)
        │
        ├─→ status.value (зависит от valid, pending)
        │
        └─→ GroupNode.value (агрегация всех полей)
            │
            └─→ GroupNode.valid (AND всех дочерних valid)
```

### Validation flow

```
field.validate()
    │
    ├─→ 1. Sync validators (последовательно)
    │       │
    │       ├─→ Validator 1 → Error | null
    │       ├─→ Validator 2 → Error | null
    │       └─→ Если есть ошибки → STOP
    │
    ├─→ 2. Async validators (параллельно)
    │       │
    │       ├─→ Promise.all([
    │       │     asyncValidator1(value),
    │       │     asyncValidator2(value),
    │       │   ])
    │       │
    │       └─→ Debounce (если настроен)
    │
    ├─→ 3. Collect errors
    │       │
    │       └─→ _errors.value = [...syncErrors, ...asyncErrors]
    │
    └─→ 4. Computed signals update
            │
            └─→ valid.value, status.value
```

---

## Ссылки

- [Примеры использования](../src/examples/)
- [Validation Schema Examples](../src/examples/validation-example.ts)
- [Behavior Schema Examples](../src/examples/behavior-schema-example.ts)
- [React Hooks Examples](../src/examples/react-hooks-example.tsx)
- [Миграция на новую архитектуру](../src/lib/forms/MIGRATION.md)
- [Организация тестов](testing-structure.md)
