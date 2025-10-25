/**
 * FieldPath proxy - типобезопасный доступ к путям полей формы
 */

import type { FieldPath, FieldPathNode } from '../types/validation-schema';

/**
 * Создать FieldPath proxy для формы
 *
 * @example
 * ```typescript
 * const path = createFieldPath<MyForm>();
 * console.log(path.email.__path); // 'email'
 * console.log(path.personalData.firstName.__path); // 'personalData.firstName'
 * ```
 */
export function createFieldPath<T>(): FieldPath<T> {
  return createFieldPathProxy<T>('');
}

/**
 * Внутренняя функция для создания прокси с отслеживанием пути
 * @private
 */
function createFieldPathProxy<T>(basePath: string): any {
  return new Proxy({} as any, {
    get(target, prop: string | symbol) {
      if (typeof prop === 'symbol') {
        return undefined;
      }

      // Специальные свойства для метаинформации
      if (prop === '__path') {
        return basePath || prop;
      }

      if (prop === '__key') {
        const parts = basePath.split('.');
        return parts[parts.length - 1] || prop;
      }

      // Игнорируем некоторые служебные свойства
      if (
        prop === 'then' ||
        prop === 'catch' ||
        prop === 'finally' ||
        prop === 'constructor' ||
        prop === 'toString' ||
        prop === 'valueOf' ||
        prop === 'toJSON'
      ) {
        return undefined;
      }

      // Создаем новый proxy для вложенного свойства
      const newPath = basePath ? `${basePath}.${prop}` : prop;

      // Возвращаем объект, который ведет себя и как значение, и как прокси
      const node: FieldPathNode<T, any> = {
        __key: prop as any,
        __path: newPath,
        __formType: undefined as any,
        __fieldType: undefined as any,
      };

      // Создаем прокси, который содержит и метаинформацию, и позволяет дальнейшую навигацию
      return new Proxy(node, {
        get(nodeTarget, nodeProp: string | symbol) {
          if (typeof nodeProp === 'symbol') {
            return undefined;
          }

          // Если запрашивают метаинформацию, возвращаем её
          if (nodeProp === '__path') return newPath;
          if (nodeProp === '__key') return prop;
          if (nodeProp === '__formType') return undefined;
          if (nodeProp === '__fieldType') return undefined;

          // Игнорируем служебные свойства
          if (
            nodeProp === 'then' ||
            nodeProp === 'catch' ||
            nodeProp === 'finally' ||
            nodeProp === 'constructor' ||
            nodeProp === 'toString' ||
            nodeProp === 'valueOf' ||
            nodeProp === 'toJSON'
          ) {
            return undefined;
          }

          // Иначе создаем еще более вложенный proxy
          return createFieldPathProxy(`${newPath}.${nodeProp}`);
        },
      });
    },
  });
}

/**
 * Извлечь путь из FieldPathNode
 */
export function extractPath(node: FieldPathNode<any, any> | any): string {
  if (node && typeof node === 'object' && '__path' in node) {
    return node.__path;
  }
  // Fallback для строк
  if (typeof node === 'string') {
    return node;
  }
  throw new Error('Invalid field path node');
}

/**
 * Преобразовать FieldPathNode в FieldPath для переиспользования схем
 *
 * Позволяет композировать validation schemas:
 *
 * @example
 * ```typescript
 * const personalDataValidation = (path: FieldPath<PersonalData>) => {
 *   required(path.firstName, { message: 'Имя обязательно' });
 *   required(path.lastName, { message: 'Фамилия обязательна' });
 * };
 *
 * const mainValidation = (path: FieldPath<MyForm>) => {
 *   // ✅ Переиспользуем схему
 *   personalDataValidation(toFieldPath(path.personalData));
 *   required(path.email);
 * };
 * ```
 */
export function toFieldPath<T>(node: FieldPathNode<any, T>): FieldPath<T> {
  const basePath = extractPath(node);
  return createFieldPathProxy<T>(basePath);
}

/**
 * Извлечь ключ поля из FieldPathNode
 */
export function extractKey(node: FieldPathNode<any, any> | any): string {
  if (node && typeof node === 'object' && '__key' in node) {
    return node.__key as string;
  }
  // Fallback для строк
  if (typeof node === 'string') {
    const parts = node.split('.');
    return parts[parts.length - 1];
  }
  throw new Error('Invalid field path node');
}
