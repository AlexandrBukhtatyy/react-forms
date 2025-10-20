import { useSignals } from '@preact/signals-react/runtime';
import type { FormStore } from '@/lib/forms/core/form-store';
import type { CreditApplicationForm } from '../../_shared/types/credit-application';
import { FormField } from '@/lib/forms/components';

interface Step6Props {
  form: FormStore<CreditApplicationForm>;
}

export function Step6Confirmation({ form }: Step6Props) {
  useSignals();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Подтверждение и согласия</h2>

      {/* Информационное сообщение */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          Пожалуйста, внимательно ознакомьтесь с условиями и дайте необходимые согласия перед отправкой заявки.
        </p>
      </div>

      {/* Согласия */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Обязательные согласия</h3>

        <div className="space-y-3">
          <FormField control={form.controls.agreePersonalData} />
          <FormField control={form.controls.agreeCreditHistory} />
          <FormField control={form.controls.agreeTerms} />
          <FormField control={form.controls.confirmAccuracy} />
        </div>
      </div>

      {/* Опциональные согласия */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mt-6">Опциональные согласия</h3>
        <FormField control={form.controls.agreeMarketing} />
      </div>

      {/* Электронная подпись */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mt-6">Электронная подпись</h3>
        <FormField control={form.controls.electronicSignature} />
        <p className="text-xs text-gray-500">
          Введите код из SMS, отправленный на ваш номер телефона
        </p>
      </div>

      {/* Финальное предупреждение */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mt-6">
        <p className="text-sm text-yellow-800">
          <strong>Внимание!</strong> После нажатия кнопки "Отправить заявку" вы подтверждаете достоверность предоставленной информации и согласие с условиями кредитования.
        </p>
      </div>

      {/* Информация о дальнейших действиях */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <h4 className="font-semibold text-green-900 mb-2">Что будет дальше?</h4>
        <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
          <li>Ваша заявка будет рассмотрена в течение 24 часов</li>
          <li>Мы свяжемся с вами для подтверждения информации</li>
          <li>После одобрения вы получите индивидуальное предложение</li>
          <li>Вы сможете подписать договор онлайн или в офисе</li>
        </ul>
      </div>
    </div>
  );
}
