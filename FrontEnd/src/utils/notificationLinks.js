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
