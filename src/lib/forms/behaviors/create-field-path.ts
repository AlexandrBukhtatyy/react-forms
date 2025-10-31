/**
 * Создание типизированного FieldPath для Behavior Schema
 * Аналогично createFieldPath из validators
 */

import type { FieldPath, FieldPathNode } from './types';

/**
 * Создать типизированный путь к полям формы
 * Используется для декларативного описания behavior схем
 *
 * @example
 * ```typescript
 * const schema: BehaviorSchemaFn<MyForm> = (path) => {
 *   // path.email, path.address.city и т.д. - типизированы
 *   copyFrom(path.residenceAddress, path.registrationAddress, {
 *     when: (form) => form.sameAsRegistration
 *   });
 * };
 * ```
 */
export function createFieldPath<T>(): FieldPath<T> {
  return createFieldPathProxy('');
}

/**
 * Создать Proxy для вложенного доступа к полям
 * @private
 */
function createFieldPathProxy<T>(
  currentPath: string
): any {
  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === '__fieldPath') {
          return currentPath;
        }

        const newPath = currentPath ? `${currentPath}.${prop}` : prop;

        // Создаем объект FieldPathNode с вложенным Proxy
        const node: FieldPathNode<T, any> = {
          __fieldPath: newPath,
        };

        // Возвращаем Proxy, который поддерживает дальнейшую вложенность
        return new Proxy(node, {
          get(target, nestedProp: string) {
            if (nestedProp === '__fieldPath') {
              return newPath;
            }

            // Для вложенных свойств создаем новый Proxy
            const nestedPath = `${newPath}.${nestedProp}`;
            return createFieldPathProxy<T>(nestedPath);
          },
        });
      },
    }
  );
}
