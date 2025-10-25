/**
 * DeepFormStore - LEGACY алиас для GroupNode
 *
 * @deprecated Используйте GroupNode вместо DeepFormStore
 * DeepFormStore будет удален в версии 2.0
 *
 * GroupNode теперь нативно поддерживает:
 * - Вложенные формы
 * - Массивы форм (ArrayNode)
 * - Прямой доступ к полям через Proxy
 *
 * @example
 * ```typescript
 * // Старый способ
 * const form = new DeepFormStore({
 *   name: { value: '', component: Input },
 *   address: {
 *     city: { value: '', component: Input },
 *   },
 * });
 *
 * // Новый способ (рекомендуется)
 * const form = new GroupNode({
 *   name: { value: '', component: Input },
 *   address: {
 *     city: { value: '', component: Input },
 *   },
 * });
 * ```
 */

import { GroupNode } from './nodes/group-node';

/**
 * @deprecated Используйте GroupNode вместо DeepFormStore
 */
export const DeepFormStore = GroupNode;

// Re-export types for backward compatibility
export type { DeepFormSchema, DeepControls } from '../types';
