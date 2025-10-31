/**
 * Вычисление общего дохода (основной + дополнительный)
 */

/**
 * Вычисление общего дохода (основной + дополнительный)
 * @param values - значения полей формы
 * @returns общий доход (₽)
 */
export function computeTotalIncome(values: Record<string, any>): number {
  const monthlyIncome = values.monthlyIncome || 0;
  const additionalIncome = values.additionalIncome || 0;

  return monthlyIncome + additionalIncome;
}
