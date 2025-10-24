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
import type { DeepFormStore } from '@/lib/forms/core/deep-form-store';
import { FormField, FormArrayManager } from '@/lib/forms/components';
import { PropertyForm } from '../../nested-forms/PropertyForm';
import { ExistingLoanForm } from '../../nested-forms/ExistingLoanForm';
import { CoBorrowerForm } from '../../nested-forms/CoBorrowerForm';

interface AdditionalInfoFormProps {
  form: DeepFormStore<any>;
}

export function AdditionalInfoForm({ form }: AdditionalInfoFormProps) {
  useSignals();

  const hasProperty = form.controls.hasProperty.value;
  const hasExistingLoans = form.controls.hasExistingLoans.value;
  const hasCoBorrower = form.controls.hasCoBorrower.value;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Дополнительная информация</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Общая информация</h3>

        <FormField control={form.controls.maritalStatus} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.controls.dependents} />
          <FormField control={form.controls.education} />
        </div>
      </div>

      <div className="space-y-4">
        <FormField control={form.controls.hasProperty} />

        {hasProperty && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Имущество</h3>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => (form.controls.properties as any).push()}
              >
                + Добавить имущество
              </button>
            </div>

            <FormArrayManager
              control={form.controls.properties as any}
              component={PropertyForm}
            />

            {(form.controls.properties as any).length.value === 0 && (
              <div className="p-4 bg-gray-100 border border-gray-300 rounded text-center text-gray-600">
                Нажмите "Добавить имущество" для добавления информации
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <FormField control={form.controls.hasExistingLoans} />

        {hasExistingLoans && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Существующие кредиты</h3>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => (form.controls.existingLoans as any).push()}
              >
                + Добавить кредит
              </button>
            </div>

            <FormArrayManager
              control={form.controls.existingLoans as any}
              component={ExistingLoanForm}
            />

            {(form.controls.existingLoans as any).length.value === 0 && (
              <div className="p-4 bg-gray-100 border border-gray-300 rounded text-center text-gray-600">
                Нажмите "Добавить кредит" для добавления информации
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <FormField control={form.controls.hasCoBorrower} />

        {hasCoBorrower && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Созаемщики</h3>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => (form.controls.coBorrowers as any).push()}
              >
                + Добавить созаемщика
              </button>
            </div>

            <FormArrayManager
              control={form.controls.coBorrowers as any}
              component={CoBorrowerForm}
            />

            {(form.controls.coBorrowers as any).length.value === 0 && (
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
