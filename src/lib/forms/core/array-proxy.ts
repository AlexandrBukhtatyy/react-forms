/**
 * ArrayProxy - Proxy для массива форм
 *
 * Предоставляет элегантный API для работы с динамическими массивами форм:
 * - Доступ по индексу: items[0].title.value
 * - CRUD операции: push(), remove(), insert(), clear()
 * - Автоматическая переиндексация при удалении
 * - Валидация всех элементов
 */

import { signal, computed } from '@preact/signals-react';
import type { Signal, ReadonlySignal } from '@preact/signals-react';
import type { FormStore } from './form-store';
import type { DeepFormSchema, ArrayConfig, ValidationError } from '../types';
import { GroupProxy } from './group-proxy';
import { FieldController } from './field-controller';

/**
 * Proxy для массива форм
 * Предоставляет элегантный API: items[0].field
 */
export class ArrayProxy<T extends Record<string, any>> {
  private _items: Signal<GroupProxy<T>[]>;
  private _errors: Signal<ValidationError[]>;
  private itemsProxy: any;

  constructor(
    private store: FormStore<any>,
    private path: string[],
    private config: ArrayConfig<T>
  ) {
    this._items = signal([]);
    this._errors = signal([]);

    // Инициализируем начальные элементы
    if (config.initial && config.initial.length > 0) {
      config.initial.forEach(item => this.push(item));
    }

    // Создаем Proxy для доступа
    this.itemsProxy = this.createItemsProxy();
  }

  /**
   * Создать Proxy для доступа по индексу и методам
   */
  private createItemsProxy(): any {
    return new Proxy([] as any, {
      get: (target, prop: string | symbol) => {
        // Числовой индекс
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          const index = parseInt(prop, 10);
          return this._items.value[index]?.proxy;
        }

        // Array методы и свойства
        switch (prop) {
          case 'length':
            return this.length;
          case 'items':
            return this._items;
          case 'push':
            return this.push.bind(this);
          case 'remove':
            return this.remove.bind(this);
          case 'insert':
            return this.insert.bind(this);
          case 'clear':
            return this.clear.bind(this);
          case 'at':
            return this.at.bind(this);
          case 'forEach':
            return this.forEach.bind(this);
          case 'map':
            return this.map.bind(this);
          case 'valid':
            return this.valid;
          case 'invalid':
            return this.invalid;
          case 'errors':
            return this._errors.value;
          case 'validate':
            return this.validate.bind(this);
          case 'getValue':
            return this.getValue.bind(this);
          case 'setValue':
            return this.setValue.bind(this);
          case 'markAsTouched':
            return this.markAsTouched.bind(this);
          case 'reset':
            return this.reset.bind(this);
          default:
            return undefined;
        }
      },

      has: (target, prop) => {
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          const index = parseInt(prop, 10);
          return index >= 0 && index < this._items.value.length;
        }
        return prop in this;
      },
    });
  }

  /**
   * Получить Proxy
   */
  get proxy(): any {
    return this.itemsProxy;
  }

  // ============================================================================
  // Свойства
  // ============================================================================

  get length(): ReadonlySignal<number> {
    return computed(() => this._items.value.length);
  }

  get valid(): boolean {
    return this._items.value.every(item => item.valid);
  }

  get invalid(): boolean {
    return !this.valid;
  }

  // ============================================================================
  // CRUD операции
  // ============================================================================

  /**
   * Добавить элемент в конец массива
   */
  push(initialValue?: Partial<T>): void {
    const index = this._items.value.length;
    const itemProxy = this.createItem(index, initialValue);
    this._items.value = [...this._items.value, itemProxy];
  }

  /**
   * Удалить элемент по индексу
   * Автоматически переиндексирует оставшиеся элементы
   */
  remove(index: number): void {
    if (index < 0 || index >= this._items.value.length) {
      console.warn(`ArrayProxy: index ${index} out of bounds`);
      return;
    }

    // Удаляем поля из FormStore
    this.removeItemFields(index);

    // Обновляем массив
    const newItems = [...this._items.value];
    newItems.splice(index, 1);

    // Переиндексируем оставшиеся элементы (переименовываем поля в FormStore)
    this.reindexItems(newItems, index);

    // ВАЖНО: Пересоздаем GroupProxy объекты с правильными путями
    // т.к. после переиндексации старые GroupProxy указывают на неправильные пути
    for (let i = index; i < newItems.length; i++) {
      const itemPath = [...this.path, String(i)];
      newItems[i] = new GroupProxy<T>(this.store, itemPath);
    }

    this._items.value = newItems;
  }

  /**
   * Вставить элемент в массив
   * Автоматически сдвигает индексы последующих элементов
   */
  insert(index: number, initialValue?: Partial<T>): void {
    if (index < 0 || index > this._items.value.length) {
      console.warn(`ArrayProxy: index ${index} out of bounds`);
      return;
    }

    // Сдвигаем индексы в FormStore
    this.shiftIndices(index, 1);

    // Создаем элемент
    const itemProxy = this.createItem(index, initialValue);
    const newItems = [...this._items.value];
    newItems.splice(index, 0, itemProxy);

    // ВАЖНО: Пересоздаем GroupProxy объекты после вставки
    // т.к. после сдвига индексов старые GroupProxy указывают на неправильные пути
    for (let i = index + 1; i < newItems.length; i++) {
      const itemPath = [...this.path, String(i)];
      newItems[i] = new GroupProxy<T>(this.store, itemPath);
    }

    this._items.value = newItems;
  }

  /**
   * Удалить все элементы массива
   */
  clear(): void {
    for (let i = this._items.value.length - 1; i >= 0; i--) {
      this.removeItemFields(i);
    }
    this._items.value = [];
  }

  /**
   * Получить элемент по индексу (безопасный доступ)
   */
  at(index: number): GroupProxy<T> | undefined {
    return this._items.value[index];
  }

  // ============================================================================
  // Итерация
  // ============================================================================

  /**
   * Итерировать по элементам массива
   */
  forEach(callback: (item: any, index: number) => void): void {
    this._items.value.forEach((item, index) => {
      callback(item.proxy, index);
    });
  }

  /**
   * Маппинг элементов массива
   */
  map<R>(callback: (item: any, index: number) => R): R[] {
    return this._items.value.map((item, index) => {
      return callback(item.proxy, index);
    });
  }

  // ============================================================================
  // Валидация и значения
  // ============================================================================

  /**
   * Валидировать все элементы массива
   */
  async validate(): Promise<boolean> {
    const results = await Promise.all(
      this._items.value.map(item => item.validate())
    );

    const arrayValid = results.every(r => r);

    if (!arrayValid) {
      this._errors.value = [{
        code: 'invalidItems',
        message: 'Некоторые элементы массива содержат ошибки',
      }];
    } else {
      this._errors.value = [];
    }

    return arrayValid;
  }

  /**
   * Получить значения всех элементов массива
   */
  getValue(): T[] {
    return this._items.value.map(item => item.getValue());
  }

  /**
   * Установить значения элементов массива
   * Удаляет существующие элементы и создает новые
   */
  setValue(values: Partial<T>[]): void {
    this.clear();
    values.forEach(value => this.push(value));
  }

  /**
   * Пометить все элементы как touched
   */
  markAsTouched(): void {
    this._items.value.forEach(item => item.markAsTouched());
  }

  /**
   * Сбросить все элементы к начальным значениям
   */
  reset(): void {
    this._items.value.forEach(item => item.reset());
  }

  // ============================================================================
  // Private методы
  // ============================================================================

  /**
   * Создать элемент массива
   */
  private createItem(index: number, initialValue?: Partial<T>): GroupProxy<T> {
    const itemPath = [...this.path, String(index)];
    this.createItemFields(index, initialValue);
    return new GroupProxy<T>(this.store, itemPath);
  }

  /**
   * Создать поля для элемента
   */
  private createItemFields(index: number, initialValue?: Partial<T>): void {
    const flattenField = (
      schema: any,
      path: string[],
      values?: any
    ): void => {
      for (const [key, config] of Object.entries(schema)) {
        const currentPath = [...path, key];
        const flatKey = currentPath.join('.');

        if (Array.isArray(config) && config.length === 1) {
          // Вложенный массив
          const arrayConfig = { itemSchema: config[0], initial: values?.[key] || [] };
          (this.store as any)['arrayConfigs'].set(flatKey, arrayConfig);
        } else if (this.isFieldConfig(config)) {
          // Поле
          const value = values?.[key] ?? (config as any).value;
          (this.store as any)['fields'].set(
            flatKey,
            new FieldController({ ...config, value })
          );
        } else {
          // Вложенная группа
          flattenField(config, currentPath, values?.[key]);
        }
      }
    };

    const itemPath = [...this.path, String(index)];
    flattenField(this.config.itemSchema, itemPath, initialValue);
  }

  /**
   * Удалить поля элемента
   */
  private removeItemFields(index: number): void {
    const prefix = [...this.path, String(index)].join('.');
    const keysToRemove: string[] = [];

    (this.store as any)['fields'].forEach((_, key: string) => {
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => (this.store as any)['fields'].delete(key));

    // Также удаляем ArrayProxy если есть
    if ((this.store as any)['arrayProxies']) {
      (this.store as any)['arrayProxies'].forEach((_, key: string) => {
        if (key.startsWith(prefix)) {
          (this.store as any)['arrayProxies'].delete(key);
        }
      });
    }
  }

  /**
   * Переиндексировать элементы после удаления
   */
  private reindexItems(items: GroupProxy<T>[], fromIndex: number): void {
    for (let i = fromIndex; i < items.length; i++) {
      this.renameItemFields(i + 1, i);
    }
  }

  /**
   * Сдвинуть индексы при вставке
   */
  private shiftIndices(fromIndex: number, offset: number): void {
    for (let i = this._items.value.length - 1; i >= fromIndex; i--) {
      this.renameItemFields(i, i + offset);
    }
  }

  /**
   * Переименовать поля элемента
   */
  private renameItemFields(oldIndex: number, newIndex: number): void {
    const oldPrefix = [...this.path, String(oldIndex)].join('.');
    const newPrefix = [...this.path, String(newIndex)].join('.');

    const fieldsToRename: Array<[string, FieldController<any>]> = [];

    (this.store as any)['fields'].forEach((field: any, key: string) => {
      if (key.startsWith(oldPrefix)) {
        const newKey = key.replace(oldPrefix, newPrefix);
        fieldsToRename.push([newKey, field]);
        (this.store as any)['fields'].delete(key);
      }
    });

    fieldsToRename.forEach(([key, field]) => {
      (this.store as any)['fields'].set(key, field);
    });
  }

  /**
   * Проверить, является ли конфиг конфигурацией поля
   */
  private isFieldConfig(config: any): boolean {
    return config && 'value' in config && 'component' in config;
  }
}
