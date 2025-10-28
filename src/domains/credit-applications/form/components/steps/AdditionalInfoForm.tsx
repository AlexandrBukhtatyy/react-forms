/**
 * AdditionalInfoForm (Step 5)
 *
 * Демонстрирует работу с массивами форм через готовые компоненты:
 * - PropertyForm (имущество)
 * - ExistingLoanForm (кредиты)
 * - CoBorrowerForm (созаемщики с вложенной personalData)
 *
 * NOTE: Массивы будут активированы после раскомментирования в схеме
 */

import type { GroupNodeWithControls } from '@/lib/forms';
import { FormField, FormArrayManager } from '@/lib/forms/components';
import { PropertyForm } from '../nested-forms/PropertyForm';
import { ExistingLoanForm } from '../nested-forms/ExistingLoanForm';
import { CoBorrowerForm } from '../nested-forms/CoBorrowerForm';
import type { CreditApplicationForm } from '../../types/credit-application';

interface AdditionalInfoFormProps {
  control: GroupNodeWithControls<CreditApplicationForm>;
}

export function AdditionalInfoForm({ control }: AdditionalInfoFormProps) {
  const hasProperty = control.hasProperty.value.value;
  const hasExistingLoans = control.hasExistingLoans.value.value;
  const hasCoBorrower = control.hasCoBorrower.value.value;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Дополнительная информация</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Общая информация</h3>

        <FormField control={control.maritalStatus} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={control.dependents} />
          <FormField control={control.education} />
        </div>
      </div>

      <div className="space-y-4">
        <FormField control={control.hasProperty} />

        {hasProperty && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Имущество</h3>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => control.properties.push()}
              >
                + Добавить имущество
              </button>
            </div>

            <FormArrayManager
              control={control.properties}
              component={PropertyForm}
              itemLabel="Имущество"
            />

            {control.properties.length.value === 0 && (
              <div className="p-4 bg-gray-100 border border-gray-300 rounded text-center text-gray-600">
                Нажмите "Добавить имущество" для добавления информации
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <FormField control={control.hasExistingLoans} />

        {hasExistingLoans && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Существующие кредиты</h3>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => control.existingLoans.push()}
              >
                + Добавить кредит
              </button>
            </div>

            <FormArrayManager
              control={control.existingLoans}
              component={ExistingLoanForm}
              itemLabel="Кредит"
            />

            {control.existingLoans.length.value === 0 && (
              <div className="p-4 bg-gray-100 border border-gray-300 rounded text-center text-gray-600">
                Нажмите "Добавить кредит" для добавления информации
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <FormField control={control.hasCoBorrower} />

        {hasCoBorrower && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Созаемщики</h3>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => control.coBorrowers.push()}
              >
                + Добавить созаемщика
              </button>
            </div>

            <FormArrayManager
              control={control.coBorrowers}
              component={CoBorrowerForm}
              itemLabel="Созаемщик"
            />

            {control.coBorrowers.length.value === 0 && (
              <div className="p-4 bg-gray-100 border border-gray-300 rounded text-center text-gray-600">
                Нажмите "Добавить созаемщика" для добавления информации
                <div className="mt-2 text-xs text-gray-500">
                  CoBorrowerForm поддерживает вложенную группу personalData
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
