import { useSignals } from '@preact/signals-react/runtime';
import { FieldController } from '@/lib/forms/core/field-controller';
import { FormField } from '@/lib/forms/components/form-field';
import type { Address } from '../../../_shared/types/credit-application';

interface AddressFormProps {
  // Контроллер всей вложенной формы Address
  control: FieldController<Address>;
}

/**
 * Отдельный компонент для вложенной формы Address
 * Полностью переиспользуемый компонент - можно использовать для:
 * - Адреса регистрации
 * - Адреса проживания
 * - Адреса работы
 * - Любого другого адреса
 */
export function AddressForm({ control }: AddressFormProps) {
  useSignals();

  return (
    <>
      {/* Регион */}
      <FormField control={control.region as any} />

      {/* Город */}
      <FormField control={control.city as any} />

      {/* Улица */}
      <FormField control={control.street as any} />

      {/* Дом и квартира */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control.house as any} />
        <FormField control={control.apartment as any} />
      </div>

      {/* Почтовый индекс */}
      <FormField control={control.postalCode as any} />
    </>
  );
}
