/**
 * Примеры использования нового API GroupNode с перегрузками конструктора
 *
 * Демонстрирует:
 * 1. Старый API (обратная совместимость)
 * 2. Новый API с form, behavior, validation схемами
 * 3. Частичное применение схем
 */

import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { FieldNode } from '@/lib/forms/core/nodes/field-node';
import {
  required,
  email,
  minLength,
  applyWhen,
} from '@/lib/forms/validators';
import {
  copyFrom,
  enableWhen,
  computeFrom,
  watchField,
} from '@/lib/forms/behaviors';

// Примеры компонентов UI (заглушки)
const Input = () => null;
const Select = () => null;

// =============================================================================
// Пример 1: Старый API (обратная совместимость)
// =============================================================================
/**
 * Простая форма без автоматических схем
 */
function example1_OldAPI() {
  const form = new GroupNode({
    email: { value: '', component: Input },
    password: { value: '', component: Input },
  });

  // Схемы применяются вручную
  form.applyValidationSchema((path) => {
    required(path.email);
    email(path.email);
    required(path.password);
    minLength(path.password, 8);
  });

  return form;
}

// =============================================================================
// Пример 2: Новый API - Полная конфигурация
// =============================================================================
/**
 * Форма с автоматическим применением behavior и validation схем
 */
function example2_FullConfig() {
  interface LoginForm {
    email: string;
    password: string;
    rememberMe: boolean;
  }

  const form = new GroupNode<LoginForm>({
    form: {
      email: { value: '', component: Input },
      password: { value: '', component: Input },
      rememberMe: { value: false, component: Input },
    },
    behavior: (path) => {
      // Автоматически обрезаем пробелы в email
      computeFrom(path.email, [path.email], (values) => {
        const email = values[path.email] as string;
        return email?.trim() || '';
      });
    },
    validation: (path) => {
      required(path.email, { message: 'Email обязателен' });
      email(path.email, { message: 'Некорректный email' });
      required(path.password, { message: 'Пароль обязателен' });
      minLength(path.password, 8, { message: 'Минимум 8 символов' });
    },
  });

  return form;
}

// =============================================================================
// Пример 3: Только validation схема
// =============================================================================
/**
 * Форма только с валидацией, без behavior
 */
function example3_ValidationOnly() {
  interface RegistrationForm {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }

  const form = new GroupNode<RegistrationForm>({
    form: {
      username: { value: '', component: Input },
      email: { value: '', component: Input },
      password: { value: '', component: Input },
      confirmPassword: { value: '', component: Input },
    },
    validation: (path) => {
      required(path.username);
      minLength(path.username, 3);

      required(path.email);
      email(path.email);

      required(path.password);
      minLength(path.password, 8);

      required(path.confirmPassword);
      // Кросс-полевая валидация
      // TODO: добавить validateTree для проверки confirmPassword === password
    },
  });

  return form;
}

// =============================================================================
// Пример 4: Только behavior схема
// =============================================================================
/**
 * Форма только с реактивным поведением, без валидации
 */
function example4_BehaviorOnly() {
  interface ProductForm {
    price: number;
    quantity: number;
    discount: number;
    total: number;
    finalPrice: number;
  }

  const form = new GroupNode<ProductForm>({
    form: {
      price: { value: 0, component: Input },
      quantity: { value: 1, component: Input },
      discount: { value: 0, component: Input },
      total: { value: 0, component: Input },
      finalPrice: { value: 0, component: Input },
    },
    behavior: (path) => {
      // Вычисляем total = price * quantity
      computeFrom(path.total, [path.price, path.quantity], (values) => {
        const price = values[path.price] as number;
        const quantity = values[path.quantity] as number;
        return (price || 0) * (quantity || 0);
      });

      // Вычисляем finalPrice = total - (total * discount / 100)
      computeFrom(path.finalPrice, [path.total, path.discount], (values) => {
        const total = values[path.total] as number;
        const discount = values[path.discount] as number;
        return total - total * ((discount || 0) / 100);
      });
    },
  });

  return form;
}

// =============================================================================
// Пример 5: Вложенные формы с полной конфигурацией
// =============================================================================
/**
 * Форма с вложенными группами и полными схемами
 */
function example5_NestedWithConfig() {
  interface UserForm {
    personalData: {
      firstName: string;
      lastName: string;
      email: string;
    };
    address: {
      country: string;
      city: string;
      street: string;
      zipCode: string;
    };
  }

  const form = new GroupNode<UserForm>({
    form: {
      personalData: {
        firstName: { value: '', component: Input },
        lastName: { value: '', component: Input },
        email: { value: '', component: Input },
      },
      address: {
        country: { value: '', component: Select },
        city: { value: '', component: Select },
        street: { value: '', component: Input },
        zipCode: { value: '', component: Input },
      },
    },
    behavior: (path) => {
      // При изменении страны - обновляем список городов
      watchField(
        path.address.country,
        async (form) => {
          const country = form.address.country;
          if (country) {
            // Имитация загрузки городов
            const cities = await fetchCities(country);
            // Обновляем options для города
            // form.address.city.updateComponentProps({ options: cities });
          }
        },
        { immediate: false }
      );
    },
    validation: (path) => {
      // Personal Data
      required(path.personalData.firstName);
      required(path.personalData.lastName);
      required(path.personalData.email);
      email(path.personalData.email);

      // Address
      required(path.address.country);
      required(path.address.city);
      required(path.address.street);
    },
  });

  return form;
}

// =============================================================================
// Пример 6: Комплексная форма кредитной заявки
// =============================================================================
/**
 * Реальный пример: форма кредитной заявки с условной логикой
 */
function example6_LoanApplicationForm() {
  interface LoanApplicationForm {
    loanType: 'mortgage' | 'consumer' | 'auto' | '';
    loanAmount: number | null;
    propertyValue: number | null; // Только для ипотеки
    autoValue: number | null; // Только для авто
    initialPayment: number | null;
    term: number | null;
    monthlyIncome: number | null;
  }

  const form = new GroupNode<LoanApplicationForm>({
    form: {
      loanType: {
        value: '',
        component: Select,
        componentProps: {
          options: [
            { value: 'mortgage', label: 'Ипотека' },
            { value: 'consumer', label: 'Потребительский' },
            { value: 'auto', label: 'Автокредит' },
          ],
        },
      },
      loanAmount: { value: null, component: Input },
      propertyValue: { value: null, component: Input },
      autoValue: { value: null, component: Input },
      initialPayment: { value: null, component: Input },
      term: { value: null, component: Input },
      monthlyIncome: { value: null, component: Input },
    },
    behavior: (path) => {
      // Показываем propertyValue только для ипотеки
      enableWhen(path.propertyValue, path.loanType, {
        condition: (type) => type === 'mortgage',
        resetOnDisable: true,
      });

      // Показываем autoValue только для авто
      enableWhen(path.autoValue, path.loanType, {
        condition: (type) => type === 'auto',
        resetOnDisable: true,
      });

      // Автоматически вычисляем initialPayment для ипотеки (20% от стоимости)
      computeFrom(path.initialPayment, [path.propertyValue], (values) => {
        const propertyValue = values[path.propertyValue] as number | null;
        if (propertyValue) {
          return propertyValue * 0.2;
        }
        return null;
      });
    },
    validation: (path) => {
      // Общие поля
      required(path.loanType, { message: 'Выберите тип кредита' });
      required(path.loanAmount, { message: 'Укажите сумму кредита' });
      required(path.term, { message: 'Укажите срок кредита' });
      required(path.monthlyIncome, { message: 'Укажите ежемесячный доход' });

      // Условная валидация для ипотеки
      applyWhen(
        path.loanType,
        (type) => type === 'mortgage',
        () => {
          required(path.propertyValue, {
            message: 'Укажите стоимость недвижимости',
          });
          required(path.initialPayment, {
            message: 'Укажите первоначальный взнос',
          });
        }
      );

      // Условная валидация для авто
      applyWhen(
        path.loanType,
        (type) => type === 'auto',
        () => {
          required(path.autoValue, {
            message: 'Укажите стоимость автомобиля',
          });
        }
      );
    },
  });

  return form;
}

// =============================================================================
// Пример 7: Копирование адресов
// =============================================================================
/**
 * Классический пример: копирование адреса регистрации в адрес проживания
 */
function example7_AddressCopy() {
  interface AddressForm {
    sameAsRegistration: boolean;
    registrationAddress: {
      city: string;
      street: string;
      zipCode: string;
    };
    residenceAddress: {
      city: string;
      street: string;
      zipCode: string;
    };
  }

  const form = new GroupNode<AddressForm>({
    form: {
      sameAsRegistration: { value: false, component: Input },
      registrationAddress: {
        city: { value: '', component: Input },
        street: { value: '', component: Input },
        zipCode: { value: '', component: Input },
      },
      residenceAddress: {
        city: { value: '', component: Input },
        street: { value: '', component: Input },
        zipCode: { value: '', component: Input },
      },
    },
    behavior: (path) => {
      // Копируем адрес регистрации в адрес проживания
      copyFrom(path.residenceAddress, path.registrationAddress, {
        when: (form) => form.sameAsRegistration === true,
      });
    },
    validation: (path) => {
      // Валидация адреса регистрации
      required(path.registrationAddress.city);
      required(path.registrationAddress.street);
      required(path.registrationAddress.zipCode);

      // Валидация адреса проживания (только если не совпадает с регистрацией)
      applyWhen(
        path.sameAsRegistration,
        (same) => !same,
        () => {
          required(path.residenceAddress.city);
          required(path.residenceAddress.street);
          required(path.residenceAddress.zipCode);
        }
      );
    },
  });

  return form;
}

// =============================================================================
// Вспомогательные функции
// =============================================================================

async function fetchCities(country: string): Promise<any[]> {
  // Имитация API запроса
  await new Promise((resolve) => setTimeout(resolve, 500));

  const citiesByCountry: Record<string, any[]> = {
    russia: [
      { value: 'moscow', label: 'Москва' },
      { value: 'spb', label: 'Санкт-Петербург' },
    ],
    usa: [
      { value: 'ny', label: 'New York' },
      { value: 'la', label: 'Los Angeles' },
    ],
  };

  return citiesByCountry[country] || [];
}

// =============================================================================
// Экспорт примеров
// =============================================================================

export {
  example1_OldAPI,
  example2_FullConfig,
  example3_ValidationOnly,
  example4_BehaviorOnly,
  example5_NestedWithConfig,
  example6_LoanApplicationForm,
  example7_AddressCopy,
};
