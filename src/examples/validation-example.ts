/**
 * Пример использования функционального API валидации (Angular Signal Forms style)
 */

import { FormStore } from '../lib/forms/core/form-store';
import type { FieldPath } from '../lib/forms/types';
import {
  required,
  minLength,
  maxLength,
  email,
  pattern,
  min,
  max,
  validate,
  validateAsync,
  validateTree,
  apply,
  applyWhen,
  updateOn,
} from '../lib/forms/validators';

// Определяем модель формы
interface UserRegistrationForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
  country: string;
  city: string;
  acceptTerms: boolean;
}

// Мок-функция для проверки уникальности имени пользователя
async function checkUsernameExists(username: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const existingUsernames = ['admin', 'test', 'user'];
  return existingUsernames.includes(username.toLowerCase());
}

const usernameSchema = (path: FieldPath<UserRegistrationForm>) => {
  required(path.username, { message: 'Имя пользователя обязательно' });
  minLength(path.username, 3, { message: 'Минимум 3 символа' });
  maxLength(path.username, 20, { message: 'Максимум 20 символов' });
}

/**
 * Схема валидации (чистые функции, без билдера!)
 * Максимально похоже на Angular Signal Forms
 */
const userValidationSchema = (path: FieldPath<UserRegistrationForm>) => {
  // ============================================================================
  // Обязательные поля
  // ============================================================================

  required(path.email, { message: 'Email обязателен' });
  required(path.password, { message: 'Пароль обязателен' });
  required(path.confirmPassword, { message: 'Подтвердите пароль' });
  required(path.age, { message: 'Возраст обязателен' });
  required(path.acceptTerms, { message: 'Необходимо принять условия' });

  // ============================================================================
  // Валидация строк
  // ============================================================================

  minLength(path.username, 3, { message: 'Минимум 3 символа' });
  maxLength(path.username, 20, { message: 'Максимум 20 символов' });

  // Email
  email(path.email);

  // Проверять email только при потере фокуса
  updateOn(path.email, 'blur');

  // ============================================================================
  // Валидация пароля
  // ============================================================================

  minLength(path.password, 8, { message: 'Минимум 8 символов' });
  pattern(path.password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Должен содержать заглавные и строчные буквы, а также цифры',
  });

  // ============================================================================
  // Валидация числовых полей
  // ============================================================================

  min(path.age, 18, { message: 'Минимальный возраст: 18 лет' });
  max(path.age, 100, { message: 'Максимальный возраст: 100 лет' });

  // ============================================================================
  // Кастомные валидаторы
  // ============================================================================

  // Имя пользователя не должно содержать пробелы
  validate(path.username, (ctx) => {
    const value = ctx.value();
    if (value.includes(' ')) {
      return {
        code: 'noSpaces',
        message: 'Имя пользователя не должно содержать пробелы',
      };
    }
    return null;
  });

  // Checkbox должен быть отмечен
  validate(path.acceptTerms, (ctx) => {
    const value = ctx.value();
    if (value !== true) {
      return {
        code: 'mustAccept',
        message: 'Вы должны принять условия использования',
      };
    }
    return null;
  });

  // ============================================================================
  // Асинхронные валидаторы
  // ============================================================================

  // Проверка уникальности имени пользователя с debounce
  validateAsync(
    path.username,
    async (ctx) => {
      const value = ctx.value();

      // Не проверяем, если поле пустое (это обрабатывает required)
      if (!value) return null;

      const exists = await checkUsernameExists(value);
      if (exists) {
        return {
          code: 'usernameExists',
          message: 'Это имя пользователя уже занято',
        };
      }
      return null;
    },
    { debounce: 500 }
  );

  // ============================================================================
  // Cross-field валидация
  // ============================================================================

  // Проверка совпадения паролей
  validateTree(
    (ctx) => {
      const formValue = ctx.formValue();
      if (formValue.password && formValue.confirmPassword) {
        if (formValue.password !== formValue.confirmPassword) {
          return {
            code: 'passwordMismatch',
            message: 'Пароли не совпадают',
          };
        }
      }
      return null;
    },
    { targetField: 'confirmPassword' } // Ошибка будет показана на поле confirmPassword
  );

  // ============================================================================
  // Условная валидация
  // ============================================================================

  // Город обязателен только для России
  applyWhen(path.country, (value) => value === 'Russia', (path) => {
    required(path.city, { message: 'Укажите город для России' });
  });

  // Для несовершеннолетних (хотя по age >= 18, это демонстрация)
  applyWhen(path.age, (age) => age < 21, (path) => {
    minLength(path.username, 5, {
      message: 'Для пользователей младше 21 года требуется имя не короче 5 символов',
    });
  });

  // ============================================================================
  // Переиспользование валидации
  // ============================================================================
  apply(path.username, usernameSchema)
};

/**
 * Создание и использование формы
 */
export function createUserRegistrationForm() {
  const form = new FormStore<UserRegistrationForm>(
    {
      username: {
        value: '',
        component: () => null, // Компонент указывается при использовании в React
      },
      email: {
        value: '',
        component: () => null,
      },
      password: {
        value: '',
        component: () => null,
      },
      confirmPassword: {
        value: '',
        component: () => null,
      },
      age: {
        value: 18,
        component: () => null,
      },
      country: {
        value: '',
        component: () => null,
      },
      city: {
        value: '',
        component: () => null,
      },
      acceptTerms: {
        value: false,
        component: () => null,
      },
    },
    userValidationSchema // Передаем схему валидации
  );

  return form;
}

/**
 * Пример использования формы
 */
export async function exampleUsage() {
  const form = createUserRegistrationForm();

  // Устанавливаем значения #1
  form.setValue({
    username: 'john',
    email: 'john@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
    age: 25,
    country: 'USA',
    acceptTerms: true,
  });

  // Устанавливаем значения #2
  // form.controls.username.setValue('john');
  // form.controls.email.setValue('john@example.com');
  // form.controls.password.setValue('Password123');
  // form.controls.confirmPassword.setValue('Password123');
  // form.controls.age.setValue(25);
  // form.controls.country.setValue('USA');
  // form.controls.acceptTerms.setValue(true);

  // Частичное обновление значения
  // form.patchValue({...})
  // form.controls.username.patchValue('john');

  // Валидируем форму
  const isValid = await form.validate();

  if (isValid) {
    console.log('Form is valid!', form.getValue());
  } else {
    console.log('Form is invalid');

    // Показываем ошибки
    Object.entries(form.controls).forEach(([key, control]) => {
      if (control.invalid) {
        console.log(`${key}:`, control.errors);
      }
    });
  }

  // Отправка формы
  await form.submit(async (values) => {
    console.log('Submitting:', values);
    // Здесь отправка на сервер
    return { success: true };
  });
}
