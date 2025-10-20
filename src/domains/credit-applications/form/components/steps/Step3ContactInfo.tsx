import { useSignals } from '@preact/signals-react/runtime';
import type { FormStore } from '@/lib/forms/core/form-store';
import type { CreditApplicationForm } from '../../_shared/types/credit-application';
import { FormField } from '@/lib/forms/components';
import { AddressForm } from '../nested-forms';

interface Step3Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step3ContactInfo({ form }: Step3Props) {
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
      <AddressForm
        title="Адрес регистрации"
        regionControl={form.controls.registrationAddress_region}
        cityControl={form.controls.registrationAddress_city}
        streetControl={form.controls.registrationAddress_street}
        houseControl={form.controls.registrationAddress_house}
        apartmentControl={form.controls.registrationAddress_apartment}
        postalCodeControl={form.controls.registrationAddress_postalCode}
      />

      {/* Адрес проживания */}
      <div className="space-y-4">
        <FormField control={form.controls.sameAsRegistration} />

        {/* Вложенная форма: Адрес проживания (условная) */}
        {!sameAsRegistration && (
          <AddressForm
            title="Адрес проживания"
            regionControl={form.controls.residenceAddress_region!}
            cityControl={form.controls.residenceAddress_city!}
            streetControl={form.controls.residenceAddress_street!}
            houseControl={form.controls.residenceAddress_house!}
            apartmentControl={form.controls.residenceAddress_apartment!}
            postalCodeControl={form.controls.residenceAddress_postalCode!}
          />
        )}
      </div>
    </div>
  );
}
