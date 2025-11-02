/**
 * Реализация контекста валидации
 */

import type { GroupNode } from '../core/nodes/group-node';
import type { FieldNode } from '../core/nodes/field-node';
import type {
  ValidationContext,
  TreeValidationContext,
} from '../types/validation-schema';

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
    return this.control.value;
  }

  getField<K extends keyof TForm>(path: K): TForm[K];
  getField(path: string): any;
  getField(path: any): any {
    if (typeof path !== 'string') {
      // ✅ Используем proxy доступ вместо form.controls
      const field = (this.form as any)[path];
      return field?.value?.value;
    }

    const keys = path.split('.');
    let current: any = this.form;

    for (const key of keys) {
      if (current && current[key]) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    // Если это FormNode, вернуть значение
    return current?.value?.value ?? current;
  }

  setField(path: string, value: any): void;
  setField<K extends keyof TForm>(path: K, value: TForm[K]): void;
  setField(path: any, value: any): void {
    if (typeof path !== 'string') {
      const control = this.form[path];
      if (control) {
        control.setValue(value);
      }
      return;
    }

    const keys = path.split('.');
    let current: any = this.form;

    for (let i = 0; i < keys.length - 1; i++) {
      if (current && current[keys[i]]) {
        current = current[keys[i]];
      } else {
        return;
      }
    }

    const lastKey = keys[keys.length - 1];
    if (current && current[lastKey]) {
      current[lastKey].setValue(value);
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

  getField<K extends keyof TForm>(path: K): TForm[K];
  getField(path: string): any;
  getField(path: any): any {
    if (typeof path !== 'string') {
      // ✅ Используем proxy доступ вместо form.controls
      const field = (this.form as any)[path];
      return field?.value?.value;
    }

    const keys = path.split('.');
    let current: any = this.form;

    for (const key of keys) {
      if (current && current[key]) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    // Если это FormNode, вернуть значение
    return current?.value?.value ?? current;
  }

  formValue(): TForm {
    return this.form.getValue();
  }

  getForm(): GroupNode<TForm> {
    return this.form;
  }
}
