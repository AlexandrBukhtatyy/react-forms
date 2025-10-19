# Signal Forms: Полная документация

> **Функциональный API валидации форм в стиле Angular Signal Forms**
> Comprehensive руководство с примерами, паттернами и реальным кейсом

## 📚 Структура документации

Документация разделена на несколько файлов для удобства навигации:

### 1. **[SIGNAL_FORMS_COMPLETE_GUIDE.md](SIGNAL_FORMS_COMPLETE_GUIDE.md)**
**Полное руководство по всем паттернам использования**

Содержит:
- ✅ Основы работы с API
- ✅ Все виды валидации полей
- ✅ Cross-field валидация (валидация на основе нескольких полей)
- ✅ Условная валидация (валидация в зависимости от других полей)
- ✅ Асинхронная валидация (проверка на сервере)
- ✅ Сложные паттерны и динамические формы
- ✅ Переиспользование валидации
- ✅ Стратегии обновления (change/blur/submit) 

**Ключевые разделы:**
- Базовая структура и доступ к значениям
- Built-in валидаторы (required, minLength, email, pattern, min, max)
- Кастомные синхронные валидаторы
- Cross-field валидация для проверки связанных полей
- Условная валидация с вложенными условиями
- Асинхронная валидация с debounce
- Валидация массивов и динамических полей
- Мульти-степенные формы (wizard)
- Переиспользуемые функции валидации

### 2. **[CREDIT_APPLICATION_EXAMPLE.md](CREDIT_APPLICATION_EXAMPLE.md)**
**Пример сложной пошаговой формы заявки на кредит**

Содержит:
- ✅ Структуру 6-шаговой формы
- ✅ Полные типы данных TypeScript
- ✅ Comprehensive схему валидации
- ✅ Все паттерны валидации в одном примере

**Шаги формы:**
1. **Основная информация** - тип кредита, сумма, срок, цель
2. **Персональные данные** - ФИО, дата рождения, паспорт, ИНН, СНИЛС
3. **Контактная информация** - телефоны, email, адреса
4. **Информация о занятости** - место работы, должность, доход
5. **Дополнительная информация** - семья, имущество, другие кредиты
6. **Подтверждение и согласия** - проверка данных, согласия, подпись

**Особенности примера:**
- Динамические поля в зависимости от типа кредита (ипотека/авто/потребительский)
- Условная валидация для разных статусов занятости
- Cross-field валидация соотношения дохода и платежа
- Асинхронная проверка ИНН, email, СМС-кода
- Валидация массивов (имущество, кредиты, созаемщики)
- Бизнес-логика (первоначальный взнос, возрастные ограничения)

### 3. **[CREDIT_APPLICATION_USAGE.md](CREDIT_APPLICATION_USAGE.md)**
**React компоненты и использование формы**

Содержит:
- ✅ Создание инстанса формы
- ✅ React компоненты для каждого шага
- ✅ Навигация между шагами
- ✅ Индикатор прогресса
- ✅ Сохранение черновика
- ✅ Отправка заявки
- ✅ Полные стили CSS

**Компоненты:**
- `CreditApplicationPage` - главный компонент
- `StepIndicator` - индикатор шагов с прогрессом
- `Step1BasicInfo` - компонент первого шага
- `NavigationButtons` - кнопки навигации
- Полностью рабочий пример с React и signals

---

## 🚀 Быстрый старт

### Простая форма

```typescript
import { FormStore } from './lib/forms';
import { required, email, minLength } from './lib/forms/validators';
import type { FieldPath } from './lib/forms';

// 1. Определяем интерфейс
interface LoginForm {
  email: string;
  password: string;
}

// 2. Создаем схему валидации (чистые функции!)
const loginValidation = (path: FieldPath<LoginForm>) => {
  required(path.email);
  email(path.email);

  required(path.password);
  minLength(path.password, 8);
};

// 3. Создаем форму
const form = new FormStore<LoginForm>(
  {
    email: { value: '', component: InputText },
    password: { value: '', component: InputPassword },
  },
  loginValidation
);

// 4. Используем
form.controls.email.setValue('user@example.com');
await form.validate();
const values = form.getValue();
```

### Кредитная форма (полный пример)

```typescript
import { createCreditApplicationForm } from './form-factory';

// Создаем форму со всей валидацией
const form = createCreditApplicationForm();

// Форма автоматически валидируется с учетом:
// - Текущего шага
// - Типа кредита
// - Статуса занятости
// - И других условий

// Навигация по шагам
form.controls.currentStep.setValue(2);

// Валидация текущего шага
await form.validate();

// Отправка
await form.submit(async (values) => {
  return await api.submitCreditApplication(values);
});
```

---

## 📖 Основные концепции

### 1. Функциональный API (без билдеров!)

**Как в Angular Signal Forms:**
```typescript
// Angular
flightForm = form(this.flight, (path) => {
  required(path.from);
  minLength(path.from, 3);
});

// Наша реализация (идентично!)
const validation = (path: FieldPath<FlightModel>) => {
  required(path.from);
  minLength(path.from, 3);
};
```

### 2. Type-safe доступ к полям

```typescript
const validation = (path: FieldPath<UserForm>) => {
  // TypeScript знает все поля формы
  required(path.username);  // ✅ Типобезопасно
  required(path.email);     // ✅ Типобезопасно
  required(path.unknown);   // ❌ Ошибка компиляции
};
```

### 3. Реактивность через Signals

```typescript
// Значения автоматически обновляются
const name = form.controls.name.value;

// Изменение триггерит валидацию (если updateOn === 'change')
form.controls.name.setValue('John');

// Вся форма реактивна
const allValues = form.value; // ReadonlySignal<T>
```

### 4. Композиция валидаторов

```typescript
// Переиспользуемый валидатор
function validateFullName(field, label) {
  required(field, { message: `${label} обязательно` });
  minLength(field, 2);
  maxLength(field, 50);
  pattern(field, /^[А-ЯЁа-яё\s-]+$/);
}

// Используем
const validation = (path) => {
  validateFullName(path.firstName, 'Имя');
  validateFullName(path.lastName, 'Фамилия');
};
```

---

## 🎯 Паттерны использования

### Базовая валидация
```typescript
required(path.email);
email(path.email);
minLength(path.password, 8);
```

### Вложенные формы (Nested Forms)
```typescript
// Интерфейс вложенной формы
interface Address {
  city: string;
  street: string;
  postalCode: string;
}

// Переиспользуемый валидатор
function validateAddress<T>(addressPath: FieldPath<T>[keyof T]) {
  const addr = addressPath as any as FieldPath<Address>;
  required(addr.city);
  required(addr.postalCode);
  pattern(addr.postalCode, /^\d{6}$/, { message: '6 цифр' });
}

// Основная форма с вложенными адресами
interface Form {
  registrationAddress: Address;
  residenceAddress?: Address;
}

const validation = (path: FieldPath<Form>) => {
  validateAddress(path.registrationAddress);
  validateAddress(path.residenceAddress as any);
};
```

### Cross-field валидация
```typescript
validateTree(
  (ctx) => {
    const form = ctx.formValue();
    if (form.password !== form.confirmPassword) {
      return { code: 'mismatch', message: 'Пароли не совпадают' };
    }
    return null;
  },
  { targetField: 'confirmPassword' }
);
```

### Условная валидация
```typescript
applyWhen(
  path.country,
  (value) => value === 'Russia',
  (path) => {
    required(path.city);
    required(path.region);
  }
);
```

### Асинхронная валидация
```typescript
validateAsync(
  path.username,
  async (ctx) => {
    const exists = await checkUsernameExists(ctx.value());
    if (exists) {
      return { code: 'exists', message: 'Имя занято' };
    }
    return null;
  },
  { debounce: 500 }
);
```

---

## 📊 Статистика примера кредитной формы

### Объем кода
- **Типы данных**: ~150 строк
- **Схема валидации**: ~800 строк
- **React компоненты**: ~400 строк
- **Всего**: ~1350 строк кода

### Покрывает
- ✅ 6 шагов формы
- ✅ 40+ полей формы
- ✅ **4 вложенные формы** (PersonalData, PassportData, Address x2)
- ✅ 5 типов кредитов с разной логикой
- ✅ 4 статуса занятости
- ✅ 20+ условных правил
- ✅ 10+ cross-field проверок (включая между вложенными формами)
- ✅ 5 асинхронных валидаторов
- ✅ Валидация массивов и динамических полей
- ✅ Бизнес-правила банковской сферы

### Демонстрирует
- ✅ Мульти-степенную форму (wizard)
- ✅ **Вложенные формы** с переиспользуемой валидацией
- ✅ Динамические поля
- ✅ Сложную условную логику
- ✅ Расчеты на основе нескольких полей
- ✅ Cross-field валидацию между вложенными формами
- ✅ Проверку на сервере
- ✅ UX-паттерны (индикатор прогресса, сохранение черновика)
- ✅ Реактивность и производительность

---

## 🛠 Технологии

- **TypeScript** - полная типизация
- **Preact Signals** - реактивность
- **React** - UI компоненты
- **Proxy API** - type-safe доступ к полям

---

## 📝 Дополнительные ресурсы

### Другие файлы документации

- [VALIDATION_API.md](VALIDATION_API.md) - Краткое руководство по API
- [validation-schema-variant-2-functional.md](validation-schema-variant-2-functional.md) - Дизайн и архитектура

### Исходный код

- [src/lib/forms/validators/functional.ts](src/lib/forms/validators/functional.ts) - Реализация валидаторов
- [src/lib/forms/core/form-store.ts](src/lib/forms/core/form-store.ts) - FormStore
- [src/lib/forms/core/field-controller.ts](src/lib/forms/core/field-controller.ts) - FieldController
- [src/lib/forms/types/index.ts](src/lib/forms/types/index.ts) - Типы

### Примеры

- [src/examples/validation-example.ts](src/examples/validation-example.ts) - Базовый пример
- Кредитная форма - см. CREDIT_APPLICATION_*.md

---

## 🎓 Изученные источники

При создании этой документации были изучены:

### Angular Signal Forms (официальная документация)
- **ANGULARarchitects** - "All About Angular's New Signal Forms"
- Детальное описание API, validateTree, cross-field валидации

### Community библиотеки
- **ng-signal-forms** by Tim Deschryver
- Паттерны реализации, примеры использования

### Статьи и tutorials
- "Bringing the power of Signals to Angular Forms with Signal Forms"
- "Angular Signal Forms Deep Dive"
- "Mastering Angular 21 Signal Forms"

---

## ✨ Особенности реализации

### Отличия от Angular

| Аспект | Angular Signal Forms | Наша реализация |
|--------|---------------------|-----------------|
| **Библиотека сигналов** | Angular Signals | Preact Signals |
| **UI Framework** | Angular | React |
| **Синтаксис функций** | Идентичный | Идентичный |
| **Type safety** | TypeScript | TypeScript |
| **API** | Чистые функции | Чистые функции |

### Что идентично

✅ Синтаксис валидации (required, minLength, validate, validateTree)
✅ Паттерн path для доступа к полям
✅ ValidationContext API
✅ Условная валидация через applyWhen
✅ Асинхронные валидаторы с debounce
✅ Cross-field валидация

### Дополнительные возможности

✅ Интеграция с React компонентами
✅ Сохранение черновиков
✅ Мульти-степенные формы
✅ Динамические массивы полей
✅ Готовые компоненты для сложных форм

---

## 🚦 Начало работы

### 1. Прочитайте базовое руководство
👉 [SIGNAL_FORMS_COMPLETE_GUIDE.md](SIGNAL_FORMS_COMPLETE_GUIDE.md)

### 2. Изучите пример кредитной формы
👉 [CREDIT_APPLICATION_EXAMPLE.md](CREDIT_APPLICATION_EXAMPLE.md)
👉 [CREDIT_APPLICATION_USAGE.md](CREDIT_APPLICATION_USAGE.md)

### 3. Используйте в своем проекте
```typescript
import { FormStore } from './lib/forms';
import { required, email } from './lib/forms/validators';
// ... ваш код
```

---

## 💡 Лучшие практики

1. **Разделяйте схемы валидации на переиспользуемые функции**
2. **Используйте условную валидацию вместо множества if-else**
3. **Применяйте updateOn('blur') для тяжелых проверок**
4. **Добавляйте debounce для асинхронных валидаторов**
5. **Группируйте связанные поля в cross-field валидаторы**
6. **Пишите понятные сообщения об ошибках**
7. **Тестируйте сложные схемы валидации**

---

## 📞 Поддержка

Если у вас возникли вопросы:
1. Проверьте примеры в документации
2. Посмотрите на кредитную форму - она покрывает 90% use cases
3. Изучите исходный код валидаторов

---

**Happy coding! 🎉**

Эта реализация демонстрирует, как можно создать мощную, типобезопасную и удобную систему валидации форм, основанную на функциональном подходе Angular Signal Forms, но адаптированную для React экосистемы.
