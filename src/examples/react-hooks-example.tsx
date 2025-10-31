/**
 * Примеры использования React хуков для форм
 *
 * Демонстрирует все доступные хуки:
 * - useFormEffect
 * - useComputedField / useComputedFieldAuto
 * - useCopyField
 * - useEnableWhen / useDisableWhen
 * - useWatchField / useWatchFieldWithOptions
 */

import { useMemo } from 'react';
import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { FieldNode } from '@/lib/forms/core/nodes/field-node';
import { computed } from '@preact/signals-react';
import {
  useFormEffect,
  useComputedField,
  useComputedFieldAuto,
  useCopyField,
  useEnableWhen,
  useDisableWhen,
  useWatchField,
  useWatchFieldWithOptions,
} from '@/lib/forms/hooks';

// Примеры компонентов UI (заглушки)
const Input = () => null;
const Select = () => null;

// =============================================================================
// Пример 1: useFormEffect - Базовый эффект на форме
// =============================================================================
/**
 * Отслеживает изменения формы и выполняет побочные эффекты
 */
function Example1_FormEffect() {
  const form = useMemo(
    () =>
      new GroupNode({
        email: { value: '', component: Input },
        password: { value: '', component: Input },
      }),
    []
  );

  // Логирование при любых изменениях формы
  useFormEffect(() => {
    console.log('Form changed:', form.value.value);
    console.log('Is valid:', form.valid.value);
  });

  return <div>См. консоль для логов</div>;
}

// =============================================================================
// Пример 2: useComputedField - Вычисляемое поле с явными зависимостями
// =============================================================================
/**
 * Автоматически вычисляет полную стоимость на основе цены и количества
 */
function Example2_ComputedField() {
  const form = useMemo(
    () =>
      new GroupNode({
        price: { value: 100, component: Input },
        quantity: { value: 1, component: Input },
        total: { value: 100, component: Input }, // readonly поле
      }),
    []
  );

  // Вычисление total = price * quantity
  useComputedField(
    form.total,
    () => {
      const price = form.price.value.value || 0;
      const quantity = form.quantity.value.value || 0;
      return price * quantity;
    },
    [form.price.value.value, form.quantity.value.value]
  );

  return <div>Total будет автоматически пересчитан</div>;
}

// =============================================================================
// Пример 3: useComputedFieldAuto - Вычисляемое поле с автоматическими зависимостями
// =============================================================================
/**
 * То же самое, но без явного указания deps
 */
function Example3_ComputedFieldAuto() {
  const form = useMemo(
    () =>
      new GroupNode({
        price: { value: 100, component: Input },
        quantity: { value: 1, component: Input },
        total: { value: 100, component: Input },
      }),
    []
  );

  // Signals отслеживаются автоматически
  useComputedFieldAuto(form.total, () => {
    const price = form.price.value.value || 0;
    const quantity = form.quantity.value.value || 0;
    return price * quantity;
  });

  return <div>Total вычисляется автоматически</div>;
}

// =============================================================================
// Пример 4: useCopyField - Копирование между группами
// =============================================================================
/**
 * Классический пример: "Адрес проживания совпадает с адресом регистрации"
 */
function Example4_CopyField() {
  const form = useMemo(
    () =>
      new GroupNode({
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
      }),
    []
  );

  // Копируем адрес регистрации в адрес проживания
  useCopyField(form.registrationAddress, form.residenceAddress, {
    enabled: form.sameAsRegistration.value, // ReadonlySignal<boolean>
    fields: 'all',
  });

  return <div>Адрес будет скопирован при sameAsRegistration = true</div>;
}

// =============================================================================
// Пример 5: useCopyField с трансформацией
// =============================================================================
/**
 * Копирование с преобразованием данных
 */
function Example5_CopyFieldWithTransform() {
  const form = useMemo(
    () =>
      new GroupNode({
        sourceData: {
          firstName: { value: '', component: Input },
          lastName: { value: '', component: Input },
        },
        targetData: {
          firstName: { value: '', component: Input },
          lastName: { value: '', component: Input },
        },
      }),
    []
  );

  // Копируем с преобразованием в uppercase
  useCopyField(form.sourceData, form.targetData, {
    transform: (value) => ({
      firstName: value.firstName?.toUpperCase() || '',
      lastName: value.lastName?.toUpperCase() || '',
    }),
  });

  return <div>Данные копируются в UPPERCASE</div>;
}

// =============================================================================
// Пример 6: useEnableWhen - Условное включение поля
// =============================================================================
/**
 * Включает поле "Стоимость недвижимости" только для ипотеки
 */
function Example6_EnableWhen() {
  const form = useMemo(
    () =>
      new GroupNode({
        loanType: {
          value: '',
          component: Select,
          componentProps: {
            options: [
              { value: 'mortgage', label: 'Ипотека' },
              { value: 'consumer', label: 'Потребительский' },
            ],
          },
        },
        propertyValue: { value: null as number | null, component: Input },
      }),
    []
  );

  // Включаем поле только для ипотеки
  useEnableWhen(
    form.propertyValue,
    () => form.loanType.value.value === 'mortgage',
    { resetOnDisable: true }
  );

  return <div>Поле propertyValue включено только для ипотеки</div>;
}

// =============================================================================
// Пример 7: useDisableWhen - Условное выключение поля
// =============================================================================
/**
 * Выключает поле "Email" для администраторов
 */
function Example7_DisableWhen() {
  const form = useMemo(
    () =>
      new GroupNode({
        role: {
          value: 'user',
          component: Select,
          componentProps: {
            options: [
              { value: 'user', label: 'Пользователь' },
              { value: 'admin', label: 'Администратор' },
            ],
          },
        },
        email: { value: '', component: Input },
      }),
    []
  );

  // Выключаем email для админов
  useDisableWhen(form.email, () => form.role.value.value === 'admin');

  return <div>Email disabled для админов</div>;
}

// =============================================================================
// Пример 8: useWatchField - Динамическая загрузка данных
// =============================================================================
/**
 * Загружает города при изменении страны
 */
function Example8_WatchField() {
  const form = useMemo(
    () =>
      new GroupNode({
        country: { value: '', component: Select },
        city: { value: '', component: Select },
      }),
    []
  );

  // Загружаем города при изменении страны
  useWatchField(form.country, async (country) => {
    if (country) {
      // Имитация API запроса
      const cities = await fetchCities(country);
      form.city.updateComponentProps({
        options: cities,
      });

      // Сбрасываем выбранный город
      form.city.setValue('');
    }
  });

  return <div>Города загружаются при выборе страны</div>;
}

// =============================================================================
// Пример 9: useWatchFieldWithOptions - Контроль immediate
// =============================================================================
/**
 * Отслеживает email, но не вызывает callback при mount
 */
function Example9_WatchFieldWithOptions() {
  const form = useMemo(
    () =>
      new GroupNode({
        email: { value: '', component: Input },
      }),
    []
  );

  // Не вызывать при mount (immediate: false)
  useWatchFieldWithOptions(
    form.email,
    (value) => {
      console.log('Email changed to:', value);
      // Валидация на сервере, метрики и т.д.
    },
    { immediate: false }
  );

  return <div>Email отслеживается, но не при mount</div>;
}

// =============================================================================
// Пример 10: Комбинирование хуков
// =============================================================================
/**
 * Комплексный пример с несколькими хуками
 */
function Example10_Combined() {
  const form = useMemo(
    () =>
      new GroupNode({
        productType: {
          value: '',
          component: Select,
          componentProps: {
            options: [
              { value: 'laptop', label: 'Ноутбук' },
              { value: 'phone', label: 'Телефон' },
            ],
          },
        },
        price: { value: 0, component: Input },
        quantity: { value: 1, component: Input },
        discount: { value: 0, component: Input },
        total: { value: 0, component: Input },
        finalPrice: { value: 0, component: Input },
      }),
    []
  );

  // 1. Вычисляем общую стоимость
  useComputedFieldAuto(form.total, () => {
    const price = form.price.value.value || 0;
    const quantity = form.quantity.value.value || 0;
    return price * quantity;
  });

  // 2. Вычисляем финальную цену с учетом скидки
  useComputedFieldAuto(form.finalPrice, () => {
    const total = form.total.value.value || 0;
    const discount = form.discount.value.value || 0;
    return total - total * (discount / 100);
  });

  // 3. Включаем скидку только для ноутбуков
  useEnableWhen(
    form.discount,
    () => form.productType.value.value === 'laptop',
    { resetOnDisable: true }
  );

  // 4. Отслеживаем изменения финальной цены
  useWatchFieldWithOptions(
    form.finalPrice,
    (price) => {
      console.log('Final price updated:', price);
    },
    { immediate: false }
  );

  return <div>Комплексная форма с несколькими хуками</div>;
}

// =============================================================================
// Пример 11: useEnableWhen с computed signal
// =============================================================================
/**
 * Использование computed signal вместо функции
 */
function Example11_EnableWhenComputed() {
  const form = useMemo(
    () =>
      new GroupNode({
        age: { value: 0, component: Input },
        hasLicense: { value: false, component: Input },
        canDrive: { value: false, component: Input },
      }),
    []
  );

  // Computed signal для условия
  const canDriveCondition = computed(() => {
    const age = form.age.value.value;
    const hasLicense = form.hasLicense.value.value;
    return age >= 18 && hasLicense;
  });

  // Включаем поле на основе computed signal
  useEnableWhen(form.canDrive, canDriveCondition);

  return <div>Поле canDrive включено при age >= 18 и hasLicense</div>;
}

// =============================================================================
// Пример 12: Сложная условная логика с несколькими полями
// =============================================================================
/**
 * Управление видимостью/доступностью нескольких полей
 */
function Example12_ComplexConditions() {
  const form = useMemo(
    () =>
      new GroupNode({
        employmentType: {
          value: '',
          component: Select,
          componentProps: {
            options: [
              { value: 'employed', label: 'Работаю' },
              { value: 'self-employed', label: 'ИП' },
              { value: 'unemployed', label: 'Безработный' },
            ],
          },
        },
        companyName: { value: '', component: Input },
        inn: { value: '', component: Input },
        monthlyIncome: { value: 0, component: Input },
      }),
    []
  );

  // Включаем companyName только для employed
  useEnableWhen(
    form.companyName,
    () => form.employmentType.value.value === 'employed',
    { resetOnDisable: true }
  );

  // Включаем INN только для self-employed
  useEnableWhen(
    form.inn,
    () => form.employmentType.value.value === 'self-employed',
    { resetOnDisable: true }
  );

  // Выключаем monthlyIncome для unemployed
  useDisableWhen(
    form.monthlyIncome,
    () => form.employmentType.value.value === 'unemployed'
  );

  return <div>Поля управляются на основе типа занятости</div>;
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
  Example1_FormEffect,
  Example2_ComputedField,
  Example3_ComputedFieldAuto,
  Example4_CopyField,
  Example5_CopyFieldWithTransform,
  Example6_EnableWhen,
  Example7_DisableWhen,
  Example8_WatchField,
  Example9_WatchFieldWithOptions,
  Example10_Combined,
  Example11_EnableWhenComputed,
  Example12_ComplexConditions,
};
