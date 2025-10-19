# Signal Forms: Полное руководство по всем паттернам использования

> **Основано на Angular Signal Forms API**
> Полное руководство по функциональному API валидации форм в стиле Angular Signal Forms

## Содержание

1. [Основы](#основы)
2. [Валидация полей](#валидация-полей)
3. [Cross-field валидация](#cross-field-валидация)
4. [Условная валидация](#условная-валидация)
5. [Асинхронная валидация](#асинхронная-валидация)
6. [Вложенные формы (Nested Forms)](#вложенные-формы-nested-forms)
7. [Сложные паттерны](#сложные-паттерны)
8. [Динамические формы](#динамические-формы)
9. [Переиспользование валидации](#переиспользование-валидации)
10. [Реальный пример: Заявка на кредит](#пример-заявка-на-кредит)

---

## Основы

### Базовая структура

```typescript
import { FormStore } from './lib/forms';
import { required, email } from './lib/forms/validators';
import type { FieldPath } from './lib/forms';

interface MyForm {
  name: string;
  email: string;
}

// Схема валидации - простая функция
const validation = (path: FieldPath<MyForm>) => {
  required(path.name);
  required(path.email);
  email(path.email);
};

// Создание формы
const form = new FormStore<MyForm>(
  {
    name: { value: '', component: InputText },
    email: { value: '', component: InputText },
  },
  validation
);
```

### Доступ к значениям

```typescript
// Получить все значения формы
const values = form.getValue();

// Получить значение одного поля
const name = form.controls.name.value;

// Установить значения
form.setValue({ name: 'John', email: 'john@example.com' });

// Частичное обновление
form.patchValue({ name: 'Jane' });

// Установить значение одного поля
form.controls.email.setValue('jane@example.com');
```

---

## Валидация полей

### Built-in валидаторы

```typescript
const validation = (path: FieldPath<UserForm>) => {
  // ============================================================================
  // 1. Required - обязательное поле
  // ============================================================================

  required(path.username);
  required(path.email, { message: 'Email обязателен' });

  // ============================================================================
  // 2. Длина строки
  // ============================================================================

  minLength(path.username, 3);
  minLength(path.username, 3, { message: 'Минимум 3 символа' });

  maxLength(path.username, 20);
  maxLength(path.bio, 500, { message: 'Максимум 500 символов' });

  // ============================================================================
  // 3. Числовые значения
  // ============================================================================

  min(path.age, 18);
  min(path.age, 18, { message: 'Минимальный возраст: 18 лет' });

  max(path.age, 100);
  max(path.salary, 1000000, { message: 'Максимум 1 млн' });

  // ============================================================================
  // 4. Форматы
  // ============================================================================

  email(path.email);
  email(path.workEmail, { message: 'Некорректный рабочий email' });

  pattern(path.phone, /^\+?\d{10,15}$/);
  pattern(path.phone, /^\+?\d{10,15}$/, {
    message: 'Телефон должен содержать 10-15 цифр'
  });

  // Пароль с буквами и цифрами
  pattern(path.password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/);
};
```

### Кастомные синхронные валидаторы

```typescript
const validation = (path: FieldPath<UserForm>) => {
  // ============================================================================
  // Простой кастомный валидатор
  // ============================================================================

  validate(path.username, (ctx) => {
    const value = ctx.value();

    if (value.includes(' ')) {
      return {
        code: 'noSpaces',
        message: 'Имя не должно содержать пробелы',
      };
    }

    return null; // валидация пройдена
  });

  // ============================================================================
  // Валидатор с доступом к другим полям
  // ============================================================================

  validate(path.confirmEmail, (ctx) => {
    const confirmEmail = ctx.value();
    const email = ctx.getField('email');

    if (confirmEmail !== email) {
      return {
        code: 'emailMismatch',
        message: 'Email адреса не совпадают',
      };
    }

    return null;
  });

  // ============================================================================
  // Множественные проверки
  // ============================================================================

  validate(path.password, (ctx) => {
    const value = ctx.value();

    if (value.length < 8) {
      return {
        code: 'tooShort',
        message: 'Минимум 8 символов',
      };
    }

    if (!/[A-Z]/.test(value)) {
      return {
        code: 'noUppercase',
        message: 'Должна быть хотя бы одна заглавная буква',
      };
    }

    if (!/[a-z]/.test(value)) {
      return {
        code: 'noLowercase',
        message: 'Должна быть хотя бы одна строчная буква',
      };
    }

    if (!/\d/.test(value)) {
      return {
        code: 'noDigit',
        message: 'Должна быть хотя бы одна цифра',
      };
    }

    return null;
  });

  // ============================================================================
  // Валидация с параметрами
  // ============================================================================

  validate(path.username, (ctx) => {
    const value = ctx.value();
    const forbiddenWords = ['admin', 'root', 'system'];

    const found = forbiddenWords.find(word =>
      value.toLowerCase().includes(word)
    );

    if (found) {
      return {
        code: 'forbiddenWord',
        message: `Слово "${found}" запрещено`,
        params: { word: found },
      };
    }

    return null;
  });
};
```

---

## Cross-field валидация

### Базовая cross-field валидация

```typescript
const validation = (path: FieldPath<PasswordForm>) => {
  // ============================================================================
  // 1. Проверка совпадения паролей
  // ============================================================================

  validateTree(
    (ctx) => {
      const form = ctx.formValue();

      if (form.password !== form.confirmPassword) {
        return {
          code: 'passwordMismatch',
          message: 'Пароли не совпадают',
        };
      }

      return null;
    },
    { targetField: 'confirmPassword' } // Ошибка отобразится на этом поле
  );

  // ============================================================================
  // 2. Сравнение дат
  // ============================================================================

  validateTree(
    (ctx) => {
      const form = ctx.formValue();
      const startDate = new Date(form.startDate);
      const endDate = new Date(form.endDate);

      if (endDate <= startDate) {
        return {
          code: 'invalidDateRange',
          message: 'Дата окончания должна быть позже даты начала',
        };
      }

      return null;
    },
    { targetField: 'endDate' }
  );

  // ============================================================================
  // 3. Зависимые поля
  // ============================================================================

  validateTree(
    (ctx) => {
      const form = ctx.formValue();

      // Если указан email, то имя обязательно
      if (form.email && !form.name) {
        return {
          code: 'nameRequiredWithEmail',
          message: 'При указании email необходимо указать имя',
        };
      }

      return null;
    },
    { targetField: 'name' }
  );

  // ============================================================================
  // 4. Сумма полей
  // ============================================================================

  validateTree(
    (ctx) => {
      const form = ctx.formValue();
      const total = form.field1 + form.field2 + form.field3;

      if (total > 100) {
        return {
          code: 'totalExceeded',
          message: 'Сумма полей не должна превышать 100',
          params: { total },
        };
      }

      return null;
    },
    { targetField: 'field3' }
  );
};
```

### Множественные cross-field валидаторы

```typescript
const validation = (path: FieldPath<ComplexForm>) => {
  // Валидатор 1: Пароли совпадают
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

  // Валидатор 2: Хотя бы один контакт указан
  validateTree(
    (ctx) => {
      const form = ctx.formValue();
      if (!form.email && !form.phone) {
        return {
          code: 'noContact',
          message: 'Укажите хотя бы один способ связи',
        };
      }
      return null;
    },
    { targetField: 'phone' }
  );

  // Валидатор 3: Логика бизнес-правил
  validateTree(
    (ctx) => {
      const form = ctx.formValue();

      // Если выбрана доставка, адрес обязателен
      if (form.deliveryMethod === 'delivery' && !form.address) {
        return {
          code: 'addressRequired',
          message: 'Укажите адрес доставки',
        };
      }

      // Если самовывоз, адрес не нужен
      if (form.deliveryMethod === 'pickup' && form.address) {
        return {
          code: 'addressNotNeeded',
          message: 'Адрес не требуется при самовывозе',
        };
      }

      return null;
    },
    { targetField: 'address' }
  );
};
```

---

## Условная валидация

### Базовая условная валидация

```typescript
const validation = (path: FieldPath<OrderForm>) => {
  // ============================================================================
  // 1. Условие на основе значения поля
  // ============================================================================

  applyWhen(
    path.country,
    (value) => value === 'Russia',
    (path) => {
      required(path.city, { message: 'Для России укажите город' });
      required(path.region, { message: 'Для России укажите регион' });
    }
  );

  // ============================================================================
  // 2. Условие на основе числового значения
  // ============================================================================

  applyWhen(
    path.age,
    (age) => age < 18,
    (path) => {
      required(path.parentName, { message: 'Укажите имя родителя' });
      required(path.parentPhone, { message: 'Укажите телефон родителя' });
    }
  );

  // ============================================================================
  // 3. Условие на основе булевого значения
  // ============================================================================

  applyWhen(
    path.hasCompany,
    (value) => value === true,
    (path) => {
      required(path.companyName);
      required(path.companyInn);
      pattern(path.companyInn, /^\d{10}$|^\d{12}$/, {
        message: 'ИНН должен содержать 10 или 12 цифр',
      });
    }
  );

  // ============================================================================
  // 4. Множественные условия
  // ============================================================================

  applyWhen(
    path.deliveryMethod,
    (value) => value === 'delivery',
    (path) => {
      required(path.address);
      required(path.city);
      required(path.postalCode);
      pattern(path.postalCode, /^\d{6}$/);
    }
  );

  applyWhen(
    path.deliveryMethod,
    (value) => value === 'pickup',
    (path) => {
      required(path.pickupPoint);
    }
  );
};
```

### Вложенная условная валидация

```typescript
const validation = (path: FieldPath<ApplicationForm>) => {
  // ============================================================================
  // Вложенные условия
  // ============================================================================

  applyWhen(
    path.applicationType,
    (type) => type === 'business',
    (path) => {
      required(path.companyName);
      required(path.businessType);

      // Вложенное условие внутри первого
      applyWhen(
        path.businessType,
        (type) => type === 'ooo' || type === 'ao',
        (path) => {
          required(path.ogrn);
          required(path.director);
          minLength(path.ogrn, 13);
        }
      );

      applyWhen(
        path.businessType,
        (type) => type === 'ip',
        (path) => {
          required(path.ogrnip);
          minLength(path.ogrnip, 15);
        }
      );
    }
  );

  // ============================================================================
  // Условия с дополнительной валидацией
  // ============================================================================

  applyWhen(
    path.loanAmount,
    (amount) => amount > 1000000,
    (path) => {
      required(path.incomeProof, {
        message: 'Для суммы >1млн требуется подтверждение дохода'
      });
      required(path.collateral, {
        message: 'Для суммы >1млн требуется залог',
      });

      // Дополнительная валидация внутри условия
      validate(path.collateral, (ctx) => {
        const value = ctx.value();
        const loanAmount = ctx.getField('loanAmount');

        if (value < loanAmount * 1.2) {
          return {
            code: 'insufficientCollateral',
            message: 'Залог должен быть не менее 120% от суммы кредита',
          };
        }

        return null;
      });
    }
  );
};
```

---

## Асинхронная валидация

### Базовая асинхронная валидация

```typescript
const validation = (path: FieldPath<RegistrationForm>) => {
  // ============================================================================
  // 1. Проверка уникальности на сервере
  // ============================================================================

  validateAsync(
    path.username,
    async (ctx) => {
      const value = ctx.value();

      // Не проверяем пустые значения
      if (!value) return null;

      try {
        const response = await fetch(`/api/check-username?name=${value}`);
        const data = await response.json();

        if (data.exists) {
          return {
            code: 'usernameTaken',
            message: 'Это имя пользователя уже занято',
          };
        }

        return null;
      } catch (error) {
        return {
          code: 'checkFailed',
          message: 'Не удалось проверить имя пользователя',
        };
      }
    },
    { debounce: 500 } // Задержка 500мс перед отправкой запроса
  );

  // ============================================================================
  // 2. Проверка email
  // ============================================================================

  validateAsync(
    path.email,
    async (ctx) => {
      const email = ctx.value();

      if (!email) return null;

      const exists = await checkEmailExists(email);

      if (exists) {
        return {
          code: 'emailExists',
          message: 'Этот email уже зарегистрирован',
        };
      }

      return null;
    },
    { debounce: 700 }
  );

  // ============================================================================
  // 3. Проверка с использованием других полей
  // ============================================================================

  validateAsync(
    path.promocode,
    async (ctx) => {
      const code = ctx.value();
      const country = ctx.getField('country');

      if (!code) return null;

      try {
        const isValid = await validatePromocode(code, country);

        if (!isValid) {
          return {
            code: 'invalidPromocode',
            message: 'Промокод недействителен для вашей страны',
          };
        }

        return null;
      } catch {
        return null; // Игнорируем ошибки сети
      }
    },
    { debounce: 300 }
  );
};

// Вспомогательные функции
async function checkEmailExists(email: string): Promise<boolean> {
  const response = await fetch(`/api/check-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  return data.exists;
}

async function validatePromocode(
  code: string,
  country: string
): Promise<boolean> {
  const response = await fetch('/api/validate-promocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, country }),
  });
  const data = await response.json();
  return data.valid;
}
```

### Комбинирование синхронной и асинхронной валидации

```typescript
const validation = (path: FieldPath<UserForm>) => {
  // Сначала синхронная валидация
  required(path.username);
  minLength(path.username, 3);
  maxLength(path.username, 20);
  pattern(path.username, /^[a-zA-Z0-9_]+$/, {
    message: 'Только буквы, цифры и подчеркивание',
  });

  // Затем асинхронная валидация (выполнится только если синхронная пройдена)
  validateAsync(
    path.username,
    async (ctx) => {
      const username = ctx.value();
      const exists = await checkUsernameExists(username);

      if (exists) {
        return {
          code: 'exists',
          message: 'Имя пользователя занято',
        };
      }

      return null;
    },
    { debounce: 500 }
  );
};
```

---

## Вложенные формы (Nested Forms)

### Концепция вложенных форм

Вложенные формы позволяют группировать связанные поля в отдельные структуры данных, обеспечивая лучшую организацию кода и переиспользование валидации.

### Базовый пример

```typescript
// ============================================================================
// Вложенные интерфейсы
// ============================================================================

interface Address {
  region: string;
  city: string;
  street: string;
  house: string;
  apartment?: string;
  postalCode: string;
}

interface PersonalData {
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
}

// ============================================================================
// Основная форма с вложенными формами
// ============================================================================

interface UserRegistrationForm {
  email: string;
  password: string;

  // Вложенная форма: персональные данные
  personalData: PersonalData;

  // Вложенная форма: адрес
  address: Address;
}
```

### Валидация вложенных форм

```typescript
// ============================================================================
// Переиспользуемый валидатор для вложенной формы
// ============================================================================

function validatePersonalData<T>(personalDataPath: FieldPath<T>[keyof T]) {
  // Приводим к типу вложенной формы
  const data = personalDataPath as any as FieldPath<PersonalData>;

  required(data.lastName, { message: 'Фамилия обязательна' });
  minLength(data.lastName, 2);
  maxLength(data.lastName, 50);

  required(data.firstName, { message: 'Имя обязательно' });
  minLength(data.firstName, 2);

  required(data.middleName, { message: 'Отчество обязательно' });
  minLength(data.middleName, 2);

  required(data.birthDate, { message: 'Дата рождения обязательна' });
}

function validateAddress<T>(
  addressPath: FieldPath<T>[keyof T],
  fieldLabel: string = 'Адрес'
) {
  // Приводим к типу вложенной формы
  const address = addressPath as any as FieldPath<Address>;

  required(address.region, { message: `${fieldLabel}: Регион обязателен` });
  required(address.city, { message: `${fieldLabel}: Город обязателен` });
  required(address.street, { message: `${fieldLabel}: Улица обязательна` });
  required(address.house, { message: `${fieldLabel}: Дом обязателен` });

  required(address.postalCode, { message: `${fieldLabel}: Индекс обязателен` });
  pattern(address.postalCode, /^\d{6}$/, {
    message: 'Индекс должен содержать 6 цифр',
  });
}

// ============================================================================
// Основная схема валидации
// ============================================================================

const validation = (path: FieldPath<UserRegistrationForm>) => {
  required(path.email);
  email(path.email);

  required(path.password);
  minLength(path.password, 8);

  // ВЛОЖЕННАЯ ФОРМА: Персональные данные
  validatePersonalData(path.personalData);

  // ВЛОЖЕННАЯ ФОРМА: Адрес
  validateAddress(path.address, 'Адрес проживания');
};
```

### Множественные вложенные формы одного типа

```typescript
interface ShippingForm {
  email: string;

  // Два адреса одного типа
  billingAddress: Address;
  shippingAddress: Address;

  sameAsBilling: boolean;
}

const validation = (path: FieldPath<ShippingForm>) => {
  required(path.email);
  email(path.email);

  // ВЛОЖЕННАЯ ФОРМА: Адрес выставления счета
  validateAddress(path.billingAddress, 'Адрес выставления счета');

  // ВЛОЖЕННАЯ ФОРМА: Адрес доставки (условно)
  applyWhen(
    path.sameAsBilling,
    (value) => value === false,
    (path) => {
      validateAddress(path.shippingAddress, 'Адрес доставки');
    }
  );
};
```

### Cross-field валидация между вложенными формами

```typescript
interface CreditApplicationForm {
  personalData: PersonalData;
  passportData: PassportData;
  // ...
}

interface PassportData {
  series: string;
  number: string;
  issueDate: string;
  issuedBy: string;
}

const validation = (path: FieldPath<CreditApplicationForm>) => {
  // Валидация вложенных форм
  validatePersonalData(path.personalData);
  validatePassportData(path.passportData);

  // Cross-field валидация между вложенными формами
  validateTree(
    (ctx) => {
      const form = ctx.formValue();
      const issueDate = new Date(form.passportData.issueDate);
      const birthDate = new Date(form.personalData.birthDate);

      if (issueDate < birthDate) {
        return {
          code: 'issueDateBeforeBirth',
          message: 'Дата выдачи паспорта не может быть раньше даты рождения',
        };
      }

      return null;
    },
    { targetField: 'passportData.issueDate' }
  );
};
```

### Вложенные формы с условной валидацией

```typescript
interface EmploymentForm {
  employmentStatus: 'employed' | 'selfEmployed' | 'unemployed';

  // Вложенная форма для работающих
  companyInfo?: CompanyInfo;

  // Вложенная форма для ИП
  businessInfo?: BusinessInfo;
}

interface CompanyInfo {
  name: string;
  inn: string;
  position: string;
}

interface BusinessInfo {
  type: string;
  inn: string;
  activity: string;
}

const validation = (path: FieldPath<EmploymentForm>) => {
  required(path.employmentStatus);

  // Условная валидация вложенной формы для работающих
  applyWhen(
    path.employmentStatus,
    (status) => status === 'employed',
    (path) => {
      validateCompanyInfo(path.companyInfo as any);
    }
  );

  // Условная валидация вложенной формы для ИП
  applyWhen(
    path.employmentStatus,
    (status) => status === 'selfEmployed',
    (path) => {
      validateBusinessInfo(path.businessInfo as any);
    }
  );
};

function validateCompanyInfo<T>(companyPath: FieldPath<T>[keyof T]) {
  const company = companyPath as any as FieldPath<CompanyInfo>;

  required(company.name, { message: 'Название компании обязательно' });
  minLength(company.name, 3);

  required(company.inn, { message: 'ИНН компании обязателен' });
  pattern(company.inn, /^\d{10}$/, {
    message: 'ИНН компании должен содержать 10 цифр',
  });

  required(company.position, { message: 'Должность обязательна' });
}

function validateBusinessInfo<T>(businessPath: FieldPath<T>[keyof T]) {
  const business = businessPath as any as FieldPath<BusinessInfo>;

  required(business.type, { message: 'Тип бизнеса обязателен' });

  required(business.inn, { message: 'ИНН ИП обязателен' });
  pattern(business.inn, /^\d{12}$/, {
    message: 'ИНН ИП должен содержать 12 цифр',
  });

  required(business.activity, { message: 'Вид деятельности обязателен' });
  minLength(business.activity, 10);
}
```

### Преимущества вложенных форм

✅ **Лучшая организация кода** - группировка связанных полей
✅ **Переиспользование валидации** - один валидатор для разных контекстов
✅ **Type-safety** - TypeScript знает структуру вложенных форм
✅ **Модульность** - можно использовать вложенную форму в разных местах
✅ **Читаемость** - понятная структура данных

### Пример: Форма с несколькими адресами

```typescript
interface MultiAddressForm {
  personalData: PersonalData;

  // Адрес регистрации
  registrationAddress: Address;

  // Адрес проживания (опционально)
  sameAsRegistration: boolean;
  residenceAddress?: Address;

  // Адрес работы (опционально)
  hasWorkAddress: boolean;
  workAddress?: Address;
}

const validation = (path: FieldPath<MultiAddressForm>) => {
  // Личные данные
  validatePersonalData(path.personalData);

  // Адрес регистрации (всегда обязателен)
  validateAddress(path.registrationAddress, 'Адрес регистрации');

  // Адрес проживания (если отличается)
  applyWhen(
    path.sameAsRegistration,
    (value) => value === false,
    (path) => {
      validateAddress(path.residenceAddress as any, 'Адрес проживания');
    }
  );

  // Адрес работы (если указан)
  applyWhen(
    path.hasWorkAddress,
    (value) => value === true,
    (path) => {
      validateAddress(path.workAddress as any, 'Адрес работы');
    }
  );
};
```

---

## Сложные паттерны

### Динамические правила валидации

```typescript
const validation = (path: FieldPath<DynamicForm>) => {
  // ============================================================================
  // Валидация на основе типа документа
  // ============================================================================

  applyWhen(
    path.documentType,
    (type) => type === 'passport',
    (path) => {
      required(path.passportSeries);
      required(path.passportNumber);
      pattern(path.passportSeries, /^\d{4}$/);
      pattern(path.passportNumber, /^\d{6}$/);
    }
  );

  applyWhen(
    path.documentType,
    (type) => type === 'driverLicense',
    (path) => {
      required(path.licenseNumber);
      pattern(path.licenseNumber, /^\d{10}$/);
      required(path.licenseIssueDate);
    }
  );

  applyWhen(
    path.documentType,
    (type) => type === 'foreignPassport',
    (path) => {
      required(path.foreignPassportNumber);
      pattern(path.foreignPassportNumber, /^\d{9}$/);
      required(path.foreignPassportCountry);
    }
  );
};
```

### Валидация массивов (динамические поля)

```typescript
interface FormWithArray {
  contacts: ContactItem[];
  // ... другие поля
}

interface ContactItem {
  type: 'email' | 'phone';
  value: string;
}

const validation = (path: FieldPath<FormWithArray>) => {
  // Базовая валидация для массива
  validate(path.contacts, (ctx) => {
    const contacts = ctx.value();

    if (!contacts || contacts.length === 0) {
      return {
        code: 'noContacts',
        message: 'Добавьте хотя бы один контакт',
      };
    }

    if (contacts.length > 5) {
      return {
        code: 'tooManyContacts',
        message: 'Максимум 5 контактов',
      };
    }

    // Проверка уникальности
    const values = contacts.map(c => c.value);
    const unique = new Set(values);

    if (values.length !== unique.size) {
      return {
        code: 'duplicateContacts',
        message: 'Контакты должны быть уникальными',
      };
    }

    // Проверка форматов
    for (const contact of contacts) {
      if (contact.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact.value)) {
          return {
            code: 'invalidEmail',
            message: `Некорректный email: ${contact.value}`,
          };
        }
      }

      if (contact.type === 'phone') {
        const phoneRegex = /^\+?\d{10,15}$/;
        if (!phoneRegex.test(contact.value)) {
          return {
            code: 'invalidPhone',
            message: `Некорректный телефон: ${contact.value}`,
          };
        }
      }
    }

    return null;
  });

  // Требуем хотя бы один email
  validate(path.contacts, (ctx) => {
    const contacts = ctx.value();
    const hasEmail = contacts?.some(c => c.type === 'email');

    if (!hasEmail) {
      return {
        code: 'noEmail',
        message: 'Добавьте хотя бы один email',
      };
    }

    return null;
  });
};
```

---

## Динамические формы

### Мульти-степенная форма

```typescript
interface WizardForm {
  // Шаг 1: Персональные данные
  firstName: string;
  lastName: string;
  birthDate: string;

  // Шаг 2: Контакты
  email: string;
  phone: string;
  address: string;

  // Шаг 3: Дополнительно
  newsletter: boolean;
  notifications: boolean;

  // Метаданные
  currentStep: number;
}

const validation = (path: FieldPath<WizardForm>) => {
  // ============================================================================
  // Шаг 1: Валидация только если находимся на шаге 1 или дальше
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step >= 1,
    (path) => {
      required(path.firstName, { message: 'Имя обязательно' });
      required(path.lastName, { message: 'Фамилия обязательна' });
      required(path.birthDate, { message: 'Дата рождения обязательна' });

      // Проверка возраста
      validate(path.birthDate, (ctx) => {
        const birthDate = new Date(ctx.value());
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        if (age < 18) {
          return {
            code: 'tooYoung',
            message: 'Вам должно быть не менее 18 лет',
          };
        }

        if (age > 100) {
          return {
            code: 'invalidAge',
            message: 'Проверьте корректность даты рождения',
          };
        }

        return null;
      });
    }
  );

  // ============================================================================
  // Шаг 2: Валидация только если находимся на шаге 2 или дальше
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step >= 2,
    (path) => {
      required(path.email, { message: 'Email обязателен' });
      email(path.email);

      required(path.phone, { message: 'Телефон обязателен' });
      pattern(path.phone, /^\+?\d{10,15}$/, {
        message: 'Некорректный формат телефона',
      });

      required(path.address, { message: 'Адрес обязателен' });
      minLength(path.address, 10, {
        message: 'Укажите полный адрес (минимум 10 символов)'
      });
    }
  );

  // ============================================================================
  // Шаг 3: Дополнительная валидация на последнем шаге
  // ============================================================================

  applyWhen(
    path.currentStep,
    (step) => step >= 3,
    (path) => {
      // На последнем шаге можем добавить дополнительные проверки
      validateTree(
        (ctx) => {
          const form = ctx.formValue();

          // Проверяем, что все обязательные шаги пройдены
          if (!form.firstName || !form.lastName || !form.birthDate) {
            return {
              code: 'step1Incomplete',
              message: 'Заполните данные на шаге 1',
            };
          }

          if (!form.email || !form.phone || !form.address) {
            return {
              code: 'step2Incomplete',
              message: 'Заполните данные на шаге 2',
            };
          }

          return null;
        },
        { targetField: 'currentStep' }
      );
    }
  );
};
```

---

## Переиспользование валидации

### Создание переиспользуемых валидаторов

```typescript
// ============================================================================
// Переиспользуемые функции валидации
// ============================================================================

/**
 * Валидация имени пользователя
 */
function usernameValidation<T>(path: FieldPath<T>, fieldPath: FieldPath<T>[keyof T]) {
  required(fieldPath, { message: 'Имя пользователя обязательно' });
  minLength(fieldPath, 3, { message: 'Минимум 3 символа' });
  maxLength(fieldPath, 20, { message: 'Максимум 20 символов' });
  pattern(fieldPath, /^[a-zA-Z0-9_]+$/, {
    message: 'Только буквы, цифры и подчеркивание',
  });

  validate(fieldPath, (ctx) => {
    const value = ctx.value();
    const forbidden = ['admin', 'root', 'system', 'test'];

    if (forbidden.some(word => value.toLowerCase().includes(word))) {
      return {
        code: 'forbiddenWord',
        message: 'Имя содержит запрещенное слово',
      };
    }

    return null;
  });
}

/**
 * Валидация телефона
 */
function phoneValidation<T>(
  fieldPath: FieldPath<T>[keyof T],
  options?: { required?: boolean }
) {
  if (options?.required) {
    required(fieldPath, { message: 'Телефон обязателен' });
  }

  pattern(fieldPath, /^\+?\d{10,15}$/, {
    message: 'Телефон должен содержать 10-15 цифр',
  });

  validate(fieldPath, (ctx) => {
    const phone = ctx.value();

    if (!phone) return null;

    // Проверка российского номера
    if (phone.startsWith('+7') || phone.startsWith('8')) {
      if (phone.replace(/\D/g, '').length !== 11) {
        return {
          code: 'invalidRussianPhone',
          message: 'Российский номер должен содержать 11 цифр',
        };
      }
    }

    return null;
  });
}

/**
 * Валидация пароля
 */
function passwordValidation<T>(
  fieldPath: FieldPath<T>[keyof T],
  options?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireDigit?: boolean;
    requireSpecialChar?: boolean;
  }
) {
  const opts = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecialChar: false,
    ...options,
  };

  required(fieldPath, { message: 'Пароль обязателен' });
  minLength(fieldPath, opts.minLength, {
    message: `Минимум ${opts.minLength} символов`,
  });

  validate(fieldPath, (ctx) => {
    const value = ctx.value();

    if (opts.requireUppercase && !/[A-Z]/.test(value)) {
      return {
        code: 'noUppercase',
        message: 'Должна быть хотя бы одна заглавная буква',
      };
    }

    if (opts.requireLowercase && !/[a-z]/.test(value)) {
      return {
        code: 'noLowercase',
        message: 'Должна быть хотя бы одна строчная буква',
      };
    }

    if (opts.requireDigit && !/\d/.test(value)) {
      return {
        code: 'noDigit',
        message: 'Должна быть хотя бы одна цифра',
      };
    }

    if (opts.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return {
        code: 'noSpecialChar',
        message: 'Должен быть хотя бы один специальный символ',
      };
    }

    return null;
  });
}

/**
 * Валидация ИНН
 */
function innValidation<T>(fieldPath: FieldPath<T>[keyof T]) {
  required(fieldPath, { message: 'ИНН обязателен' });
  pattern(fieldPath, /^\d{10}$|^\d{12}$/, {
    message: 'ИНН должен содержать 10 или 12 цифр',
  });

  validate(fieldPath, (ctx) => {
    const inn = ctx.value();

    if (inn.length !== 10 && inn.length !== 12) {
      return {
        code: 'invalidLength',
        message: 'ИНН должен содержать 10 или 12 цифр',
      };
    }

    // Проверка контрольной суммы для 10-значного ИНН
    if (inn.length === 10) {
      const checkDigit = calculateInnCheckDigit10(inn);
      if (parseInt(inn[9]) !== checkDigit) {
        return {
          code: 'invalidChecksum',
          message: 'Неверная контрольная сумма ИНН',
        };
      }
    }

    // Проверка для 12-значного ИНН
    if (inn.length === 12) {
      const checkDigit11 = calculateInnCheckDigit11(inn);
      const checkDigit12 = calculateInnCheckDigit12(inn);

      if (
        parseInt(inn[10]) !== checkDigit11 ||
        parseInt(inn[11]) !== checkDigit12
      ) {
        return {
          code: 'invalidChecksum',
          message: 'Неверная контрольная сумма ИНН',
        };
      }
    }

    return null;
  });
}

// Вспомогательные функции для проверки ИНН
function calculateInnCheckDigit10(inn: string): number {
  const coefficients = [2, 4, 10, 3, 5, 9, 4, 6, 8];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(inn[i]) * coefficients[i];
  }

  return (sum % 11) % 10;
}

function calculateInnCheckDigit11(inn: string): number {
  const coefficients = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(inn[i]) * coefficients[i];
  }

  return (sum % 11) % 10;
}

function calculateInnCheckDigit12(inn: string): number {
  const coefficients = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
  let sum = 0;

  for (let i = 0; i < 11; i++) {
    sum += parseInt(inn[i]) * coefficients[i];
  }

  return (sum % 11) % 10;
}

// ============================================================================
// Использование переиспользуемых валидаторов
// ============================================================================

interface RegistrationForm {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const registrationValidation = (path: FieldPath<RegistrationForm>) => {
  // Используем готовые валидаторы
  usernameValidation(path, path.username);

  required(path.email);
  email(path.email);

  phoneValidation(path.phone, { required: true });

  passwordValidation(path.password, {
    minLength: 10,
    requireSpecialChar: true,
  });

  // Cross-field валидация паролей
  validateTree(
    (ctx) => {
      const form = ctx.formValue();
      if (form.password !== form.confirmPassword) {
        return {
          code: 'mismatch',
          message: 'Пароли не совпадают',
        };
      }
      return null;
    },
    { targetField: 'confirmPassword' }
  );
};
```

---

## Стратегии обновления

```typescript
const validation = (path: FieldPath<UserForm>) => {
  // ============================================================================
  // 1. Валидация при каждом изменении (по умолчанию)
  // ============================================================================

  required(path.username);
  // Валидируется при каждом вводе символа

  // ============================================================================
  // 2. Валидация при потере фокуса (blur)
  // ============================================================================

  required(path.email);
  email(path.email);
  updateOn(path.email, 'blur');
  // Валидируется только когда пользователь уходит с поля

  // ============================================================================
  // 3. Валидация при отправке формы (submit)
  // ============================================================================

  required(path.agreement);
  updateOn(path.agreement, 'submit');
  // Валидируется только при попытке отправить форму

  // ============================================================================
  // Рекомендации по использованию
  // ============================================================================

  // 'change' - для полей с мгновенной валидацией (пароль, имя)
  required(path.password);
  minLength(path.password, 8);
  // По умолчанию 'change'

  // 'blur' - для сложных полей (email, телефон, адрес)
  required(path.phone);
  pattern(path.phone, /^\+?\d{10,15}$/);
  updateOn(path.phone, 'blur');

  // 'submit' - для опциональных или простых полей
  updateOn(path.newsletter, 'submit');
};
```

---

Продолжение следует в следующей части с примером заявки на кредит...
