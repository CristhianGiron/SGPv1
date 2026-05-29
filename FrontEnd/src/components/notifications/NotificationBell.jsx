import { useEffect, useRef, useState } from 'react';
import { Bell, BellRing, Check, X } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { openNotificationLink } from '../../utils/notificationLinks';

const bellButtonClass =
  'relative inline-flex h-[1.82rem] w-[1.82rem] items-center justify-center rounded-full border border-[#529914] bg-transparent text-white transition-colors hover:border-white hover:bg-[#074462] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 dark:border-[#75c66a] dark:text-ink dark:hover:border-[#a7e79f] dark:hover:bg-[#172033]';

const unreadIconClass = 'text-[#9ed174] dark:text-[#a7e79f]';

const smallActionButtonClass =
  'inline-flex min-h-8 items-center justify-center rounded-lg border border-[#529914] bg-transparent px-2.5 py-1.5 text-xs font-extrabold text-primary transition-colors hover:border-[#074462] hover:bg-[#074462] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-600 dark:bg-[#172033] dark:text-ink dark:hover:border-[#75c66a] dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0]';

const closeButtonClass =
  'inline-grid min-h-8 w-8 place-items-center rounded-lg border border-[#529914] bg-transparent text-primary transition-colors hover:border-[#074462] hover:bg-[#074462] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-600 dark:bg-[#172033] dark:text-ink dark:hover:border-[#75c66a] dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0]';

const panelMessageClass =
  'rounded-lg border border-dashed border-[#bdcbd0] bg-[#eef3f2] p-4 text-sm leading-6 text-muted dark:border-slate-700 dark:bg-[#172033] dark:text-slate-300';

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications();

  const [open, setOpen] = useState(false);

  // Ref que envuelve botón + panel
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick);

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutsideClick
      );
    };
  }, [open]);

  const handleBellClick = () => {
    setOpen((current) => !current);

    if (!open) {
      refresh();
    }
  };

  const handleSelectNotification = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    setOpen(false);
    openNotificationLink(notification.link);
  };

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={handleBellClick}
        className={bellButtonClass}
        aria-label="Ver notificaciones"
      >
        {unreadCount > 0 ? (
          <BellRing
            aria-hidden="true"
            size={20}
            className={unreadIconClass}
          />
        ) : (
          <Bell aria-hidden="true" size={20} />
        )}

        {unreadCount > 0 && (
          <span className="absolute -right-[0.28rem] -top-[0.28rem] inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#529914] px-1.5 text-[0.62rem] font-[850] leading-none text-white dark:bg-[#75c66a] dark:text-[#0b1120]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(23rem,calc(100vw-1rem))] rounded-lg border border-[#bdcbd0] bg-white text-ink opacity-0 shadow-[0_18px_42px_rgba(4,52,76,0.16)] transition-[opacity,transform] duration-150 dark:border-slate-700 dark:bg-surface dark:shadow-[0_18px_42px_rgba(0,0,0,0.34)] ${
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-1'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#d7e4e9] p-3 dark:border-border">
          <div>
            <p className="text-sm font-[850] leading-tight text-[#10232c] dark:text-slate-50">
              Notificaciones
            </p>

            <p className="mt-0.5 text-xs font-bold leading-tight text-muted">
              {unreadCount} sin leer
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllAsRead}
              className={`${smallActionButtonClass} gap-1.5`}
            >
              <Check aria-hidden="true" size={14} />
              Marcar leídas
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className={closeButtonClass}
              aria-label="Cerrar panel de notificaciones"
            >
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        </div>

        <div className="grid max-h-96 gap-2 overflow-y-auto overscroll-contain p-3">
          {loading ? (
            <div className="grid gap-3">
              <div className="min-h-[4.5rem] rounded-lg border border-[#d7e4e9] bg-[#eef3f2] dark:border-slate-700 dark:bg-[#172033]" />
              <div className="min-h-[4.5rem] rounded-lg border border-[#d7e4e9] bg-[#eef3f2] dark:border-slate-700 dark:bg-[#172033]" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-[#f2b8bd] bg-[#f9e6e7] p-3 text-sm leading-6 text-[#8a1f2a] dark:border-rose-400/40 dark:bg-rose-950/35 dark:text-rose-200">
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className={panelMessageClass}>
              No tienes notificaciones nuevas.
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={handleSelectNotification}
              />
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            window.location.hash = 'notifications';
          }}
          className="mx-3 mb-3 inline-flex min-h-9 w-[calc(100%-1.5rem)] items-center justify-center rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-[850] text-white transition-colors hover:border-[#074462] hover:bg-[#074462] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-[#75c66a] dark:bg-[#2f7a4d] dark:hover:border-[#a7e79f] dark:hover:bg-[#25643d]"
        >
          Ver todas las notificaciones
        </button>
      </div>
    </div>
  );
}
