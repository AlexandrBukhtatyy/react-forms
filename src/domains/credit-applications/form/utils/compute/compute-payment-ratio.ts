/**
 * Вычисление процента платежа от дохода
 */

/**
 * Вычисление процента платежа от дохода
 * @param values - значения полей формы
 * @returns процент платежа от дохода (%)
 */
export function computePaymentRatio(values: Record<string, any>): number {
  const monthlyPayment = values.monthlyPayment;
  const totalIncome = values.totalIncome;

  if (!monthlyPayment || !totalIncome || totalIncome === 0) {
    return 0;
  }

  return Math.round((monthlyPayment / totalIncome) * 100);
}
