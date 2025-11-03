/**
 * Реализация контекста валидации
 */

import type { GroupNode } from '../core/nodes/group-node';
import type { FieldNode } from '../core/nodes/field-node';
import type { FormNode } from '../core/nodes/form-node';
import type {
  ValidationContext,
  TreeValidationContext,
} from '../types/validation-schema';

/**
 * Type guard для проверки, является ли объект FormNode
 */
function isFormNode(value: any): value is FormNode<any> {
  return (
    value &&
    typeof value === 'object' &&
    'value' in value &&
    'valid' in value &&
    'setValue' in value &&
    'getValue' in value
  );
}

/**
 * Реализация ValidationContext для валидации отдельного поля
 */
export class ValidationContextImpl<TForm = any, TField = any>
  implements ValidationContext<TForm, TField>
{
  constructor(
    private form: GroupNode<TForm>,
    private fieldKey: keyof TForm,
    private control: FieldNode<TField>
  ) {}

  value(): TField {
    return this.control.value.value;
  }

  /**
   * Получить значение поля по ключу или пути
   * @param path - ключ поля (type-safe) или строковый путь для вложенных полей
   * @returns значение поля
   * @example
   * ```typescript
   * ctx.getField('email')         // Type-safe доступ
   * ctx.getField('address.city')  // Вложенный путь
   * ```
   */
  getField<K extends keyof TForm>(path: K): TForm[K];
  getField(path: string): any;
  getField(path: any): any {
    if (typeof path !== 'string') {
      // Type-safe доступ через ключ
      const field = (this.form as any)[path];

      if (!field) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[ValidationContext] Path '${String(path)}' not found in form`);
        }
        return undefined;
      }

      // Используем type guard вместо duck typing
      return isFormNode(field) ? field.value.value : field;
    }

    // String path для вложенных полей
    return this.resolveNestedPath(path);
  }

  /**
   * Resolve вложенного пути (например, 'address.city')
   * @private
   */
  private resolveNestedPath(path: string): any {
    const keys = path.split('.');
    let current: any = this.form;

    for (const key of keys) {
      if (current && current[key]) {
        current = current[key];
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[ValidationContext] Path '${path}' not found in form`);
        }
        return undefined;
      }
    }

    // Используем type guard
    return isFormNode(current) ? current.value.value : current;
  }

  /**
   * Установить значение поля по ключу или пути
   * @param path - ключ поля (type-safe) или строковый путь для вложенных полей
   * @param value - новое значение
   * @example
   * ```typescript
   * ctx.setField('email', 'test@example.com')  // Type-safe доступ
   * ctx.setField('address.city', 'Moscow')     // Вложенный путь
   * ```
   */
  setField(path: string, value: any): void;
  setField<K extends keyof TForm>(path: K, value: TForm[K]): void;
  setField(path: any, value: any): void {
    if (typeof path !== 'string') {
      // Type-safe доступ через ключ
      const field = this.form[path];

      if (!field) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[ValidationContext] Path '${String(path)}' not found in form`);
        }
        return;
      }

      // Используем type guard для проверки наличия setValue
      if (isFormNode(field)) {
        field.setValue(value);
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[ValidationContext] Path '${String(path)}' is not a FormNode`);
        }
      }
      return;
    }

    // String path для вложенных полей
    this.setNestedPath(path, value);
  }

  /**
   * Установить значение по вложенному пути (например, 'address.city')
   * @private
   */
  private setNestedPath(path: string, value: any): void {
    const keys = path.split('.');
    let current: any = this.form;

    // Проходим до предпоследнего ключа
    for (let i = 0; i < keys.length - 1; i++) {
      if (current && current[keys[i]]) {
        current = current[keys[i]];
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[ValidationContext] Path '${path}' not found in form`);
        }
        return;
      }
    }

    // Устанавливаем значение последнего ключа
    const lastKey = keys[keys.length - 1];
    const targetField = current?.[lastKey];

    if (!targetField) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[ValidationContext] Path '${path}' not found in form`);
      }
      return;
    }

    // Используем type guard
    if (isFormNode(targetField)) {
      targetField.setValue(value);
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[ValidationContext] Path '${path}' is not a FormNode`);
      }
    }
  }

  formValue(): TForm {
    return this.form.getValue();
  }

  getControl(): FieldNode<TField> {
    return this.control;
  }

  getForm(): GroupNode<TForm> {
    return this.form;
  }
}

/**
 * Реализация TreeValidationContext для cross-field валидации
 */
export class TreeValidationContextImpl<TForm = any>
  implements TreeValidationContext<TForm>
{
  constructor(private form: GroupNode<TForm>) {}

  /**
   * Получить значение поля по ключу или пути
   * @param path - ключ поля (type-safe) или строковый путь для вложенных полей
   * @returns значение поля
   * @example
   * ```typescript
   * ctx.getField('email')         // Type-safe доступ
   * ctx.getField('address.city')  // Вложенный путь
   * ```
   */
  getField<K extends keyof TForm>(path: K): TForm[K];
  getField(path: string): any;
  getField(path: any): any {
    if (typeof path !== 'string') {
      // Type-safe доступ через ключ
      const field = (this.form as any)[path];

      if (!field) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[TreeValidationContext] Path '${String(path)}' not found in form`);
        }
        return undefined;
      }

      // Используем type guard вместо duck typing
      return isFormNode(field) ? field.value.value : field;
    }

    // String path для вложенных полей
    return this.resolveNestedPath(path);
  }

  /**
   * Resolve вложенного пути (например, 'address.city')
   * @private
   */
  private resolveNestedPath(path: string): any {
    const keys = path.split('.');
    let current: any = this.form;

    for (const key of keys) {
      if (current && current[key]) {
        current = current[key];
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[TreeValidationContext] Path '${path}' not found in form`);
        }
        return undefined;
      }
    }

    // Используем type guard
    return isFormNode(current) ? current.value.value : current;
  }

  formValue(): TForm {
    return this.form.getValue();
  }

  getForm(): GroupNode<TForm> {
    return this.form;
  }
}
