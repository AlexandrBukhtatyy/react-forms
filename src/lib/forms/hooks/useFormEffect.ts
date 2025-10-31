/**
 * useFormEffect - React хук для работы с @preact/signals effect
 *
 * Обертка над effect из @preact/signals для удобного использования в React компонентах
 */

import { useEffect } from 'react';
import { effect } from '@preact/signals-react';

/**
 * React хук для подписки на изменения signals
 * Автоматически управляет cleanup при unmount
 *
 * @param callback - Функция, которая будет вызвана при изменении отслеживаемых signals
 * @param deps - Зависимости React (опционально)
 *
 * @example
 * ```typescript
 * function MyForm() {
 *   const form = useMemo(() => createForm(), []);
 *
 *   useFormEffect(() => {
 *     // Автоматически отслеживает изменения
 *     const country = form.registrationAddress.country.value.value;
 *
 *     if (country) {
 *       console.log('Country changed:', country);
 *     }
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useFormEffect(
  callback: () => void | (() => void),
  deps?: React.DependencyList
): void {
  useEffect(() => {
    // Создаем effect из @preact/signals
    // effect автоматически отслеживает все signals, к которым обращается callback
    const dispose = effect(() => {
      callback();
    });

    // Cleanup при unmount или изменении deps
    return () => dispose();
  }, deps);
}
