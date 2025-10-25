/**
 * FieldController - алиас для FieldNode
 *
 * @deprecated Используйте FieldNode вместо FieldController
 * FieldController будет удален в версии 2.0
 *
 * Для обратной совместимости FieldController остается как алиас для FieldNode
 */

import { FieldNode } from './nodes/field-node';

/**
 * @deprecated Используйте FieldNode вместо FieldController
 */
export const FieldController = FieldNode;

// Экспорт типов
export type { FieldConfig, ValidationError, FieldStatus } from '../types';
