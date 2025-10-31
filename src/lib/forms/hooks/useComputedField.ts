/**
 * useComputedField - React хук для автоматического вычисления поля
 *
 * Автоматически обновляет поле на основе других полей
 */

import { useEffect } from 'react';
import { effect } from '@preact/signals-react';
import type { FieldNode } from '../core/nodes/field-node';
import type { ReadonlySignal } from '@preact/signals-react';

/**
 * React хук для автоматического вычисления значения поля
 * Автоматически управляет cleanup при unmount
 *
 * @param field - FieldNode для записи результата
 * @param computeFn - Функция вычисления нового значения
 * @param deps - Зависимости React
 *
 * @example
 * ```typescript
 * function MortgageForm() {
 *   const form = useMemo(() => createMortgageForm(), []);
 *
 *   // Автоматический расчет минимального взноса (20%)
 *   useComputedField(
 *     form.initialPayment,
 *     () => {
 *       const propertyValue = form.propertyValue.value.value;
 *       return propertyValue ? propertyValue * 0.2 : null;
 *     },
 *     [form.propertyValue.value.value]
 *   );
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useComputedField<T>(
  field: FieldNode<T>,
  computeFn: () => T,
  deps: React.DependencyList
): void {
  useEffect(() => {
    const dispose = effect(() => {
      const newValue = computeFn();
      field.setValue(newValue, { emitEvent: false });
    });

    return () => dispose();
  }, deps);
}

/**
 * Вариант useComputedField с автоматическим отслеживанием зависимостей
 * Не требует указания deps, отслеживает все signals автоматически
 *
 * @param field - FieldNode для записи результата
 * @param computeFn - Функция вычисления, автоматически отслеживает signals
 *
 * @example
 * ```typescript
 * function MortgageForm() {
 *   const form = useMemo(() => createMortgageForm(), []);
 *
 *   // Автоматически отслеживает form.propertyValue.value
 *   useComputedFieldAuto(form.initialPayment, () => {
 *     const propertyValue = form.propertyValue.value.value;
 *     return propertyValue ? propertyValue * 0.2 : null;
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useComputedFieldAuto<T>(
  field: FieldNode<T>,
  computeFn: () => T
): void {
  useEffect(() => {
    const dispose = effect(() => {
      const newValue = computeFn();
      field.setValue(newValue, { emitEvent: false });
    });

    return () => dispose();
  }, [field]); // Только field в deps, signals отслеживаются автоматически
}
