/**
 * useEnableWhen / useDisableWhen - React хуки для условного enable/disable полей
 *
 * Автоматически включает/выключает поле на основе условия
 */

import { useEffect } from 'react';
import { effect } from '@preact/signals-react';
import type { FormNode } from '../core/nodes/form-node';
import type { ReadonlySignal } from '@preact/signals-react';

/**
 * Опции для useEnableWhen
 */
export interface UseEnableWhenOptions {
  /** Сбросить значение при disable */
  resetOnDisable?: boolean;
}

/**
 * React хук для условного включения/выключения поля
 * Автоматически управляет cleanup при unmount
 *
 * @param field - Поле для включения/выключения
 * @param condition - Условие (computed signal или function)
 * @param options - Опции
 *
 * @example
 * ```typescript
 * function LoanForm() {
 *   const form = useMemo(() => createLoanForm(), []);
 *
 *   // Включить поле только для ипотеки
 *   useEnableWhen(
 *     form.propertyValue,
 *     () => form.loanType.value.value === 'mortgage',
 *     { resetOnDisable: true }
 *   );
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useEnableWhen(
  field: FormNode<any>,
  condition: ReadonlySignal<boolean> | (() => boolean),
  options?: UseEnableWhenOptions
): void {
  const { resetOnDisable = false } = options || {};

  useEffect(() => {
    const dispose = effect(() => {
      const shouldEnable =
        typeof condition === 'function' ? condition() : condition.value;

      if (shouldEnable) {
        field.enable();
      } else {
        field.disable();
        if (resetOnDisable) {
          field.reset();
        }
      }
    });

    return () => dispose();
  }, [field, condition, resetOnDisable]);
}

/**
 * React хук для условного выключения поля (инверсия useEnableWhen)
 * Автоматически управляет cleanup при unmount
 *
 * @param field - Поле для выключения
 * @param condition - Условие (true = disable, false = enable)
 * @param options - Опции
 *
 * @example
 * ```typescript
 * function LoanForm() {
 *   const form = useMemo(() => createLoanForm(), []);
 *
 *   // Выключить поле для потребительского кредита
 *   useDisableWhen(
 *     form.propertyValue,
 *     () => form.loanType.value.value === 'consumer'
 *   );
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useDisableWhen(
  field: FormNode<any>,
  condition: ReadonlySignal<boolean> | (() => boolean),
  options?: UseEnableWhenOptions
): void {
  // Инвертируем условие
  const invertedCondition =
    typeof condition === 'function'
      ? () => !condition()
      : (() => !condition.value) as any;

  useEnableWhen(field, invertedCondition, options);
}
