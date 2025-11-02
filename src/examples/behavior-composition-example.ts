/**
 * Примеры композиции Behavior Schema
 *
 * Демонстрирует использование функций apply, applyWhen, toBehaviorFieldPath
 * для переиспользования behavior схем.
 *
 * Аналог toFieldPath из validation API.
 */

import { GroupNode } from '@/lib/forms';
import type { BehaviorSchemaFn, FieldPath } from '@/lib/forms';
import { apply, applyWhen, toBehaviorFieldPath, watchField, computeFrom } from '@/lib/forms/behaviors';

// ============================================================================
// Пример 1: Базовая композиция - применение одной схемы к нескольким полям
// ============================================================================

interface Address {
  country: string;
  region: string;
  city: string;
  street: string;
  postalCode: string;
}

interface UserForm {
  name: string;
  homeAddress: Address;
  workAddress: Address;
  billingAddress: Address;
}

// Модульная behavior схема для Address
const addressBehavior: BehaviorSchemaFn<Address> = (path: FieldPath<Address>) => {
  // Динамическая загрузка городов при изменении региона
  watchField(path.region, async (region, ctx) => {
    if (region) {
      const cities = await fetchCities(region);
      ctx.updateComponentProps(path.city, { options: cities });
    }
  }, { debounce: 300 });

  // Очистка зависимых полей
  watchField(path.region, (region, ctx) => {
    ctx.setField('city', '');
  });

  // Автоформатирование почтового индекса
  watchField(path.postalCode, (code, ctx) => {
    const formatted = code?.replace(/\D/g, '').slice(0, 6);
    if (formatted !== code) {
      ctx.setField('postalCode', formatted || '');
    }
  });
};

// Главная схема с композицией
const userBehavior: BehaviorSchemaFn<UserForm> = (path: FieldPath<UserForm>) => {
  // ✅ Применяем addressBehavior к трём полям сразу
  apply([path.homeAddress, path.workAddress, path.billingAddress], addressBehavior);
};

const example1 = () => {
  const form = new GroupNode<UserForm>({
    form: {
      name: { value: '', component: Input },
      homeAddress: addressFormSchema,
      workAddress: addressFormSchema,
      billingAddress: addressFormSchema,
    },
    behavior: userBehavior,
  });

  console.log('Example 1: Behavior applied to 3 address fields');
};

// ============================================================================
// Пример 2: Применение нескольких схем к одному полю
// ============================================================================

interface ProductForm {
  title: string;
  price: number;
  discount: number;
  finalPrice: number;
  metadata: {
    slug: string;
    searchTerms: string[];
  };
}

// Behavior для slug generation
const slugBehavior: BehaviorSchemaFn<ProductForm['metadata']> = (path) => {
  watchField(path.slug, (slug, ctx) => {
    // Автоматическое форматирование slug
    const formatted = slug
      ?.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');

    if (formatted !== slug) {
      ctx.setField('slug', formatted || '');
    }
  });
};

// Behavior для search terms generation
const searchTermsBehavior: BehaviorSchemaFn<ProductForm['metadata']> = (path) => {
  watchField(path.slug, (slug, ctx) => {
    if (slug) {
      const terms = slug.split('-').filter(Boolean);
      ctx.setField('searchTerms', terms);
    }
  }, { debounce: 500 });
};

const productBehavior: BehaviorSchemaFn<ProductForm> = (path) => {
  // ✅ Применяем несколько схем к одному полю
  apply(path.metadata, [slugBehavior, searchTermsBehavior]);

  // Вычисление финальной цены
  computeFrom(
    path.finalPrice,
    [path.price, path.discount],
    ({ price, discount }) => price * (1 - discount / 100)
  );
};

const example2 = () => {
  console.log('Example 2: Multiple behaviors applied to metadata field');
};

// ============================================================================
// Пример 3: Условная композиция через applyWhen
// ============================================================================

interface OrderForm {
  hasShipping: boolean;
  shippingAddress: Address;
  sameBillingAddress: boolean;
  billingAddress: Address;
}

const orderBehavior: BehaviorSchemaFn<OrderForm> = (path) => {
  // ✅ Условное применение: только если hasShipping === true
  applyWhen(
    path.hasShipping,
    (value) => value === true,
    (path) => {
      apply(path.shippingAddress, addressBehavior);
    }
  );

  // ✅ Применение к billing address (безусловно)
  apply(path.billingAddress, addressBehavior);
};

const example3 = () => {
  console.log('Example 3: Conditional behavior application');
};

// ============================================================================
// Пример 4: Вложенная композиция через toBehaviorFieldPath
// ============================================================================

interface CompanyForm {
  name: string;
  headquarters: {
    address: Address;
    phone: string;
  };
  branches: Array<{
    name: string;
    address: Address;
  }>;
}

// Behavior для headquarters
const headquartersBehavior: BehaviorSchemaFn<CompanyForm['headquarters']> = (path) => {
  // ✅ Используем toBehaviorFieldPath для вложенного поля
  addressBehavior(toBehaviorFieldPath(path.address));

  // Дополнительная логика для headquarters
  watchField(path.phone, (phone, ctx) => {
    const formatted = phone?.replace(/\D/g, '');
    if (formatted !== phone) {
      ctx.setField('phone', formatted || '');
    }
  });
};

const companyBehavior: BehaviorSchemaFn<CompanyForm> = (path) => {
  // Применяем схему к headquarters
  apply(path.headquarters, headquartersBehavior);

  // ПРИМЕЧАНИЕ: Для массивов branches используется ArrayNode.applyBehaviorSchema
  // Это будет реализовано в будущем (аналог validateItems для behaviors)
};

const example4 = () => {
  console.log('Example 4: Nested behavior composition with toBehaviorFieldPath');
};

// ============================================================================
// Пример 5: Комбинированное использование
// ============================================================================

interface RegistrationForm {
  personal: {
    firstName: string;
    lastName: string;
    fullName: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  addresses: {
    home: Address;
    work: Address;
  };
  sameWorkAddress: boolean;
}

// Behavior для personal info
const personalBehavior: BehaviorSchemaFn<RegistrationForm['personal']> = (path) => {
  computeFrom(
    path.fullName,
    [path.firstName, path.lastName],
    ({ firstName, lastName }) => `${firstName} ${lastName}`.trim()
  );
};

// Behavior для contact info
const contactBehavior: BehaviorSchemaFn<RegistrationForm['contact']> = (path) => {
  watchField(path.email, (email, ctx) => {
    const trimmed = email?.trim().toLowerCase();
    if (trimmed !== email) {
      ctx.setField('email', trimmed || '');
    }
  });
};

const registrationBehavior: BehaviorSchemaFn<RegistrationForm> = (path) => {
  // ✅ Композиция для разных секций формы
  apply(path.personal, personalBehavior);
  apply(path.contact, contactBehavior);
  apply([path.addresses.home, path.addresses.work], addressBehavior);

  // ✅ Условная композиция
  applyWhen(
    path.sameWorkAddress,
    (value) => value === false,
    (path) => {
      apply(path.addresses.work, addressBehavior);
    }
  );
};

const example5 = () => {
  console.log('Example 5: Combined usage of apply, applyWhen, and toBehaviorFieldPath');
};

// ============================================================================
// Вспомогательные функции (заглушки)
// ============================================================================

const fetchCities = async (region: string): Promise<string[]> => {
  return ['City 1', 'City 2', 'City 3'];
};

const Input = () => null;
const addressFormSchema = {};

// ============================================================================
// Экспорт примеров
// ============================================================================

export const behaviorCompositionExamples = {
  example1,
  example2,
  example3,
  example4,
  example5,
};

// Запустить все примеры
export const runAllExamples = () => {
  console.log('='.repeat(60));
  console.log('Behavior Composition Examples');
  console.log('='.repeat(60));

  example1();
  example2();
  example3();
  example4();
  example5();

  console.log('='.repeat(60));
};
