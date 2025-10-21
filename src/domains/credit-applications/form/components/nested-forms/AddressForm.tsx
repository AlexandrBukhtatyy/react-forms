/**
 * AddressForm
 *
 * Полностью переиспользуемый компонент для ввода адреса.
 * Работает с DeepFormStore через GroupProxy.
 *
 * Можно использовать для:
 * - Адреса регистрации
 * - Адреса проживания
 * - Адреса работы
 * - Любого другого адреса
 *
 * Использование:
 * <AddressForm control={form.controls.registrationAddress} />
 * <AddressForm control={form.controls.residenceAddress} />
 */

import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/form-field';

interface AddressFormProps {
  // GroupProxy для вложенной формы address (используем any для обхода ограничений TypeScript)
  control: any;
}

export function AddressForm({ control }: AddressFormProps) {
  useSignals();

  return (
    <div className="space-y-4">
      {/* Регион и город */}
      <div className="grid grid-cols-2 gap-4">
        <FormField control={control.region} />
        <FormField control={control.city} />
      </div>

      {/* Улица */}
      <FormField control={control.street} />

      {/* Дом, квартира, индекс */}
      <div className="grid grid-cols-3 gap-4">
        <FormField control={control.house} />
        <FormField control={control.apartment} />
        <FormField control={control.postalCode} />
      </div>
    </div>
  );
}
