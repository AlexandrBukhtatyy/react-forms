import { signal, computed } from "@preact/signals-react";
import type { Signal, ReadonlySignal } from "@preact/signals-react";
import { FieldController } from "./field-controller";
import type { FormSchema } from "../types";

export class FormStore<T extends Record<string, any>> {
  private fields: Map<keyof T, FieldController<any>>;
  private _submitting: Signal<boolean>;
  public value: ReadonlySignal<T>;

  constructor(schema: FormSchema<T>) {
    this.fields = new Map();
    this._submitting = signal(false);

    // Создаем контроллеры для каждого поля
    for (const [key, config] of Object.entries(schema)) {
      this.fields.set(key as keyof T, new FieldController(config));
    }

    // Создаем computed signal для отслеживания изменений значений
    this.value = computed(() => {
      const result = {} as T;
      this.fields.forEach((field, key) => {
        result[key] = field.value;
      });
      return result;
    });
  }

  // ============================================================================
  // Доступ к полям через Proxy
  // ============================================================================

  private fieldProxy = new Proxy({} as Record<keyof T, FieldController>, {
    get: (_, prop: string | symbol) => {
      if (typeof prop === 'string') {
        return this.fields.get(prop as keyof T);
      }
      return undefined;
    }
  });

  get controls(): Record<keyof T, FieldController> {
    return this.fieldProxy;
  }

  // ============================================================================
  // Computed значения
  // ============================================================================

  get valid(): boolean {
    return Array.from(this.fields.values()).every(field => field.valid);
  }

  get invalid(): boolean {
    return !this.valid;
  }

  get pending(): boolean {
    return Array.from(this.fields.values()).some(field => field.pending);
  }

  get touched(): boolean {
    return Array.from(this.fields.values()).some(field => field.touched);
  }

  get dirty(): boolean {
    return Array.from(this.fields.values()).some(field => field.dirty);
  }

  get submitting(): boolean {
    return this._submitting.value;
  }

  // ============================================================================
  // Методы управления
  // ============================================================================

  async validate(): Promise<boolean> {
    const results = await Promise.all(
      Array.from(this.fields.values()).map(field => field.validate())
    );
    return results.every(result => result);
  }

  markAllAsTouched(): void {
    this.fields.forEach(field => field.markAsTouched());
  }

  reset(values?: Partial<T>): void {
    if (values) {
      for (const [key, value] of Object.entries(values)) {
        this.fields.get(key as keyof T)?.reset(value);
      }
    } else {
      this.fields.forEach(field => field.reset());
    }
  }

  disable(): void {
    this.fields.forEach(field => field.disable());
  }

  enable(): void {
    this.fields.forEach(field => field.enable());
  }

  // ============================================================================
  // Работа со значениями
  // ============================================================================

  getValue(): T {
    const result = {} as T;
    this.fields.forEach((field, key) => {
      result[key] = field.getValue();
    });
    return result;
  }

  setValue(values: Partial<T>, options?: { emitEvent?: boolean }): void {
    for (const [key, value] of Object.entries(values)) {
      this.fields.get(key as keyof T)?.setValue(value, options);
    }
  }

  patchValue(values: Partial<T>): void {
    this.setValue(values, { emitEvent: false });
  }

  // ============================================================================
  // Submit
  // ============================================================================

  async submit<R = any>(
    onSubmit: (values: T) => Promise<R> | R
  ): Promise<R | null> {
    this.markAllAsTouched();

    const isValid = await this.validate();
    if (!isValid) {
      return null;
    }

    this._submitting.value = true;
    try {
      const result = await onSubmit(this.getValue());
      return result;
    } finally {
      this._submitting.value = false;
    }
  }
}
