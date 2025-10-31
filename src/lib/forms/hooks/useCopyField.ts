/**
 * useCopyField - React хук для копирования значений между полями
 *
 * Автоматически копирует значения из source в target при изменениях
 */

import { useEffect } from 'react';
import { effect } from '@preact/signals-react';
import type { ReadonlySignal } from '@preact/signals-react';
import type { GroupNode } from '../core/nodes/group-node';

/**
 * Опции для useCopyField
 */
export interface UseCopyFieldOptions<T> {
  /** Условие копирования (computed signal или function) */
  enabled?: ReadonlySignal<boolean> | (() => boolean);

  /** Какие поля копировать (для групп) */
  fields?: keyof T[] | 'all';

  /** Трансформация значения */
  transform?: (value: T) => T;
}

/**
 * React хук для копирования значений между полями
 * Автоматически управляет cleanup при unmount
 *
 * @param source - Поле-источник (FieldNode или GroupNode)
 * @param target - Поле-цель (FieldNode или GroupNode)
 * @param options - Опции копирования
 *
 * @example
 * ```typescript
 * function AddressForm() {
 *   const form = useMemo(() => createAddressForm(), []);
 *
 *   // Копировать адрес регистрации в адрес проживания
 *   useCopyField(
 *     form.registrationAddress,
 *     form.residenceAddress,
 *     {
 *       enabled: form.sameAsRegistration.value, // ReadonlySignal<boolean>
 *       fields: 'all'
 *     }
 *   );
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useCopyField<T extends Record<string, any>>(
  source: GroupNode<T>,
  target: GroupNode<T>,
  options?: UseCopyFieldOptions<T>
): void {
  const { enabled, fields = 'all', transform } = options || {};

  useEffect(() => {
    const dispose = effect(() => {
      // Проверка условия
      if (enabled) {
        const isEnabled =
          typeof enabled === 'function' ? enabled() : enabled.value;

        if (!isEnabled) return;
      }

      // Получение значения источника
      const sourceValue = source.value.value;

      // Трансформация
      const value = transform ? transform(sourceValue) : sourceValue;

      // Копирование
      if (fields === 'all') {
        target.setValue(value, { emitEvent: false });
      } else {
        // Частичное копирование
        const patch: Partial<T> = {};
        fields.forEach((key) => {
          patch[key] = sourceValue[key];
        });
        target.patchValue(patch);
      }
    });

    return () => dispose();
  }, [source, target, enabled, fields, transform]);
}
