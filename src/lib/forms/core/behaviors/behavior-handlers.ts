/**
 * Behavior Handlers - функции-обработчики для различных типов behaviors
 *
 * Функциональный подход вместо классического Strategy паттерна.
 * Каждый handler - чистая функция, которая создает effect подписку.
 */

import { effect } from '@preact/signals-react';
import type { GroupNode } from '../nodes/group-node';
import type { FormNode } from '../nodes/form-node';
import type { BehaviorRegistration } from './types';
import { BehaviorContextImpl } from './behavior-context';

/**
 * Тип функции-обработчика behavior
 *
 * @template T - Тип формы
 * @param registration - Регистрация behavior
 * @param form - Форма (GroupNode)
 * @param context - Контекст behavior
 * @param withDebounce - Функция-обертка для debounce
 * @returns Функция cleanup для отписки от effect или null
 */
export type BehaviorHandler<T = any> = (
  registration: BehaviorRegistration<T>,
  form: GroupNode<T>,
  context: BehaviorContextImpl<T>,
  withDebounce: (callback: () => void) => void
) => (() => void) | null;

/**
 * Вспомогательная функция для разрешения узла формы по пути
 *
 * @param form - Корневая форма
 * @param fieldPath - Путь к полю
 * @returns Узел формы или undefined
 */
function resolveNode<T>(
  form: GroupNode<T>,
  fieldPath: string
): FormNode<any> | undefined {
  const parts = fieldPath.split('.');
  let current: any = form;

  for (const part of parts) {
    if (current && 'fields' in current && current.fields) {
      current = current.fields.get(part);
      if (!current) return undefined;
    } else {
      return undefined;
    }
  }

  return current as FormNode<any>;
}

/**
 * Handler для 'copy' behavior (copyFrom)
 *
 * Копирует значение из одного поля в другое с опциональной трансформацией
 */
export const copyHandler: BehaviorHandler = (registration, form, context, withDebounce) => {
  const { sourceField, targetField, condition, transform, fields } = registration;

  if (!sourceField || !targetField) return null;

  const sourceNode = resolveNode(form, sourceField.__path);
  const targetNode = resolveNode(form, targetField.__path);

  if (!sourceNode || !targetNode) return null;

  return effect(() => {
    const sourceValue = sourceNode.value.value;

    withDebounce(() => {
      // Проверка условия
      if (condition) {
        const formValue = form.getValue();
        if (!condition(formValue)) return;
      }

      // Трансформация значения
      const value = transform ? transform(sourceValue) : sourceValue;

      // Копирование
      if (fields === 'all' || !fields) {
        targetNode.setValue(value, { emitEvent: false });
      } else {
        // Частичное копирование для групп
        const patch: any = {};
        fields.forEach((key) => {
          if (sourceValue && typeof sourceValue === 'object') {
            patch[key] = (sourceValue as any)[key];
          }
        });
        if ('patchValue' in targetNode) {
          (targetNode as any).patchValue(patch);
        }
      }
    });
  });
};

/**
 * Handler для 'enable' behavior (enableWhen/disableWhen)
 *
 * Включает/выключает поле в зависимости от условия
 */
export const enableHandler: BehaviorHandler = (registration, form, context, withDebounce) => {
  const { targetField, condition, resetOnDisable } = registration;

  if (!targetField || !condition) return null;

  const targetNode = resolveNode(form, targetField.__path);
  if (!targetNode) return null;

  return effect(() => {
    const formValue = form.value.value;

    withDebounce(() => {
      const shouldEnable = condition(formValue);

      if (shouldEnable) {
        targetNode.enable && targetNode.enable();
      } else {
        targetNode.disable && targetNode.disable();
        if (resetOnDisable) {
          targetNode.reset();
        }
      }
    });
  });
};

/**
 * Handler для 'show' behavior (showWhen/hideWhen)
 *
 * Показывает/скрывает поле в зависимости от условия
 * (в текущей реализации показывает warning)
 */
export const showHandler: BehaviorHandler = (registration, form, context, withDebounce) => {
  if (import.meta.env.DEV) {
    console.warn(
      'BehaviorRegistry: "show" behavior is not implemented yet. Use "enable" instead.'
    );
  }
  return null;
};

/**
 * Handler для 'compute' behavior (computeFrom)
 *
 * Вычисляет значение поля на основе других полей
 */
export const computeHandler: BehaviorHandler = (registration, form, context, withDebounce) => {
  const { targetField, sourceFields, computeFn, condition } = registration;

  if (!targetField || !sourceFields || !computeFn) return null;

  const targetNode = resolveNode(form, targetField.__path);
  if (!targetNode) return null;

  // Разрешаем source узлы
  const sourceNodes = sourceFields
    .map((field) => resolveNode(form, field.__path))
    .filter((node): node is FormNode<any> => node !== undefined);

  if (sourceNodes.length === 0) return null;

  return effect(() => {
    // Читаем значения всех source полей
    const sourceValues = sourceNodes.map((node) => node.value.value);

    withDebounce(() => {
      // Проверка условия
      if (condition) {
        const formValue = form.getValue();
        if (!condition(formValue)) return;
      }

      // Вычисляем новое значение
      const computedValue = computeFn(...sourceValues);

      // Устанавливаем значение без триггера событий
      targetNode.setValue(computedValue, { emitEvent: false });
    });
  });
};

/**
 * Handler для 'watch' behavior (watchField)
 *
 * Вызывает callback при изменении поля
 */
export const watchHandler: BehaviorHandler = (registration, form, context, withDebounce) => {
  const { sourceField, callback, immediate } = registration;

  if (!sourceField || !callback) return null;

  const node = resolveNode(form, sourceField.__path);
  if (!node) return null;

  // Вызвать сразу если immediate: true
  if (immediate) {
    const value = node.value.value;
    // watchField callback принимает (value, context)
    callback(value, context as any);
  }

  return effect(() => {
    const value = node.value.value;

    withDebounce(() => {
      // watchField callback принимает (value, context)
      callback(value, context as any);
    });
  });
};

/**
 * Handler для 'revalidate' behavior
 *
 * Перезапускает валидацию при изменении зависимых полей
 */
export const revalidateHandler: BehaviorHandler = (
  registration,
  form,
  context,
  withDebounce
) => {
  const { targetField, sourceFields } = registration;

  if (!targetField || !sourceFields) return null;

  const targetNode = resolveNode(form, targetField.__path);
  if (!targetNode) return null;

  const sourceNodes = sourceFields
    .map((field) => resolveNode(form, field.__path))
    .filter((node): node is FormNode<any> => node !== undefined);

  if (sourceNodes.length === 0) return null;

  return effect(() => {
    // Отслеживаем изменения source полей
    sourceNodes.forEach((node) => node.value.value);

    withDebounce(() => {
      // Перезапускаем валидацию target поля
      targetNode.validate();
    });
  });
};

/**
 * Handler для 'sync' behavior
 *
 * Синхронизирует два поля (двусторонняя связь)
 */
export const syncHandler: BehaviorHandler = (registration, form, context, withDebounce) => {
  const { sourceField, targetField, transform } = registration;

  if (!sourceField || !targetField) return null;

  const sourceNode = resolveNode(form, sourceField.__path);
  const targetNode = resolveNode(form, targetField.__path);

  if (!sourceNode || !targetNode) return null;

  // Флаг для предотвращения циклических обновлений
  let isUpdating = false;

  const dispose1 = effect(() => {
    const sourceValue = sourceNode.value.value;

    if (isUpdating) return;

    withDebounce(() => {
      isUpdating = true;
      const finalValue = transform ? transform(sourceValue) : sourceValue;
      targetNode.setValue(finalValue, { emitEvent: false });
      isUpdating = false;
    });
  });

  const dispose2 = effect(() => {
    const targetValue = targetNode.value.value;

    if (isUpdating) return;

    withDebounce(() => {
      isUpdating = true;
      // Обратная синхронизация (без трансформации)
      sourceNode.setValue(targetValue, { emitEvent: false });
      isUpdating = false;
    });
  });

  // Возвращаем комбинированный cleanup
  return () => {
    dispose1();
    dispose2();
  };
};

/**
 * Lookup table для всех behavior handlers
 *
 * Используется в BehaviorRegistry.createEffect для диспетчеризации
 */
export const behaviorHandlers: Record<string, BehaviorHandler> = {
  copy: copyHandler,
  enable: enableHandler,
  show: showHandler,
  compute: computeHandler,
  watch: watchHandler,
  revalidate: revalidateHandler,
  sync: syncHandler,
};
