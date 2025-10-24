/**
 * ContactInfoForm (Step 3)
 *
 * Демонстрирует:
 * - Переиспользование AddressForm для двух разных адресов
 * - Операции с группами: getValue(), setValue()
 * - Условное отображение вложенных форм
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { DeepFormStore } from '@/lib/forms/core/deep-form-store';
import { FormField } from '@/lib/forms/components';
import { Button } from '@/lib/ui/button';
import { AddressForm } from '../../nested-forms/AddressForm';

interface ContactInfoFormProps {
  form: DeepFormStore<any>;
}

export function ContactInfoForm({ form }: ContactInfoFormProps) {
  useSignals();

  const sameAsRegistration = form.controls.sameAsRegistration.value;

  // Копировать адрес регистрации в адрес проживания
  const copyRegistrationAddress = () => {
    const regAddress = form.controls.registrationAddress.getValue();
    form.controls.residenceAddress.setValue(regAddress);
  };

  // Очистить адрес проживания
  const clearResidenceAddress = () => {
    form.controls.residenceAddress.reset();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Контактная информация</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Контакты</h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.controls.phoneMain} />
          <FormField control={form.controls.phoneAdditional} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.controls.email} />
          <FormField control={form.controls.emailAdditional} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Адрес регистрации</h3>
        <AddressForm control={form.controls.registrationAddress} />
      </div>

      <FormField control={form.controls.sameAsRegistration} />
      {!sameAsRegistration && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Адрес проживания</h3>
            <Button
              type="button"
              size="sm"
              onClick={copyRegistrationAddress}
            >
              Скопировать из адреса регистрации
            </Button>
          </div>

          <AddressForm control={form.controls.residenceAddress} />

          <Button
            type="button"
            size="sm"
            onClick={clearResidenceAddress}
          >
            Очистить адрес проживания
          </Button>
        </div>
      )}
    </div>
  );
}
