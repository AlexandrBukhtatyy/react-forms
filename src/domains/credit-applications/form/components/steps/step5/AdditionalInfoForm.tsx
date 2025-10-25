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
import type { GroupNode } from '@/lib/forms/core/nodes/group-node';
import { FormField, FormArrayManager } from '@/lib/forms/components';
import { PropertyForm } from '../../nested-forms/PropertyForm';
import { ExistingLoanForm } from '../../nested-forms/ExistingLoanForm';
import { CoBorrowerForm } from '../../nested-forms/CoBorrowerForm';

interface AdditionalInfoFormProps {
  form: GroupNode<any>;
}

export function AdditionalInfoForm({ form }: AdditionalInfoFormProps) {
  useSignals();

  const hasProperty = (form as any).hasProperty.value.value;
  const hasExistingLoans = (form as any).hasExistingLoans.value.value;
  const hasCoBorrower = (form as any).hasCoBorrower.value.value;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Дополнительная информация</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Общая информация</h3>

        <FormField control={(form as any).maritalStatus} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={(form as any).dependents} />
          <FormField control={(form as any).education} />
        </div>
      </div>

      <div className="space-y-4">
        <FormField control={(form as any).hasProperty} />

        {hasProperty && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Имущество</h3>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => ((form as any).properties as any).push()}
              >
                + Добавить имущество
              </button>
            </div>

            <FormArrayManager
              control={(form as any).properties as any}
              component={PropertyForm}
              itemLabel="Имущество"
            />

            {((form as any).properties as any).length.value === 0 && (
              <div className="p-4 bg-gray-100 border border-gray-300 rounded text-center text-gray-600">
                Нажмите "Добавить имущество" для добавления информации
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <FormField control={(form as any).hasExistingLoans} />

        {hasExistingLoans && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Существующие кредиты</h3>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => ((form as any).existingLoans as any).push()}
              >
                + Добавить кредит
              </button>
            </div>

            <FormArrayManager
              control={(form as any).existingLoans as any}
              component={ExistingLoanForm}
              itemLabel="Кредит"
            />

            {((form as any).existingLoans as any).length.value === 0 && (
              <div className="p-4 bg-gray-100 border border-gray-300 rounded text-center text-gray-600">
                Нажмите "Добавить кредит" для добавления информации
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <FormField control={(form as any).hasCoBorrower} />

        {hasCoBorrower && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Созаемщики</h3>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => ((form as any).coBorrowers as any).push()}
              >
                + Добавить созаемщика
              </button>
            </div>

            <FormArrayManager
              control={(form as any).coBorrowers as any}
              component={CoBorrowerForm}
              itemLabel="Созаемщик"
            />

            {((form as any).coBorrowers as any).length.value === 0 && (
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
