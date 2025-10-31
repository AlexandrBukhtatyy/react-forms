/**
 * Вычисление процентной ставки на основе типа кредита и дополнительных условий
 */

/**
 * Вычисление процентной ставки на основе типа кредита и дополнительных условий
 * @param values - значения полей формы
 * @returns процентная ставка (%)
 */
export function computeInterestRate(values: Record<string, any>): number {
  const loanType = values.loanType;

  // Базовые ставки по типам кредита
  const baseRates: Record<string, number> = {
    consumer: 15.5,
    mortgage: 8.5,
    car: 12.0,
    business: 18.0,
    refinancing: 14.0,
  };

  let rate = baseRates[loanType] || 15.0;

  // Надбавки и скидки
  if (loanType === 'mortgage') {
    // Надбавка за регион (Москва дороже)
    const region = values.registrationAddress?.region;
    if (region === 'moscow') {
      rate += 0.5;
    }
  }

  if (loanType === 'car') {
    // Скидка за КАСКО (если есть)
    const hasInsurance = values.carInsurance === true;
    if (hasInsurance) {
      rate -= 1.0;
    }
  }

  // Скидка за обеспечение (имущество)
  if (values.hasProperty === true && values.properties && values.properties.length > 0) {
    rate -= 0.5;
  }

  return Math.max(rate, 0);
}
