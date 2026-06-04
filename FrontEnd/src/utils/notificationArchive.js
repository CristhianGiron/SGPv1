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
