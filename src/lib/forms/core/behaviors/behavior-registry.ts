/**
 * BehaviorRegistry - регистрация и управление behavior схемами
 *
 * Аналогично ValidationRegistry, но для реактивного поведения форм
 */

import { effect } from '@preact/signals-react';
import type { GroupNode } from '../core/nodes/group-node';
import type { FormNode } from '../core/nodes/form-node';
import type { BehaviorRegistration } from './types';
import { BehaviorContextImpl } from './behavior-context';

/**
 * Реестр behaviors для формы
 *
 * Каждый экземпляр GroupNode создает собственный реестр (композиция).
 * Устраняет race conditions и изолирует формы друг от друга.
 *
 * @example
 * ```typescript
 * class GroupNode {
 *   private readonly behaviorRegistry = new BehaviorRegistryClass();
 *
 *   applyBehaviorSchema(schemaFn) {
 *     this.behaviorRegistry.beginRegistration();
 *     schemaFn(createBehaviorFieldPath(this));
 *     return this.behaviorRegistry.endRegistration(this);
 *   }
 * }
 * ```
 */
export class BehaviorRegistryClass {
  private registrations: BehaviorRegistration[] = [];
  private isRegistering = false;

  /**
   * Начать регистрацию behaviors
   * Вызывается перед применением схемы
   */
  beginRegistration(): void {
    this.isRegistering = true;
    this.registrations = [];
  }

  /**
   * Зарегистрировать behavior
   * Вызывается функциями из schema-behaviors.ts
   */
  register(registration: BehaviorRegistration): void {
    if (!this.isRegistering) {
      if (import.meta.env.DEV) {
        throw new Error(
          'BehaviorRegistry: call beginRegistration() before registering behaviors'
        );
      }
      return;
    }

    this.registrations.push(registration);
  }

  /**
   * Завершить регистрацию и применить behaviors к форме
   * Создает effect подписки для всех зарегистрированных behaviors
   *
   * @param form - GroupNode формы
   * @returns Массив зарегистрированных behaviors и функция cleanup
   */
  endRegistration<T>(
    form: GroupNode<T>
  ): { behaviors: BehaviorRegistration[]; cleanup: () => void } {
    this.isRegistering = false;

    const context = new BehaviorContextImpl(form);
    const disposeCallbacks: Array<() => void> = [];

    // Создаем effect подписки для каждого behavior
    for (const registration of this.registrations) {
      const dispose = this.createEffect(registration, form, context);
      if (dispose) {
        disposeCallbacks.push(dispose);
      }
    }

    // Функция cleanup для отписки от всех effects
    const cleanup = () => {
      disposeCallbacks.forEach((dispose) => dispose());
    };

    return {
      behaviors: [...this.registrations],
      cleanup,
    };
  }

  /**
   * Создать effect подписку для behavior
   * @private
   */
  private createEffect<T>(
    registration: BehaviorRegistration<T>,
    form: GroupNode<T>,
    context: BehaviorContextImpl<T>
  ): (() => void) | null {
    const { type, debounce: debounceMs = 0 } = registration;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Обертка для debounce
    const withDebounce = (callback: () => void) => {
      if (debounceMs > 0) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(callback, debounceMs);
      } else {
        callback();
      }
    };

    // ✅ ИСПРАВЛЕНИЕ: Cleanup функция для debounce таймера
    const cleanupDebounce = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
    };

    // Создаем effect в зависимости от типа
    let effectDispose: (() => void) | null = null;

    switch (type) {
      case 'copy': {
        effectDispose = this.createCopyEffect(registration, form, context, withDebounce);
        break;
      }

      case 'enable': {
        effectDispose = this.createEnableEffect(
          registration,
          form,
          context,
          withDebounce
        );
        break;
      }

      case 'show': {
        effectDispose = this.createShowEffect(registration, form, context, withDebounce);
        break;
      }

      case 'compute': {
        effectDispose = this.createComputeEffect(
          registration,
          form,
          context,
          withDebounce
        );
        break;
      }

      case 'watch': {
        effectDispose = this.createWatchEffect(
          registration,
          form,
          context,
          withDebounce
        );
        break;
      }

      case 'revalidate': {
        effectDispose = this.createRevalidateEffect(
          registration,
          form,
          context,
          withDebounce
        );
        break;
      }

      case 'sync': {
        effectDispose = this.createSyncEffect(registration, form, context, withDebounce);
        break;
      }

      default:
        if (import.meta.env.DEV) {
          console.warn(`Unknown behavior type: ${type}`);
        }
        return null;
    }

    // ✅ ИСПРАВЛЕНИЕ: Возвращаем комбинированный cleanup
    // который очищает и effect, и debounce таймер
    return () => {
      cleanupDebounce();
      if (effectDispose) {
        effectDispose();
      }
    };
  }

  /**
   * Создать effect для копирования значений
   * @private
   */
  private createCopyEffect<T>(
    registration: BehaviorRegistration<T>,
    form: GroupNode<T>,
    context: BehaviorContextImpl<T>,
    withDebounce: (cb: () => void) => void
  ): () => void {
    const { sourceField, targetField, condition, transform, fields } =
      registration;

    if (!sourceField || !targetField) return () => {};

    const sourceNode = this.resolveNode(form, sourceField.__path);
    const targetNode = this.resolveNode(form, targetField.__path);

    if (!sourceNode || !targetNode) return () => {};

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
              patch[key] = sourceValue[key];
            }
          });
          if ('patchValue' in targetNode) {
            (targetNode as any).patchValue(patch);
          }
        }
      });
    });
  }

  /**
   * Создать effect для условного enable/disable
   * @private
   */
  private createEnableEffect<T>(
    registration: BehaviorRegistration<T>,
    form: GroupNode<T>,
    context: BehaviorContextImpl<T>,
    withDebounce: (cb: () => void) => void
  ): () => void {
    const { targetField, condition, resetOnDisable } = registration;

    if (!targetField || !condition) return () => {};

    const node = this.resolveNode(form, targetField.__path);
    if (!node) return () => {};

    return effect(() => {
      const formValue = form.value.value;

      withDebounce(() => {
        const shouldEnable = condition(formValue);

        if (shouldEnable) {
          node.enable && node.enable();
        } else {
          node.disable && node.disable();
          if (resetOnDisable) {
            node.reset();
          }
        }
      });
    });
  }

  /**
   * Создать effect для условного show/hide
   * @private
   */
  private createShowEffect<T>(
    registration: BehaviorRegistration<T>,
    form: GroupNode<T>,
    context: BehaviorContextImpl<T>,
    withDebounce: (cb: () => void) => void
  ): () => void {
    const { targetField, condition } = registration;

    if (!targetField || !condition) return () => {};

    const node = this.resolveNode(form, targetField.__path);
    if (!node || !('updateComponentProps' in node)) return () => {};

    return effect(() => {
      const formValue = form.value.value;

      withDebounce(() => {
        const shouldShow = condition(formValue);
        (node as any).updateComponentProps({ hidden: !shouldShow });
      });
    });
  }

  /**
   * Создать effect для вычисляемых полей
   * @private
   */
  private createComputeEffect<T>(
    registration: BehaviorRegistration<T>,
    form: GroupNode<T>,
    context: BehaviorContextImpl<T>,
    withDebounce: (cb: () => void) => void
  ): () => void {
    const { targetField, sourceFields, computeFn, condition } = registration;

    if (!targetField || !sourceFields || !computeFn) return () => {};

    const targetNode = this.resolveNode(form, targetField.__path);
    if (!targetNode) return () => {};

    const sourceNodes = sourceFields
      .map((sf) => this.resolveNode(form, sf.__path))
      .filter(Boolean) as FormNode<any>[];

    if (sourceNodes.length === 0) return () => {};

    return effect(() => {
      const sourceValues = sourceNodes.map((node) => node.value.value);

      withDebounce(() => {
        // Проверка условия
        if (condition) {
          const formValue = form.getValue();
          if (!condition(formValue)) return;
        }

        // Вычисление нового значения
        const newValue = computeFn(...sourceValues);

        // Установка значения без триггера событий
        targetNode.setValue(newValue, { emitEvent: false });
      });
    });
  }

  /**
   * Создать effect для подписки на изменения
   * @private
   */
  private createWatchEffect<T>(
    registration: BehaviorRegistration<T>,
    form: GroupNode<T>,
    context: BehaviorContextImpl<T>,
    withDebounce: (cb: () => void) => void
  ): () => void {
    const { sourceField, callback, immediate } = registration;

    if (!sourceField || !callback) return () => {};

    const node = this.resolveNode(form, sourceField.__path);
    if (!node) return () => {};

    // Вызвать сразу если immediate: true
    if (immediate) {
      const value = node.value.value;
      // ✅ Передаём context, а не node
      callback(value, context);
    }

    return effect(() => {
      const value = node.value.value;

      withDebounce(() => {
        // ✅ Передаём context, а не node
        callback(value, context);
      });
    });
  }

  /**
   * Создать effect для перевалидации
   * @private
   */
  private createRevalidateEffect<T>(
    registration: BehaviorRegistration<T>,
    form: GroupNode<T>,
    context: BehaviorContextImpl<T>,
    withDebounce: (cb: () => void) => void
  ): () => void {
    const { targetField, sourceFields } = registration;

    if (!targetField || !sourceFields) return () => {};

    const targetNode = this.resolveNode(form, targetField.__path);
    if (!targetNode) return () => {};

    const sourceNodes = sourceFields
      .map((sf) => this.resolveNode(form, sf.__path))
      .filter(Boolean) as FormNode<any>[];

    if (sourceNodes.length === 0) return () => {};

    return effect(() => {
      // Отслеживаем изменения всех source полей
      sourceNodes.forEach((node) => node.value.value);

      withDebounce(() => {
        // Перевалидируем target
        targetNode.validate();
      });
    });
  }

  /**
   * Создать effect для двусторонней синхронизации
   * @private
   */
  private createSyncEffect<T>(
    registration: BehaviorRegistration<T>,
    form: GroupNode<T>,
    context: BehaviorContextImpl<T>,
    withDebounce: (cb: () => void) => void
  ): () => void {
    const { sourceField, targetField, transform } = registration;

    if (!sourceField || !targetField) return () => {};

    const sourceNode = this.resolveNode(form, sourceField.__path);
    const targetNode = this.resolveNode(form, targetField.__path);

    if (!sourceNode || !targetNode) return () => {};

    let isSyncing = false;

    // source → target
    const dispose1 = effect(() => {
      const value = sourceNode.value.value;

      withDebounce(() => {
        if (isSyncing) return;
        isSyncing = true;

        const transformedValue = transform ? transform(value) : value;
        targetNode.setValue(transformedValue, { emitEvent: false });

        isSyncing = false;
      });
    });

    // target → source
    const dispose2 = effect(() => {
      const value = targetNode.value.value;

      withDebounce(() => {
        if (isSyncing) return;
        isSyncing = true;

        const transformedValue = transform ? transform(value) : value;
        sourceNode.setValue(transformedValue, { emitEvent: false });

        isSyncing = false;
      });
    });

    // Cleanup обоих effects
    return () => {
      dispose1();
      dispose2();
    };
  }

  /**
   * Разрешить fieldPath в FormNode
   * @private
   */
  private resolveNode<T>(
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
}

/**
 * Глобальный экземпляр для обратной совместимости (deprecated)
 *
 * @deprecated Используйте локальный экземпляр в GroupNode вместо глобального.
 * Этот экземпляр будет удален в следующей версии.
 *
 * @example
 * ```typescript
 * // ❌ Старый способ (deprecated)
 * BehaviorRegistry.beginRegistration();
 *
 * // ✅ Новый способ (рекомендуется)
 * class GroupNode {
 *   private readonly behaviorRegistry = new BehaviorRegistryClass();
 * }
 * ```
 */
export const BehaviorRegistry = new BehaviorRegistryClass();
