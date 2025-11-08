/**
 * NodeFactory - фабрика для создания узлов формы
 *
 * Инкапсулирует логику определения типа конфига и создания соответствующего узла.
 * Используется в GroupNode и ArrayNode для создания дочерних узлов.
 *
 * Паттерн Factory Method упрощает создание узлов и делает код более читаемым:
 * - Вместо if-else в GroupNode/ArrayNode
 * - Единая точка для создания узлов
 * - Легко добавлять новые типы узлов
 *
 * @example
 * ```typescript
 * const factory = new NodeFactory();
 *
 * // Создание FieldNode
 * const field = factory.createNode({ value: '', component: Input });
 *
 * // Создание GroupNode
 * const group = factory.createNode({
 *   email: { value: '', component: Input },
 *   password: { value: '', component: Input }
 * });
 *
 * // Создание ArrayNode
 * const array = factory.createNode({
 *   schema: { title: { value: '', component: Input } },
 *   initialItems: []
 * });
 * ```
 */

import { FieldNode } from '../nodes/field-node';
import { GroupNode } from '../nodes/group-node';
import { ArrayNode } from '../nodes/array-node';
import type { FormNode } from '../nodes/form-node';

/**
 * Фабрика для создания узлов формы
 *
 * Определяет тип конфига и создает соответствующий узел (FieldNode, GroupNode, ArrayNode)
 */
export class NodeFactory {
  /**
   * Создает узел формы на основе конфигурации
   *
   * Автоматически определяет тип узла:
   * - FieldNode: имеет value и component
   * - ArrayNode: имеет schema (без value)
   * - GroupNode: объект без value, component, schema
   *
   * @param config Конфигурация узла
   * @returns Экземпляр FieldNode, GroupNode или ArrayNode
   * @throws Error если конфиг не соответствует ни одному типу
   *
   * @example
   * ```typescript
   * const factory = new NodeFactory();
   *
   * // FieldNode
   * const field = factory.createNode({
   *   value: 'test@mail.com',
   *   component: Input,
   *   validators: [required, email]
   * });
   *
   * // GroupNode
   * const group = factory.createNode({
   *   email: { value: '', component: Input },
   *   password: { value: '', component: Input }
   * });
   *
   * // ArrayNode
   * const array = factory.createNode({
   *   schema: { title: { value: '', component: Input } },
   *   initialItems: [{ title: 'Item 1' }]
   * });
   * ```
   */
  createNode<T>(config: any): FormNode<T> {
    // 1. Проверка FieldConfig (приоритет: самый специфичный тип)
    if (this.isFieldConfig(config)) {
      return new FieldNode(config) as any;
    }

    // 2. Проверка ArrayConfig
    if (this.isArrayConfig(config)) {
      return new ArrayNode(config.schema, config.initialItems) as any;
    }

    // 3. Проверка GroupConfig (самый общий тип)
    if (this.isGroupConfig(config)) {
      return new GroupNode(config) as any;
    }

    // Неизвестный конфиг
    throw new Error(
      `NodeFactory: Unknown node config. Expected FieldConfig, GroupConfig, or ArrayConfig, but got: ${JSON.stringify(
        config
      )}`
    );
  }

  /**
   * Проверяет, является ли конфиг конфигурацией поля (FieldConfig)
   *
   * FieldConfig имеет обязательные свойства:
   * - value: начальное значение поля
   * - component: React-компонент для отображения
   *
   * @param config Проверяемая конфигурация
   * @returns true если config является FieldConfig
   *
   * @example
   * ```typescript
   * const factory = new NodeFactory();
   *
   * factory.isFieldConfig({ value: '', component: Input }); // true
   * factory.isFieldConfig({ email: { value: '' } }); // false
   * factory.isFieldConfig(null); // false
   * ```
   */
  isFieldConfig(config: any): boolean {
    return (
      config != null &&
      typeof config === 'object' &&
      'value' in config &&
      'component' in config
    );
  }

  /**
   * Проверяет, является ли конфиг конфигурацией массива (ArrayConfig)
   *
   * ArrayConfig имеет обязательное свойство:
   * - schema: схема для элементов массива
   *
   * И НЕ имеет:
   * - value (отличие от FieldConfig)
   *
   * @param config Проверяемая конфигурация
   * @returns true если config является ArrayConfig
   *
   * @example
   * ```typescript
   * const factory = new NodeFactory();
   *
   * factory.isArrayConfig({ schema: {}, initialItems: [] }); // true
   * factory.isArrayConfig({ value: '', component: Input }); // false
   * factory.isArrayConfig({ email: { value: '' } }); // false
   * ```
   */
  isArrayConfig(config: any): boolean {
    return (
      config != null &&
      typeof config === 'object' &&
      'schema' in config &&
      !('value' in config)
    );
  }

  /**
   * Проверяет, является ли конфиг конфигурацией группы (GroupConfig)
   *
   * GroupConfig - это объект, который:
   * - НЕ является FieldConfig (нет value/component)
   * - НЕ является ArrayConfig (нет schema)
   * - Содержит вложенные конфиги полей/групп/массивов
   *
   * @param config Проверяемая конфигурация
   * @returns true если config является GroupConfig
   *
   * @example
   * ```typescript
   * const factory = new NodeFactory();
   *
   * factory.isGroupConfig({
   *   email: { value: '', component: Input },
   *   password: { value: '', component: Input }
   * }); // true
   *
   * factory.isGroupConfig({ value: '', component: Input }); // false
   * factory.isGroupConfig({ schema: {} }); // false
   * factory.isGroupConfig(null); // false
   * ```
   */
  isGroupConfig(config: any): boolean {
    return (
      config != null &&
      typeof config === 'object' &&
      !this.isFieldConfig(config) &&
      !this.isArrayConfig(config)
    );
  }
}
