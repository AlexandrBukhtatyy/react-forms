/**
 * BehaviorRegistry - регистрация и управление behavior схемами
 *
 * Аналогично ValidationRegistry, но для реактивного поведения форм
 */

import type { GroupNode } from '../nodes/group-node';
import type { BehaviorRegistration } from './types';
import { BehaviorContextImpl } from './behavior-context';
import { behaviorHandlers } from './behavior-handlers';

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

    // Создаем effect в зависимости от типа используя lookup table
    let effectDispose: (() => void) | null = null;

    const handler = behaviorHandlers[type];
    if (handler) {
      effectDispose = handler(registration, form, context, withDebounce);
    } else if (import.meta.env.DEV) {
      console.warn(`Unknown behavior type: ${type}`);
    }

    if (!effectDispose) {
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
