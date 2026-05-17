/**
 * Sistema de Notificações Internas - SOS Pet
 * 
 * STATUS: 🔜 PÓS-MVP
 * 
 * Este arquivo será implementado após validação do MVP.
 * 
 * Funcionalidade planejada:
 * - Trigger no Supabase (AFTER INSERT em pets)
 * - Edge Function para processar
 * - Buscar usuários da mesma região
 * - Criar notificação interna (tabela notifications)
 * - Exibir badge e lista no frontend
 * 
 * Tecnologias previstas:
 * - Supabase Edge Functions
 * - Supabase Realtime (opcional)
 * - Tabela: notifications
 * 
 * @see /docs/notifications.md (criar documentação)
 */

export async function notifyUsersInRegion(pet) {
  console.warn('⚠️ notifyUsers.js ainda não implementado (Pós-MVP)');
  return { success: false, message: 'Funcionalidade em desenvolvimento' };
}

export async function getUserNotifications(userId) {
  console.warn('⚠️ notifyUsers.js ainda não implementado (Pós-MVP)');
  return [];
}

export async function markNotificationAsRead(notificationId) {
  console.warn('⚠️ notifyUsers.js ainda não implementado (Pós-MVP)');
  return { success: false };
}
