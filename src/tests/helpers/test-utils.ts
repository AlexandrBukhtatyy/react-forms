/**
 * Test utilities - общие helper функции для тестов
 */

import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { ArrayNode } from '@/lib/forms/core/nodes/array-node';
import type { DeepFormSchema } from '@/lib/forms/types';

/**
 * Создать тестовую форму с дефолтными значениями
 *
 * @example
 * ```typescript
 * const form = createTestForm({
 *   email: { value: '', component: mockComponent },
 *   password: { value: '', component: mockComponent },
 * });
 * ```
 */
export function createTestForm<T>(schema: DeepFormSchema<T>): GroupNode<T> {
  return new GroupNode(schema);
}

/**
 * Создать тестовый ArrayNode с дефолтными значениями
 *
 * @example
 * ```typescript
 * const arrayNode = createTestArray({
 *   title: { value: '', component: mockComponent },
 *   price: { value: 0, component: mockComponent },
 * });
 * ```
 */
export function createTestArray<T>(
  schema: DeepFormSchema<T>,
  initialItems: Partial<T>[] = []
): ArrayNode<T> {
  return new ArrayNode(schema, initialItems);
}

/**
 * Дождаться выполнения всех async валидаторов
 *
 * @param ms - Время ожидания в миллисекундах (по умолчанию 10ms)
 *
 * @example
 * ```typescript
 * form.email.setValue('test@mail.com');
 * await waitForValidation();
 * expect(form.email.valid.value).toBe(true);
 * ```
 */
export async function waitForValidation(ms: number = 10): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Дождаться выполнения debounce в поле
 *
 * @param ms - Время ожидания в миллисекундах (по умолчанию 100ms)
 *
 * @example
 * ```typescript
 * form.email.setValue('test@mail.com');
 * await waitForDebounce(150); // Если debounce = 100ms
 * expect(callback).toHaveBeenCalled();
 * ```
 */
export async function waitForDebounce(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock component для тестов
 * Используется вместо реальных React компонентов в FieldConfig
 *
 * @example
 * ```typescript
 * const form = new GroupNode({
 *   email: { value: '', component: mockComponent },
 * });
 * ```
 */
export const mockComponent = null as any;

/**
 * Проверить, что форма валидна
 *
 * @example
 * ```typescript
 * const form = createTestForm({ email: { value: 'test@mail.com', component: mockComponent } });
 * await form.validate();
 * expect(isFormValid(form)).toBe(true);
 * ```
 */
export function isFormValid<T>(form: GroupNode<T>): boolean {
  return form.valid.value;
}

/**
 * Проверить, что форма содержит ошибки
 *
 * @example
 * ```typescript
 * const form = createTestForm({ email: { value: '', component: mockComponent } });
 * await form.validate();
 * expect(hasFormErrors(form)).toBe(true);
 * ```
 */
export function hasFormErrors<T>(form: GroupNode<T>): boolean {
  return form.errors.value.length > 0;
}

/**
 * Получить количество ошибок в форме
 *
 * @example
 * ```typescript
 * const form = createTestForm({ email: { value: '', component: mockComponent } });
 * await form.validate();
 * expect(getErrorCount(form)).toBe(1);
 * ```
 */
export function getErrorCount<T>(form: GroupNode<T>): number {
  return form.errors.value.length;
}
