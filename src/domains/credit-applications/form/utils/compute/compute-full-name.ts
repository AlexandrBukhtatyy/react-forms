/**
 * Вычисление полного имени (конкатенация Фамилия Имя Отчество)
 */

/**
 * Вычисление полного имени (конкатенация Фамилия Имя Отчество)
 * @param values - значения полей формы
 * @returns полное имя
 */
export function computeFullName(values: Record<string, any>): string {
  const lastName = values.personalData?.lastName || '';
  const firstName = values.personalData?.firstName || '';
  const middleName = values.personalData?.middleName || '';

  return [lastName, firstName, middleName].filter(Boolean).join(' ');
}
