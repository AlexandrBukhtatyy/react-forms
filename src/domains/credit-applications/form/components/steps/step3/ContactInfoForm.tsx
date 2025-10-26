/**
 * ContactInfoForm (Step 3)
 *
 * Демонстрирует:
 * - Переиспользование AddressForm для двух разных адресов
 * - Операции с группами: getValue(), setValue()
 * - Условное отображение вложенных форм
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { GroupNodeWithControls } from '@/lib/forms';
import { FormField } from '@/lib/forms/components';
import { Button } from '@/lib/ui/button';
import { AddressForm } from '../../nested-forms/AddressForm';
import type { CreditApplicationForm } from '../../../types/credit-application';

interface ContactInfoFormProps {
  form: GroupNodeWithControls<CreditApplicationForm>;
}

export function ContactInfoForm({ form }: ContactInfoFormProps) {
  useSignals();

  const sameAsRegistration = form.sameAsRegistration.value.value;

  // Копировать адрес регистрации в адрес проживания
  const copyRegistrationAddress = () => {
    const regAddress = form.registrationAddress.getValue();
    form.residenceAddress.setValue(regAddress);
  };

  // Очистить адрес проживания
  const clearResidenceAddress = () => {
    form.residenceAddress.reset();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Контактная информация</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Контакты</h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.phoneMain} />
          <FormField control={form.phoneAdditional} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.email} />
          <FormField control={form.emailAdditional} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Адрес регистрации</h3>
        <AddressForm control={form.registrationAddress} />
      </div>

      <FormField control={form.sameAsRegistration} />
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

          <AddressForm control={form.residenceAddress} />

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
