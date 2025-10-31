/**
 * Вычисление возраста из даты рождения
 */

/**
 * Вычисление возраста из даты рождения
 * @param values - значения полей формы
 * @returns возраст (лет)
 */
export function computeAge(values: Record<string, any>): number | null {
  const birthDate = values.personalData?.birthDate;

  if (!birthDate) {
    return null;
  }

  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
