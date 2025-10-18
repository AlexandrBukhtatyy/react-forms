# Сравнение вариантов FormValidationSchema

## Краткий обзор

| Критерий | Вариант 1<br/>Declarative | Вариант 2<br/>Functional | Вариант 3<br/>Integration | Вариант 4<br/>Hybrid |
|----------|---------------------------|--------------------------|---------------------------|----------------------|
| **Сложность реализации** | ⭐ Простая (1-2 дня) | ⭐⭐⭐ Средняя (3-4 дня) | ⭐⭐ Средняя (2-3 дня) | ⭐⭐⭐⭐ Сложная (4-5 дней) |
| **Простота использования** | ⭐⭐⭐⭐⭐ Очень простая | ⭐⭐⭐ Средняя | ⭐⭐⭐⭐ Простая | ⭐⭐⭐ Средняя |
| **Похожесть на Angular** | ⭐⭐ Слабая | ⭐⭐⭐⭐⭐ Максимальная | ⭐⭐⭐ Средняя | ⭐⭐⭐⭐ Высокая |
| **Гибкость** | ⭐⭐⭐ Средняя | ⭐⭐⭐⭐ Высокая | ⭐⭐⭐⭐ Высокая | ⭐⭐⭐⭐⭐ Максимальная |
| **Тестируемость** | ⭐⭐⭐⭐⭐ Отличная | ⭐⭐⭐⭐ Хорошая | ⭐⭐⭐⭐⭐ Отличная | ⭐⭐⭐⭐ Хорошая |
| **TypeScript поддержка** | ⭐⭐⭐⭐ Хорошая | ⭐⭐⭐⭐ Хорошая | ⭐⭐⭐⭐⭐ Отличная | ⭐⭐⭐⭐⭐ Отличная |
| **Bundle size** | +0kb | +2-3kb | +12-50kb (зависит от библиотеки) | +3-5kb (+библиотеки опционально) |
| **Кросс-филд валидация** | ⭐⭐⭐ Средняя | ⭐⭐⭐⭐⭐ Отличная | ⭐⭐⭐⭐ Хорошая | ⭐⭐⭐⭐⭐ Отличная |
| **Условная валидация** | ⭐⭐ Ограниченная | ⭐⭐⭐⭐⭐ Отличная | ⭐⭐⭐⭐ Хорошая | ⭐⭐⭐⭐⭐ Отличная |
| **Расширяемость** | ⭐⭐⭐ Средняя | ⭐⭐⭐⭐ Хорошая | ⭐⭐⭐⭐⭐ Отличная | ⭐⭐⭐⭐⭐ Отличная |

## Детальное сравнение

### 1. Синтаксис использования

#### Вариант 1: Declarative

```typescript
const schema: FormValidationSchema<UserModel> = {
  username: {
    validators: [Validators.required(), Validators.minLength(3)],
    asyncValidators: [checkAvailability],
  },
  email: {
    validators: [Validators.required(), Validators.email()],
  },
};
```

**Плюсы:**
- Простой и понятный
- Легко читать и модифицировать
- Не требует изучения нового API

**Минусы:**
- Много boilerplate для сложных схем
- Кросс-филд валидация менее элегантна

---

#### Вариант 2: Functional (Angular-like)

```typescript
const schema: FormValidationSchema<UserModel> = (path, builder) => {
  builder.required(path.username);
  builder.minLength(path.username, 3);
  builder.asyncValidate(path.username, checkAvailability);
  builder.email(path.email);

  builder.validateTree((ctx) => {
    // Кросс-филд валидация
  });
};
```

**Плюсы:**
- Максимально похож на Angular Signal Forms
- Отличная поддержка условной валидации
- Выразительный для сложных сценариев

**Минусы:**
- Требует изучения нового API
- Больше кода для простых случаев

---

#### Вариант 3: Integration (Zod)

```typescript
const zodSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
});

const schema = createValidationSchema({
  type: 'external',
  library: 'zod',
  schema: zodSchema,
});
```

**Плюсы:**
- Минимальный код
- Отличная типизация
- Большая экосистема

**Минусы:**
- Дополнительная зависимость
- Синтаксис отличается от Angular

---

#### Вариант 4: Hybrid

```typescript
const schema = createValidationSchema({
  type: 'hybrid',
  schemas: [
    // Zod для базовой валидации
    { type: 'external', library: 'zod', schema: zodSchema },

    // Declarative для async
    {
      type: 'declarative',
      schema: { username: { asyncValidators: [checkAvailability] } },
    },

    // Functional для кросс-филд
    {
      type: 'functional',
      builder: (path, builder) => builder.validateTree(...),
    },
  ],
});
```

**Плюсы:**
- Максимальная гибкость
- Лучший инструмент для каждой задачи
- Расширяемый

**Минусы:**
- Самый сложный в реализации
- Больше концепций для изучения

## Сравнение по сценариям использования

### Сценарий 1: Простая форма логина

**Лучший выбор:** Вариант 1 (Declarative) или Вариант 3 (Zod)

```typescript
// Вариант 1
const schema = {
  email: { validators: [Validators.required(), Validators.email()] },
  password: { validators: [Validators.required(), Validators.minLength(8)] },
};

// Вариант 3
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

**Почему:** Простая валидация полей не требует сложных инструментов.

---

### Сценарий 2: Форма регистрации с проверкой паролей

**Лучший выбор:** Вариант 2 (Functional) или Вариант 4 (Hybrid)

```typescript
// Вариант 2
const schema = (path, builder) => {
  builder.required(path.password);
  builder.required(path.confirmPassword);

  builder.validateTree((ctx) => {
    const values = ctx.formValue();
    if (values.password !== values.confirmPassword) {
      return { code: 'mismatch', message: 'Пароли не совпадают' };
    }
    return null;
  }, { targetField: 'confirmPassword' });
};
```

**Почему:** Кросс-филд валидация лучше выражается через functional API.

---

### Сценарий 3: Динамическая форма с условной валидацией

**Лучший выбор:** Вариант 2 (Functional) или Вариант 4 (Hybrid)

```typescript
// Вариант 2
const schema = (path, builder) => {
  builder.required(path.country);

  builder.applyWhenValue(
    path.country,
    (value) => value === 'Russia',
    (builder) => builder.required(path.city)
  );

  builder.applyWhenValue(
    path.country,
    (value) => value === 'USA',
    (builder) => builder.required(path.zipCode)
  );
};
```

**Почему:** Условная валидация требует гибкости functional подхода.

---

### Сценарий 4: Форма с типобезопасностью и трансформацией

**Лучший выбор:** Вариант 3 (Zod) или Вариант 4 (Hybrid)

```typescript
const schema = z.object({
  email: z.string().email().transform(v => v.toLowerCase()),
  age: z.string().transform(v => parseInt(v, 10)).pipe(z.number().min(18)),
});
```

**Почему:** Zod предоставляет встроенную трансформацию и отличную типизацию.

---

### Сценарий 5: Большая форма с разными типами валидации

**Лучший выбор:** Вариант 4 (Hybrid)

```typescript
const schema = createValidationSchema({
  type: 'hybrid',
  schemas: [
    // Базовая валидация через Zod
    { type: 'external', library: 'zod', schema: baseZodSchema },

    // Async валидация уникальности
    {
      type: 'declarative',
      schema: {
        username: { asyncValidators: [checkUsername], updateOn: 'blur' },
        email: { asyncValidators: [checkEmail], updateOn: 'blur' },
      },
    },

    // Сложная кросс-филд логика
    {
      type: 'functional',
      builder: (path, builder) => {
        builder.validateTree(...);
        builder.applyWhenValue(...);
      },
    },
  ],
});
```

**Почему:** Разные требования лучше решаются разными инструментами.

## Рекомендации по выбору

### Выбирайте Вариант 1 (Declarative), если:

- ✅ Простая/средняя сложность форм
- ✅ Преимущественно валидация на уровне полей
- ✅ Нужна быстрая реализация
- ✅ Команда предпочитает декларативный подход
- ✅ Важна легкость тестирования
- ✅ Небольшой проект или прототип

**Примеры:** Формы логина, регистрации, настроек профиля

---

### Выбирайте Вариант 2 (Functional), если:

- ✅ Команда знакома с Angular Signal Forms
- ✅ Много кросс-филд валидаций
- ✅ Нужна условная валидация
- ✅ Сложные сценарии валидации
- ✅ Важна выразительность кода
- ✅ Средний/крупный проект

**Примеры:** Многошаговые формы, формы с динамической валидацией, мастера настройки

---

### Выбирайте Вариант 3 (Integration с Zod), если:

- ✅ Проект уже использует Zod/Yup
- ✅ Важна строгая типизация
- ✅ Нужна трансформация данных
- ✅ Команда знакома с Zod
- ✅ Нужны готовые решения
- ✅ Приоритет - скорость разработки

**Примеры:** Формы с API интеграцией, формы с трансформацией данных, типобезопасные формы

---

### Выбирайте Вариант 4 (Hybrid), если:

- ✅ Крупный проект с разными требованиями
- ✅ Нужна максимальная гибкость
- ✅ Разные части формы имеют разные нужды
- ✅ Планируется развитие и усложнение
- ✅ Важна расширяемость
- ✅ Можно выделить время на реализацию

**Примеры:** Enterprise приложения, конструкторы форм, сложные бизнес-формы

## Матрица принятия решений

```
                    Простота │ Гибкость │ Angular-like │ TypeScript
                             │          │              │
Вариант 1 (Declarative)      │    ✅    │     ⚠️      │     ⚠️      │    ✅
Вариант 2 (Functional)       │    ⚠️    │     ✅      │     ✅      │    ✅
Вариант 3 (Zod)              │    ✅    │     ✅      │     ⚠️      │    ✅✅
Вариант 4 (Hybrid)           │    ⚠️    │     ✅✅    │     ✅      │    ✅✅
```

## Примеры миграции

### Текущий подход → Вариант 1

**Было:**
```typescript
const form = new FormStore({
  username: {
    value: '',
    component: InputText,
    validators: [Validators.required()],
  },
});
```

**Стало:**
```typescript
const form = new FormStore(
  {
    username: { value: '', component: InputText },
  },
  {
    username: { validators: [Validators.required()] },
  }
);
```

**Сложность миграции:** Низкая

---

### Текущий подход → Вариант 2

**Было:**
```typescript
const form = new FormStore({
  username: {
    value: '',
    component: InputText,
    validators: [Validators.required(), Validators.minLength(3)],
  },
});
```

**Стало:**
```typescript
const form = new FormStore(
  {
    username: { value: '', component: InputText },
  },
  (path, schema) => {
    schema.required(path.username);
    schema.minLength(path.username, 3);
  }
);
```

**Сложность миграции:** Средняя

---

### Текущий подход → Вариант 3

**Было:**
```typescript
const form = new FormStore({
  username: {
    value: '',
    component: InputText,
    validators: [Validators.required(), Validators.minLength(3)],
  },
  email: {
    value: '',
    component: InputText,
    validators: [Validators.required(), Validators.email()],
  },
});
```

**Стало:**
```typescript
const zodSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
});

const form = new FormStore(
  {
    username: { value: '', component: InputText },
    email: { value: '', component: InputText },
  },
  createValidationSchema({ type: 'external', library: 'zod', schema: zodSchema })
);
```

**Сложность миграции:** Средняя

## Итоговая рекомендация

### Для вашего проекта рекомендую:

1. **Начать с Варианта 1 (Declarative)** ✅
   - Простая и быстрая реализация
   - Интуитивно понятен
   - Легко тестировать
   - Достаточно для большинства случаев
   - Можно всегда мигрировать на более сложный вариант

2. **Добавить поддержку Варианта 3 (Zod) позже** 🎯
   - Опциональная интеграция
   - Для случаев, где нужна мощная типизация
   - Через адаптеры

3. **Рассмотреть Вариант 4 (Hybrid) для будущего** 🚀
   - Когда проект вырастет
   - Когда появятся сложные требования
   - Постепенная эволюция

### Пошаговый план внедрения:

**Этап 1 (1-2 недели):**
- Реализовать Вариант 1 (Declarative)
- Покрыть тестами
- Документировать
- Мигрировать 2-3 простые формы

**Этап 2 (опционально, через 1-2 месяца):**
- Добавить адаптер для Zod
- Использовать для новых сложных форм
- Оценить необходимость

**Этап 3 (опционально, через 3-6 месяцев):**
- Если нужна большая гибкость
- Реализовать Functional builder (Вариант 2)
- Или полный Hybrid (Вариант 4)

## Заключение

Все четыре варианта жизнеспособны и решают задачу добавления FormValidationSchema. Выбор зависит от:

- **Размера проекта:** малый → Вариант 1, крупный → Вариант 4
- **Сложности валидации:** простая → Вариант 1/3, сложная → Вариант 2/4
- **Знакомства команды:** React → Вариант 1/3, Angular → Вариант 2
- **Времени на реализацию:** мало → Вариант 1, много → Вариант 4
- **Приоритетов:** скорость → Вариант 1, гибкость → Вариант 4

**Моя личная рекомендация:** Начните с Варианта 1, он даст 80% пользы за 20% усилий.
