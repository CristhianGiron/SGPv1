import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest, getApiBaseUrl } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function useNotifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const socketOpenedRef = useRef(false);

  const buildWebSocketUrl = useCallback(() => {
    const apiBase = getApiBaseUrl();
    const url = apiBase
      ? new URL(apiBase, window.location.origin)
      : new URL(window.location.origin);
    const localDevHost = ['localhost', '127.0.0.1'].includes(url.hostname);

    if (!apiBase && localDevHost && url.port !== '8080') {
      url.port = '8080';
    }

    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws/notifications';
    url.search = `token=${encodeURIComponent(token)}`;

    return url.toString();
  }, [token]);

  const loadNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [items, countPayload] = await Promise.all([
        apiRequest('/api/notifications/me', { token }),
        apiRequest('/api/notifications/me/count', { token }),
      ]);

      setNotifications(Array.isArray(items) ? items : []);
      setUnreadCount(Number(countPayload?.count || 0));
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    loadNotifications();

    if (!token) {
      return undefined;
    }

    const webSocketUrl = buildWebSocketUrl();
    console.debug('Notification WebSocket URL', webSocketUrl);

    let ws;
    try {
      ws = new WebSocket(webSocketUrl);
    } catch (err) {
      console.error('WebSocket constructor failed', err);
      setError('Error de conexión WebSocket de notificaciones');
      return undefined;
    }

    socketRef.current = ws;
    socketOpenedRef.current = false;

    ws.onopen = () => {
      socketOpenedRef.current = true;
      console.debug('Notification WebSocket opened');
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload && payload.id) {
          setNotifications((current) => [payload, ...current.filter((item) => item.id !== payload.id)]);
          setUnreadCount((current) => current + (payload.read ? 0 : 1));
        }
      } catch (err) {
        console.warn('Error parsing notification websocket payload', err);
      }
    };

    ws.onerror = (event) => {
      if (!socketOpenedRef.current) {
        console.debug('Notification WebSocket error before open', event);
      } else {
        console.warn('Notification WebSocket error', event);
        setError('Error de conexión WebSocket de notificaciones');
      }
    };

    ws.onclose = (event) => {
      if (!socketOpenedRef.current && event.code === 1006) {
        console.debug('Notification WebSocket closed before open (possible dev-mode cleanup)', event);
      } else {
        console.warn('Notification WebSocket closed', event.code, event.reason, event.wasClean);
      }
    };

    return () => {
      ws.close();
      socketRef.current = null;
      socketOpenedRef.current = false;
    };
  }, [loadNotifications, buildWebSocketUrl, token]);

  const markAsRead = useCallback(
    async (id) => {
      if (!token) {
        return null;
      }

      try {
        const updated = await apiRequest(`/api/notifications/${id}/read`, {
          method: 'PATCH',
          token,
        });
        const wasUnread = notifications.some((item) => item.id === id && !item.read);

        setNotifications((current) =>
          current.map((item) =>
            item.id === updated.id ? { ...item, read: true } : item,
          ),
        );
        if (wasUnread) {
          setUnreadCount((current) => Math.max(0, current - 1));
        }
        return updated;
      } catch (err) {
        setError(err?.message || 'No se pudo marcar la notificación como leída');
        return null;
      }
    },
    [notifications, token],
  );

  const markAllAsRead = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      await apiRequest('/api/notifications/read-all', {
        method: 'PATCH',
        token,
      });
      setNotifications((current) =>
        current.map((item) => ({ ...item, read: true })),
      );
      setUnreadCount(0);
    } catch (err) {
      setError(err?.message || 'No se pudieron marcar todas las notificaciones como leídas');
    }
  }, [token]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: loadNotifications,
    markAsRead,
    markAllAsRead,
  };
}
