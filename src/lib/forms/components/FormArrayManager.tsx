import React, { ComponentType } from 'react';
import { useSignals } from '@preact/signals-react/runtime';

interface FormArrayManagerProps<T> {
  // ArrayProxy (из DeepFormStore)
  control: any;
  // Компонент для рендера одного элемента массива
  component: ComponentType<{ control: any; index: number; onRemove: () => void }>;
}

/**
 * Компонент для управления массивами форм
 *
 * Использует ArrayProxy.map() для итерации по элементам массива.
 * Работает с DeepFormStore через ArrayProxy.
 *
 * @example
 * <FormArrayManager
 *   control={form.controls.properties}
 *   component={PropertyForm}
 * />
 *
 * // PropertyForm получит пропсы:
 * // - control: GroupProxy элемента массива
 * // - index: индекс элемента
 * // - onRemove: функция для удаления элемента
 */
export function FormArrayManager<T>({
  control,
  component: ItemComponent,
}: FormArrayManagerProps<T>) {
  useSignals();

  // ArrayProxy имеет метод map, который возвращает массив proxy элементов
  return (
    <>
      {control.map((itemControl: any, index: number) => (
        <ItemComponent
          key={index}
          control={itemControl}
          index={index}
          onRemove={() => control.remove(index)}
        />
      ))}
    </>
  );
}
