/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          notificationInbox.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de notificationInbox utilizadas por la interfaz del SGP.
 */

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function inboxNotifications(notifications, view, search = '') {
  const terms = normalize(search).split(/\s+/).filter(Boolean);
  return (notifications || []).filter(item => (view === 'all' || (view === 'unread' ? !item.read : item.read))
    && terms.every(term => normalize(`${item.title || ''} ${item.message || ''}`).includes(term)))
    .sort((a,b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
}
export function groupInboxByDate(notifications, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
  const groups = new Map();
  for (const item of notifications) {
    const date = new Date(item.createdAt);
    const valid = Number.isFinite(date.getTime());
    const key = valid ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : 'undated';
    const time = valid ? new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() : null;
    const label = time === today.getTime() ? 'Hoy' : time === yesterday.getTime() ? 'Ayer'
      : valid ? date.toLocaleDateString('es-EC', {day:'numeric', month:'long', year:'numeric'}) : 'Sin fecha';
    if (!groups.has(key)) groups.set(key, {key,label,items:[]});
    groups.get(key).items.push(item);
  }
  return [...groups.values()];
}
