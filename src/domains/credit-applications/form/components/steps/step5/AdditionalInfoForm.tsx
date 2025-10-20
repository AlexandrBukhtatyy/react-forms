import { useState } from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import type { FormStore } from '@/lib/forms/core/form-store';
import type { CreditApplicationForm, PropertyItem, ExistingLoan, CoBorrower } from '../../../../_shared/types/credit-application';
import { FormArrayManager, FormField } from '@/lib/forms/components';
import { PropertyForm, ExistingLoanForm, CoBorrowerForm } from '../../nested-forms';

interface AdditionalInfoFormProps {
  form: FormStore<CreditApplicationForm>;
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
        <h3 className="text-lg font-semibold">Общие сведения</h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.controls.maritalStatus} />
          <FormField control={form.controls.dependents} />
        </div>
        <FormField control={form.controls.education} />
      </div>

      {/* Имущество */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mt-6">Имущество</h3>
        <FormField control={form.controls.hasProperty} />

        {hasProperty && (
          <div className="mt-4">
            <FormArrayManager control={form.controls.properties} component={PropertyForm} />
          </div>
        )}
      </div>

      {/* Существующие кредиты */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mt-6">Кредитные обязательства</h3>
        <FormField control={form.controls.hasExistingLoans} />

        {hasExistingLoans && (
          <div className="mt-4">
            <FormArrayManager control={form.controls.properties} component={ExistingLoanForm} />
          </div>
        )}
      </div>

      {/* Созаемщики */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mt-6">Созаемщики</h3>
        <FormField control={form.controls.hasCoBorrower} />

        {hasCoBorrower && (
          <div className="mt-4">
            <FormArrayManager control={form.controls.properties} component={CoBorrowerForm} />
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md mt-6">
        <p className="text-sm text-gray-700">
          <strong>Обратите внимание:</strong> Предоставление информации об имуществе и созаемщиках может улучшить условия кредитования.
        </p>
      </div>
    </div>
  );
}
