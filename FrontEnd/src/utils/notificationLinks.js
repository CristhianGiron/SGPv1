/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          notificationLinks.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de notificationLinks utilizadas por la interfaz del SGP.
 */

export function getNotificationTarget(link) {
  return String(link || '').trim();
}

export function hasNotificationLink(link) {
  return Boolean(getNotificationTarget(link));
}

export function openNotificationLink(link) {
  const target = getNotificationTarget(link);

  if (!target) {
    window.location.hash = '#/notifications';
    return;
  }

  if (/^(https?:|mailto:|tel:)/i.test(target)) {
    window.open(target, '_blank', 'noopener,noreferrer');
    return;
  }

  if (target.startsWith('#')) {
    window.location.hash = target;
    return;
  }

  window.location.hash = `#/${target.replace(/^\/+/, '')}`;
}
