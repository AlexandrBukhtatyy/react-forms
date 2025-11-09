/**
 * Mock data для тестов
 */

import type { FormSchema } from '@/lib/forms/core/types';
import { mockComponent } from './test-utils';

// ============================================================================
// Interfaces для тестовых форм
// ============================================================================

export interface TestUserForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface TestAddressForm {
  country: string;
  region: string;
  city: string;
  street: string;
  house: string;
  postalCode: string;
}

export interface TestItemForm {
  title: string;
  price: number;
  description?: string;
}

export interface TestPersonalInfoForm {
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  phone: string;
  email: string;
}

// ============================================================================
// Mock schemas
// ============================================================================

/**
 * Создать простую форму логина
 */
export function createLoginSchema(): FormSchema<TestUserForm> {
  return {
    email: { value: '', component: mockComponent },
    password: { value: '', component: mockComponent },
    confirmPassword: { value: '', component: mockComponent },
  };
}

/**
 * Создать форму адреса
 */
export function createAddressSchema(): FormSchema<TestAddressForm> {
  return {
    country: { value: '', component: mockComponent },
    region: { value: '', component: mockComponent },
    city: { value: '', component: mockComponent },
    street: { value: '', component: mockComponent },
    house: { value: '', component: mockComponent },
    postalCode: { value: '', component: mockComponent },
  };
}

/**
 * Создать схему элемента для ArrayNode
 */
export function createItemSchema(): FormSchema<TestItemForm> {
  return {
    title: { value: '', component: mockComponent },
    price: { value: 0, component: mockComponent },
    description: { value: '', component: mockComponent },
  };
}

/**
 * Создать схему персональной информации
 */
export function createPersonalInfoSchema(): FormSchema<TestPersonalInfoForm> {
  return {
    lastName: { value: '', component: mockComponent },
    firstName: { value: '', component: mockComponent },
    middleName: { value: '', component: mockComponent },
    birthDate: { value: '', component: mockComponent },
    phone: { value: '', component: mockComponent },
    email: { value: '', component: mockComponent },
  };
}

// ============================================================================
// Mock data values
// ============================================================================

/**
 * Валидные данные для формы логина
 */
export const validLoginData: TestUserForm = {
  email: 'test@example.com',
  password: 'SecurePassword123',
  confirmPassword: 'SecurePassword123',
};

/**
 * Невалидные данные для формы логина
 */
export const invalidLoginData: TestUserForm = {
  email: 'invalid-email',
  password: '123', // Слишком короткий
  confirmPassword: '456', // Не совпадает
};

/**
 * Валидные данные для формы адреса
 */
export const validAddressData: TestAddressForm = {
  country: 'RU',
  region: 'Московская область',
  city: 'Москва',
  street: 'Ленина',
  house: '1',
  postalCode: '123456',
};

/**
 * Невалидные данные для формы адреса
 */
export const invalidAddressData: TestAddressForm = {
  country: '',
  region: '',
  city: '',
  street: '',
  house: '',
  postalCode: '12', // Неправильный формат
};

/**
 * Валидные данные для элемента
 */
export const validItemData: TestItemForm = {
  title: 'Товар 1',
  price: 1000,
  description: 'Описание товара',
};

/**
 * Массив валидных элементов
 */
export const validItemsArray: TestItemForm[] = [
  { title: 'Товар 1', price: 100 },
  { title: 'Товар 2', price: 200 },
  { title: 'Товар 3', price: 300 },
];

/**
 * Валидные персональные данные
 */
export const validPersonalInfoData: TestPersonalInfoForm = {
  lastName: 'Иванов',
  firstName: 'Иван',
  middleName: 'Иванович',
  birthDate: '1990-01-01',
  phone: '+79991234567',
  email: 'ivanov@example.com',
};

// ============================================================================
// Mock callbacks
// ============================================================================

/**
 * Mock callback для async валидаторов
 */
export const mockAsyncValidator = async (value: any): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 10));
  return value !== '';
};

/**
 * Mock callback для sync валидаторов
 */
export const mockSyncValidator = (value: any): boolean => {
  return value !== '';
};

/**
 * Mock callback для behavior схем
 */
// @ts-ignore
export const mockBehaviorCallback = (value: any, ctx: any): void => {
  // Mock implementation
};
