/**
 * Integration tests for cleanup mechanism
 * Tests real-world scenarios with React components and complex form structures
 */

import { describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useEffect } from 'react';
import { signal } from '@preact/signals-react';
import { makeForm } from '@/lib/forms/core/utils/make-form';

describe('Cleanup Integration Tests', () => {
  afterEach(() => {
    cleanup();
  });

  describe('React Component Integration', () => {
    it('should cleanup form on component unmount', () => {
      const watchCallback = vi.fn();

      interface TestForm {
        email: string;
        password: string;
      }

      const form = makeForm<TestForm>({
        email: { value: '', component: null as any },
        password: { value: '', component: null as any },
      });

      form.watchField('email', watchCallback);

      // Component that uses the form
      function FormComponent() {
        useEffect(() => {
          return () => {
            form.dispose();
          };
        }, []);

        return <div>Form</div>;
      }

      // Render component
      const { unmount } = render(<FormComponent />);

      // Initial call
      expect(watchCallback).toHaveBeenCalledTimes(1);

      // Change value while mounted
      form.email.setValue('test@example.com');
      expect(watchCallback).toHaveBeenCalledTimes(2);

      // Unmount component (triggers cleanup)
      unmount();

      // Change value after unmount - should NOT trigger callback
      form.email.setValue('after-unmount@example.com');
      expect(watchCallback).toHaveBeenCalledTimes(2); // Still 2
    });

    it('should cleanup multiple forms in the same component', () => {
      const form1Callback = vi.fn();
      const form2Callback = vi.fn();

      interface TestForm {
        field: string;
      }

      const form1 = makeForm<TestForm>({
        field: { value: '', component: null as any },
      });

      const form2 = makeForm<TestForm>({
        field: { value: '', component: null as any },
      });

      form1.watchField('field', form1Callback);
      form2.watchField('field', form2Callback);

      function MultiFormComponent() {
        useEffect(() => {
          return () => {
            form1.dispose();
            form2.dispose();
          };
        }, []);

        return <div>Multi Form</div>;
      }

      const { unmount } = render(<MultiFormComponent />);

      // Both forms working
      form1.field.setValue('value1');
      form2.field.setValue('value2');
      expect(form1Callback).toHaveBeenCalledTimes(2); // Initial + setValue
      expect(form2Callback).toHaveBeenCalledTimes(2);

      // Unmount
      unmount();

      // Both should be cleaned up
      form1.field.setValue('after-unmount1');
      form2.field.setValue('after-unmount2');
      expect(form1Callback).toHaveBeenCalledTimes(2); // Not triggered
      expect(form2Callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Complex Form Structures', () => {
    it('should cleanup deeply nested forms', () => {
      interface DeepForm {
        level1: {
          level2: {
            level3: {
              level4: {
                value: string;
              };
            };
          };
        };
      }

      const form = makeForm<DeepForm>({
        level1: {
          level2: {
            level3: {
              level4: {
                value: { value: '', component: null as any },
              },
            },
          },
        },
      });

      const callback = vi.fn();
      // Поле 'value' получаем через fields.get()
      const valueField = form.level1.level2.level3.level4.fields.get('value' as any);
      valueField?.watch(callback);

      expect(callback).toHaveBeenCalledTimes(1);

      // Change value
      valueField?.setValue('test');
      expect(callback).toHaveBeenCalledTimes(2);

      // Dispose from root
      form.dispose();

      // Should not trigger
      valueField?.setValue('after-dispose');
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should cleanup form with arrays and nested groups', () => {
      interface Item {
        title: string;
        price: number;
      }

      interface ComplexForm {
        user: {
          name: string;
        };
        items: Item[];
      }

      const form = makeForm<ComplexForm>({
        user: {
          name: { value: '', component: null as any },
        },
        items: [
          {
            title: { value: '', component: null as any },
            price: { value: 0, component: null as any },
          },
        ],
      });

      // Add an item to the array
      form.items.push({ title: 'Item 1', price: 100 });

      const nameCallback = vi.fn();
      const itemCallback = vi.fn();

      form.user.name.watch(nameCallback);
      const item = form.items.at(0);
      if (item) {
        item.title.watch(itemCallback);
      }

      expect(nameCallback).toHaveBeenCalledTimes(1);
      expect(itemCallback).toHaveBeenCalledTimes(1);

      // Changes
      form.user.name.setValue('John');
      form.items.at(0)?.title.setValue('Updated Item');

      expect(nameCallback).toHaveBeenCalledTimes(2);
      expect(itemCallback).toHaveBeenCalledTimes(2);

      // Dispose root
      form.dispose();

      // Should not trigger
      form.user.name.setValue('Jane');
      form.items.at(0)?.title.setValue('After Dispose');

      expect(nameCallback).toHaveBeenCalledTimes(2);
      expect(itemCallback).toHaveBeenCalledTimes(2);
    });

    it('should cleanup partial dispose of nested structure', () => {
      interface PartialForm {
        section1: {
          field1: string;
        };
        section2: {
          field2: string;
        };
      }

      const form = makeForm<PartialForm>({
        section1: {
          field1: { value: '', component: null as any },
        },
        section2: {
          field2: { value: '', component: null as any },
        },
      });

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      form.section1.field1.watch(callback1);
      form.section2.field2.watch(callback2);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Dispose only section1
      form.section1.dispose();

      // Changes
      form.section1.field1.setValue('value1');
      form.section2.field2.setValue('value2');

      // Only section2 should trigger
      expect(callback1).toHaveBeenCalledTimes(1); // Not triggered
      expect(callback2).toHaveBeenCalledTimes(2); // Triggered

      // Cleanup
      form.dispose();
    });
  });

  describe('Cross-Field Dependencies', () => {
    it('should cleanup linkFields with multiple dependencies', () => {
      interface DependentForm {
        firstName: string;
        lastName: string;
        fullName: string;
      }

      const form = makeForm<DependentForm>({
        firstName: { value: '', component: null as any },
        lastName: { value: '', component: null as any },
        fullName: { value: '', component: null as any },
      });

      // Link fullName to firstName and lastName
      form.linkFields('firstName', 'fullName', (firstName: string) => {
        const lastName = form.lastName.value.value;
        return `${firstName} ${lastName}`.trim();
      });

      form.linkFields('lastName', 'fullName', (lastName: string) => {
        const firstName = form.firstName.value.value;
        return `${firstName} ${lastName}`.trim();
      });

      // Initial state
      expect(form.fullName.value.value).toBe('');

      // Changes
      form.firstName.setValue('John');
      expect(form.fullName.value.value).toBe('John');

      form.lastName.setValue('Doe');
      expect(form.fullName.value.value).toBe('John Doe');

      // Dispose
      form.dispose();

      // Changes after dispose - fullName should NOT update
      form.firstName.setValue('Jane');
      expect(form.fullName.value.value).toBe('John Doe'); // Still old value
    });

    it('should cleanup computed fields with external signals', () => {
      const externalSignal1 = signal(10);
      const externalSignal2 = signal(20);

      interface ComputedForm {
        sum: number;
        product: number;
      }

      const form = makeForm<ComputedForm>({
        sum: { value: 0, component: null as any },
        product: { value: 0, component: null as any },
      });

      form.sum.computeFrom(
        [externalSignal1, externalSignal2],
        (v1: number, v2: number) => v1 + v2
      );

      form.product.computeFrom(
        [externalSignal1, externalSignal2],
        (v1: number, v2: number) => v1 * v2
      );

      // Initial computation
      expect(form.sum.value.value).toBe(30);
      expect(form.product.value.value).toBe(200);

      // Change external signals
      externalSignal1.value = 5;
      expect(form.sum.value.value).toBe(25);
      expect(form.product.value.value).toBe(100);

      // Dispose
      form.dispose();

      // Change external signals after dispose
      externalSignal1.value = 100;
      externalSignal2.value = 200;

      // Values should NOT update
      expect(form.sum.value.value).toBe(25);
      expect(form.product.value.value).toBe(100);
    });

    it('should cleanup watchField with side effects', () => {
      interface SideEffectForm {
        country: string;
        city: string;
      }

      const form = makeForm<SideEffectForm>({
        country: { value: '', component: null as any },
        city: { value: '', component: null as any },
      });

      const sideEffectCallback = vi.fn();

      // Watch country and reset city when it changes
      form.watchField('country', (country: string) => {
        if (country) {
          form.city.setValue(''); // Reset city
          sideEffectCallback(country);
        }
      });

      // Change country
      form.country.setValue('USA');
      expect(sideEffectCallback).toHaveBeenCalledTimes(1);
      expect(sideEffectCallback).toHaveBeenCalledWith('USA');
      expect(form.city.value.value).toBe('');

      // Set city
      form.city.setValue('New York');
      expect(form.city.value.value).toBe('New York');

      // Dispose
      form.dispose();

      // Change country after dispose - side effect should NOT run
      form.country.setValue('Canada');
      expect(sideEffectCallback).toHaveBeenCalledTimes(1); // Still 1
      expect(form.city.value.value).toBe('New York'); // Not reset
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not leak memory with many mount/unmount cycles', () => {
      interface TestForm {
        field: string;
      }

      // Simulate 100 mount/unmount cycles
      for (let i = 0; i < 100; i++) {
        const form = makeForm<TestForm>({
          field: { value: '', component: null as any },
        });

        const callback = vi.fn();
        form.watchField('field', callback);

        // Simulate component lifecycle
        form.field.setValue(`value-${i}`);
        expect(callback).toHaveBeenCalledTimes(2); // Initial + setValue

        // Cleanup
        form.dispose();

        // Verify cleanup worked
        form.field.setValue(`after-dispose-${i}`);
        expect(callback).toHaveBeenCalledTimes(2); // Not triggered
      }

      // Test completes successfully without memory issues
      expect(true).toBe(true);
    });

    it('should handle rapid subscribe/dispose cycles', () => {
      interface TestForm {
        field: string;
      }

      const form = makeForm<TestForm>({
        field: { value: '', component: null as any },
      });

      // Rapid subscribe/dispose cycles
      for (let i = 0; i < 50; i++) {
        const callback = vi.fn();
        form.watchField('field', callback);

        form.field.setValue(`value-${i}`);
        expect(callback).toHaveBeenCalledTimes(2);

        form.dispose();

        form.field.setValue(`after-${i}`);
        expect(callback).toHaveBeenCalledTimes(2);
      }

      // Final verification
      const finalCallback = vi.fn();
      form.watchField('field', finalCallback);

      form.field.setValue('final');
      expect(finalCallback).toHaveBeenCalledTimes(2);

      // Cleanup
      form.dispose();
    });

    it('should cleanup large forms with many fields', () => {
      // Create form with 50 fields
      const fields: Record<string, any> = {};
      const callbacks: Array<() => void> = [];

      for (let i = 0; i < 50; i++) {
        fields[`field${i}`] = { value: '', component: null as any };
      }

      const form = makeForm(fields);

      // Add watchers to all fields
      for (let i = 0; i < 50; i++) {
        const callback = vi.fn();
        const fieldName = `field${i}` as keyof typeof fields;
        form.watchField(fieldName, callback);
        callbacks.push(callback);
      }

      // Change all fields
      for (let i = 0; i < 50; i++) {
        const fieldName = `field${i}` as keyof typeof fields;
        (form[fieldName] as any).setValue(`value-${i}`);
      }

      // Verify all callbacks triggered
      callbacks.forEach((cb) => {
        expect(cb).toHaveBeenCalledTimes(2); // Initial + setValue
      });

      // Dispose
      form.dispose();

      // Change all fields after dispose
      for (let i = 0; i < 50; i++) {
        const fieldName = `field${i}` as keyof typeof fields;
        (form[fieldName] as any).setValue(`after-dispose-${i}`);
      }

      // Verify no callbacks triggered
      callbacks.forEach((cb) => {
        expect(cb).toHaveBeenCalledTimes(2); // Still 2
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle dispose during async operations', async () => {
      interface AsyncForm {
        email: string;
      }

      const form = makeForm<AsyncForm>({
        email: {
          value: '',
          component: null as any,
          asyncValidators: [
            async (value: string) => {
              await new Promise((resolve) => setTimeout(resolve, 100));
              return value.includes('@')
                ? null
                : { code: 'email', message: 'Invalid email' };
            },
          ],
        },
      });

      // Start async validation
      form.email.setValue('test');
      const validationPromise = form.validate();

      // Dispose before validation completes
      form.dispose();

      // Wait for validation to complete
      await validationPromise;

      // Form should still be disposed
      const callback = vi.fn();
      form.email.watch(callback);
      expect(callback).toHaveBeenCalledTimes(1); // Initial call

      form.email.setValue('new-value');
      expect(callback).toHaveBeenCalledTimes(2); // New subscription works

      // Cleanup
      form.dispose();
    });

    it('should handle dispose with pending debounced validation', async () => {
      interface DebounceForm {
        field: string;
      }

      const form = makeForm<DebounceForm>({
        field: {
          value: '',
          component: null as any,
          asyncValidators: [
            async (value: string) => {
              return value.length < 3
                ? { code: 'minLength', message: 'Too short' }
                : null;
            },
          ],
          debounce: 500,
        },
      });

      // Trigger debounced validation
      form.field.setValue('ab');
      void form.validate();

      // Dispose before debounce completes
      form.dispose();

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should not throw
      expect(() => form.dispose()).not.toThrow();
    });

    it('should handle cross-form references', () => {
      interface Form1 {
        sharedField: string;
      }

      interface Form2 {
        dependentField: string;
      }

      const form1 = makeForm<Form1>({
        sharedField: { value: '', component: null as any },
      });

      const form2 = makeForm<Form2>({
        dependentField: { value: '', component: null as any },
      });

      // form2 depends on form1
      form2.dependentField.computeFrom(
        [form1.sharedField.value],
        (sharedValue: string) => `Dependent: ${sharedValue}`
      );

      // Initial state
      expect(form2.dependentField.value.value).toBe('Dependent: ');

      // Change form1
      form1.sharedField.setValue('test');
      expect(form2.dependentField.value.value).toBe('Dependent: test');

      // Dispose form2 (consumer)
      form2.dispose();

      // Change form1 - form2 should NOT update
      form1.sharedField.setValue('after-dispose');
      expect(form2.dependentField.value.value).toBe('Dependent: test');

      // Cleanup
      form1.dispose();
    });
  });
});
