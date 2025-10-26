/**
 * Типы для Proxy-доступа к полям GroupNode
 *
 * Решает проблему типизации, когда GroupNode<T> использует Proxy для прямого доступа к полям.
 * TypeScript не может автоматически определить правильные типы для вложенных форм и массивов.
 *
 * @example
 * ```typescript
 * interface MyForm {
 *   name: string;
 *   address: {
 *     city: string;
 *   };
 *   items: Array<{ title: string }>;
 * }
 *
 * const form: GroupNodeWithControls<MyForm> = new GroupNode(schema);
 *
 * // ✅ TypeScript знает, что это FieldNode<string>
 * form.name.setValue('John');
 *
 * // ✅ TypeScript знает, что это GroupNode<{city: string}>
 * form.address.city.setValue('Moscow');
 *
 * // ✅ TypeScript знает, что это ArrayNode<{title: string}>
 * form.items.push({ title: 'New Item' });
 * ```
 */

import type { FieldNode } from '../core/nodes/field-node';
import type { GroupNode } from '../core/nodes/group-node';
import type { ArrayNode } from '../core/nodes/array-node';

/**
 * Мапит тип модели данных T на правильные типы узлов формы
 *
 * Рекурсивно определяет типы узлов на основе структуры данных:
 * - `T[K] extends Array<infer U>` где U - объект → `ArrayNode<U>`
 * - `T[K] extends Array<infer U>` где U - примитив → `FieldNode<T[K]>` (массив как обычное поле)
 * - `T[K] extends object` → `GroupNode<T[K]>` (вложенная форма)
 * - `T[K]` примитив → `FieldNode<T[K]>` (простое поле)
 *
 * @template T - Тип модели данных формы
 */
export type FormNodeControls<T> = {
  [K in keyof T]: T[K] extends Array<infer U>
    ? U extends Record<string, any>
      ? ArrayNode<U>          // Массив объектов → ArrayNode
      : FieldNode<T[K]>       // Массив примитивов → FieldNode
    : T[K] extends Record<string, any>
    ? T[K] extends Date | File | Blob
      ? FieldNode<T[K]>       // Специальные объекты → FieldNode
      : GroupNode<T[K]>       // Обычный объект → GroupNode (вложенная форма)
    : FieldNode<T[K]>;        // Примитивные типы → FieldNode
};

/**
 * Комбинированный тип для GroupNode с Proxy доступом к полям
 *
 * Объединяет методы и свойства GroupNode с типизированными полями формы.
 * Это позволяет использовать как API GroupNode, так и прямой доступ к полям.
 *
 * @template T - Тип модели данных формы
 *
 * @example
 * ```typescript
 * interface UserForm {
 *   email: string;
 *   profile: {
 *     name: string;
 *     age: number;
 *   };
 * }
 *
 * const form: GroupNodeWithControls<UserForm> = new GroupNode(schema);
 *
 * // Доступ к методам GroupNode
 * await form.validate();
 * const values = form.getValue();
 * console.log(form.valid.value);
 *
 * // Прямой доступ к полям (через Proxy)
 * form.email.setValue('test@mail.com');
 * form.profile.name.setValue('John');
 * ```
 */
export type GroupNodeWithControls<T extends Record<string, any>> =
  GroupNode<T> & FormNodeControls<T>;

/**
 * Комбинированный тип для ArrayNode с Proxy доступом к элементам
 *
 * Объединяет методы и свойства ArrayNode с типизированным доступом к элементам массива.
 *
 * @template T - Тип модели данных элемента массива
 *
 * @example
 * ```typescript
 * interface TodoItem {
 *   title: string;
 *   completed: boolean;
 * }
 *
 * const todos: ArrayNodeWithControls<TodoItem> = new ArrayNode(schema);
 *
 * // Доступ к методам ArrayNode
 * todos.push({ title: 'New todo', completed: false });
 * todos.removeAt(0);
 *
 * // Доступ к элементам (через Proxy)
 * todos.at(0)?.title.setValue('Updated title');
 *
 * // Итерация
 * todos.forEach((item, i) => {
 *   console.log(item.title.value.value);
 * });
 * ```
 */
export type ArrayNodeWithControls<T extends Record<string, any>> =
  ArrayNode<T> & {
    /**
     * Безопасный доступ к элементу массива по индексу
     * Возвращает GroupNode с типизированными полями или undefined
     */
    at(index: number): GroupNodeWithControls<T> | undefined;

    /**
     * Итерация по элементам массива с типизированными элементами
     */
    forEach(callback: (item: GroupNodeWithControls<T>, index: number) => void): void;

    /**
     * Маппинг элементов массива с типизированными элементами
     */
    map<R>(callback: (item: GroupNodeWithControls<T>, index: number) => R): R[];
  };