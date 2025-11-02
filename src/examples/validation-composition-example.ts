/**
 * Примеры композиции Validation Schema
 *
 * Демонстрирует использование функции apply для переиспользования
 * validation схем (аналог apply из behavior API).
 */

import type { ValidationSchemaFn, FieldPath } from '@/lib/forms/types';
import { apply, required, email, minLength, toFieldPath } from '@/lib/forms/validators';

// ============================================================================
// Пример 1: Базовая композиция - применение одной схемы к нескольким полям
// ============================================================================

interface Address {
  country: string;
  region: string;
  city: string;
  street: string;
  postalCode: string;
}

interface UserForm {
  name: string;
  homeAddress: Address;
  workAddress: Address;
  billingAddress: Address;
}

// Модульная validation схема для Address
const addressValidation: ValidationSchemaFn<Address> = (path: FieldPath<Address>) => {
  required(path.country, { message: 'Укажите страну' });
  required(path.region, { message: 'Укажите регион' });
  required(path.city, { message: 'Укажите город' });
  required(path.street, { message: 'Укажите улицу' });
  required(path.postalCode, { message: 'Укажите индекс' });
  minLength(path.postalCode, 6, { message: 'Индекс должен содержать 6 цифр' });
};

// Главная схема с композицией
const userValidation: ValidationSchemaFn<UserForm> = (path: FieldPath<UserForm>) => {
  required(path.name);

  // ✅ Применяем addressValidation к трём полям сразу
  apply([path.homeAddress, path.workAddress, path.billingAddress], addressValidation);
};

const example1 = () => {
  console.log('Example 1: Validation applied to 3 address fields');
};

// ============================================================================
// Пример 2: Применение нескольких схем к одному полю
// ============================================================================

interface ProductForm {
  title: string;
  slug: string;
  email: string;
  password: string;
}

// Базовая валидация email
const emailBasicValidation: ValidationSchemaFn<string> = (path) => {
  required(path, { message: 'Email обязателен' });
  email(path, { message: 'Некорректный email' });
};

// Дополнительная валидация email (например, проверка домена)
const emailDomainValidation: ValidationSchemaFn<string> = (path) => {
  // Здесь можно добавить custom валидатор для проверки домена
  // validate(path, async (ctx) => {
  //   const value = ctx.value();
  //   if (!value.endsWith('@company.com')) {
  //     return { code: 'invalidDomain', message: 'Только корпоративные email' };
  //   }
  //   return null;
  // });
};

const productValidation: ValidationSchemaFn<ProductForm> = (path) => {
  required(path.title);
  required(path.slug);

  // ✅ Применяем несколько схем к одному полю
  apply(path.email, [emailBasicValidation, emailDomainValidation]);

  required(path.password);
  minLength(path.password, 8);
};

const example2 = () => {
  console.log('Example 2: Multiple validation schemas applied to email field');
};

// ============================================================================
// Пример 3: Композиция с использованием toFieldPath (старый API)
// ============================================================================

interface CompanyForm {
  name: string;
  headquarters: {
    address: Address;
    phone: string;
  };
}

const headquartersValidation: ValidationSchemaFn<CompanyForm['headquarters']> = (path) => {
  // ✅ Используем toFieldPath для вложенного поля (старый API)
  addressValidation(toFieldPath(path.address));

  required(path.phone, { message: 'Укажите телефон' });
  minLength(path.phone, 10, { message: 'Минимум 10 цифр' });
};

const companyValidation: ValidationSchemaFn<CompanyForm> = (path) => {
  required(path.name);

  // Применяем схему к headquarters
  apply(path.headquarters, headquartersValidation);
};

const example3 = () => {
  console.log('Example 3: Composition using toFieldPath (legacy API)');
};

// ============================================================================
// Пример 4: Комбинированное использование apply и applyWhen
// ============================================================================

interface RegistrationForm {
  personal: {
    firstName: string;
    lastName: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  addresses: {
    home: Address;
    work: Address;
  };
  sameWorkAddress: boolean;
  hasShipping: boolean;
  shippingAddress?: Address;
}

const personalValidation: ValidationSchemaFn<RegistrationForm['personal']> = (path) => {
  required(path.firstName, { message: 'Укажите имя' });
  required(path.lastName, { message: 'Укажите фамилию' });
};

const contactValidation: ValidationSchemaFn<RegistrationForm['contact']> = (path) => {
  required(path.email);
  email(path.email);
  required(path.phone);
};

const registrationValidation: ValidationSchemaFn<RegistrationForm> = (path) => {
  // ✅ Композиция для разных секций формы
  apply(path.personal, personalValidation);
  apply(path.contact, contactValidation);
  apply([path.addresses.home, path.addresses.work], addressValidation);

  // ✅ Условная композиция через applyWhen (существующий API)
  // applyWhen уже существует в validators API
  // applyWhen(
  //   path.hasShipping,
  //   (value) => value === true,
  //   (path) => {
  //     apply(path.shippingAddress, addressValidation);
  //   }
  // );
};

const example4 = () => {
  console.log('Example 4: Combined usage of apply with applyWhen');
};

// ============================================================================
// Пример 5: Массовое применение одной схемы
// ============================================================================

interface MultiAddressForm {
  addresses: {
    billing: Address;
    shipping: Address;
    home: Address;
    work: Address;
    emergency: Address;
  };
}

const multiAddressValidation: ValidationSchemaFn<MultiAddressForm> = (path) => {
  // ✅ Применяем одну схему ко всем адресам
  apply(
    [
      path.addresses.billing,
      path.addresses.shipping,
      path.addresses.home,
      path.addresses.work,
      path.addresses.emergency,
    ],
    addressValidation
  );
};

const example5 = () => {
  console.log('Example 5: Mass application of single validation schema');
};

// ============================================================================
// Экспорт примеров
// ============================================================================

export const validationCompositionExamples = {
  example1,
  example2,
  example3,
  example4,
  example5,
};

// Запустить все примеры
export const runAllExamples = () => {
  console.log('='.repeat(60));
  console.log('Validation Composition Examples');
  console.log('='.repeat(60));

  example1();
  example2();
  example3();
  example4();
  example5();

  console.log('='.repeat(60));
};
