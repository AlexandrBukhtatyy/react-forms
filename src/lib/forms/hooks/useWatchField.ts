/**
 * useWatchField - React хук для подписки на изменения поля
 *
 * Выполняет callback при изменении поля
 */

import { useEffect } from 'react';
import { effect } from '@preact/signals-react';
import type { FieldNode } from '../core/nodes/field-node';

/**
 * React хук для подписки на изменения поля
 * Автоматически управляет cleanup при unmount
 *
 * @param field - Поле для отслеживания
 * @param callback - Функция, вызываемая при изменении
 * @param deps - Зависимости React (опционально)
 *
 * @example
 * ```typescript
 * function LocationForm() {
 *   const form = useMemo(() => createLocationForm(), []);
 *
 *   // Динамическая загрузка городов при изменении страны
 *   useWatchField(
 *     form.registrationAddress.country,
 *     async (country) => {
 *       if (country) {
 *         const cities = await fetchCities(country);
 *         form.registrationAddress.city.updateComponentProps({
 *           options: cities
 *         });
 *       }
 *     }
 *   );
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useWatchField<T>(
  field: FieldNode<T>,
  callback: (value: T) => void | Promise<void>,
  deps?: React.DependencyList
): void {
  useEffect(() => {
    const dispose = effect(() => {
      const value = field.value.value;
      callback(value);
    });

    return () => dispose();
  }, deps || [field]);
}

/**
 * useWatchField с immediate опцией
 * Позволяет контролировать, вызывать ли callback сразу при mount
 *
 * @param field - Поле для отслеживания
 * @param callback - Функция, вызываемая при изменении
 * @param options - Опции
 *
 * @example
 * ```typescript
 * useWatchFieldWithOptions(
 *   form.email,
 *   (value) => console.log('Email:', value),
 *   { immediate: false } // Не вызывать при mount
 * );
 * ```
 */
export function useWatchFieldWithOptions<T>(
  field: FieldNode<T>,
  callback: (value: T) => void | Promise<void>,
  options?: {
    immediate?: boolean;
    deps?: React.DependencyList;
  }
): void {
  const { immediate = true, deps } = options || {};

  useEffect(() => {
    let isFirst = true;

    const dispose = effect(() => {
      const value = field.value.value;

      // Пропустить первый вызов если immediate: false
      if (!immediate && isFirst) {
        isFirst = false;
        return;
      }

      isFirst = false;
      callback(value);
    });

    return () => dispose();
  }, deps || [field]);
}
