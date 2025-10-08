import React from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { Button } from '@/components/ui/button';
import { Input } from '@/lib/forms/components/input';
import { InputPassword } from '@/lib/forms/components/input-password';
import { InputSearch } from '@/lib/forms/components/input-search';
import { InputFiles } from '@/lib/forms/components/input-files';
import { Select } from '@/lib/forms/components/select';
import { Form } from '@/lib/forms/components/form';
import type { FormSchema } from '@/lib/forms/types';
import { searchResource } from '../resources/search.resource';
import { selectResource } from '../resources/select.resource';
import { fileUploader } from '../resources/file-uploader.resource';
import { FormField, FormStore } from '@/lib/forms';

// ============================================================================
// Модель формы
// ============================================================================

interface UsersFormModel {
  input: string | null;
  password: string | null;
  search: string | null;
  select: string | null;
  files: File | null;
}

// ============================================================================
// Создание формы
// ============================================================================

const createUsersForm = () => {
  const schema: FormSchema<UsersFormModel> = {
    input: {
      value: null,
      component: Input,
      componentProps: {
        placeholder: 'Введите текст...'
      }
    },
    password: {
      value: null,
      component: InputPassword,
      componentProps: {
        placeholder: 'Введите пароль...'
      }
    },
    search: {
      value: null,
      component: InputSearch,
      componentProps: {
        placeholder: 'Поиск...',
        resource: searchResource,
        debounce: 300
      }
    },
    select: {
      value: null,
      component: Select,
      componentProps: {
        placeholder: 'Выберите вариант',
        resource: selectResource
      }
    },
    files: {
      value: null,
      component: InputFiles,
      componentProps: {
        uploader: fileUploader,
        accept: 'image/*,.pdf',
        maxSize: 5 * 1024 * 1024 // 5MB
      }
    }
  };

  return new FormStore(schema);
};

// ============================================================================
// Компонент формы
// ============================================================================

function UsersForm() {
  useSignals();

  const form = React.useMemo(() => createUsersForm(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await form.submit(async (values) => {
      console.log('Submitting form:', values);

      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true, data: values };
    });

    if (result) {
      console.log('Form submitted successfully:', result);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-6 max-w-6xl">
      <div className="flex flex-col md:flex-row w-full gap-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-6">Форма пользователя</h1>

          <Form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField control={form.controls.input} label="Текст" />
            <FormField control={form.controls.password} label="Пароль" />
            <FormField control={form.controls.search} label="Поиск" />
            <FormField control={form.controls.select} label="Выбор" />
            <FormField control={form.controls.files} label="Файлы" />

            <div className="flex gap-2 mt-6">
              <Button
                type="submit"
                disabled={form.invalid || form.submitting}
                className="flex-1"
              >
                {form.submitting ? 'Сохранение...' : 'Сохранить'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={form.submitting}
              >
                Сбросить
              </Button>
            </div>

            {/* Индикаторы состояния */}
            <div className="text-sm text-gray-500 space-y-1">
              <div>Valid: {form.valid ? '✓' : '✗'}</div>
              <div>Dirty: {form.dirty ? '✓' : '✗'}</div>
              <div>Touched: {form.touched ? '✓' : '✗'}</div>
              <div>Submitting: {form.submitting ? '✓' : '✗'}</div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default UsersForm;
