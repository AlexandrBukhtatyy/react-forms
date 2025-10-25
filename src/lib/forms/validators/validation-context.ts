/**
 * Реализация контекста валидации
 */

import type { FormStore } from '../core/form-store';
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
    private form: FormStore<TForm>,
    private fieldKey: keyof TForm,
    private control: FieldNode<TField>
  ) {}

  value(): TField {
    return this.control.value;
  }

  getField<K extends keyof TForm>(path: K): TForm[K];
  getField(path: string): any;
  getField(path: any): any {
    // Простая поддержка путей вида 'field' или 'nested.field'
    if (typeof path === 'string') {
      const keys = path.split('.');
      if (keys.length === 1) {
        return this.form.controls[path as keyof TForm]?.value;
      }
      // TODO: Поддержка вложенных путей
      return this.form.controls[keys[0] as keyof TForm]?.value;
    }
    return this.form.controls[path]?.value;
  }

  formValue(): TForm {
    return this.form.getValue();
  }

  getControl(): FieldNode<TField> {
    return this.control;
  }

  getForm(): FormStore<TForm> {
    return this.form;
  }
}

/**
 * Реализация TreeValidationContext для cross-field валидации
 */
export class TreeValidationContextImpl<TForm = any>
  implements TreeValidationContext<TForm>
{
  constructor(private form: FormStore<TForm>) {}

  getField<K extends keyof TForm>(path: K): TForm[K];
  getField(path: string): any;
  getField(path: any): any {
    if (typeof path === 'string') {
      const keys = path.split('.');
      if (keys.length === 1) {
        return this.form.controls[path as keyof TForm]?.value;
      }
      // TODO: Поддержка вложенных путей
      return this.form.controls[keys[0] as keyof TForm]?.value;
    }
    return this.form.controls[path]?.value;
  }

  formValue(): TForm {
    return this.form.getValue();
  }

  getForm(): FormStore<TForm> {
    return this.form;
  }
}
