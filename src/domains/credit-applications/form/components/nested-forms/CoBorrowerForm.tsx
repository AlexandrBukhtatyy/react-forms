/**
 * CoBorrowerForm
 *
 * Компонент для отдельного созаемщика.
 * Работает с DeepFormStore через GroupProxy (элемент массива).
 *
 * ОСОБЕННОСТЬ: Созаемщик содержит вложенную группу personalData.
 * Демонстрирует работу с массивами, содержащими вложенные группы.
 *
 * Используется с ArrayProxy в родительском компоненте:
 * {form.controls.coBorrowers.map((coBorrower, index) => (
 *   <CoBorrowerForm key={index} control={coBorrower} />
 * ))}
 */

import { useSignals } from '@preact/signals-react/runtime';
import { FormField } from '@/lib/forms/components/form-field';

interface CoBorrowerFormProps {
  // GroupProxy для элемента массива coBorrowers (используем any для обхода ограничений TypeScript)
  control: any;
}

export function CoBorrowerForm({ control }: CoBorrowerFormProps) {
  useSignals();

  return (
    <div className="space-y-4">
      {/* Вложенная группа: personalData */}
      <div className="p-3 bg-gray-50 rounded">
        <h5 className="text-sm font-medium mb-3">Личные данные</h5>
        <div className="space-y-3">
          {/* ФИО */}
          <div className="grid grid-cols-3 gap-3">
            <FormField control={control.personalData.lastName} />
            <FormField control={control.personalData.firstName} />
            <FormField control={control.personalData.middleName} />
          </div>

          {/* Дата рождения */}
          <FormField control={control.personalData.birthDate} />
        </div>
      </div>

      {/* Контактные данные */}
      <div className="grid grid-cols-2 gap-4">
        <FormField control={control.phone} />
        <FormField control={control.email} />
      </div>

      {/* Дополнительная информация */}
      <div className="grid grid-cols-2 gap-4">
        <FormField control={control.relationship} />
        <FormField control={control.monthlyIncome} />
      </div>
    </div>
  );
}
