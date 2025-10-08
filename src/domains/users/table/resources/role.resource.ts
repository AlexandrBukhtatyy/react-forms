import { staticResource } from '@/lib/forms/core/resources';

/**
 * Ресурс ролей пользователей
 */
export const roleResource = staticResource([
  { id: '1', label: 'Администратор', value: 'admin' },
  { id: '2', label: 'Пользователь', value: 'user' },
  { id: '3', label: 'Модератор', value: 'moderator' }
]);
