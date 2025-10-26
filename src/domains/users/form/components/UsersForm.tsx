import React from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { Button } from '@/lib/ui/button';
import { 
  Input,
  InputPassword,
  InputSearch,
  InputFiles,
  Select,
  Form,
} from '@/lib/forms/components';
import type { FormSchema } from '@/lib/forms/types';
import { searchResource } from '../resources/search.resource';
import { selectResource } from '../resources/select.resource';
import { fileUploader } from '../resources/file-uploader.resource';
import { FormField, GroupNode, type GroupNodeWithControls } from '@/lib/forms';
import { useDialog } from '@/context/DialogContext';
import { createUser } from '@/domains/users/_shared/services/users';

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

const createUsersForm = (): GroupNodeWithControls<UsersFormModel> => {
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

  return new GroupNode(schema);
};

// ============================================================================
// Компонент формы
// ============================================================================

interface UsersFormProps {
  openInDialog?: boolean;
}
// TODO: Понимать из контекста где было запущена форма а не через пропс openInDialog
function UsersForm({ openInDialog = false }: UsersFormProps) {
  useSignals();

  const form = React.useMemo(() => createUsersForm(), []);
  const { closeDialog } = useDialog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await form.submit(async (values) => {
        const newUser = await createUser({
          login: values.input || '',
          email: values.search || '',
          password: values.password || '',
          status: 'active',
          role: 'user'
        });
        return { success: true, data: newUser };
      });
      if (openInDialog) {
        // TODO: Добавить алерт успеха
        closeDialog(result);
      }
    } catch (error) {
      // TODO: Добавить алерт ошибки
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full gap-8">
      <div className="flex-1">
        <Form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField control={form.input}/>
          <FormField control={form.password}/>
          <FormField control={form.search}/>
          <FormField control={form.select}/>
          <FormField control={form.files}/>

          <div className="flex gap-2 mt-6">
            <Button
              type="submit"
              disabled={form.invalid.value || form.submitting.value}
              className="flex-1"
            >
              {form.submitting.value ? 'Сохранение...' : 'Сохранить'}
            </Button>

            <Button
              type="button"
              onClick={() => form.reset()}
              disabled={form.submitting.value}
            >
              Сбросить
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default UsersForm;
