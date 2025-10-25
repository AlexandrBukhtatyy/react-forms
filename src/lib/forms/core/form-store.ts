/**
 * FormStore - алиас для GroupNode
 *
 * @deprecated Используйте GroupNode вместо FormStore
 * FormStore будет удален в версии 2.0
 *
 * Для обратной совместимости FormStore остается как алиас для GroupNode
 */

import { GroupNode } from './nodes/group-node';

/**
 * @deprecated Используйте GroupNode вместо FormStore
 */
export const FormStore = GroupNode;

// Экспорт типов
export type { FormSchema, ValidationSchemaFn } from '../types';
