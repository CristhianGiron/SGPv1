import { useMemo, useState } from 'react';
import { CheckCheck, ChevronDown, Send } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Alert } from '../components/ui/Alert';
import { ActionBar, PrimaryButton, SecondaryButton } from '../components/ui/ActionBar';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { Field, Input, Textarea } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { ROLES } from '../config/resources';
import { formatRole } from '../utils/format';
import { hasNotificationLink, openNotificationLink } from '../utils/notificationLinks';
import { splitNotificationsForArchive } from '../utils/notificationArchive';

const EMPTY_ANNOUNCEMENT = {
  title: '',
  message: '',
  link: '',
  roles: [],
};

const roleOptionClass =
  'flex min-h-10 items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm font-medium text-body dark:border-line dark:bg-surface dark:text-ink';

const roleCheckboxClass = 'h-4 w-4 accent-accent dark:accent-accent';

const refreshButtonClass =
  'inline-flex min-h-9 items-center justify-center rounded-lg border border-accent bg-transparent px-3 py-2 text-sm font-medium text-primary transition-colors hover:border-primary-strong hover:bg-primary-strong hover:text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:bg-surface-soft dark:text-ink dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong';

const skeletonClass =
  'min-h-[4.5rem] rounded-lg border border-line bg-panel-soft dark:border-line dark:bg-surface-soft';

export function NotificationsPage() {
  const { notifications, loading, unreadCount, error, markAsRead, markAllAsRead, refresh } = useNotifications();
  const { token, roles } = useAuth();
  const confirm = useConfirm();
  const [announcement, setAnnouncement] = useState(EMPTY_ANNOUNCEMENT);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const isAdmin = roles.includes('ROLE_ADMIN');
  const { recentNotifications, archivedNotifications } = useMemo(
    () => splitNotificationsForArchive(notifications),
    [notifications],
  );
  const hasArchivedNotifications = archivedNotifications.length > 0;

  function updateAnnouncementField(field, value) {
    setAnnouncement((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleAnnouncementRole(role) {
    setAnnouncement((current) => {
      const selected = new Set(current.roles);

      if (selected.has(role)) {
        selected.delete(role);
      } else {
        selected.add(role);
      }

      return {
        ...current,
        roles: Array.from(selected),
      };
    });
  }

  async function sendAnnouncement(event) {
    event.preventDefault();
    setAnnouncementError('');
    setAnnouncementMessage('');

    if (!announcement.title.trim() || !announcement.message.trim()) {
      setAnnouncementError('Completa el titulo y el mensaje del aviso.');
      return;
    }

    const accepted = await confirm({
      title: 'Enviar aviso',
      description: 'El aviso se enviara a los destinatarios seleccionados. Revisa el mensaje antes de continuar.',
      details: announcement.roles.length ? `${announcement.roles.length} rol(es) seleccionado(s)` : 'Todos los usuarios',
      confirmLabel: 'Enviar aviso',
      tone: 'warning',
    });

    if (!accepted) {
      return;
    }

    setSendingAnnouncement(true);

    try {
      const response = await apiRequest('/api/notifications/announcements', {
        method: 'POST',
        token,
        body: {
          title: announcement.title.trim(),
          message: announcement.message.trim(),
          link: announcement.link.trim() || null,
          roles: announcement.roles,
        },
      });

      const sent = Number(response?.sent || 0);
      setAnnouncement(EMPTY_ANNOUNCEMENT);
      setAnnouncementOpen(false);
      setAnnouncementMessage(`Aviso enviado a ${sent} usuario${sent === 1 ? '' : 's'}.`);
      await refresh();
    } catch (err) {
      setAnnouncementError(err?.message || 'No se pudo enviar el aviso.');
    } finally {
      setSendingAnnouncement(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Centro de notificaciones"
        title="Tus notificaciones"
        description="Recibe avisos sobre envíos, revisiones, comentarios y actualizaciones relevantes de la plataforma."
        action={
          <ActionBar>
            {isAdmin && (
              <PrimaryButton icon={Send} onClick={() => setAnnouncementOpen(true)} type="button">
                Enviar aviso
              </PrimaryButton>
            )}
            <SecondaryButton
              type="button"
              onClick={async () => {
                const accepted = await confirm({
                  title: 'Marcar notificaciones como leidas',
                  description: 'Todas tus notificaciones pendientes quedaran marcadas como leidas.',
                  confirmLabel: 'Marcar como leidas',
                  tone: 'warning',
                });

                if (accepted) {
                  markAllAsRead();
                }
              }}
              icon={CheckCheck}
            >
              Marcar todas como leídas
            </SecondaryButton>
          </ActionBar>
        }
      />

      <Modal
        description="Envía una comunicación general o segmentada por rol."
        maxWidth="max-w-4xl"
        onClose={() => setAnnouncementOpen(false)}
        open={isAdmin && announcementOpen}
        title="Enviar aviso"
      >
          <form className="space-y-4" onSubmit={sendAnnouncement}>
            {announcementError && <Alert tone="error">{announcementError}</Alert>}
            {announcementMessage && <Alert tone="success">{announcementMessage}</Alert>}

            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Titulo">
                <Input
                  maxLength={120}
                  onChange={(event) => updateAnnouncementField('title', event.target.value)}
                  placeholder="Aviso general"
                  value={announcement.title}
                />
              </Field>

              <Field label="Enlace opcional">
                <Input
                  onChange={(event) => updateAnnouncementField('link', event.target.value)}
                  placeholder="#/documents, #/photos o https://..."
                  value={announcement.link}
                />
              </Field>
            </div>

            <Field label="Mensaje">
              <Textarea
                maxLength={1000}
                onChange={(event) => updateAnnouncementField('message', event.target.value)}
                placeholder="Escribe el aviso"
                value={announcement.message}
              />
            </Field>

            <div>
              <p className="mb-1.5 text-[0.82rem] font-semibold text-body dark:text-ink">Destinatarios</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <label className={roleOptionClass}>
                  <input
                    checked={announcement.roles.length === 0}
                    className={roleCheckboxClass}
                    onChange={() => updateAnnouncementField('roles', [])}
                    type="checkbox"
                  />
                  Todos
                </label>
                {ROLES.map((role) => (
                  <label
                    className={roleOptionClass}
                    key={role}
                  >
                    <input
                      checked={announcement.roles.includes(role)}
                      className={roleCheckboxClass}
                      onChange={() => toggleAnnouncementRole(role)}
                      type="checkbox"
                    />
                    {formatRole(role)}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <PrimaryButton
                icon={Send}
                loading={sendingAnnouncement}
                type="submit"
              >
                Enviar aviso
              </PrimaryButton>
            </div>
          </form>
      </Modal>

      <div className="rounded-lg border border-line bg-panel p-4 shadow-card dark:border-line dark:bg-surface dark:shadow-soft">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium leading-tight text-heading dark:text-heading">Notificaciones recientes</p>
            <p className="mt-0.5 text-xs font-medium leading-tight text-body">Tienes {unreadCount} notificaciones sin leer.</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className={refreshButtonClass}
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="grid gap-3">
            <div className={skeletonClass} />
            <div className={skeletonClass} />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-danger bg-danger-soft p-3 text-sm leading-6 text-danger-strong dark:border-danger/40 dark:bg-danger-soft dark:text-danger-strong">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-panel-soft p-4 text-center text-sm leading-6 text-body dark:border-line dark:bg-surface-soft dark:text-ink">
            Todavía no tienes notificaciones.
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="grid gap-3">
            <div className="rounded-lg border border-dashed border-line bg-panel-soft p-4 text-center text-sm leading-6 text-body dark:border-line dark:bg-surface-soft dark:text-ink">
              No tienes notificaciones recientes.
            </div>

            {hasArchivedNotifications && (
              <section className="mt-1 overflow-hidden rounded-lg border border-line bg-panel-soft dark:border-line dark:bg-surface-soft">
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-heading transition-colors hover:bg-hover-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:text-heading"
                  aria-expanded={archivedOpen}
                  onClick={() => setArchivedOpen((current) => !current)}
                >
                  <span className="min-w-0 truncate">
                    Notificaciones archivadas ({archivedNotifications.length})
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`flex-none text-body transition-transform ${archivedOpen ? 'rotate-180' : ''}`}
                    size={18}
                  />
                </button>

                {archivedOpen && (
                  <div className="grid gap-3 border-t border-line p-3 dark:border-line">
                    {archivedNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={async (item) => {
                          if (!item.read) {
                            await markAsRead(item.id);
                          }

                          if (hasNotificationLink(item.link)) {
                            openNotificationLink(item.link);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {recentNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={async (item) => {
                  if (!item.read) {
                    await markAsRead(item.id);
                  }

                  if (hasNotificationLink(item.link)) {
                    openNotificationLink(item.link);
                  }
                }}
              />
            ))}

            {hasArchivedNotifications && (
              <section className="mt-1 overflow-hidden rounded-lg border border-line bg-panel-soft dark:border-line dark:bg-surface-soft">
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-heading transition-colors hover:bg-hover-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:text-heading"
                  aria-expanded={archivedOpen}
                  onClick={() => setArchivedOpen((current) => !current)}
                >
                  <span className="min-w-0 truncate">
                    Notificaciones archivadas ({archivedNotifications.length})
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`flex-none text-body transition-transform ${archivedOpen ? 'rotate-180' : ''}`}
                    size={18}
                  />
                </button>

                {archivedOpen && (
                  <div className="grid gap-3 border-t border-line p-3 dark:border-line">
                    {archivedNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={async (item) => {
                          if (!item.read) {
                            await markAsRead(item.id);
                          }

                          if (hasNotificationLink(item.link)) {
                            openNotificationLink(item.link);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
