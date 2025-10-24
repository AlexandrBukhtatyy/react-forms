/**
 * GroupProxy - Proxy для группы полей (вложенной формы)
 *
 * Предоставляет доступ к вложенным полям через точку:
 * form.controls.address.city.value
 *
 * Работает с flat хранилищем FormStore, где поля хранятся с ключами вида:
 * - "address.city"
 * - "address.street"
 * - "personalData.firstName"
 */

import type { FormStore } from './form-store';
import type { ValidationError } from '../types';

// Счетчик для генерации уникальных ID
let groupProxyIdCounter = 0;

/**
 * Proxy для группы полей (вложенной формы)
 * Предоставляет доступ к вложенным полям через точку
 */
export class GroupProxy<T extends Record<string, any>> {
  private controlsProxy: any;
  // Уникальный идентификатор для использования в React key
  public readonly _id: string;

  constructor(
    private store: FormStore<any>,
    private path: string[]
  ) {
    this._id = `group-${++groupProxyIdCounter}`;
    this.controlsProxy = this.createControlsProxy();
  }

  /**
   * Создать Proxy для доступа к вложенным полям
   */
  private createControlsProxy(): any {
    return new Proxy({} as any, {
      get: (_, prop: string | symbol) => {
        if (typeof prop !== 'string') return undefined;

        // Возвращаем уникальный ID для использования в React key
        if (prop === '_id') {
          return this._id;
        }

        // Экспонируем методы GroupProxy
        if (prop === 'getValue') {
          return this.getValue.bind(this);
        }
        if (prop === 'setValue') {
          return this.setValue.bind(this);
        }
        if (prop === 'reset') {
          return this.reset.bind(this);
        }
        if (prop === 'validate') {
          return this.validate.bind(this);
        }
        if (prop === 'markAsTouched') {
          return this.markAsTouched.bind(this);
        }

        // Экспонируем геттеры GroupProxy
        if (prop === 'valid') {
          return this.valid;
        }
        if (prop === 'invalid') {
          return this.invalid;
        }
        if (prop === 'errors') {
          return this.errors;
        }
        if (prop === 'touched') {
          return this.touched;
        }
        if (prop === 'dirty') {
          return this.dirty;
        }

        const currentPath = [...this.path, prop];
        const flatKey = currentPath.join('.');

        // Проверяем, это поле?
        const field = (this.store as any)['fields'].get(flatKey);
        if (field) {
          return field;
        }

        // Проверяем, это массив?
        const arrayConfig = (this.store as any)['arrayConfigs']?.get(flatKey);
        if (arrayConfig) {
          // Создаем или получаем ArrayProxy
          if (!(this.store as any)['arrayProxies']?.has(flatKey)) {
            // Динамический импорт для избежания циклической зависимости
            const { ArrayProxy } = require('./array-proxy');
            const arrayProxy = new ArrayProxy(
              this.store,
              currentPath,
              arrayConfig
            );
            (this.store as any)['arrayProxies'].set(flatKey, arrayProxy);
          }
          return (this.store as any)['arrayProxies'].get(flatKey).proxy;
        }

        // Проверяем, есть ли вложенные поля?
        const hasNestedFields = Array.from((this.store as any)['fields'].keys())
          .some((key: string) => key.startsWith(flatKey + '.'));

        const hasNestedArrays = (this.store as any)['arrayConfigs'] &&
          Array.from((this.store as any)['arrayConfigs'].keys())
            .some((key: string) => key.startsWith(flatKey + '.'));

        if (hasNestedFields || hasNestedArrays) {
          // Возвращаем новый GroupProxy
          return new GroupProxy(this.store, currentPath).proxy;
        }

        return undefined;
      }
    });
  }

  /**
   * Получить Proxy для доступа
   */
  get proxy(): any {
    return this.controlsProxy;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Проверить, что все поля группы валидны
   */
  get valid(): boolean {
    const prefix = this.path.join('.');
    const fields = Array.from((this.store as any)['fields'].entries())
      .filter((entry: any) => this.isInGroup(entry[0], prefix));

    return fields.every((entry: any) => entry[1].valid.value);
  }

  /**
   * Проверить, что хотя бы одно поле группы невалидно
   */
  get invalid(): boolean {
    return !this.valid;
  }

  /**
   * Получить все ошибки валидации в группе
   */
  get errors(): ValidationError[] {
    const prefix = this.path.join('.');
    const errors: ValidationError[] = [];

    (this.store as any)['fields'].forEach((field: any, key: string) => {
      if (this.isInGroup(key, prefix)) {
        errors.push(...field.errors);
      }
    });

    return errors;
  }

  /**
   * Валидировать все поля группы
   */
  async validate(): Promise<boolean> {
    const prefix = this.path.join('.');
    const fields = Array.from((this.store as any)['fields'].entries())
      .filter((entry: any) => this.isInGroup(entry[0], prefix))
      .map((entry: any) => entry[1]);

    const results = await Promise.all(fields.map((f: any) => f.validate()));
    return results.every((r: boolean) => r);
  }

  // ============================================================================
  // State
  // ============================================================================

  /**
   * Проверить, что хотя бы одно поле группы было touched
   */
  get touched(): boolean {
    const prefix = this.path.join('.');
    return Array.from((this.store as any)['fields'].entries())
      .filter((entry: any) => this.isInGroup(entry[0], prefix))
      .some((entry: any) => entry[1].touched);
  }

  /**
   * Проверить, что хотя бы одно поле группы было изменено
   */
  get dirty(): boolean {
    const prefix = this.path.join('.');
    return Array.from((this.store as any)['fields'].entries())
      .filter((entry: any) => this.isInGroup(entry[0], prefix))
      .some((entry: any) => entry[1].dirty);
  }

  /**
   * Пометить все поля группы как touched
   */
  markAsTouched(): void {
    const prefix = this.path.join('.');
    (this.store as any)['fields'].forEach((field: any, key: string) => {
      if (this.isInGroup(key, prefix)) {
        field.markAsTouched();
      }
    });
  }

  // ============================================================================
  // Values
  // ============================================================================

  /**
   * Получить значения всех полей группы
   */
  getValue(): T {
    const prefix = this.path.join('.');
    const result: any = {};

    // Получаем значения обычных полей
    (this.store as any)['fields'].forEach((field: any, key: string) => {
      if (this.isInGroup(key, prefix)) {
        const relativePath = key.substring(prefix.length + 1);
        this.setNestedValue(result, relativePath, field.getValue());
      }
    });

    // Также получаем значения массивов
    if ((this.store as any)['arrayProxies']) {
      (this.store as any)['arrayProxies'].forEach((arrayProxy: any, key: string) => {
        if (this.isInGroup(key, prefix)) {
          const relativePath = key.substring(prefix.length + 1);
          this.setNestedValue(result, relativePath, arrayProxy.getValue());
        }
      });
    }

    return result;
  }

  /**
   * Установить значения полей группы
   */
  setValue(values: Partial<T>): void {
    const prefix = this.path.join('.');

    // Рекурсивно устанавливаем значения
    const setValues = (obj: any, currentPath: string) => {
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = currentPath ? `${currentPath}.${key}` : key;
        const field = (this.store as any)['fields'].get(fieldPath);

        if (field) {
          field.setValue(value);
        } else if (Array.isArray(value)) {
          // Это массив - используем ArrayProxy
          const arrayProxy = (this.store as any)['arrayProxies']?.get(fieldPath);
          if (arrayProxy) {
            arrayProxy.setValue(value);
          }
        } else if (typeof value === 'object' && value !== null) {
          // Рекурсивно для вложенных объектов
          setValues(value, fieldPath);
        }
      }
    };

    setValues(values, prefix);
  }

  /**
   * Сбросить все поля группы к начальным значениям
   */
  reset(): void {
    const prefix = this.path.join('.');
    (this.store as any)['fields'].forEach((field: any, key: string) => {
      if (this.isInGroup(key, prefix)) {
        field.reset();
      }
    });

    // Также сбрасываем массивы
    if ((this.store as any)['arrayProxies']) {
      (this.store as any)['arrayProxies'].forEach((arrayProxy: any, key: string) => {
        if (this.isInGroup(key, prefix)) {
          arrayProxy.reset();
        }
      });
    }
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  /**
   * Проверить, принадлежит ли поле данной группе
   * @param key - Ключ поля
   * @param prefix - Префикс группы
   */
  private isInGroup(key: string, prefix: string): boolean {
    if (!prefix) {
      // Корневая группа - все поля
      return true;
    }

    // Поле должно начинаться с префикса группы
    return key.startsWith(prefix + '.');
  }

  /**
   * Установить значение по вложенному пути
   * Создает промежуточные объекты если нужно
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }
}
