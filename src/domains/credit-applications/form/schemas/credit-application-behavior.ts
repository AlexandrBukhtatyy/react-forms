/**
 * Behavior Schema для кредитной заявки
 *
 * Содержит декларативное описание реактивного поведения формы:
 * - copyFrom: Копирование значений между полями
 * - enableWhen: Условное включение/выключение полей
 * - computeFrom: Автоматическое вычисление значений
 * - watchField: Подписка на изменения с динамической загрузкой
 * - revalidateWhen: Перевалидация зависимых полей
 *
 * Всего реализовано 33 behaviors:
 * - 2 copyFrom
 * - 15 enableWhen (массивы контролируются через UI)
 * - 8 computeFrom
 * - 6 watchField (включая 3 для очистки ArrayNode)
 * - 2 revalidateWhen
 */

import type { BehaviorSchemaFn, FieldPath } from '@/lib/forms';
import { copyFrom, enableWhen, computeFrom, watchField, revalidateWhen } from '@/lib/forms/behaviors';
import type { CreditApplicationForm } from '../types/credit-application';

// Compute функции из utils
import {
  computeInterestRate,
  computeMonthlyPayment,
  computeInitialPayment,
  computeFullName,
  computeAge,
  computeTotalIncome,
  computePaymentRatio,
  computeCoBorrowersIncome,
} from '../utils';

// API функции из api (уровень домена)
import { fetchRegions, fetchCities, fetchCarModels } from '../../api';

/**
 * Главная схема поведения формы заявки на кредит
 *
 * Применяется автоматически при создании формы через GroupNode конструктор
 */
export const creditApplicationBehavior: BehaviorSchemaFn<CreditApplicationForm> = (
  path: FieldPath<CreditApplicationForm>
) => {
  // ===================================================================
  // 1. copyFrom() - Копирование значений между полями (2)
  // ===================================================================

  // Копирование адреса регистрации → адрес проживания
  copyFrom(path.residenceAddress, path.registrationAddress, {
    when: (form) => form.sameAsRegistration === true,
    fields: 'all',
  });

  // Копирование основного email → дополнительный email
  copyFrom(path.emailAdditional, path.email, {
    when: (form) => form.sameEmail === true,
  });

  // ===================================================================
  // 2. enableWhen() - Условное включение полей (15)
  // ===================================================================

  // ------------------------------------------------------------------------
  // 2.1. Поля ипотеки (включаются только при loanType === 'mortgage')
  // ------------------------------------------------------------------------
  enableWhen(path.propertyValue, (form) => form.loanType === 'mortgage', {
    resetOnDisable: true,
  });
  enableWhen(path.initialPayment, (form) => form.loanType === 'mortgage', {
    resetOnDisable: true,
  });

  // ------------------------------------------------------------------------
  // 2.2. Поля автокредита (включаются только при loanType === 'car')
  // ------------------------------------------------------------------------
  enableWhen(path.carBrand, (form) => form.loanType === 'car', {
    resetOnDisable: true,
  });
  enableWhen(path.carModel, (form) => form.loanType === 'car', {
    resetOnDisable: true,
  });
  enableWhen(path.carYear, (form) => form.loanType === 'car', {
    resetOnDisable: true,
  });
  enableWhen(path.carPrice, (form) => form.loanType === 'car', {
    resetOnDisable: true,
  });

  // ------------------------------------------------------------------------
  // 2.3. Поля для трудоустроенных (employmentStatus === 'employed')
  // ------------------------------------------------------------------------
  enableWhen(path.companyName, (form) => form.employmentStatus === 'employed', {
    resetOnDisable: true,
  });
  enableWhen(path.companyInn, (form) => form.employmentStatus === 'employed', {
    resetOnDisable: true,
  });
  enableWhen(path.companyPhone, (form) => form.employmentStatus === 'employed', {
    resetOnDisable: true,
  });
  enableWhen(path.companyAddress, (form) => form.employmentStatus === 'employed', {
    resetOnDisable: true,
  });
  enableWhen(path.position, (form) => form.employmentStatus === 'employed', {
    resetOnDisable: true,
  });

  // ------------------------------------------------------------------------
  // 2.4. Поля для ИП (employmentStatus === 'selfEmployed')
  // ------------------------------------------------------------------------
  enableWhen(path.businessType, (form) => form.employmentStatus === 'selfEmployed', {
    resetOnDisable: true,
  });
  enableWhen(path.businessInn, (form) => form.employmentStatus === 'selfEmployed', {
    resetOnDisable: true,
  });
  enableWhen(path.businessActivity, (form) => form.employmentStatus === 'selfEmployed', {
    resetOnDisable: true,
  });

  // ------------------------------------------------------------------------
  // 2.5. Адрес проживания (включается при sameAsRegistration === false)
  // ------------------------------------------------------------------------
  enableWhen(path.residenceAddress, (form) => form.sameAsRegistration === false, {
    resetOnDisable: true,
  });

  // ------------------------------------------------------------------------
  // 2.6. Массивы форм (условное отображение)
  // ------------------------------------------------------------------------

  // ПРИМЕЧАНИЕ: ArrayNode не поддерживает enable()/disable()
  // Массивы (properties, existingLoans, coBorrowers) должны контролироваться
  // через условный рендеринг в React компоненте:
  // {form.hasProperty.value.value && <ArrayField control={form.properties} />}

  // ===================================================================
  // 3. computeFrom() - Вычисляемые поля (8)
  // ===================================================================

  // Процентная ставка (зависит от типа кредита, региона, наличия имущества)
  computeFrom(
    path.interestRate,
    [path.loanType, path.registrationAddress, path.hasProperty, path.properties],
    computeInterestRate
  );

  // Ежемесячный платеж (вычисляется по формуле аннуитетного платежа)
  computeFrom(
    path.monthlyPayment,
    [path.loanAmount, path.loanTerm, path.interestRate],
    computeMonthlyPayment
  );

  // Первоначальный взнос (20% от стоимости недвижимости)
  computeFrom(
    path.initialPayment,
    [path.propertyValue],
    computeInitialPayment
  );

  // Полное имя (конкатенация Фамилия Имя Отчество)
  computeFrom(
    path.fullName,
    [path.personalData],
    computeFullName
  );

  // Возраст (вычисляется из даты рождения)
  computeFrom(
    path.age,
    [path.personalData],
    computeAge
  );

  // Общий доход (основной + дополнительный)
  computeFrom(
    path.totalIncome,
    [path.monthlyIncome, path.additionalIncome],
    computeTotalIncome
  );

  // Процент платежа от дохода
  computeFrom(
    path.paymentToIncomeRatio,
    [path.monthlyPayment, path.totalIncome],
    computePaymentRatio
  );

  // Общий доход созаемщиков (сумма доходов всех созаемщиков)
  computeFrom(
    path.coBorrowersIncome,
    [path.coBorrowers],
    computeCoBorrowersIncome
  );

  // ===================================================================
  // 4. watchField() - Динамическая загрузка данных (3)
  // ===================================================================

  // Загрузка регионов при изменении страны (адрес регистрации)
  watchField(path.registrationAddress, async (value, ctx) => {
    if (value?.country) {
      const regions = await fetchRegions(value.country);
      // В реальном приложении здесь нужно обновить componentProps.options
      console.log('Loaded regions for registration:', regions);
    }
  }, { immediate: false, debounce: 300 });

  // Загрузка городов при изменении региона (адрес регистрации)
  watchField(path.registrationAddress, async (value, ctx) => {
    if (value?.region) {
      const cities = await fetchCities(value.region);
      console.log('Loaded cities for registration:', cities);
    }
  }, { immediate: false, debounce: 300 });

  // Загрузка моделей автомобилей при изменении марки
  watchField(path.carBrand, async (value, ctx) => {
    if (value) {
      const models = await fetchCarModels(value);
      console.log('Loaded car models:', models);
    }
  }, { immediate: false, debounce: 300 });

  // ===================================================================
  // 5. revalidateWhen() - Перевалидация зависимых полей (2)
  // ===================================================================

  // Перевалидировать доход при изменении платежа
  revalidateWhen(path.monthlyIncome, [path.monthlyPayment]);

  // Перевалидировать первоначальный взнос при изменении стоимости недвижимости
  revalidateWhen(path.initialPayment, [path.propertyValue]);

  // ===================================================================
  // 6. Очистка ArrayNode при снятии чекбоксов (3)
  // ===================================================================
  // ✅ Миграция на ArrayNode: автоматическая очистка массивов

  // Очистить массив имущества при снятии чекбокса hasProperty
  watchField(path.hasProperty, (hasProperty, ctx) => {
    if (!hasProperty) {
      ctx.formNode.properties?.clear();
    }
  });

  // Очистить массив кредитов при снятии чекбокса hasExistingLoans
  watchField(path.hasExistingLoans, (hasLoans, ctx) => {
    if (!hasLoans) {
      ctx.formNode.existingLoans?.clear();
    }
  });

  // Очистить массив созаемщиков при снятии чекбокса hasCoBorrower
  watchField(path.hasCoBorrower, (hasCoBorrower, ctx) => {
    if (!hasCoBorrower) {
      ctx.formNode.coBorrowers?.clear();
    }
  });
};
