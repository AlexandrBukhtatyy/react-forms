/**
 * Вычисление общего дохода созаемщиков
 */

/**
 * Вычисление общего дохода созаемщиков
 * @param values - значения полей формы
 * @returns общий доход созаемщиков (₽)
 */
export function computeCoBorrowersIncome(values: Record<string, any>): number {
  const coBorrowers = values.coBorrowers;

  if (!coBorrowers || !Array.isArray(coBorrowers)) {
    return 0;
  }

  return coBorrowers.reduce((sum, coBorrower) => {
    const income = coBorrower?.monthlyIncome || 0;
    return sum + income;
  }, 0);
}
