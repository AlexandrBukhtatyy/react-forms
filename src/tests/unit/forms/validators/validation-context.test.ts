/**
 * Unit tests for ValidationContext
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { FieldNode } from '@/lib/forms/core/nodes/field-node';
import { ValidationContextImpl, TreeValidationContextImpl } from '@/lib/forms/validators/validation-context';

describe('ValidationContext', () => {
  interface TestForm {
    email: string;
    password: string;
    address: {
      city: string;
      street: string;
    };
  }

  let form: GroupNode<TestForm>;
  let emailField: FieldNode<string>;

  beforeEach(() => {
    form = new GroupNode({
      email: { value: 'test@mail.com', component: null as any },
      password: { value: 'password123', component: null as any },
      address: {
        city: { value: 'Moscow', component: null as any },
        street: { value: 'Lenina', component: null as any },
      },
    });

    emailField = form.email as unknown as FieldNode<string>;
  });

  describe('ValidationContextImpl', () => {
    it('should return current field value via value()', () => {
      const context = new ValidationContextImpl(form, 'email', emailField);

      expect(context.value()).toBe('test@mail.com');
    });

    it('should get field value by key', () => {
      const context = new ValidationContextImpl(form, 'email', emailField);

      const password = context.getField('password' as any);
      expect(password).toBe('password123');
    });

    it('should get nested field value by path', () => {
      const context = new ValidationContextImpl(form, 'email', emailField);

      const city = context.getField('address.city');
      expect(city).toBe('Moscow');

      const street = context.getField('address.street');
      expect(street).toBe('Lenina');
    });

    it('should return undefined for non-existent path', () => {
      const context = new ValidationContextImpl(form, 'email', emailField);

      const result = context.getField('nonexistent.path');
      expect(result).toBeUndefined();
    });

    it('should set field value by key', () => {
      const context = new ValidationContextImpl(form, 'email', emailField);

      context.setField('password' as any, 'newpassword');
      expect(form.password.value.value).toBe('newpassword');
    });

    it('should set nested field value by path', () => {
      const context = new ValidationContextImpl(form, 'email', emailField);

      context.setField('address.city', 'SPB');
      expect(form.address.city.value.value).toBe('SPB');

      context.setField('address.street', 'Nevsky');
      expect(form.address.street.value.value).toBe('Nevsky');
    });

    it('should return full form value via formValue()', () => {
      const context = new ValidationContextImpl(form, 'email', emailField);

      const formValue = context.formValue();
      expect(formValue).toEqual({
        email: 'test@mail.com',
        password: 'password123',
        address: {
          city: 'Moscow',
          street: 'Lenina',
        },
      });
    });

    it('should return control via getControl()', () => {
      const context = new ValidationContextImpl(form, 'email', emailField);

      const control = context.getControl();
      expect(control).toBe(emailField);
      expect(control.value.value).toBe('test@mail.com');
    });

    it('should return form via getForm()', () => {
      const context = new ValidationContextImpl(form, 'email', emailField);

      const formRef = context.getForm();
      expect(formRef).toBe(form);
    });
  });

  describe('TreeValidationContextImpl', () => {
    it('should get field value by key', () => {
      const context = new TreeValidationContextImpl(form);

      const email = context.getField('email' as any);
      expect(email).toBe('test@mail.com');

      const password = context.getField('password' as any);
      expect(password).toBe('password123');
    });

    it('should get nested field value by path', () => {
      const context = new TreeValidationContextImpl(form);

      const city = context.getField('address.city');
      expect(city).toBe('Moscow');

      const street = context.getField('address.street');
      expect(street).toBe('Lenina');
    });

    it('should return undefined for non-existent path', () => {
      const context = new TreeValidationContextImpl(form);

      const result = context.getField('invalid.path');
      expect(result).toBeUndefined();
    });

    it('should return full form value via formValue()', () => {
      const context = new TreeValidationContextImpl(form);

      const formValue = context.formValue();
      expect(formValue).toEqual({
        email: 'test@mail.com',
        password: 'password123',
        address: {
          city: 'Moscow',
          street: 'Lenina',
        },
      });
    });

    it('should return form via getForm()', () => {
      const context = new TreeValidationContextImpl(form);

      const formRef = context.getForm();
      expect(formRef).toBe(form);
    });
  });

  describe('Cross-field validation use cases', () => {
    it('should allow comparing two fields (password confirmation)', () => {
      interface PasswordForm {
        password: string;
        confirmPassword: string;
      }

      const passwordForm = new GroupNode<PasswordForm>({
        password: { value: 'secret123', component: null as any },
        confirmPassword: { value: 'secret456', component: null as any },
      });

      const passwordField = passwordForm.password as unknown as FieldNode<string>;
      const context = new ValidationContextImpl(passwordForm, 'password', passwordField);

      const password = context.value();
      const confirmPassword = context.getField('confirmPassword' as any);

      expect(password).not.toBe(confirmPassword);
    });

    it('should allow conditional validation based on other field', () => {
      interface ConditionalForm {
        loanType: string;
        propertyValue: number | null;
      }

      const conditionalForm = new GroupNode<ConditionalForm>({
        loanType: { value: 'mortgage', component: null as any },
        propertyValue: { value: null, component: null as any },
      });

      const propertyField = conditionalForm.propertyValue as unknown as FieldNode<number | null>;
      const context = new ValidationContextImpl(conditionalForm, 'propertyValue', propertyField);

      const loanType = context.getField('loanType' as any);
      const propertyValue = context.value();

      // Валидация: если loanType === 'mortgage', propertyValue обязательно
      const shouldValidate = loanType === 'mortgage';
      const isValid = !shouldValidate || (propertyValue !== null && propertyValue !== undefined);

      expect(shouldValidate).toBe(true);
      expect(isValid).toBe(false); // propertyValue === null
    });
  });
});
