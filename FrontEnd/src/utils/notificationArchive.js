/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          notificationArchive.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de notificationArchive utilizadas por la interfaz del SGP.
 */

function getNotificationTime(notification) {
  const time = notification?.createdAt
    ? new Date(notification.createdAt).getTime()
    : 0;

  return Number.isFinite(time) ? time : 0;
}

export function splitNotificationsForArchive(notifications) {
  const sortedNotifications = [...(notifications || [])].sort(
    (left, right) => getNotificationTime(right) - getNotificationTime(left),
  );

  return sortedNotifications.reduce(
    (groups, notification) => {
      if (notification.read) {
        groups.archivedNotifications.push(notification);
      } else {
        groups.recentNotifications.push(notification);
      }

      return groups;
    },
    {
      archivedNotifications: [],
      recentNotifications: [],
    },
  );
}
