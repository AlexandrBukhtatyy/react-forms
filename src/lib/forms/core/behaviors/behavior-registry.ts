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
 * Context stack используется для tracking текущего активного реестра:
 * - beginRegistration() помещает this в stack
 * - endRegistration() извлекает из stack
 * - getCurrent() возвращает текущий активный реестр
 *
 * @example
 * ```typescript
 * class GroupNode {
 *   private readonly behaviorRegistry = new BehaviorRegistry();
 *
 *   applyBehaviorSchema(schemaFn) {
 *     this.behaviorRegistry.beginRegistration(); // Pushes this to stack
 *     schemaFn(createBehaviorFieldPath(this));   // Uses getCurrent()
 *     return this.behaviorRegistry.endRegistration(this); // Pops from stack
 *   }
 * }
 * ```
 */
export class BehaviorRegistry {
  /**
   * Stack активных контекстов регистрации
   * Используется для изоляции форм друг от друга
   */
  private static contextStack: BehaviorRegistry[] = [];

  private registrations: BehaviorRegistration[] = [];
  private isRegistering = false;

  /**
   * Получить текущий активный реестр из context stack
   *
   * @returns Текущий активный реестр или null
   *
   * @example
   * ```typescript
   * // В schema-behaviors.ts
   * export function copyFrom(...) {
   *   const registry = BehaviorRegistry.getCurrent();
   *   if (registry) {
   *     registry.register({ ... });
   *   }
   * }
   * ```
   */
  static getCurrent(): BehaviorRegistry | null {
    const stack = BehaviorRegistry.contextStack;
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }

  /**
   * Начать регистрацию behaviors
   * Вызывается перед применением схемы
   *
   * Помещает this в context stack для изоляции форм
   */
  beginRegistration(): void {
    this.isRegistering = true;
    this.registrations = [];
    // Помещаем this в stack для tracking текущего активного реестра
    BehaviorRegistry.contextStack.push(this);
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
   * Извлекает this из context stack
   *
   * @param form - GroupNode формы
   * @returns Массив зарегистрированных behaviors и функция cleanup
   */
  endRegistration<T>(
    form: GroupNode<T>
  ): { behaviors: BehaviorRegistration[]; cleanup: () => void } {
    this.isRegistering = false;

    // Извлекаем из stack
    const popped = BehaviorRegistry.contextStack.pop();
    if (popped !== this && import.meta.env.DEV) {
      console.warn(
        'BehaviorRegistry: Context stack mismatch. Expected this, got:',
        popped
      );
    }

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

// ============================================================================
// Глобальный экземпляр BehaviorRegistry УДАЛЕН
// ============================================================================
//
// Ранее здесь был глобальный Singleton экземпляр BehaviorRegistry,
// который создавал race conditions и нарушал изоляцию форм.
//
// ✅ Теперь каждый GroupNode создает собственный экземпляр BehaviorRegistry:
//
// @example
// ```typescript
// class GroupNode {
//   private readonly behaviorRegistry = new BehaviorRegistry();
//
//   applyBehaviorSchema(schemaFn) {
//     this.behaviorRegistry.beginRegistration();
//     schemaFn(createBehaviorFieldPath(this));
//     return this.behaviorRegistry.endRegistration(this);
//   }
// }
// ```
//
// Это обеспечивает:
// - Полную изоляцию форм друг от друга
// - Отсутствие race conditions при параллельной регистрации
// - Возможность применять разные behavior схемы к разным формам одновременно
