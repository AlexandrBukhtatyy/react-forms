# План рефакторинга библиотеки форм

## Обзор

**Стратегия**: Постепенный рефакторинг в 4 фазы с минимизацией breaking changes. Каждая фаза — законченный этап, который можно коммитить и при необходимости откатить.

**Основные цели**:
1. Устранить Singleton анти-паттерн → композиция (каждая форма владеет реестрами)
2. Разбить God Class (GroupNode) → SRP (< 200 строк на класс)
3. Централизовать дублирующийся код → DRY
4. Применить Strategy/Template Method паттерны
5. Документировать весь код (JSDoc на русском)

**Порядок**: От простого к сложному. Сначала инфраструктурные классы (низкий риск), затем декомпозиция существующих (средний риск).

---

## Фаза 1: Подготовка — Централизация и инфраструктура

**Цель**: Создать вспомогательные классы для последующего рефакторинга. Устранить дублирование кода. Перенести общую логику в базовый класс FormNode.

### Задачи

#### 1.1. Создать FieldPathNavigator (централизация парсинга путей)

**Файлы**:
- Создать: `src/lib/forms/core/utils/field-path-navigator.ts`
- Создать: `src/lib/forms/core/utils/index.ts`

**Код**:
```typescript
/**
 * Сегмент пути к полю формы
 *
 * @example "items[0].name" → [{ key: 'items', index: 0 }, { key: 'name' }]
 */
interface PathSegment {
  key: string;
  index?: number;
}

/**
 * Навигация по путям к полям формы
 *
 * Централизует логику парсинга путей вида "address.city" или "items[0].name".
 * Используется в ValidationContext, BehaviorContext, GroupNode.
 *
 * @example
 * ```typescript
 * const navigator = new FieldPathNavigator();
 * const segments = navigator.parsePath('items[0].title'); // [{ key: 'items', index: 0 }, { key: 'title' }]
 * const value = navigator.getValueByPath(obj, 'items[0].title');
 * ```
 */
export class FieldPathNavigator {
  /**
   * Парсит путь в массив сегментов
   *
   * Поддерживает:
   * - Простые пути: "name", "email"
   * - Вложенные пути: "address.city", "user.profile.avatar"
   * - Массивы: "items[0]", "items[0].name"
   *
   * @param path Путь к полю
   * @returns Массив сегментов пути
   */
  parsePath(path: string): PathSegment[] {
    const segments: PathSegment[] = [];
    const parts = path.split('.');

    for (const part of parts) {
      // Проверка на массив: items[0]
      const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        segments.push({
          key: arrayMatch[1],
          index: parseInt(arrayMatch[2], 10),
        });
      } else {
        segments.push({ key: part });
      }
    }

    return segments;
  }

  /**
   * Получает значение по пути из объекта
   *
   * @param obj Объект
   * @param path Путь к значению
   * @returns Значение или undefined
   *
   * @example
   * ```typescript
   * const obj = { address: { city: 'Moscow' } };
   * navigator.getValueByPath(obj, 'address.city'); // 'Moscow'
   * ```
   */
  getValueByPath(obj: any, path: string): any {
    const segments = this.parsePath(path);
    let current = obj;

    for (const segment of segments) {
      if (current == null) return undefined;

      current = current[segment.key];

      if (segment.index !== undefined) {
        if (!Array.isArray(current)) return undefined;
        current = current[segment.index];
      }
    }

    return current;
  }

  /**
   * Устанавливает значение по пути в объекте (мутирует объект)
   *
   * @param obj Объект
   * @param path Путь к значению
   * @param value Новое значение
   *
   * @example
   * ```typescript
   * const obj = { address: { city: '' } };
   * navigator.setValueByPath(obj, 'address.city', 'Moscow');
   * // obj.address.city === 'Moscow'
   * ```
   */
  setValueByPath(obj: any, path: string, value: any): void {
    const segments = this.parsePath(path);
    let current = obj;

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      let next = current[segment.key];

      if (segment.index !== undefined) {
        if (!Array.isArray(next)) {
          throw new Error(`Expected array at path segment: ${segment.key}`);
        }
        current = next[segment.index];
      } else {
        if (next == null) {
          // Создаем объект, если его нет
          current[segment.key] = {};
          next = current[segment.key];
        }
        current = next;
      }
    }

    const lastSegment = segments[segments.length - 1];
    if (lastSegment.index !== undefined) {
      const arr = current[lastSegment.key];
      if (!Array.isArray(arr)) {
        throw new Error(`Expected array at path segment: ${lastSegment.key}`);
      }
      arr[lastSegment.index] = value;
    } else {
      current[lastSegment.key] = value;
    }
  }

  /**
   * Получает узел формы по пути
   *
   * @param form Корневой узел формы (GroupNode)
   * @param path Путь к узлу
   * @returns Узел формы или null
   *
   * @example
   * ```typescript
   * const emailNode = navigator.getNodeByPath(form, 'email');
   * const cityNode = navigator.getNodeByPath(form, 'address.city');
   * ```
   */
  getNodeByPath(form: any, path: string): any | null {
    const segments = this.parsePath(path);
    let current = form;

    for (const segment of segments) {
      if (current == null) return null;

      // Для GroupNode
      if (current.fields && current.fields instanceof Map) {
        current = current.fields.get(segment.key);
      }
      // Для ArrayNode
      else if (segment.index !== undefined && current.items) {
        const items = current.items.value || current.items;
        if (!Array.isArray(items)) return null;
        current = items[segment.index];
      }
      // Proxy доступ
      else {
        current = current[segment.key];
      }

      if (current == null) return null;
    }

    return current;
  }
}
```

**Тесты** (`src/lib/forms/core/utils/__tests__/field-path-navigator.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { FieldPathNavigator } from '../field-path-navigator';

describe('FieldPathNavigator', () => {
  const navigator = new FieldPathNavigator();

  describe('parsePath', () => {
    it('парсит простой путь', () => {
      expect(navigator.parsePath('email')).toEqual([{ key: 'email' }]);
    });

    it('парсит вложенный путь', () => {
      expect(navigator.parsePath('address.city')).toEqual([
        { key: 'address' },
        { key: 'city' },
      ]);
    });

    it('парсит путь с массивом', () => {
      expect(navigator.parsePath('items[0].name')).toEqual([
        { key: 'items', index: 0 },
        { key: 'name' },
      ]);
    });
  });

  describe('getValueByPath', () => {
    const obj = {
      email: 'test@mail.com',
      address: {
        city: 'Moscow',
        street: 'Lenina',
      },
      items: [
        { title: 'Item 1', price: 100 },
        { title: 'Item 2', price: 200 },
      ],
    };

    it('получает простое значение', () => {
      expect(navigator.getValueByPath(obj, 'email')).toBe('test@mail.com');
    });

    it('получает вложенное значение', () => {
      expect(navigator.getValueByPath(obj, 'address.city')).toBe('Moscow');
    });

    it('получает значение из массива', () => {
      expect(navigator.getValueByPath(obj, 'items[0].title')).toBe('Item 1');
    });

    it('возвращает undefined для несуществующего пути', () => {
      expect(navigator.getValueByPath(obj, 'foo.bar')).toBeUndefined();
    });
  });

  describe('setValueByPath', () => {
    it('устанавливает простое значение', () => {
      const obj = { email: '' };
      navigator.setValueByPath(obj, 'email', 'new@mail.com');
      expect(obj.email).toBe('new@mail.com');
    });

    it('устанавливает вложенное значение', () => {
      const obj = { address: { city: '' } };
      navigator.setValueByPath(obj, 'address.city', 'Moscow');
      expect(obj.address.city).toBe('Moscow');
    });

    it('устанавливает значение в массиве', () => {
      const obj = { items: [{ title: 'Old' }] };
      navigator.setValueByPath(obj, 'items[0].title', 'New');
      expect(obj.items[0].title).toBe('New');
    });

    it('создает объект, если его нет', () => {
      const obj: any = {};
      navigator.setValueByPath(obj, 'address.city', 'Moscow');
      expect(obj.address.city).toBe('Moscow');
    });
  });
});
```

#### 1.2. Создать SubscriptionManager (управление подписками)

**Файлы**:
- Создать: `src/lib/forms/core/utils/subscription-manager.ts`

**Код**:
```typescript
/**
 * Менеджер подписок для FormNode
 *
 * Централизует управление effect-подписками, предотвращает утечки памяти.
 * Позволяет отписываться от конкретных подписок по ключу.
 *
 * @example
 * ```typescript
 * class FieldNode {
 *   private subscriptions = new SubscriptionManager();
 *
 *   watch(callback: Function) {
 *     const dispose = effect(() => callback(this.value.value));
 *     return this.subscriptions.add('watch', dispose);
 *   }
 *
 *   dispose() {
 *     this.subscriptions.clear();
 *   }
 * }
 * ```
 */
export class SubscriptionManager {
  private subscriptions = new Map<string, () => void>();

  /**
   * Добавляет подписку
   *
   * Если подписка с таким ключом уже существует, заменяет её (отписывается от старой).
   *
   * @param key Уникальный ключ подписки
   * @param dispose Функция отписки
   * @returns Функция для отписки от этой конкретной подписки
   */
  add(key: string, dispose: () => void): () => void {
    // Если подписка уже есть, отписываемся от неё
    if (this.subscriptions.has(key)) {
      console.warn(`Subscription "${key}" already exists, replacing`);
      this.subscriptions.get(key)?.();
    }

    this.subscriptions.set(key, dispose);

    // Возвращаем функцию отписки
    return () => this.remove(key);
  }

  /**
   * Удаляет подписку по ключу
   *
   * @param key Ключ подписки
   * @returns true, если подписка была удалена
   */
  remove(key: string): boolean {
    const dispose = this.subscriptions.get(key);
    if (dispose) {
      dispose();
      this.subscriptions.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Очищает все подписки
   *
   * Вызывает dispose для каждой подписки.
   */
  clear(): void {
    for (const dispose of this.subscriptions.values()) {
      dispose();
    }
    this.subscriptions.clear();
  }

  /**
   * Возвращает количество активных подписок
   *
   * Полезно для отладки утечек памяти.
   */
  size(): number {
    return this.subscriptions.size;
  }

  /**
   * Проверяет, есть ли подписка с данным ключом
   */
  has(key: string): boolean {
    return this.subscriptions.has(key);
  }
}
```

**Тесты** (`src/lib/forms/core/utils/__tests__/subscription-manager.test.ts`):
```typescript
import { describe, it, expect, vi } from 'vitest';
import { SubscriptionManager } from '../subscription-manager';

describe('SubscriptionManager', () => {
  it('добавляет подписку', () => {
    const manager = new SubscriptionManager();
    const dispose = vi.fn();

    manager.add('test', dispose);

    expect(manager.has('test')).toBe(true);
    expect(manager.size()).toBe(1);
  });

  it('удаляет подписку', () => {
    const manager = new SubscriptionManager();
    const dispose = vi.fn();

    manager.add('test', dispose);
    const removed = manager.remove('test');

    expect(removed).toBe(true);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(manager.has('test')).toBe(false);
  });

  it('заменяет существующую подписку', () => {
    const manager = new SubscriptionManager();
    const dispose1 = vi.fn();
    const dispose2 = vi.fn();

    manager.add('test', dispose1);
    manager.add('test', dispose2); // заменяет первую

    expect(dispose1).toHaveBeenCalledTimes(1); // старая отписалась
    expect(manager.size()).toBe(1);
  });

  it('очищает все подписки', () => {
    const manager = new SubscriptionManager();
    const dispose1 = vi.fn();
    const dispose2 = vi.fn();

    manager.add('test1', dispose1);
    manager.add('test2', dispose2);

    manager.clear();

    expect(dispose1).toHaveBeenCalledTimes(1);
    expect(dispose2).toHaveBeenCalledTimes(1);
    expect(manager.size()).toBe(0);
  });

  it('возвращает функцию отписки', () => {
    const manager = new SubscriptionManager();
    const dispose = vi.fn();

    const unsubscribe = manager.add('test', dispose);
    unsubscribe();

    expect(dispose).toHaveBeenCalledTimes(1);
    expect(manager.has('test')).toBe(false);
  });
});
```

#### 1.3. Перенести общую логику в FormNode (Template Method паттерн)

**Файлы**:
- Изменить: `src/lib/forms/core/nodes/form-node.ts`

**Изменения**:
```typescript
/**
 * Абстрактный базовый класс для всех узлов формы
 *
 * Реализует общую логику управления состоянием (touched, dirty, status).
 * Наследники: FieldNode, GroupNode, ArrayNode.
 *
 * @template T Тип значения узла
 */
export abstract class FormNode<T> {
  // ✅ Общее состояние (перенесено из наследников)
  protected _touched = signal(false);
  protected _dirty = signal(false);
  protected _status = signal<FieldStatus>('VALID');

  // Публичные computed signals
  readonly touched: ReadonlySignal<boolean> = computed(() => this._touched.value);
  readonly dirty: ReadonlySignal<boolean> = computed(() => this._dirty.value);
  readonly status: ReadonlySignal<FieldStatus> = computed(() => this._status.value);

  // Абстрактные методы (реализуются в наследниках)
  abstract getValue(): T;
  abstract setValue(value: T, options?: SetValueOptions): void;
  abstract patchValue(value: Partial<T>): void;
  abstract reset(value?: T): void;
  abstract validate(): Promise<boolean>;
  abstract setErrors(errors: ValidationError[]): void;
  abstract clearErrors(): void;

  // ✅ Общая логика управления состоянием (Template Method)

  /**
   * Помечает узел как "тронутый" (touched)
   */
  markAsTouched(): void {
    this._touched.value = true;
    this.onMarkAsTouched(); // hook для наследников
  }

  /**
   * Помечает узел как "нетронутый" (untouched)
   */
  markAsUntouched(): void {
    this._touched.value = false;
    this.onMarkAsUntouched();
  }

  /**
   * Помечает узел как "измененный" (dirty)
   */
  markAsDirty(): void {
    this._dirty.value = true;
    this.onMarkAsDirty();
  }

  /**
   * Помечает узел как "неизмененный" (pristine)
   */
  markAsPristine(): void {
    this._dirty.value = false;
    this.onMarkAsPristine();
  }

  /**
   * Отключает узел (disabled)
   */
  disable(): void {
    this._status.value = 'DISABLED';
    this.onDisable(); // hook для наследников
  }

  /**
   * Включает узел
   */
  enable(): void {
    this._status.value = 'VALID';
    this.onEnable();
  }

  /**
   * Помечает все вложенные узлы как touched
   */
  abstract touchAll(): void;

  /**
   * Освобождает ресурсы (отписки от effect)
   */
  abstract dispose(): void;

  // ✅ Template Method hooks (переопределяются в наследниках)

  /**
   * Hook: вызывается после markAsTouched()
   * Переопределяется в наследниках для специфичной логики
   */
  protected onMarkAsTouched(): void {
    // GroupNode/ArrayNode могут пометить вложенные узлы
  }

  protected onMarkAsUntouched(): void {}
  protected onMarkAsDirty(): void {}
  protected onMarkAsPristine(): void {}

  /**
   * Hook: вызывается после disable()
   * Переопределяется в наследниках
   */
  protected onDisable(): void {
    // GroupNode/ArrayNode рекурсивно отключают вложенные узлы
  }

  protected onEnable(): void {}
}
```

**Изменить наследников**:
- `FieldNode`: удалить дублирующиеся методы markAsTouched/disable/enable
- `GroupNode`: удалить дублирующиеся методы, переопределить hooks (onDisable → рекурсивно disable вложенных)
- `ArrayNode`: аналогично

### Критерии готовности Фазы 1

- ✅ FieldPathNavigator создан и покрыт тестами (100%)
- ✅ SubscriptionManager создан и покрыт тестами (100%)
- ✅ Общая логика перенесена в FormNode (disable, enable, markAs*)
- ✅ Все тесты проходят (npm test)
- ✅ Существующие примеры работают без изменений
- ✅ Код задокументирован (JSDoc на русском)

### Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Breaking change при изменении FormNode | Средняя | Переопределить методы в наследниках для сохранения поведения |
| Регрессия в примерах | Низкая | Запустить все примеры после изменений |
| Падение тестов | Низкая | Unit-тесты для новых классов |

---

## Фаза 2: Декомпозиция GroupNode — Разделение ответственностей

**Цель**: Разбить God Class (GroupNode) на несколько классов с единственной ответственностью. Применить computed signals вместо ручного кеширования.

### Задачи

#### 2.1. Создать NodeFactory (фабрика узлов)

**Файлы**:
- Создать: `src/lib/forms/core/factories/node-factory.ts`
- Создать: `src/lib/forms/core/factories/index.ts`

**Код**:
```typescript
/**
 * Фабрика для создания узлов формы
 *
 * Инкапсулирует логику определения типа конфига и создания соответствующего узла.
 * Используется в GroupNode и ArrayNode.
 *
 * @example
 * ```typescript
 * const factory = new NodeFactory();
 * const node = factory.createNode({ value: '', component: Input }); // FieldNode
 * const group = factory.createNode({ email: { ... }, password: { ... } }); // GroupNode
 * ```
 */
export class NodeFactory {
  /**
   * Создает узел формы на основе конфигурации
   *
   * @param config Конфигурация узла
   * @returns Экземпляр FieldNode, GroupNode или ArrayNode
   */
  createNode<T>(config: any): FormNode<T> {
    if (this.isFieldConfig(config)) {
      return new FieldNode(config);
    }

    if (this.isArrayConfig(config)) {
      return new ArrayNode(config.schema, config.initialItems);
    }

    if (this.isGroupConfig(config)) {
      return new GroupNode(config);
    }

    throw new Error(`Unknown node config: ${JSON.stringify(config)}`);
  }

  /**
   * Проверяет, является ли конфиг конфигурацией поля
   *
   * Поле имеет: value, component, validators (опционально)
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
   * Проверяет, является ли конфиг конфигурацией массива
   *
   * Массив имеет: schema, initialItems (опционально)
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
   * Проверяет, является ли конфиг конфигурацией группы
   *
   * Группа — это объект без value/component/schema
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
```

**Тесты** (`src/lib/forms/core/factories/__tests__/node-factory.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { NodeFactory } from '../node-factory';
import { FieldNode, GroupNode, ArrayNode } from '../../nodes';
import { Input } from '@/components/fields/Input';

describe('NodeFactory', () => {
  const factory = new NodeFactory();

  describe('isFieldConfig', () => {
    it('распознает конфиг поля', () => {
      expect(factory.isFieldConfig({ value: '', component: Input })).toBe(true);
    });

    it('отклоняет конфиг группы', () => {
      expect(factory.isFieldConfig({ email: { value: '' } })).toBe(false);
    });
  });

  describe('isArrayConfig', () => {
    it('распознает конфиг массива', () => {
      expect(factory.isArrayConfig({ schema: {}, initialItems: [] })).toBe(true);
    });

    it('отклоняет конфиг поля', () => {
      expect(factory.isArrayConfig({ value: '', component: Input })).toBe(false);
    });
  });

  describe('isGroupConfig', () => {
    it('распознает конфиг группы', () => {
      expect(factory.isGroupConfig({ email: { value: '' }, password: { value: '' } })).toBe(true);
    });

    it('отклоняет конфиг поля', () => {
      expect(factory.isGroupConfig({ value: '', component: Input })).toBe(false);
    });
  });

  describe('createNode', () => {
    it('создает FieldNode', () => {
      const node = factory.createNode({ value: '', component: Input });
      expect(node).toBeInstanceOf(FieldNode);
    });

    it('создает GroupNode', () => {
      const node = factory.createNode({
        email: { value: '', component: Input },
      });
      expect(node).toBeInstanceOf(GroupNode);
    });

    it('создает ArrayNode', () => {
      const node = factory.createNode({
        schema: { title: { value: '', component: Input } },
        initialItems: [],
      });
      expect(node).toBeInstanceOf(ArrayNode);
    });

    it('выбрасывает ошибку для неизвестного конфига', () => {
      expect(() => factory.createNode(null)).toThrow('Unknown node config');
    });
  });
});
```

#### 2.2. Заменить ручное кеширование на computed signals в GroupNode

**Файлы**:
- Изменить: `src/lib/forms/core/nodes/group-node.ts`

**До** (ручное кеширование):
```typescript
class GroupNode {
  private _cachedValue: T;
  private _cachedFieldValues = new Map();

  getValue(): T {
    // ❌ O(n) каждый раз
    let hasChanged = false;
    for (const [key, field] of this.fields) {
      const value = field.getValue();
      if (this._cachedFieldValues.get(key) !== value) {
        hasChanged = true;
        this._cachedFieldValues.set(key, value);
      }
    }

    if (hasChanged) {
      this._cachedValue = this.buildValueObject();
    }

    return this._cachedValue;
  }
}
```

**После** (computed signal):
```typescript
class GroupNode {
  // ✅ Computed signal — автоматическое кеширование O(1)
  readonly value: ReadonlySignal<T> = computed(() => {
    const result = {} as T;
    for (const [key, field] of this.fields) {
      result[key as keyof T] = field.value.value;
    }
    return result;
  });

  getValue(): T {
    return this.value.value; // ✅ O(1) благодаря memoization
  }
}
```

**Преимущества**:
- ✅ O(1) при повторных вызовах
- ✅ Реактивность "из коробки"
- ✅ Нет риска багов с синхронизацией
- ✅ Удаляем _cachedValue, _cachedFieldValues (упрощение)

#### 2.3. Интегрировать FieldPathNavigator в GroupNode

**Файлы**:
- Изменить: `src/lib/forms/core/nodes/group-node.ts`

**Изменения**:
```typescript
import { FieldPathNavigator } from '../utils/field-path-navigator';

export class GroupNode<T extends object> extends FormNode<T> {
  // ✅ Композиция вместо дублирования логики
  private readonly pathNavigator = new FieldPathNavigator();
  private readonly nodeFactory = new NodeFactory();

  /**
   * Получает узел формы по пути
   *
   * @param path Путь к узлу (например, "address.city" или "items[0].name")
   * @returns Узел формы или null
   *
   * @example
   * ```typescript
   * const cityNode = form.getFieldByPath('address.city');
   * cityNode?.setValue('Moscow');
   * ```
   */
  getFieldByPath(path: string): FormNode<any> | null {
    return this.pathNavigator.getNodeByPath(this, path);
  }

  // Удалить старые методы parsePathWithArrays, resolveNestedPath
  // Теперь вся логика парсинга в FieldPathNavigator
}
```

#### 2.4. Использовать SubscriptionManager в FieldNode/GroupNode/ArrayNode

**Файлы**:
- Изменить: `src/lib/forms/core/nodes/field-node.ts`
- Изменить: `src/lib/forms/core/nodes/group-node.ts`
- Изменить: `src/lib/forms/core/nodes/array-node.ts`

**Пример для FieldNode**:
```typescript
import { SubscriptionManager } from '../utils/subscription-manager';

export class FieldNode<T> extends FormNode<T> {
  // ✅ Вместо disposers: Function[]
  private subscriptions = new SubscriptionManager();

  /**
   * Подписаться на изменения значения поля
   *
   * @param callback Функция, вызываемая при изменении
   * @returns Функция отписки
   *
   * @example
   * ```typescript
   * const unsubscribe = field.watch((value) => {
   *   console.log('Value changed:', value);
   * });
   *
   * // Отписаться
   * unsubscribe();
   * ```
   */
  watch(callback: (value: T) => void): () => void {
    const dispose = effect(() => {
      callback(this.value.value);
    });

    return this.subscriptions.add(`watch-${Date.now()}`, dispose);
  }

  /**
   * Освобождает ресурсы (отписывается от всех effect)
   */
  dispose(): void {
    this.subscriptions.clear();
  }

  // Отладка: можно проверить количество подписок
  getSubscriptionCount(): number {
    return this.subscriptions.size();
  }
}
```

### Критерии готовности Фазы 2

- ✅ NodeFactory создан и интегрирован в GroupNode/ArrayNode
- ✅ Ручное кеширование заменено на computed signals
- ✅ FieldPathNavigator интегрирован в GroupNode, ValidationContext, BehaviorContext
- ✅ SubscriptionManager используется во всех узлах
- ✅ Старый код (parsePathWithArrays, _cachedValue) удален
- ✅ Все тесты проходят
- ✅ Размер GroupNode сократился на ~100 строк
- ✅ Код задокументирован

### Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Регрессия при замене кеширования | Средняя | Unit-тесты, проверка примеров |
| Breaking change API | Низкая | Сохранить публичные методы (getValue, getFieldByPath) |
| Производительность computed signals | Низкая | Signals оптимизированы, тесты производительности |

---

## Фаза 3: Устранение Singleton — Композиция реестров

**Цель**: Убрать глобальный Singleton ValidationRegistry/BehaviorRegistry. Каждый GroupNode владеет собственными экземплярами реестров (композиция).

### Задачи

#### 3.1. Рефакторинг ValidationRegistry (убрать глобальное состояние)

**Файлы**:
- Изменить: `src/lib/forms/core/validators/validation-registry.ts`

**До** (Singleton):
```typescript
// ❌ Глобальный экземпляр
export const ValidationRegistry = new ValidationRegistryClass();

class ValidationRegistryClass {
  private formStoreMap = new WeakMap(); // общий для всех форм
  private contextStack = []; // общий стек
}
```

**После** (инстанс на форму):
```typescript
/**
 * Реестр валидаторов для формы
 *
 * Каждый экземпляр GroupNode создает собственный реестр.
 * Устраняет race conditions и изолирует формы друг от друга.
 *
 * @example
 * ```typescript
 * class GroupNode {
 *   private readonly validationRegistry = new ValidationRegistryClass();
 *
 *   applyValidationSchema(schemaFn) {
 *     this.validationRegistry.beginRegistration();
 *     schemaFn(createFieldPath(this));
 *     this.validationRegistry.endRegistration(this);
 *   }
 * }
 * ```
 */
export class ValidationRegistryClass {
  // ✅ Локальное состояние (не глобальное)
  private contextStack: RegistrationContext[] = [];
  private validators: ValidatorRegistration[] = [];

  /**
   * Начинает регистрацию валидаторов
   *
   * @returns Контекст регистрации
   */
  beginRegistration(): RegistrationContext {
    const context = new RegistrationContext();
    this.contextStack.push(context);
    return context;
  }

  /**
   * Завершает регистрацию и применяет валидаторы к форме
   *
   * @param form Форма, к которой применяются валидаторы
   */
  endRegistration(form: GroupNode<any>): void {
    const context = this.contextStack.pop();
    if (!context) {
      throw new Error('No active registration context');
    }

    // Сохраняем валидаторы в локальном массиве
    this.validators = context.getValidators();

    // Применяем валидаторы к полям формы
    this.applyValidators(form);
  }

  /**
   * Отменяет регистрацию
   */
  cancelRegistration(): void {
    this.contextStack.pop();
  }

  /**
   * Возвращает текущий контекст регистрации
   */
  getCurrentContext(): RegistrationContext | null {
    return this.contextStack[this.contextStack.length - 1] || null;
  }

  // Методы регистрации валидаторов (registerSync, registerAsync, registerTree)
  // остаются без изменений

  /**
   * Применяет зарегистрированные валидаторы к форме
   */
  private applyValidators(form: GroupNode<any>): void {
    // Логика применения валидаторов к полям
    // (из текущего кода)
  }

  /**
   * Возвращает валидаторы для отладки
   */
  getValidators(): ValidatorRegistration[] {
    return this.validators;
  }
}

// ❌ Удалить глобальный экземпляр
// export const ValidationRegistry = new ValidationRegistryClass();
```

#### 3.2. Рефакторинг BehaviorRegistry (аналогично)

**Файлы**:
- Изменить: `src/lib/forms/core/behaviors/behavior-registry.ts`

**Аналогичные изменения**:
- Удалить глобальный `export const BehaviorRegistry`
- Локальное состояние (registrations: BehaviorRegistration[])
- beginRegistration/endRegistration работают с локальным массивом

#### 3.3. Интегрировать композицию реестров в GroupNode

**Файлы**:
- Изменить: `src/lib/forms/core/nodes/group-node.ts`

**Изменения**:
```typescript
import { ValidationRegistryClass } from '../validators/validation-registry';
import { BehaviorRegistryClass } from '../behaviors/behavior-registry';

/**
 * Узел формы для группы полей (объект)
 *
 * Каждый экземпляр владеет собственными реестрами валидации и поведения.
 * Это обеспечивает полную изоляцию форм друг от друга.
 */
export class GroupNode<T extends object> extends FormNode<T> {
  // ✅ Композиция: каждая форма владеет своими реестрами
  private readonly validationRegistry = new ValidationRegistryClass();
  private readonly behaviorRegistry = new BehaviorRegistryClass();

  private readonly pathNavigator = new FieldPathNavigator();
  private readonly nodeFactory = new NodeFactory();
  private subscriptions = new SubscriptionManager();

  // ... остальной код

  /**
   * Применяет validation схему к форме
   *
   * @param schemaFn Функция-схема валидации
   *
   * @example
   * ```typescript
   * form.applyValidationSchema((path) => {
   *   required(path.email, { message: 'Email обязателен' });
   *   email(path.email);
   * });
   * ```
   */
  applyValidationSchema(schemaFn: ValidationSchemaFn<T>): void {
    // ✅ Работа с локальным реестром
    this.validationRegistry.beginRegistration();
    try {
      schemaFn(createFieldPath(this));
      this.validationRegistry.endRegistration(this);
    } catch (error) {
      this.validationRegistry.cancelRegistration();
      throw error;
    }
  }

  /**
   * Применяет behavior схему к форме
   *
   * @param schemaFn Функция-схема поведения
   * @returns Объект с методом dispose для отписки от всех behaviors
   *
   * @example
   * ```typescript
   * const { dispose } = form.applyBehaviorSchema((path) => {
   *   copyFrom(path.residenceAddress, path.registrationAddress, {
   *     when: (form) => form.sameAsRegistration === true
   *   });
   * });
   *
   * // Отписаться от behaviors
   * dispose();
   * ```
   */
  applyBehaviorSchema(schemaFn: BehaviorSchemaFn<T>): { dispose: () => void } {
    // ✅ Работа с локальным реестром
    this.behaviorRegistry.beginRegistration();
    try {
      schemaFn(createBehaviorFieldPath(this));
      return this.behaviorRegistry.endRegistration(this);
    } catch (error) {
      this.behaviorRegistry.cancelRegistration();
      throw error;
    }
  }

  dispose(): void {
    this.subscriptions.clear();
    // Очищаем вложенные узлы
    for (const field of this.fields.values()) {
      field.dispose();
    }
  }
}
```

#### 3.4. Обновить функции schema-validators и schema-behaviors

**Файлы**:
- Изменить: `src/lib/forms/core/validators/schema-validators.ts`
- Изменить: `src/lib/forms/core/behaviors/schema-behaviors.ts`

**Проблема**: Функции `required()`, `email()`, `copyFrom()` и т.д. обращаются к глобальному `ValidationRegistry`.

**Решение**: Передавать реестр через контекст (уже есть в текущей реализации через getCurrentContext).

**Пример**:
```typescript
/**
 * Валидатор: обязательное поле
 *
 * @param fieldPath Путь к полю
 * @param options Опции валидации
 */
export function required<TForm, TField>(
  fieldPath: FieldPathNode<TForm, TField>,
  options?: ValidateOptions
): void {
  // ✅ Получаем контекст из стека (локальный реестр)
  const context = fieldPath._registry?.getCurrentContext();
  if (!context) {
    throw new Error('Validation schema must be called within applyValidationSchema');
  }

  context.addValidator({
    fieldPath: fieldPath._path,
    type: 'sync',
    validator: (ctx) => {
      const value = ctx.value();
      if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
        return { code: 'required', message: options?.message ?? 'Поле обязательно' };
      }
      return null;
    },
    options,
  });
}
```

**Изменения в FieldPathNode**:
```typescript
/**
 * Узел пути к полю формы (для validation schema)
 *
 * Содержит ссылку на реестр валидации для регистрации валидаторов.
 */
export interface FieldPathNode<TForm, TField> {
  _path: string;
  _registry: ValidationRegistryClass; // ✅ Ссылка на локальный реестр
}

/**
 * Создает FieldPath для validation schema
 *
 * @param form Форма
 * @returns Proxy для доступа к полям
 */
export function createFieldPath<T>(form: GroupNode<T>): FieldPath<T> {
  // Передаем реестр формы в FieldPathNode
  // ...
}
```

### Критерии готовности Фазы 3

- ✅ ValidationRegistry: убрано глобальное состояние (WeakMap, contextStack)
- ✅ BehaviorRegistry: убрано глобальное состояние
- ✅ GroupNode владеет собственными реестрами (композиция)
- ✅ Функции валидации/behaviors работают с локальными реестрами
- ✅ Тесты: две формы создаются параллельно, валидация не смешивается
- ✅ Форма "Заявка на кредит" работает (src\domains\credit-applications\form)
- ✅ Код задокументирован

### Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Breaking change: удаление глобального ValidationRegistry | Высокая | Проверить весь код на использование глобального экземпляра |
| Race conditions в тестах | Средняя | Интеграционные тесты с параллельным созданием форм |
| Регрессия в validation/behavior API | Средняя | Unit-тесты для каждой функции (required, email, copyFrom и т.д.) |

---

## Фаза 4: Strategy паттерн и рефайнмент

**Цель**: Применить Strategy паттерн для BehaviorRegistry. Разделить интерфейсы FormNode по ISP. Опционально: декомпозиция FieldNode.

### Задачи

#### 4.1. Применить Strategy паттерн для BehaviorRegistry

**Файлы**:
- Создать: `src/lib/forms/core/behaviors/strategies/behavior-strategy.ts`
- Создать: `src/lib/forms/core/behaviors/strategies/copy-behavior-strategy.ts`
- Создать: `src/lib/forms/core/behaviors/strategies/enable-behavior-strategy.ts`
- Создать: `src/lib/forms/core/behaviors/strategies/compute-behavior-strategy.ts`
- Создать: `src/lib/forms/core/behaviors/strategies/watch-behavior-strategy.ts`
- Создать: `src/lib/forms/core/behaviors/strategies/revalidate-behavior-strategy.ts`
- Создать: `src/lib/forms/core/behaviors/strategies/sync-behavior-strategy.ts`
- Создать: `src/lib/forms/core/behaviors/strategies/show-behavior-strategy.ts`
- Изменить: `src/lib/forms/core/behaviors/behavior-registry.ts`

**Интерфейс стратегии**:
```typescript
/**
 * Стратегия выполнения behavior
 *
 * Каждый тип behavior (copy, enable, compute и т.д.) реализует эту стратегию.
 */
export interface BehaviorStrategy {
  /**
   * Создает effect для behavior
   *
   * @param registration Регистрация behavior
   * @param form Форма
   * @param context Контекст behavior
   * @returns Функция отписки
   */
  execute(
    registration: BehaviorRegistration,
    form: GroupNode<any>,
    context: BehaviorContext
  ): () => void;
}
```

**Пример стратегии**:
```typescript
/**
 * Стратегия для copyFrom behavior
 *
 * Копирует значения из source поля в target поле.
 */
export class CopyBehaviorStrategy implements BehaviorStrategy {
  execute(
    registration: BehaviorRegistration,
    form: GroupNode<any>,
    context: BehaviorContext
  ): () => void {
    const { sourceField, targetField, transform, fields, condition } = registration;

    // Создаем effect
    const dispose = effect(() => {
      // Проверяем условие
      if (condition && !condition(form.getValue())) {
        return;
      }

      // Получаем значение из source
      const sourceValue = context.getField(sourceField._path);

      // Применяем transform
      const transformedValue = transform ? transform(sourceValue) : sourceValue;

      // Копируем в target
      if (fields === 'all') {
        // Копируем весь объект
        context.setField(targetField._path, transformedValue);
      } else if (Array.isArray(fields)) {
        // Копируем только указанные поля
        const targetValue = context.getField(targetField._path) || {};
        for (const field of fields) {
          if (transformedValue && field in transformedValue) {
            targetValue[field] = transformedValue[field];
          }
        }
        context.setField(targetField._path, targetValue);
      }
    });

    return dispose;
  }
}
```

**Рефакторинг BehaviorRegistry**:
```typescript
import { CopyBehaviorStrategy } from './strategies/copy-behavior-strategy';
import { EnableBehaviorStrategy } from './strategies/enable-behavior-strategy';
// ... остальные стратегии

/**
 * Реестр behaviors для формы
 *
 * Использует Strategy паттерн для разделения логики разных типов behaviors.
 */
export class BehaviorRegistryClass {
  private registrations: BehaviorRegistration[] = [];
  private isRegistering = false;

  // ✅ Strategy паттерн: Map с стратегиями
  private strategies = new Map<BehaviorType, BehaviorStrategy>([
    ['copy', new CopyBehaviorStrategy()],
    ['enable', new EnableBehaviorStrategy()],
    ['show', new ShowBehaviorStrategy()],
    ['compute', new ComputeBehaviorStrategy()],
    ['watch', new WatchBehaviorStrategy()],
    ['revalidate', new RevalidateBehaviorStrategy()],
    ['sync', new SyncBehaviorStrategy()],
  ]);

  beginRegistration(): void {
    this.isRegistering = true;
    this.registrations = [];
  }

  register(registration: BehaviorRegistration): void {
    if (!this.isRegistering) {
      throw new Error('beginRegistration must be called first');
    }
    this.registrations.push(registration);
  }

  endRegistration(form: GroupNode<any>): { dispose: () => void } {
    this.isRegistering = false;

    const context = new BehaviorContextImpl(form);
    const disposers: Array<() => void> = [];

    for (const registration of this.registrations) {
      // ✅ Делегируем выполнение стратегии
      const dispose = this.createEffect(registration, form, context);
      disposers.push(dispose);
    }

    return {
      dispose: () => {
        for (const dispose of disposers) {
          dispose();
        }
      },
    };
  }

  /**
   * Создает effect с учетом debounce/immediate
   *
   * ✅ Общая логика для всех стратегий
   */
  private createEffect(
    registration: BehaviorRegistration,
    form: GroupNode<any>,
    context: BehaviorContext
  ): () => void {
    const strategy = this.strategies.get(registration.type);
    if (!strategy) {
      throw new Error(`Unknown behavior type: ${registration.type}`);
    }

    // Выполняем стратегию
    let dispose = () => strategy.execute(registration, form, context);

    // Применяем debounce, если указан
    if (registration.debounce) {
      dispose = this.wrapWithDebounce(dispose, registration.debounce);
    }

    return dispose();
  }

  /**
   * Оборачивает функцию в debounce
   */
  private wrapWithDebounce(fn: () => void, ms: number): () => void {
    let timeoutId: number | null = null;

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(fn, ms) as any;

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    };
  }

  // ❌ Удалить 7 методов: createCopyEffect, createEnableEffect и т.д.
  // Теперь вся логика в стратегиях
}
```

**Преимущества**:
- ✅ Каждая стратегия — отдельный класс (SRP)
- ✅ Легко добавлять новые behaviors (просто добавить стратегию в Map)
- ✅ Общая логика debounce/immediate в одном месте
- ✅ Проще тестировать (каждую стратегию отдельно)
- ✅ BehaviorRegistry сократился с ~500 строк до ~150

#### 4.2. Разделить интерфейсы FormNode по ISP (опционально)

**Файлы**:
- Создать: `src/lib/forms/core/interfaces/validatable.ts`
- Создать: `src/lib/forms/core/interfaces/touchable.ts`
- Создать: `src/lib/forms/core/interfaces/disableable.ts`
- Создать: `src/lib/forms/core/interfaces/disposable.ts`
- Изменить: `src/lib/forms/core/nodes/form-node.ts`

**Интерфейсы**:
```typescript
/**
 * Валидируемый узел формы
 */
export interface Validatable {
  validate(): Promise<boolean>;
  setErrors(errors: ValidationError[]): void;
  clearErrors(): void;
  readonly valid: ReadonlySignal<boolean>;
  readonly invalid: ReadonlySignal<boolean>;
  readonly errors: ReadonlySignal<ValidationError[]>;
}

/**
 * Узел с состоянием "тронутый"
 */
export interface Touchable {
  markAsTouched(): void;
  markAsUntouched(): void;
  touchAll(): void;
  readonly touched: ReadonlySignal<boolean>;
  readonly untouched: ReadonlySignal<boolean>;
}

/**
 * Узел с возможностью отключения
 */
export interface Disableable {
  disable(): void;
  enable(): void;
  readonly disabled: ReadonlySignal<boolean>;
  readonly enabled: ReadonlySignal<boolean>;
}

/**
 * Узел с освобождением ресурсов
 */
export interface Disposable {
  dispose(): void;
}
```

**FormNode**:
```typescript
/**
 * Абстрактный базовый класс для всех узлов формы
 *
 * Реализует все интерфейсы: Validatable, Touchable, Disableable, Disposable.
 */
export abstract class FormNode<T>
  implements Validatable, Touchable, Disableable, Disposable
{
  // Реализация всех методов
  // ...
}
```

**Преимущества**:
- ✅ Явные контракты
- ✅ Меньше необязательных методов (disable?, enable?)
- ✅ Проще создавать кастомные узлы (можно реализовать только нужные интерфейсы)

#### 4.3. Декомпозиция FieldNode (опционально, если есть время)

**Файлы**:
- Создать: `src/lib/forms/core/nodes/field-parts/field-state.ts`
- Создать: `src/lib/forms/core/nodes/field-parts/field-validator.ts`
- Создать: `src/lib/forms/core/nodes/field-parts/component-props-manager.ts`
- Изменить: `src/lib/forms/core/nodes/field-node.ts`

**Примеры классов**:
```typescript
/**
 * Состояние поля
 *
 * Управляет value, touched, dirty, errors.
 */
export class FieldState<T> {
  readonly value = signal<T>(this.initialValue);
  readonly touched = signal(false);
  readonly dirty = signal(false);
  readonly errors = signal<ValidationError[]>([]);

  constructor(private initialValue: T) {}

  reset(value?: T): void {
    this.value.value = value ?? this.initialValue;
    this.touched.value = false;
    this.dirty.value = false;
    this.errors.value = [];
  }
}

/**
 * Валидатор поля
 *
 * Выполняет sync/async валидацию с debounce.
 */
export class FieldValidator<T> {
  private currentValidationId = 0;
  private debounceTimer: number | null = null;

  constructor(
    private validators: ValidatorFn<T>[],
    private asyncValidators: AsyncValidatorFn<T>[],
    private debounceMs: number = 300
  ) {}

  async validate(value: T, context: ValidationContext): Promise<ValidationError[]> {
    // Логика валидации с debounce и race condition protection
    // ...
  }
}

/**
 * Менеджер props компонента
 *
 * Управляет динамическими props для UI-компонента.
 */
export class ComponentPropsManager {
  private _props = signal<Record<string, any>>({});
  readonly props = computed(() => this._props.value);

  update(props: Partial<Record<string, any>>): void {
    this._props.value = { ...this._props.value, ...props };
  }
}
```

**FieldNode после декомпозиции**:
```typescript
export class FieldNode<T> extends FormNode<T> {
  // ✅ Композиция
  private state: FieldState<T>;
  private validator: FieldValidator<T>;
  private componentPropsManager: ComponentPropsManager;
  private subscriptions = new SubscriptionManager();

  constructor(config: FieldConfig<T>) {
    super();
    this.state = new FieldState(config.value);
    this.validator = new FieldValidator(
      config.validators ?? [],
      config.asyncValidators ?? [],
      config.debounceMs ?? 300
    );
    this.componentPropsManager = new ComponentPropsManager();
  }

  async validate(): Promise<boolean> {
    const errors = await this.validator.validate(
      this.state.value.value,
      this.createContext()
    );
    this.state.errors.value = errors;
    return errors.length === 0;
  }

  // Делегирование методов
  getValue(): T {
    return this.state.value.value;
  }

  reset(value?: T): void {
    this.state.reset(value);
  }

  // ...
}
```

**Преимущества**:
- ✅ SRP: каждый класс < 100 строк
- ✅ Переиспользование (FieldValidator можно использовать в других узлах)
- ✅ Легче тестировать

### Критерии готовности Фазы 4

- ✅ Strategy паттерн применен к BehaviorRegistry
- ✅ 7 стратегий созданы и покрыты тестами
- ✅ BehaviorRegistry сократился с ~500 строк до ~150
- ✅ Интерфейсы FormNode разделены по ISP (опционально)
- ✅ FieldNode декомпозирован (опционально)
- ✅ Все тесты проходят
- ✅ Код задокументирован

### Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Регрессия при рефакторинге BehaviorRegistry | Средняя | Интеграционные тесты для каждого behavior |
| Breaking change ISP | Низкая | FormNode реализует все интерфейсы (обратная совместимость) |
| Декомпозиция FieldNode может быть избыточной | Средняя | Опционально, если есть время |

---

## Итоговые метрики

### До рефакторинга

- **GroupNode**: ~500 строк, 30+ методов, 7+ ответственностей
- **Singleton**: ValidationRegistry/BehaviorRegistry глобальные
- **Дублирование**: парсинг путей в 4 местах
- **Ручное кеширование**: O(n) каждый раз
- **BehaviorRegistry**: 7 методов без абстракции (~500 строк)
- **Управление подписками**: просто массив функций
- **Документация**: частичная
- **Покрытие тестами**: ~30%

### После рефакторинга

- **GroupNode**: ~200 строк, ~15 методов, 3 ответственности
- **Композиция**: каждая форма владеет реестрами (изоляция)
- **Централизация**: FieldPathNavigator (1 место), SubscriptionManager
- **Computed signals**: O(1) кеширование
- **BehaviorRegistry**: 7 стратегий (~150 строк)
- **SubscriptionManager**: централизованное управление
- **Документация**: JSDoc для всех публичных API (русский)
- **Покрытие тестами**: 100% (unit + integration)

### Количественные улучшения

| Метрика | До | После | Улучшение |
|---------|-----|-------|-----------|
| Размер GroupNode | ~500 строк | ~200 строк | **-60%** |
| Методов в GroupNode | 30+ | ~15 | **-50%** |
| Дублирование парсинга | 4 места | 1 место | **-75%** |
| Размер BehaviorRegistry | ~500 строк | ~150 строк | **-70%** |
| Изоляция форм | ❌ | ✅ | **100%** |
| Покрытие тестами | ~30% | 100% | **+233%** |

---

## План коммитов

### Коммит 1: Фаза 1 — Централизация
```
feat(forms): add FieldPathNavigator and SubscriptionManager

- Создать FieldPathNavigator для централизации парсинга путей
- Создать SubscriptionManager для управления подписками
- Перенести общую логику в FormNode (disable, enable, markAs*)
- Добавить unit-тесты (100% покрытие)
- Документация JSDoc на русском
```

### Коммит 2: Фаза 2 — Декомпозиция GroupNode
```
refactor(forms): decompose GroupNode, add NodeFactory

- Создать NodeFactory для создания узлов
- Заменить ручное кеширование на computed signals
- Интегрировать FieldPathNavigator в GroupNode
- Использовать SubscriptionManager во всех узлах
- GroupNode: ~500 строк → ~300 строк
```

### Коммит 3: Фаза 3 — Устранение Singleton
```
refactor(forms): remove Singleton, add composition for registries

BREAKING CHANGE: удалены глобальные ValidationRegistry/BehaviorRegistry

- ValidationRegistry/BehaviorRegistry: убрать глобальное состояние
- GroupNode владеет собственными реестрами (композиция)
- Каждая форма изолирована (нет race conditions)
- Обновить validation/behavior API
- Тесты изоляции форм
```

### Коммит 4: Фаза 4 — Strategy паттерн
```
refactor(forms): apply Strategy pattern to BehaviorRegistry

- Создать 7 стратегий для behaviors
- BehaviorRegistry: ~500 строк → ~150 строк
- Разделить интерфейсы FormNode по ISP (опционально)
- Декомпозиция FieldNode (опционально)
```

---

## Заключение

**Стратегия**: Постепенный рефакторинг в 4 фазы, от простого к сложному. Каждая фаза — законченный этап с рабочим кодом и тестами.

**Риски**: Основной риск — breaking change при удалении глобальных реестров (Фаза 3). Митигация: тщательное тестирование, проверка всех примеров.

**Результат**: Архитектура станет модульной, тестируемой, расширяемой. Каждый класс < 200 строк (SRP). Полная изоляция форм. Документация на русском.

**Время**: Оценочно 2-3 недели (по 1 фазе в неделю + тесты + документация).
