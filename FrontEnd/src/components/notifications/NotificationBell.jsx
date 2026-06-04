import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, BellRing, Check, ChevronDown, X } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { hasNotificationLink, openNotificationLink } from '../../utils/notificationLinks';
import { splitNotificationsForArchive } from '../../utils/notificationArchive';
import { setHashRoute } from '../../utils/routes';

const bellButtonClass =
  'relative inline-flex h-[1.82rem] w-[1.82rem] items-center justify-center rounded-full border border-accent bg-transparent text-inverse transition-colors hover:border-inverse hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-panel/50 dark:border-accent dark:text-ink dark:hover:border-accent-strong dark:hover:bg-surface-soft';

const unreadIconClass = 'text-accent dark:text-accent-strong';

const smallActionButtonClass =
  'inline-flex min-h-8 items-center justify-center rounded-lg border border-accent bg-transparent px-2.5 py-1.5 text-xs font-extrabold text-primary transition-colors hover:border-primary-strong hover:bg-primary-strong hover:text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:bg-surface-soft dark:text-ink dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong';

const closeButtonClass =
  'inline-grid min-h-8 w-8 place-items-center rounded-lg border border-accent bg-transparent text-primary transition-colors hover:border-primary-strong hover:bg-primary-strong hover:text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:bg-surface-soft dark:text-ink dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong';

const dropdownPanelClass =
  'absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(26rem,calc(100vw-1rem))] min-w-0 overflow-hidden rounded-lg border border-line bg-panel text-ink opacity-0 shadow-soft transition-[opacity,transform] duration-150 dark:border-line dark:bg-surface dark:shadow-soft';

const panelMessageClass =
  'rounded-lg border border-dashed border-line bg-panel-soft p-4 text-sm leading-6 text-muted dark:border-line dark:bg-surface-soft dark:text-muted';

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
  const [archivedOpen, setArchivedOpen] = useState(false);

  // Ref que envuelve botón + panel
  const containerRef = useRef(null);
  const { recentNotifications, archivedNotifications } = useMemo(
    () => splitNotificationsForArchive(notifications),
    [notifications],
  );
  const hasArchivedNotifications = archivedNotifications.length > 0;

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

  useEffect(() => {
    if (!hasArchivedNotifications && archivedOpen) {
      setArchivedOpen(false);
    }
  }, [archivedOpen, hasArchivedNotifications]);

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

    if (hasNotificationLink(notification.link)) {
      setOpen(false);
      openNotificationLink(notification.link);
    }
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
          <span className="absolute -right-[0.28rem] -top-[0.28rem] inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[0.62rem] font-[850] leading-none text-inverse dark:bg-accent dark:text-page">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div
        className={`${dropdownPanelClass} ${
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-1'
        }`}
      >
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-line p-3 dark:border-border">
          <div className="min-w-0">
            <p className="text-sm font-[850] leading-tight text-heading dark:text-heading">
              Notificaciones
            </p>

            <p className="mt-0.5 text-xs font-bold leading-tight text-muted">
              {unreadCount} sin leer
            </p>
          </div>

          <div className="flex min-w-0 flex-none items-center gap-2">
            <button
              type="button"
              onClick={markAllAsRead}
              className={`${smallActionButtonClass} gap-1.5 disabled:cursor-not-allowed disabled:opacity-60`}
              disabled={loading || unreadCount === 0}
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

        <div className="grid max-h-96 min-w-0 gap-2 overflow-y-auto overflow-x-hidden overscroll-contain p-3">
          {loading ? (
            <div className="grid gap-3">
              <div className="min-h-[4.5rem] rounded-lg border border-line bg-panel-soft dark:border-line dark:bg-surface-soft" />
              <div className="min-h-[4.5rem] rounded-lg border border-line bg-panel-soft dark:border-line dark:bg-surface-soft" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-danger bg-danger-soft p-3 text-sm leading-6 text-danger-strong dark:border-danger/40 dark:bg-danger-soft dark:text-danger-strong">
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className={panelMessageClass}>
              No tienes notificaciones nuevas.
            </div>
          ) : recentNotifications.length === 0 ? (
            <>
              <div className={panelMessageClass}>
                No tienes notificaciones recientes.
              </div>

              {hasArchivedNotifications && (
                <section className="mt-1 overflow-hidden rounded-lg border border-line bg-panel-soft dark:border-line dark:bg-surface-soft">
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-[850] text-heading transition-colors hover:bg-hover-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:text-heading"
                    aria-expanded={archivedOpen}
                    onClick={() => setArchivedOpen((current) => !current)}
                  >
                    <span className="min-w-0 truncate">
                      Notificaciones archivadas ({archivedNotifications.length})
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`flex-none text-muted transition-transform ${archivedOpen ? 'rotate-180' : ''}`}
                      size={17}
                    />
                  </button>

                  {archivedOpen && (
                    <div className="grid gap-2 border-t border-line p-2 dark:border-line">
                      {archivedNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onClick={handleSelectNotification}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          ) : (
            <>
              {recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleSelectNotification}
                />
              ))}

              {hasArchivedNotifications && (
                <section className="mt-1 overflow-hidden rounded-lg border border-line bg-panel-soft dark:border-line dark:bg-surface-soft">
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-[850] text-heading transition-colors hover:bg-hover-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:text-heading"
                    aria-expanded={archivedOpen}
                    onClick={() => setArchivedOpen((current) => !current)}
                  >
                    <span className="min-w-0 truncate">
                      Notificaciones archivadas ({archivedNotifications.length})
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`flex-none text-muted transition-transform ${archivedOpen ? 'rotate-180' : ''}`}
                      size={17}
                    />
                  </button>

                  {archivedOpen && (
                    <div className="grid gap-2 border-t border-line p-2 dark:border-line">
                      {archivedNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onClick={handleSelectNotification}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setHashRoute('notifications');
          }}
          className="mx-3 mb-3 inline-flex min-h-9 w-[calc(100%-1.5rem)] items-center justify-center rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-[850] text-inverse transition-colors hover:border-primary-strong hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-accent dark:bg-accent dark:hover:border-accent-strong dark:hover:bg-accent-strong"
        >
          Ver todas las notificaciones
        </button>
      </div>
    </div>
  );
}
