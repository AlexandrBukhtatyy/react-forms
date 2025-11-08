/**
 * Декларативные функции для описания поведения форм
 *
 * Используются внутри BehaviorSchemaFn для описания реактивного поведения
 */

import type { FieldPathNode } from '../types';
import { BehaviorRegistryClass } from './behavior-registry';
import type {
  BehaviorContext,
  CopyFromOptions,
  EnableWhenOptions,
  ComputeFromOptions,
  WatchFieldOptions,
  RevalidateWhenOptions,
  SyncFieldsOptions,
} from './types';

/**
 * Helper: получить текущий активный реестр или выбросить ошибку
 * @private
 */
function getCurrentRegistry(): BehaviorRegistryClass {
  const registry = BehaviorRegistryClass.getCurrent();
  if (!registry) {
    if (import.meta.env.DEV) {
      throw new Error(
        'No active BehaviorRegistry context. Make sure to call beginRegistration() before using behavior functions.'
      );
    }
    // В production возвращаем заглушку
    return {
      register: () => {},
    } as any;
  }
  return registry;
}

// ============================================================================
// copyFrom - Копирование значений между полями
// ============================================================================

/**
 * Копирует значения из одного поля/группы в другое при выполнении условия
 *
 * @param target - Куда копировать
 * @param source - Откуда копировать
 * @param options - Опции копирования
 *
 * @example
 * ```typescript
 * const schema: BehaviorSchemaFn<MyForm> = (path) => {
 *   // Копировать адрес регистрации в адрес проживания
 *   copyFrom(path.residenceAddress, path.registrationAddress, {
 *     when: (form) => form.sameAsRegistration === true,
 *     fields: 'all'
 *   });
 * };
 * ```
 */
export function copyFrom<TForm, TSource, TTarget>(
  target: FieldPathNode<TForm, TTarget>,
  source: FieldPathNode<TForm, TSource>,
  options?: CopyFromOptions<TForm, TSource>
): void {
  const {
    when,
    fields = 'all',
    transform,
    debounce = 0,
  } = options || {};

  getCurrentRegistry().register({
    type: 'copy',
    sourceField: source,
    targetField: target,
    condition: when,
    fields: fields === 'all' ? 'all' : (fields as string[]),
    transform,
    debounce,
  });
}

// ============================================================================
// enableWhen / disableWhen - Условное включение/выключение полей
// ============================================================================

/**
 * Условное включение поля на основе значений других полей
 *
 * @param field - Поле для включения/выключения
 * @param condition - Функция условия (true = enable, false = disable)
 * @param options - Опции
 *
 * @example
 * ```typescript
 * const schema: BehaviorSchemaFn<MyForm> = (path) => {
 *   // Включить поле только для ипотеки
 *   enableWhen(path.propertyValue, (form) => form.loanType === 'mortgage', {
 *     resetOnDisable: true
 *   });
 * };
 * ```
 */
export function enableWhen<TForm>(
  field: FieldPathNode<TForm, any>,
  condition: (form: TForm) => boolean,
  options?: EnableWhenOptions
): void {
  const { resetOnDisable = false, debounce = 0 } = options || {};

  getCurrentRegistry().register({
    type: 'enable',
    targetField: field,
    condition,
    resetOnDisable,
    debounce,
  });
}

/**
 * Условное выключение поля (инверсия enableWhen)
 *
 * @param field - Поле для выключения
 * @param condition - Функция условия (true = disable, false = enable)
 * @param options - Опции
 *
 * @example
 * ```typescript
 * const schema: BehaviorSchemaFn<MyForm> = (path) => {
 *   // Выключить поле для потребительского кредита
 *   disableWhen(path.propertyValue, (form) => form.loanType === 'consumer');
 * };
 * ```
 */
export function disableWhen<TForm>(
  field: FieldPathNode<TForm, any>,
  condition: (form: TForm) => boolean,
  options?: EnableWhenOptions
): void {
  // Инвертируем условие
  enableWhen(field, (form) => !condition(form), options);
}

// ============================================================================
// showWhen / hideWhen - Условное отображение/скрытие полей
// ============================================================================

/**
 * Условное отображение поля (устанавливает hidden флаг)
 *
 * @param field - Поле для отображения/скрытия
 * @param condition - Функция условия (true = show, false = hide)
 *
 * @example
 * ```typescript
 * const schema: BehaviorSchemaFn<MyForm> = (path) => {
 *   showWhen(path.propertyValue, (form) => form.loanType === 'mortgage');
 * };
 *
 * // В JSX
 * {!form.propertyValue.componentProps.value.hidden && (
 *   <FormField control={form.propertyValue} />
 * )}
 * ```
 */
export function showWhen<TForm>(
  field: FieldPathNode<TForm, any>,
  condition: (form: TForm) => boolean
): void {
  getCurrentRegistry().register({
    type: 'show',
    targetField: field,
    condition,
  });
}

/**
 * Условное скрытие поля (инверсия showWhen)
 *
 * @param field - Поле для скрытия
 * @param condition - Функция условия (true = hide, false = show)
 */
export function hideWhen<TForm>(
  field: FieldPathNode<TForm, any>,
  condition: (form: TForm) => boolean
): void {
  // Инвертируем условие
  showWhen(field, (form) => !condition(form));
}

// ============================================================================
// computeFrom - Вычисляемые поля
// ============================================================================

/**
 * Автоматически вычисляет значение поля на основе других полей
 *
 * @param target - Поле для записи результата
 * @param sources - Массив полей-зависимостей
 * @param computeFn - Функция вычисления
 * @param options - Опции
 *
 * @example
 * ```typescript
 * const schema: BehaviorSchemaFn<MyForm> = (path) => {
 *   // Автоматический расчет минимального взноса
 *   computeFrom(
 *     path.initialPayment,
 *     [path.propertyValue],
 *     ({ propertyValue }) => propertyValue ? propertyValue * 0.2 : null,
 *     { debounce: 300 }
 *   );
 * };
 * ```
 */
export function computeFrom<TForm, TTarget>(
  target: FieldPathNode<TForm, TTarget>,
  sources: FieldPathNode<TForm, any>[],
  computeFn: (values: Record<string, any>) => TTarget,
  options?: ComputeFromOptions<TForm>
): void {
  const {
    trigger = 'change',
    debounce = 0,
    condition,
  } = options || {};

  // Обертка для computeFn, которая преобразует массив значений в объект
  const wrappedComputeFn = (...values: any[]) => {
    const valuesObj: Record<string, any> = {};
    sources.forEach((source, index) => {
      const fieldPath = source.__path;
      const fieldName = fieldPath.split('.').pop() || fieldPath;
      valuesObj[fieldName] = values[index];
    });
    return computeFn(valuesObj);
  };

  getCurrentRegistry().register({
    type: 'compute',
    targetField: target,
    sourceFields: sources,
    computeFn: wrappedComputeFn,
    trigger,
    debounce,
    condition,
  });
}

// ============================================================================
// watchField - Подписка на изменения
// ============================================================================

/**
 * Выполняет callback при изменении поля
 *
 * @param field - Поле для отслеживания
 * @param callback - Функция обратного вызова
 * @param options - Опции
 *
 * @example
 * ```typescript
 * const schema: BehaviorSchemaFn<MyForm> = (path) => {
 *   // Динамическая загрузка городов при изменении страны
 *   watchField(path.registrationAddress.country, async (country, ctx) => {
 *     if (country) {
 *       const cities = await fetchCities(country);
 *       ctx.updateComponentProps(path.registrationAddress.city, {
 *         options: cities
 *       });
 *     }
 *   });
 * };
 * ```
 */
export function watchField<TForm, TField>(
  field: FieldPathNode<TForm, TField>,
  callback: (value: TField, ctx: BehaviorContext<TForm>) => void | Promise<void>,
  options?: WatchFieldOptions
): void {
  const { debounce = 0, immediate = false } = options || {};

  getCurrentRegistry().register({
    type: 'watch',
    sourceField: field,
    callback: callback as any,
    debounce,
    immediate,
  });
}

// ============================================================================
// revalidateWhen - Перевалидация при изменении других полей
// ============================================================================

/**
 * Перевалидирует поле при изменении других полей
 *
 * @param target - Поле для перевалидации
 * @param triggers - Поля-триггеры
 * @param options - Опции
 *
 * @example
 * ```typescript
 * const schema: BehaviorSchemaFn<MyForm> = (path) => {
 *   // Перевалидировать initialPayment при изменении propertyValue
 *   revalidateWhen(path.initialPayment, [path.propertyValue], {
 *     debounce: 300
 *   });
 * };
 * ```
 */
export function revalidateWhen<TForm>(
  target: FieldPathNode<TForm, any>,
  triggers: FieldPathNode<TForm, any>[],
  options?: RevalidateWhenOptions
): void {
  const { debounce = 0 } = options || {};

  getCurrentRegistry().register({
    type: 'revalidate',
    targetField: target,
    sourceFields: triggers,
    debounce,
  });
}

// ============================================================================
// syncFields - Двусторонняя синхронизация
// ============================================================================

/**
 * Двусторонняя синхронизация двух полей
 *
 * @param field1 - Первое поле
 * @param field2 - Второе поле
 * @param options - Опции
 *
 * @example
 * ```typescript
 * const schema: BehaviorSchemaFn<MyForm> = (path) => {
 *   // Синхронизировать два поля
 *   syncFields(path.email, path.emailCopy);
 * };
 * ```
 */
export function syncFields<TForm, T>(
  field1: FieldPathNode<TForm, T>,
  field2: FieldPathNode<TForm, T>,
  options?: SyncFieldsOptions<T>
): void {
  const { transform, debounce = 0 } = options || {};

  getCurrentRegistry().register({
    type: 'sync',
    sourceField: field1,
    targetField: field2,
    transform,
    debounce,
  });
}
