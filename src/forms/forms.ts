import type { Signal } from "@preact/signals-react";

export interface Field<T> {
  value: {
    value: T;
  };
  errors?: Array<{ message: string }>;
}

export function form<TValue>(
  model: Signal<TValue>,
  schema?: (form: any) => void,
  options?: any
): any {
  const createField = <T>(propName: string, defaultValue: T = '' as T): Field<T> => ({
    value: {
      get value() {
        return (model.value as any)?.[propName] ?? defaultValue;
      },
      set value(newValue: T) {
        model.value = {
          ...model.value,
          [propName]: newValue
        } as TValue;
      }
    },
    errors: []
  });

  const createArrayProxy = (arrayData: any[]) =>
    arrayData.map((item, index) =>
      new Proxy({}, {
        get(_, subProp: string) {
          return {
            value: {
              get value() {
                return model.value?.array?.[index]?.[subProp] ?? item[subProp];
              },
              set value(newValue: any) {
                const currentArray = [...(model.value?.array || [])];
                if (currentArray[index]) {
                  currentArray[index] = {
                    ...currentArray[index],
                    [subProp]: newValue
                  };
                  model.value = {
                    ...model.value,
                    array: currentArray
                  } as TValue;
                }
              }
            },
            errors: []
          };
        }
      })
    );

  return new Proxy({}, {
    get(_, propName: string) {
      const propValue = (model.value as any)?.[propName];

      if (propName === 'array' && Array.isArray(propValue)) {
        return createArrayProxy(propValue);
      }

      return createField(propName, propValue);
    }
  });
}