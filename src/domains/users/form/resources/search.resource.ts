import { partialResource } from '@/lib/forms/core/resources';

/**
 * Ресурс для поиска с фильтрацией
 */
export const searchResource = partialResource(async (params) => {
  const search = params?.search || '';

  // Имитация API запроса
  const items = [
    { id: '1', label: 'Option 1', value: 'opt1' },
    { id: '2', label: 'Option 2', value: 'opt2' },
    { id: '3', label: 'Option 3', value: 'opt3' },
  ];

  return items.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );
});
