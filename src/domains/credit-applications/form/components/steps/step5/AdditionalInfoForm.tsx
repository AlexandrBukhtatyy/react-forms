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
import { FormField } from '@/lib/forms/components';
import { PropertyForm, ExistingLoanForm, CoBorrowerForm } from '../../nested-forms';

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

      {/* Семейное положение и образование */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Общая информация</h3>

        <FormField control={form.controls.maritalStatus} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.controls.dependents} />
          <FormField control={form.controls.education} />
        </div>
      </div>

      {/* ========================================================================
          МАССИВ ФОРМ: Имущество (properties)
          Использует переиспользуемый компонент PropertyForm
          ======================================================================== */}
      <div className="space-y-4">
        <FormField control={form.controls.hasProperty} />

        {hasProperty && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Имущество</h3>
              {/* TODO: Кнопка добавления имущества */}
              {/* <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.controls.properties.push()}
              >
                Добавить имущество
              </Button> */}
            </div>

            {/* TODO: Список имущества с использованием PropertyForm */}
            {/* {form.controls.properties.map((property, index) => (
              <div key={index} className="mb-4 p-4 bg-white rounded border">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Имущество #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => form.controls.properties.remove(index)}
                  >
                    Удалить
                  </Button>
                </div>

                <PropertyForm control={property} />
              </div>
            ))} */}

            {/* Временная заглушка */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm">
                <strong>⚠️ В разработке</strong>
                <br />
                Массив форм будет доступен после раскомментирования в схеме.
                <br />
                <br />
                <strong>Готовые компоненты:</strong>
                <br />
                <code className="text-xs">&lt;PropertyForm control=&#123;property&#125; /&gt;</code>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================
          МАССИВ ФОРМ: Существующие кредиты (existingLoans)
          Использует переиспользуемый компонент ExistingLoanForm
          ======================================================================== */}
      <div className="space-y-4">
        <FormField control={form.controls.hasExistingLoans} />

        {hasExistingLoans && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Существующие кредиты</h3>
              {/* <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.controls.existingLoans.push()}
              >
                Добавить кредит
              </Button> */}
            </div>

            {/* TODO: Список кредитов с использованием ExistingLoanForm */}
            {/* {form.controls.existingLoans.map((loan, index) => (
              <div key={index} className="mb-4 p-4 bg-white rounded border">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Кредит #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => form.controls.existingLoans.remove(index)}
                  >
                    Удалить
                  </Button>
                </div>

                <ExistingLoanForm control={loan} />
              </div>
            ))} */}

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm">
                <strong>⚠️ В разработке</strong>
                <br />
                <code className="text-xs">&lt;ExistingLoanForm control=&#123;loan&#125; /&gt;</code>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================
          МАССИВ ФОРМ С ВЛОЖЕННЫМИ ГРУППАМИ: Созаемщики (coBorrowers)
          Самый сложный случай: массив элементов, где каждый содержит вложенную группу personalData
          Использует переиспользуемый компонент CoBorrowerForm
          ======================================================================== */}
      <div className="space-y-4">
        <FormField control={form.controls.hasCoBorrower} />

        {hasCoBorrower && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Созаемщики</h3>
              {/* <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.controls.coBorrowers.push()}
              >
                Добавить созаемщика
              </Button> */}
            </div>

            {/* TODO: Список созаемщиков с использованием CoBorrowerForm */}
            {/* {form.controls.coBorrowers.map((coBorrower, index) => (
              <div key={index} className="mb-4 p-4 bg-white rounded border">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Созаемщик #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => form.controls.coBorrowers.remove(index)}
                  >
                    Удалить
                  </Button>
                </div>

                <CoBorrowerForm control={coBorrower} />
              </div>
            ))} */}

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm">
                <strong>⚠️ В разработке</strong>
                <br />
                Массив с вложенными группами personalData будет доступен после раскомментирования.
                <br />
                <br />
                <strong>Готовые компоненты:</strong>
                <br />
                <code className="text-xs">&lt;CoBorrowerForm control=&#123;coBorrower&#125; /&gt;</code>
                <br />
                <small className="text-xs text-gray-600">
                  CoBorrowerForm автоматически обрабатывает вложенную группу personalData
                </small>
              </p>
              <ul className="mt-2 text-xs space-y-1 list-disc list-inside text-gray-600">
                <li>Доступ: <code>coBorrower.personalData.firstName</code></li>
                <li>Операции: <code>form.controls.coBorrowers.push()</code></li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
