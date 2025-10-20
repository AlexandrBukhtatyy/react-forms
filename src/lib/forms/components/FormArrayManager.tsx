import React, { ComponentType } from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { FieldController } from '../core/field-controller';

interface FormArrayManagerProps<T> {
  // Контроллер массива
  control: FieldController<T[]>;
  // Компонент для рендера одного элемента массива
  component: ComponentType<{ control: FieldController<T> }>;
}

/**
 * Простой компонент для управления массивами форм
 * Имеет только 2 параметра: control и component
 *
 * @example
 * <FormArrayManager
 *   control={form.controls.properties}
 *   component={PropertyForm}
 * />
 */
export function FormArrayManager<T>({
  control,
  component: ItemComponent,
}: FormArrayManagerProps<T>) {
  useSignals();

  return (
    <>
      {control.value?.map((_, index) => (
        <ItemComponent
          key={index}
          control={control[index] as any}
        />
      ))}
    </>
  );
}
