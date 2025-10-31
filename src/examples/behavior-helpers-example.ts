/**
 * Примеры использования методов-помощников для реактивности (Фаза 1)
 *
 * Демонстрирует использование watch(), computeFrom(), linkFields(),
 * watchField(), watchItems(), watchLength()
 */

import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { Input } from '@/components/ui/Input';

// ============================================================================
// Пример 1: FieldNode.watch() - Подписка на изменения поля
// ============================================================================

interface SimpleForm {
  email: string;
  username: string;
}

function example1_watch() {
  const form = new GroupNode<SimpleForm>({
    email: { value: '', component: Input },
    username: { value: '', component: Input },
  });

  // Подписка на изменения email
  const unsubscribe = form.email.watch((value) => {
    console.log('Email changed:', value);

    // Можно выполнять побочные эффекты
    if (value.includes('@')) {
      console.log('Valid email format');
    }
  });

  // Использование
  form.email.setValue('test@mail.com'); // Выведет: "Email changed: test@mail.com"

  // Cleanup
  // unsubscribe(); // Вызвать при unmount

  return { form, unsubscribe };
}

// ============================================================================
// Пример 2: FieldNode.computeFrom() - Вычисляемое поле
// ============================================================================

interface MortgageForm {
  propertyValue: number | null;
  initialPayment: number | null;
}

function example2_computeFrom() {
  const form = new GroupNode<MortgageForm>({
    propertyValue: { value: null, component: Input },
    initialPayment: { value: null, component: Input },
  });

  // Автоматический расчет минимального взноса (20%)
  const dispose = form.initialPayment.computeFrom(
    [form.propertyValue.value],
    (propertyValue) => {
      return propertyValue ? propertyValue * 0.2 : null;
    }
  );

  // Использование
  form.propertyValue.setValue(1000000);
  console.log(form.initialPayment.value.value); // 200000

  form.propertyValue.setValue(5000000);
  console.log(form.initialPayment.value.value); // 1000000

  // Cleanup
  // dispose(); // Вызвать при unmount

  return { form, dispose };
}

// ============================================================================
// Пример 3: GroupNode.linkFields() - Связь полей с трансформацией
// ============================================================================

interface LoanForm {
  loanAmount: number | null;
  monthlyIncome: number | null;
  maxLoanAmount: number | null;
}

function example3_linkFields() {
  const form = new GroupNode<LoanForm>({
    loanAmount: { value: null, component: Input },
    monthlyIncome: { value: null, component: Input },
    maxLoanAmount: { value: null, component: Input },
  });

  // Автоматический расчет максимальной суммы кредита (50% дохода * 12 месяцев * 10 лет)
  const dispose = form.linkFields(
    'monthlyIncome',
    'maxLoanAmount',
    (monthlyIncome) => monthlyIncome ? monthlyIncome * 0.5 * 12 * 10 : null
  );

  // Использование
  form.monthlyIncome.setValue(100000);
  console.log(form.maxLoanAmount.value.value); // 6000000

  form.monthlyIncome.setValue(150000);
  console.log(form.maxLoanAmount.value.value); // 9000000

  // Cleanup
  // dispose(); // Вызвать при unmount

  return { form, dispose };
}

// ============================================================================
// Пример 4: GroupNode.watchField() - Подписка на вложенное поле
// ============================================================================

interface AddressForm {
  registrationAddress: {
    country: string;
    city: string;
  };
}

function example4_watchField() {
  const form = new GroupNode<AddressForm>({
    registrationAddress: {
      country: { value: '', component: Input },
      city: { value: '', component: Input },
    },
  });

  // Подписка на изменение страны
  const dispose = form.watchField(
    'registrationAddress.country' as any,
    async (countryCode) => {
      console.log('Country changed:', countryCode);

      if (countryCode) {
        // Имитация загрузки городов
        const cities = await mockFetchCities(countryCode);

        // Обновление опций в Select
        form.registrationAddress.city.updateComponentProps({
          options: cities,
        });

        // Сброс выбранного города
        form.registrationAddress.city.setValue('');

        console.log(`Loaded ${cities.length} cities for ${countryCode}`);
      }
    }
  );

  // Использование
  form.registrationAddress.country.setValue('RU');
  // Выведет: "Country changed: RU"
  // Выведет: "Loaded 3 cities for RU"

  // Cleanup
  // dispose(); // Вызвать при unmount

  return { form, dispose };
}

// Mock функция для загрузки городов
async function mockFetchCities(countryCode: string): Promise<any[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const cities = {
        RU: [
          { value: 'moscow', label: 'Москва' },
          { value: 'spb', label: 'Санкт-Петербург' },
          { value: 'nsk', label: 'Новосибирск' },
        ],
        US: [
          { value: 'ny', label: 'New York' },
          { value: 'la', label: 'Los Angeles' },
        ],
      };
      resolve(cities[countryCode as keyof typeof cities] || []);
    }, 100);
  });
}

// ============================================================================
// Пример 5: ArrayNode.watchItems() - Подписка на элементы массива
// ============================================================================

interface PropertyItem {
  title: string;
  estimatedValue: number | null;
}

interface PropertyForm {
  properties: PropertyItem[];
  totalValue: number | null;
}

function example5_watchItems() {
  const form = new GroupNode<PropertyForm>({
    properties: [{
      title: { value: '', component: Input },
      estimatedValue: { value: null, component: Input },
    }],
    totalValue: { value: null, component: Input },
  });

  // Автоматический пересчет общей стоимости при изменении любого объекта
  const dispose = form.properties.watchItems(
    'estimatedValue',
    (values) => {
      const total = values.reduce((sum, value) => sum + (value || 0), 0);
      form.totalValue.setValue(total);
      console.log('Total property value:', total);
    }
  );

  // Использование
  form.properties.push({ title: 'Квартира', estimatedValue: 5000000 });
  // Выведет: "Total property value: 5000000"

  form.properties.push({ title: 'Гараж', estimatedValue: 800000 });
  // Выведет: "Total property value: 5800000"

  form.properties.at(0)?.estimatedValue.setValue(6000000);
  // Выведет: "Total property value: 6800000"

  // Cleanup
  // dispose(); // Вызвать при unmount

  return { form, dispose };
}

// ============================================================================
// Пример 6: ArrayNode.watchLength() - Подписка на изменение длины
// ============================================================================

interface LoanItem {
  bank: string;
  amount: number | null;
}

interface LoansForm {
  existingLoans: LoanItem[];
  loanCount: number;
}

function example6_watchLength() {
  const form = new GroupNode<LoansForm>({
    existingLoans: [{
      bank: { value: '', component: Input },
      amount: { value: null, component: Input },
    }],
    loanCount: { value: 0, component: Input },
  });

  // Автоматическое обновление счетчика кредитов
  const dispose = form.existingLoans.watchLength((length) => {
    form.loanCount.setValue(length);
    console.log(`Количество кредитов: ${length}`);
  });

  // Использование
  console.log('Initial:', form.loanCount.value.value); // 0

  form.existingLoans.push({ bank: 'Сбербанк', amount: 500000 });
  // Выведет: "Количество кредитов: 1"

  form.existingLoans.push({ bank: 'ВТБ', amount: 300000 });
  // Выведет: "Количество кредитов: 2"

  form.existingLoans.removeAt(0);
  // Выведет: "Количество кредитов: 1"

  // Cleanup
  // dispose(); // Вызвать при unmount

  return { form, dispose };
}

// ============================================================================
// Пример 7: Комплексный сценарий - Каскадные зависимости
// ============================================================================

interface ComplexLoanForm {
  loanType: 'mortgage' | 'consumer' | 'auto';
  interestRate: number | null;
  loanAmount: number | null;
  loanTerm: number | null;
  monthlyPayment: number | null;
}

function example7_cascading() {
  const form = new GroupNode<ComplexLoanForm>({
    loanType: { value: 'mortgage', component: Input },
    interestRate: { value: null, component: Input },
    loanAmount: { value: null, component: Input },
    loanTerm: { value: null, component: Input },
    monthlyPayment: { value: null, component: Input },
  });

  // Шаг 1: loanType → interestRate
  const dispose1 = form.linkFields(
    'loanType',
    'interestRate',
    (loanType) => {
      const rates = {
        mortgage: 8.5,
        auto: 12.0,
        consumer: 15.5,
      };
      return rates[loanType];
    }
  );

  // Шаг 2: interestRate + loanAmount + loanTerm → monthlyPayment
  const dispose2 = form.monthlyPayment.computeFrom(
    [form.loanAmount.value, form.loanTerm.value, form.interestRate.value],
    (loanAmount, loanTerm, interestRate) => {
      if (!loanAmount || !loanTerm || !interestRate) return null;

      const monthlyRate = interestRate / 100 / 12;
      const payment =
        (loanAmount * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -loanTerm));

      return Math.round(payment);
    }
  );

  // Шаг 3: Показ подсказки при изменении monthlyPayment
  const dispose3 = form.monthlyPayment.watch((payment) => {
    if (payment) {
      const loanTerm = form.loanTerm.value.value;
      const loanAmount = form.loanAmount.value.value;

      if (loanTerm && loanAmount) {
        const totalPayment = payment * loanTerm;
        const overpayment = totalPayment - loanAmount;
        console.log(`Переплата: ${overpayment.toLocaleString('ru-RU')} ₽`);
      }
    }
  });

  // Использование
  form.loanType.setValue('mortgage');
  // interestRate автоматически станет 8.5

  form.loanAmount.setValue(3000000);
  form.loanTerm.setValue(120); // 10 лет
  // monthlyPayment автоматически пересчитается
  // Выведет: "Переплата: 1,453,200 ₽"

  console.log('Ежемесячный платеж:', form.monthlyPayment.value.value); // ~37,110

  // Cleanup
  const cleanup = () => {
    dispose1();
    dispose2();
    dispose3();
  };

  return { form, cleanup };
}

// ============================================================================
// Экспорт примеров
// ============================================================================

export const examples = {
  example1_watch,
  example2_computeFrom,
  example3_linkFields,
  example4_watchField,
  example5_watchItems,
  example6_watchLength,
  example7_cascading,
};

// Запуск всех примеров (для тестирования)
export function runAllExamples() {
  console.log('=== Пример 1: watch() ===');
  example1_watch();

  console.log('\n=== Пример 2: computeFrom() ===');
  example2_computeFrom();

  console.log('\n=== Пример 3: linkFields() ===');
  example3_linkFields();

  console.log('\n=== Пример 4: watchField() ===');
  example4_watchField();

  console.log('\n=== Пример 5: watchItems() ===');
  example5_watchItems();

  console.log('\n=== Пример 6: watchLength() ===');
  example6_watchLength();

  console.log('\n=== Пример 7: Каскадные зависимости ===');
  example7_cascading();
}
