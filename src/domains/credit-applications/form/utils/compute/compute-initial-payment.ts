/**
 * Вычисление первоначального взноса (20% от стоимости недвижимости)
 */

/**
 * Вычисление первоначального взноса (20% от стоимости недвижимости)
 * @param values - значения полей формы
 * @returns первоначальный взнос (₽)
 */
export function computeInitialPayment(values: Record<string, any>): number {
  const propertyValue = values.propertyValue;

  if (!propertyValue) {
    return 0;
  }

  return Math.round(propertyValue * 0.2);
}
