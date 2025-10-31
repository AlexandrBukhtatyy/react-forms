/**
 * Примеры использования декларативного Behavior Schema API (Фаза 2)
 *
 * Демонстрирует использование copyFrom, enableWhen, computeFrom, watchField и других функций
 */

import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { Input } from '@/components/ui/Input';
import {
  copyFrom,
  enableWhen,
  disableWhen,
  showWhen,
  hideWhen,
  computeFrom,
  watchField,
  revalidateWhen,
  syncFields,
  type BehaviorSchemaFn,
} from '@/lib/forms/behaviors';

// ============================================================================
// Пример 1: Копирование адреса регистрации в адрес проживания
// ============================================================================

interface AddressForm {
  registrationAddress: {
    country: string;
    city: string;
    street: string;
    zipCode: string;
  };
  residenceAddress: {
    country: string;
    city: string;
    street: string;
    zipCode: string;
  };
  sameAsRegistration: boolean;
}

function example1_copyFrom() {
  const form = new GroupNode<AddressForm>({
    registrationAddress: {
      country: { value: '', component: Input },
      city: { value: '', component: Input },
      street: { value: '', component: Input },
      zipCode: { value: '', component: Input },
    },
    residenceAddress: {
      country: { value: '', component: Input },
      city: { value: '', component: Input },
      street: { value: '', component: Input },
      zipCode: { value: '', component: Input },
    },
    sameAsRegistration: { value: false, component: Input },
  });

  // Применяем behavior schema
  const cleanup = form.applyBehaviorSchema((path) => {
    // Копировать адрес регистрации в адрес проживания
    copyFrom(path.residenceAddress, path.registrationAddress, {
      when: (form) => form.sameAsRegistration === true,
      fields: 'all',
    });
  });

  // Использование
  form.registrationAddress.patchValue({
    country: 'RU',
    city: 'Moscow',
    street: 'Tverskaya',
    zipCode: '101000',
  });

  form.sameAsRegistration.setValue(true);

  console.log('Residence address:', form.residenceAddress.getValue());
  // { country: 'RU', city: 'Moscow', street: 'Tverskaya', zipCode: '101000' }

  return { form, cleanup };
}

// ============================================================================
// Пример 2: Условное отображение полей ипотеки
// ============================================================================

interface LoanForm {
  loanType: 'mortgage' | 'consumer' | 'auto';
  propertyValue: number | null;
  initialPayment: number | null;
  carBrand: string;
  carModel: string;
}

function example2_enableWhen() {
  const form = new GroupNode<LoanForm>({
    loanType: { value: 'mortgage', component: Input },
    propertyValue: { value: null, component: Input },
    initialPayment: { value: null, component: Input },
    carBrand: { value: '', component: Input },
    carModel: { value: '', component: Input },
  });

  const cleanup = form.applyBehaviorSchema((path) => {
    // Поля ипотеки только для loanType === 'mortgage'
    enableWhen(path.propertyValue, (form) => form.loanType === 'mortgage', {
      resetOnDisable: true,
    });

    enableWhen(path.initialPayment, (form) => form.loanType === 'mortgage', {
      resetOnDisable: true,
    });

    // Поля автокредита только для loanType === 'auto'
    enableWhen(path.carBrand, (form) => form.loanType === 'auto');
    enableWhen(path.carModel, (form) => form.loanType === 'auto');
  });

  // Использование
  console.log('Property field status:', form.propertyValue.status.value); // 'valid'

  form.loanType.setValue('consumer');
  console.log('Property field status:', form.propertyValue.status.value); // 'disabled'

  return { form, cleanup };
}

// ============================================================================
// Пример 3: Автоматический расчет минимального взноса
// ============================================================================

interface MortgageForm {
  loanType: 'mortgage' | 'consumer';
  propertyValue: number | null;
  initialPayment: number | null;
}

function example3_computeFrom() {
  const form = new GroupNode<MortgageForm>({
    loanType: { value: 'mortgage', component: Input },
    propertyValue: { value: null, component: Input },
    initialPayment: { value: null, component: Input },
  });

  const cleanup = form.applyBehaviorSchema((path) => {
    // Автоматический расчет минимального взноса (20%)
    computeFrom(
      path.initialPayment,
      [path.propertyValue],
      ({ propertyValue }) => {
        return propertyValue ? propertyValue * 0.2 : null;
      },
      {
        debounce: 300,
        condition: (form) => form.loanType === 'mortgage',
      }
    );
  });

  // Использование
  form.propertyValue.setValue(1000000);
  setTimeout(() => {
    console.log('Initial payment:', form.initialPayment.value.value); // 200000
  }, 350);

  return { form, cleanup };
}

// ============================================================================
// Пример 4: Динамическое обновление справочников
// ============================================================================

interface LocationForm {
  registrationAddress: {
    country: string;
    city: string;
  };
}

async function mockFetchCities(country: string) {
  return new Promise<any[]>((resolve) => {
    setTimeout(() => {
      const cities = {
        RU: [
          { value: 'moscow', label: 'Москва' },
          { value: 'spb', label: 'Санкт-Петербург' },
        ],
        US: [
          { value: 'ny', label: 'New York' },
          { value: 'la', label: 'Los Angeles' },
        ],
      };
      resolve(cities[country as keyof typeof cities] || []);
    }, 100);
  });
}

function example4_watchField() {
  const form = new GroupNode<LocationForm>({
    registrationAddress: {
      country: { value: '', component: Input },
      city: { value: '', component: Input },
    },
  });

  const cleanup = form.applyBehaviorSchema((path) => {
    // Динамическая загрузка городов при изменении страны
    watchField(
      path.registrationAddress.country,
      async (country, ctx) => {
        console.log('Country changed:', country);

        if (country) {
          const cities = await mockFetchCities(country);

          // Обновление опций в Select
          ctx.updateComponentProps(path.registrationAddress.city, {
            options: cities,
          });

          // Сброс города
          ctx.setField('registrationAddress.city', '');

          console.log(`Loaded ${cities.length} cities`);
        }
      },
      { debounce: 300 }
    );
  });

  // Использование
  form.registrationAddress.country.setValue('RU');

  return { form, cleanup };
}

// ============================================================================
// Пример 5: Каскадные зависимости (loanType → rate → payment)
// ============================================================================

interface CascadingForm {
  loanType: 'mortgage' | 'auto' | 'consumer';
  interestRate: number | null;
  loanAmount: number | null;
  loanTerm: number | null;
  monthlyPayment: number | null;
}

function example5_cascading() {
  const form = new GroupNode<CascadingForm>({
    loanType: { value: 'mortgage', component: Input },
    interestRate: { value: null, component: Input },
    loanAmount: { value: null, component: Input },
    loanTerm: { value: null, component: Input },
    monthlyPayment: { value: null, component: Input },
  });

  const cleanup = form.applyBehaviorSchema((path) => {
    // Шаг 1: loanType → interestRate
    computeFrom(
      path.interestRate,
      [path.loanType],
      ({ loanType }) => {
        const rates = { mortgage: 8.5, auto: 12.0, consumer: 15.5 };
        return rates[loanType];
      }
    );

    // Шаг 2: loanAmount + loanTerm + interestRate → monthlyPayment
    computeFrom(
      path.monthlyPayment,
      [path.loanAmount, path.loanTerm, path.interestRate],
      ({ loanAmount, loanTerm, interestRate }) => {
        if (!loanAmount || !loanTerm || !interestRate) return null;

        const monthlyRate = interestRate / 100 / 12;
        const payment =
          (loanAmount * monthlyRate) /
          (1 - Math.pow(1 + monthlyRate, -loanTerm));

        return Math.round(payment);
      },
      { debounce: 500 }
    );

    // Шаг 3: Показ подсказки при изменении monthlyPayment
    watchField(path.monthlyPayment, (payment, ctx) => {
      if (payment) {
        const loanTerm = ctx.getField('loanTerm');
        const loanAmount = ctx.getField('loanAmount');

        if (loanTerm && loanAmount) {
          const totalPayment = payment * loanTerm;
          const overpayment = totalPayment - loanAmount;
          console.log(`Переплата: ${overpayment.toLocaleString('ru-RU')} ₽`);
        }
      }
    });
  });

  // Использование
  form.loanType.setValue('mortgage'); // interestRate станет 8.5
  form.loanAmount.setValue(3000000);
  form.loanTerm.setValue(120); // 10 лет

  setTimeout(() => {
    console.log('Monthly payment:', form.monthlyPayment.value.value);
  }, 600);

  return { form, cleanup };
}

// ============================================================================
// Пример 6: Перевалидация зависимых полей
// ============================================================================

interface ValidationForm {
  propertyValue: number | null;
  initialPayment: number | null;
}

function example6_revalidateWhen() {
  const form = new GroupNode<ValidationForm>({
    propertyValue: { value: null, component: Input },
    initialPayment: { value: null, component: Input },
  });

  const cleanup = form.applyBehaviorSchema((path) => {
    // Перевалидировать initialPayment при изменении propertyValue
    revalidateWhen(path.initialPayment, [path.propertyValue], {
      debounce: 300,
    });
  });

  // Использование
  form.propertyValue.setValue(1000000);
  setTimeout(() => {
    console.log('Initial payment revalidated');
  }, 350);

  return { form, cleanup };
}

// ============================================================================
// Пример 7: Двусторонняя синхронизация полей
// ============================================================================

interface SyncForm {
  email: string;
  emailCopy: string;
}

function example7_syncFields() {
  const form = new GroupNode<SyncForm>({
    email: { value: '', component: Input },
    emailCopy: { value: '', component: Input },
  });

  const cleanup = form.applyBehaviorSchema((path) => {
    // Двусторонняя синхронизация email
    syncFields(path.email, path.emailCopy);
  });

  // Использование
  form.email.setValue('test@mail.com');
  console.log('Email copy:', form.emailCopy.value.value); // 'test@mail.com'

  form.emailCopy.setValue('changed@mail.com');
  console.log('Email:', form.email.value.value); // 'changed@mail.com'

  return { form, cleanup };
}

// ============================================================================
// Пример 8: Комплексный пример с множественными behaviors
// ============================================================================

interface ComplexForm {
  loanType: 'mortgage' | 'consumer' | 'auto';
  propertyValue: number | null;
  initialPayment: number | null;
  sameAsRegistration: boolean;
  registrationAddress: {
    city: string;
  };
  residenceAddress: {
    city: string;
  };
}

function example8_complex() {
  const form = new GroupNode<ComplexForm>({
    loanType: { value: 'mortgage', component: Input },
    propertyValue: { value: null, component: Input },
    initialPayment: { value: null, component: Input },
    sameAsRegistration: { value: false, component: Input },
    registrationAddress: {
      city: { value: '', component: Input },
    },
    residenceAddress: {
      city: { value: '', component: Input },
    },
  });

  const cleanup = form.applyBehaviorSchema((path) => {
    // 1. Условное отображение
    enableWhen(path.propertyValue, (form) => form.loanType === 'mortgage');

    // 2. Вычисляемое поле
    computeFrom(
      path.initialPayment,
      [path.propertyValue],
      ({ propertyValue }) => (propertyValue ? propertyValue * 0.2 : null),
      { condition: (form) => form.loanType === 'mortgage' }
    );

    // 3. Копирование адреса
    copyFrom(path.residenceAddress, path.registrationAddress, {
      when: (form) => form.sameAsRegistration === true,
    });

    // 4. Перевалидация
    revalidateWhen(path.initialPayment, [path.propertyValue]);
  });

  return { form, cleanup };
}

// ============================================================================
// Экспорт примеров
// ============================================================================

export const examples = {
  example1_copyFrom,
  example2_enableWhen,
  example3_computeFrom,
  example4_watchField,
  example5_cascading,
  example6_revalidateWhen,
  example7_syncFields,
  example8_complex,
};

// Запуск всех примеров
export function runAllExamples() {
  console.log('=== Пример 1: copyFrom ===');
  example1_copyFrom();

  console.log('\n=== Пример 2: enableWhen ===');
  example2_enableWhen();

  console.log('\n=== Пример 3: computeFrom ===');
  example3_computeFrom();

  console.log('\n=== Пример 4: watchField ===');
  example4_watchField();

  console.log('\n=== Пример 5: Каскадные зависимости ===');
  example5_cascading();

  console.log('\n=== Пример 6: revalidateWhen ===');
  example6_revalidateWhen();

  console.log('\n=== Пример 7: syncFields ===');
  example7_syncFields();

  console.log('\n=== Пример 8: Комплексный пример ===');
  example8_complex();
}
