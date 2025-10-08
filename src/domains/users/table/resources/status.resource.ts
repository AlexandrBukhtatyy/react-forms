import { staticResource } from '@/lib/forms/core/resources';

/**
 * Ресурс статусов пользователей
 */
export const statusResource = staticResource([
  { id: '1', label: 'Активен', value: 'active' },
  { id: '2', label: 'Заблокирован', value: 'blocked' },
  { id: '3', label: 'На модерации', value: 'pending' }
]);
