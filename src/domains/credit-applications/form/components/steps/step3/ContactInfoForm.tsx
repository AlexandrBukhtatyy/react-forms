import { useSignals } from '@preact/signals-react/runtime';
import type { FormStore } from '@/lib/forms/core/form-store';
import type { CreditApplicationForm } from '../../../../_shared/types/credit-application';
import { FormField } from '@/lib/forms/components';
import { AddressForm } from '../../nested-forms';

interface ContactInfoFormProps {
  form: FormStore<CreditApplicationForm>;
}

export function ContactInfoForm({ form }: ContactInfoFormProps) {
  useSignals();

  const sameAsRegistration = form.controls.sameAsRegistration.value;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Контактная информация</h2>

      {/* Телефоны и Email */}
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

      {/* Вложенная форма: Адрес регистрации */}
      <h3 className="text-lg font-semibold">Адрес регистрации</h3>
      <AddressForm control={form.controls.registrationAddress} />

      {/* Адрес проживания */}
      <div className="space-y-4">
        <FormField control={form.controls.sameAsRegistration} />

        {/* Вложенная форма: Адрес проживания (условная) */}
        {!sameAsRegistration && (
          <>
            <h3 className="text-lg font-semibold">Адрес проживания</h3>
            <AddressForm control={form.controls.residenceAddress} />
          </>
        )}
      </div>
    </div>
  );
}
