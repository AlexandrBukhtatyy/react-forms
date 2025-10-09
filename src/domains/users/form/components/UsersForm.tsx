import React from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { Button } from '@/lib/ui/button';
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
        label: 'Текст',
        placeholder: 'Введите текст...'
      }
    },
    password: {
      value: null,
      component: InputPassword,
      componentProps: {
        label: 'Пароль',
        placeholder: 'Введите пароль...'
      }
    },
    search: {
      value: null,
      component: InputSearch,
      componentProps: {
        label: 'Поиск',
        placeholder: 'Поиск...',
        resource: searchResource,
        debounce: 300
      }
    },
    select: {
      value: null,
      component: Select,
      componentProps: {
        label: 'Выбор',
        placeholder: 'Выберите вариант',
        resource: selectResource
      }
    },
    files: {
      value: null,
      component: InputFiles,
      componentProps: {
        label: 'Файлы',
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
    <div className="flex flex-col md:flex-row w-full gap-8">
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-6">Форма пользователя</h1>

        <Form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField control={form.controls.input}/>
          <FormField control={form.controls.password}/>
          <FormField control={form.controls.search}/>
          <FormField control={form.controls.select}/>
          <FormField control={form.controls.files}/>

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
          <div className="flex gap-6 text-sm text-gray-500 space-y-1">
            <span>Valid: {form.valid ? '✓' : '✗'}</span>
            <span>Dirty: {form.dirty ? '✓' : '✗'}</span>
            <span>Touched: {form.touched ? '✓' : '✗'}</span>
            <span>Submitting: {form.submitting ? '✓' : '✗'}</span>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default UsersForm;
