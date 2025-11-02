/**
 * Test helpers index - экспорт всех утилит для тестов
 */

// Test utilities
export {
  createTestForm,
  createTestArray,
  waitForValidation,
  waitForDebounce,
  mockComponent,
  isFormValid,
  hasFormErrors,
  getErrorCount,
} from './test-utils';

// Mock data
export {
  // Schemas
  createLoginSchema,
  createAddressSchema,
  createItemSchema,
  createPersonalInfoSchema,
  // Data
  validLoginData,
  invalidLoginData,
  validAddressData,
  invalidAddressData,
  validItemData,
  validItemsArray,
  validPersonalInfoData,
  // Callbacks
  mockAsyncValidator,
  mockSyncValidator,
  mockBehaviorCallback,
  // Types
  type TestUserForm,
  type TestAddressForm,
  type TestItemForm,
  type TestPersonalInfoForm,
} from './mock-data';

// Custom matchers
export {} from './custom-matchers';
