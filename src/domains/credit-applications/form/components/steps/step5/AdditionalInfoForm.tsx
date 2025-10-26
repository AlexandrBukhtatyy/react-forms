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

import { useSignals } from '@preact/signals-react/runtime';
import type { GroupNodeWithControls } from '@/lib/forms';
import { FormField, FormArrayManager } from '@/lib/forms/components';
import { PropertyForm } from '../../nested-forms/PropertyForm';
import { ExistingLoanForm } from '../../nested-forms/ExistingLoanForm';
import { CoBorrowerForm } from '../../nested-forms/CoBorrowerForm';
import type { CreditApplicationForm } from '../../../types/credit-application';

interface AdditionalInfoFormProps {
  form: GroupNodeWithControls<CreditApplicationForm>;
}

export function AdditionalInfoForm({ form }: AdditionalInfoFormProps) {
  useSignals();

  const hasProperty = form.hasProperty.value.value;
  const hasExistingLoans = form.hasExistingLoans.value.value;
  const hasCoBorrower = form.hasCoBorrower.value.value;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Дополнительная информация</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Общая информация</h3>

        <FormField control={form.maritalStatus} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.dependents} />
          <FormField control={form.education} />
        </div>
      </div>

      <div className="space-y-4">
        <FormField control={form.hasProperty} />

        {hasProperty && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Имущество</h3>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => form.properties.push()}
              >
                + Добавить имущество
              </button>
            </div>

            <FormArrayManager
              control={form.properties}
              component={PropertyForm}
              itemLabel="Имущество"
            />

            {form.properties.length.value === 0 && (
              <div className="p-4 bg-gray-100 border border-gray-300 rounded text-center text-gray-600">
                Нажмите "Добавить имущество" для добавления информации
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <FormField control={form.hasExistingLoans} />

        {hasExistingLoans && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Существующие кредиты</h3>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => form.existingLoans.push()}
              >
                + Добавить кредит
              </button>
            </div>

            <FormArrayManager
              control={form.existingLoans}
              component={ExistingLoanForm}
              itemLabel="Кредит"
            />

            {form.existingLoans.length.value === 0 && (
              <div className="p-4 bg-gray-100 border border-gray-300 rounded text-center text-gray-600">
                Нажмите "Добавить кредит" для добавления информации
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <FormField control={form.hasCoBorrower} />

        {hasCoBorrower && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Созаемщики</h3>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => form.coBorrowers.push()}
              >
                + Добавить созаемщика
              </button>
            </div>

            <FormArrayManager
              control={form.coBorrowers}
              component={CoBorrowerForm}
              itemLabel="Созаемщик"
            />

            {form.coBorrowers.length.value === 0 && (
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
