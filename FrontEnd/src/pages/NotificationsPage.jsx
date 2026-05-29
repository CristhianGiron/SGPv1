import { useState } from 'react';
import { CheckCheck, Send } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Alert } from '../components/ui/Alert';
import { PrimaryButton, SecondaryButton } from '../components/ui/ActionBar';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { Field, Input, Textarea } from '../components/ui/FormControls';
import { SectionCard } from '../components/ui/SectionCard';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { ROLES } from '../config/resources';
import { formatRole } from '../utils/format';
import { openNotificationLink } from '../utils/notificationLinks';

const EMPTY_ANNOUNCEMENT = {
  title: '',
  message: '',
  link: '',
  roles: [],
};

const roleOptionClass =
  'flex min-h-10 items-center gap-2 rounded-lg border border-[#bdcbd0] bg-white px-3 py-2 text-sm font-bold text-[#243d49] dark:border-slate-700 dark:bg-surface dark:text-ink';

const roleCheckboxClass = 'h-4 w-4 accent-[#529914] dark:accent-[#75c66a]';

const refreshButtonClass =
  'inline-flex min-h-9 items-center justify-center rounded-lg border border-[#529914] bg-transparent px-3 py-2 text-sm font-extrabold text-primary transition-colors hover:border-[#074462] hover:bg-[#074462] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-600 dark:bg-[#172033] dark:text-ink dark:hover:border-[#75c66a] dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0]';

const skeletonClass =
  'min-h-[4.5rem] rounded-lg border border-[#d7e4e9] bg-[#eef3f2] dark:border-slate-700 dark:bg-[#172033]';

export function NotificationsPage() {
  const { notifications, loading, unreadCount, error, markAsRead, markAllAsRead, refresh } = useNotifications();
  const { token, roles } = useAuth();
  const confirm = useConfirm();
  const [announcement, setAnnouncement] = useState(EMPTY_ANNOUNCEMENT);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const isAdmin = roles.includes('ROLE_ADMIN');

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
        }
      />

      {isAdmin && (
        <SectionCard title="Enviar aviso">
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

              <Field label="Enlace">
                <Input
                  onChange={(event) => updateAnnouncementField('link', event.target.value)}
                  placeholder="#/courses o https://..."
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
              <p className="mb-1.5 text-[0.82rem] font-extrabold text-[#34443b] dark:text-slate-300">Destinatarios</p>
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
        </SectionCard>
      )}

      <div className="rounded-lg border border-[#bdcbd0] bg-white p-4 shadow-card dark:border-slate-700 dark:bg-surface dark:shadow-[0_18px_42px_rgba(0,0,0,0.34)]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-[850] leading-tight text-[#10232c] dark:text-slate-50">Notificaciones recientes</p>
            <p className="mt-0.5 text-xs font-bold leading-tight text-muted">Tienes {unreadCount} notificaciones sin leer.</p>
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
          <div className="rounded-lg border border-[#f2b8bd] bg-[#f9e6e7] p-3 text-sm leading-6 text-[#8a1f2a] dark:border-rose-400/40 dark:bg-rose-950/35 dark:text-rose-200">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#bdcbd0] bg-[#eef3f2] p-4 text-center text-sm leading-6 text-muted dark:border-slate-700 dark:bg-[#172033] dark:text-slate-300">
            Todavía no tienes notificaciones.
          </div>
        ) : (
          <div className="grid gap-3">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={async (item) => {
                  await markAsRead(item.id);
                  openNotificationLink(item.link);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
