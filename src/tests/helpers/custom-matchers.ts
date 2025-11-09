/**
 * Кастомные Vitest matchers для тестирования форм
 */

import { expect } from 'vitest';
import type { GroupNode } from '@/lib/forms/core/nodes/group-node';
import type { ArrayNode } from '@/lib/forms/core/nodes/array-node';
import type { FieldNode } from '@/lib/forms/core/nodes/field-node';

// ============================================================================
// Типы для кастомных matchers
// ============================================================================

interface CustomMatchers<R = unknown> {
  toBeValidForm(): R;
  toBeInvalidForm(): R;
  toHaveErrors(count?: number): R;
  toHaveFieldError(fieldPath: string): R;
  toBeTouched(): R;
  toBeDirty(): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

// ============================================================================
// Matchers для GroupNode
// ============================================================================

/**
 * Проверить, что форма валидна
 *
 * @example
 * ```typescript
 * const form = createTestForm({ email: { value: 'test@mail.com', component: mockComponent } });
 * await form.validate();
 * expect(form).toBeValidForm();
 * ```
 */
expect.extend({
  toBeValidForm(received: GroupNode<any>) {
    const isValid = received.valid.value;
    return {
      pass: isValid,
      message: () =>
        isValid
          ? 'Expected form to be invalid'
          : `Expected form to be valid, but got errors: ${JSON.stringify(received.errors.value, null, 2)}`,
    };
  },
});

/**
 * Проверить, что форма невалидна
 *
 * @example
 * ```typescript
 * const form = createTestForm({ email: { value: '', component: mockComponent } });
 * await form.validate();
 * expect(form).toBeInvalidForm();
 * ```
 */
expect.extend({
  toBeInvalidForm(received: GroupNode<any>) {
    const isInvalid = received.invalid.value;
    return {
      pass: isInvalid,
      message: () =>
        isInvalid
          ? 'Expected form to be valid'
          : 'Expected form to be invalid, but it is valid',
    };
  },
});

/**
 * Проверить количество ошибок в форме
 *
 * @example
 * ```typescript
 * const form = createTestForm({ email: { value: '', component: mockComponent } });
 * await form.validate();
 * expect(form).toHaveErrors(1);
 * expect(form).toHaveErrors(); // Любое количество > 0
 * ```
 */
expect.extend({
  toHaveErrors(received: GroupNode<any> | ArrayNode<any>, count?: number) {
    const errorCount = received.errors.value.length;
    const hasErrors = errorCount > 0;

    if (count === undefined) {
      return {
        pass: hasErrors,
        message: () =>
          hasErrors
            ? `Expected form to have no errors, but got ${errorCount} error(s)`
            : 'Expected form to have errors',
      };
    }

    const pass = errorCount === count;
    return {
      pass,
      message: () =>
        pass
          ? `Expected form not to have ${count} error(s)`
          : `Expected form to have ${count} error(s), but got ${errorCount}`,
    };
  },
});

/**
 * Проверить, что поле содержит ошибку
 *
 * @example
 * ```typescript
 * const form = createTestForm({ email: { value: '', component: mockComponent } });
 * await form.validate();
 * expect(form).toHaveFieldError('email');
 * ```
 */
// Note: This matcher is disabled because ValidationError no longer has 'field' or 'path' properties.
// ValidationError only has: code, message, params
/*
expect.extend({
  toHaveFieldError(received: GroupNode<any>, fieldPath: string) {
    const errors = received.errors.value;
    const hasFieldError = errors.some((error) => {
      // Проверяем, что ошибка относится к указанному полю
      return error.field === fieldPath || error.path === fieldPath;
    });

    return {
      pass: hasFieldError,
      message: () =>
        hasFieldError
          ? `Expected form not to have error for field "${fieldPath}"`
          : `Expected form to have error for field "${fieldPath}", but got errors for: ${errors.map(e => e.field || e.path).join(', ')}`,
    };
  },
});
*/

// ============================================================================
// Matchers для FieldNode/GroupNode состояния
// ============================================================================

/**
 * Проверить, что поле/форма touched
 *
 * @example
 * ```typescript
 * form.email.markAsTouched();
 * expect(form.email).toBeTouched();
 * expect(form).toBeTouched();
 * ```
 */
expect.extend({
  toBeTouched(received: FieldNode<any> | GroupNode<any> | ArrayNode<any>) {
    const isTouched = received.touched.value;
    return {
      pass: isTouched,
      message: () =>
        isTouched
          ? 'Expected field/form not to be touched'
          : 'Expected field/form to be touched',
    };
  },
});

/**
 * Проверить, что поле/форма dirty
 *
 * @example
 * ```typescript
 * form.email.setValue('test@mail.com');
 * expect(form.email).toBeDirty();
 * expect(form).toBeDirty();
 * ```
 */
expect.extend({
  toBeDirty(received: FieldNode<any> | GroupNode<any> | ArrayNode<any>) {
    const isDirty = received.dirty.value;
    return {
      pass: isDirty,
      message: () =>
        isDirty
          ? 'Expected field/form not to be dirty'
          : 'Expected field/form to be dirty',
    };
  },
});

// ============================================================================
// Export для использования в тестах
// ============================================================================

export {};
