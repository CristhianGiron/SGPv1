/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          NotificationsPage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Presenta las notificaciones de la cuenta y permite consultar sus eventos relacionados.
 */

import { useMemo, useState } from 'react';
import { Bell, CheckCheck, RefreshCw, Send } from 'lucide-react';
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
import { groupInboxByDate, inboxNotifications } from '../utils/notificationInbox';
import { EmptyState } from '../components/ui/EmptyState';
import { ListToolbar } from '../components/ui/ListToolbar';
import { ModuleTab, ModuleTabs } from '../components/ui/ModuleTabs';

const EMPTY_ANNOUNCEMENT = {
  title: '',
  message: '',
  link: '',
  roles: [],
};

const roleOptionClass =
  'flex min-h-10 items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm font-medium text-body dark:border-line dark:bg-surface dark:text-ink';

const roleCheckboxClass = 'h-4 w-4 accent-accent dark:accent-accent';

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
  const [view, setView] = useState('unread');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(20);
  const [markingAll, setMarkingAll] = useState(false);
  const isAdmin = roles.includes('ROLE_ADMIN');
  const filtered = useMemo(() => inboxNotifications(notifications, view, search), [notifications, view, search]);
  const groups = groupInboxByDate(filtered.slice(0, limit));
  const readCount = notifications.filter(item => item.read).length;

  async function openNotification(item) {
    if (!item.read) {
      const updated = await markAsRead(item.id);
      if (!updated) return false;
    }
    if (hasNotificationLink(item.link)) openNotificationLink(item.link);
    return true;
  }

  async function markAll() {
    if (markingAll || loading || !unreadCount) return;
    const accepted = await confirm({title:'Marcar notificaciones como leídas', description:'Todas tus notificaciones pendientes quedarán marcadas como leídas.', confirmLabel:'Marcar como leídas', tone:'warning'});
    if (!accepted) return;
    setMarkingAll(true);
    try { await markAllAsRead(); } finally { setMarkingAll(false); }
  }

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
      setAnnouncementError('Completa el título y el mensaje del aviso.');
      return;
    }

    const accepted = await confirm({
      title: 'Enviar aviso',
      description: 'El aviso se enviará a los destinatarios seleccionados. Revisa el mensaje antes de continuar.',
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
          <form className="space-y-4" onSubmit={sendAnnouncement}><fieldset disabled={sendingAnnouncement} className="min-w-0 space-y-4">
            {announcementError && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger-strong">{announcementError}</p>}
            {announcementMessage && <Alert tone="success">{announcementMessage}</Alert>}

            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Título">
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
          </fieldset></form>
      </Modal>

      {announcementMessage && <Alert tone="success">{announcementMessage}</Alert>}
      <section className="overflow-hidden rounded-xl border border-line bg-panel shadow-card" aria-label="Bandeja de notificaciones">
        <div className="border-b border-line bg-panel-soft p-5 md:p-6">
          <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-info-soft text-info-strong"><Bell size={22} aria-hidden="true" /></span><div><h2 className="text-lg font-semibold text-heading">{loading ? 'Actualizando tu bandeja' : error ? 'No se pudo actualizar la bandeja' : unreadCount ? 'Tienes novedades por revisar' : 'Tu bandeja está al día'}</h2><p className="mt-1 text-sm text-body">{loading || error ? 'Actualiza la bandeja para comprobar tus avisos.' : `${unreadCount} sin leer · ${readCount} leídas`}</p></div></div>
        </div>
        <div className="space-y-5 p-4 md:p-6">
          <ModuleTabs>{[['unread','Sin leer'],['all','Todas'],['read','Leídas']].map(([id,label]) => <ModuleTab key={id} active={view===id} onClick={() => {setView(id);setLimit(20);}}>{label} ({id==='unread' ? notifications.filter(item=>!item.read).length : id==='read' ? readCount : notifications.length})</ModuleTab>)}</ModuleTabs>
          <ListToolbar search={<Field label="Buscar notificaciones"><Input type="search" placeholder="Título o contenido del aviso" value={search} onChange={event => {setSearch(event.target.value);setLimit(20);}} /></Field>}
            actions={<><SecondaryButton icon={RefreshCw} loading={loading} onClick={refresh}>Actualizar</SecondaryButton><SecondaryButton icon={CheckCheck} disabled={loading || markingAll || !unreadCount} loading={markingAll} onClick={markAll}>Marcar todas como leídas</SecondaryButton></>}
            summary={loading ? 'Actualizando notificaciones…' : `${filtered.length} resultado(s)`} />
          {error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger-strong">{error}</p>}
          {loading && !notifications.length ? <div className="grid gap-3" role="status" aria-label="Cargando notificaciones"><div className={skeletonClass} /><div className={skeletonClass} /></div>
            : !filtered.length ? (error ? null : <EmptyState icon={Bell} title={search ? 'No encontramos ese aviso' : view==='unread' ? 'No tienes notificaciones sin leer' : 'Todavía no hay avisos en esta vista'} text={search ? 'Prueba con otra palabra o elimina la búsqueda.' : view==='unread' ? 'Puedes consultar las comunicaciones anteriores en Leídas o Todas.' : 'Las comunicaciones para tu cuenta aparecerán aquí.'} action={search ? <SecondaryButton onClick={() => setSearch('')}>Limpiar búsqueda</SecondaryButton> : view==='unread' && readCount>0 ? <SecondaryButton onClick={() => {setView('read');setLimit(20);}}>Ver leídas</SecondaryButton> : null} />)
            : <div className="space-y-6">{groups.map(group => <section key={group.key} aria-label={group.label}><h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{group.label}</h3><div className="grid gap-2">{group.items.map(notification => <NotificationItem key={notification.id} notification={notification} onClick={openNotification} />)}</div></section>)}</div>}
          {filtered.length>limit && <div className="flex justify-center"><SecondaryButton onClick={() => setLimit(value=>value+20)}>Mostrar más ({filtered.length-limit} restantes)</SecondaryButton></div>}
        </div>
      </section>
    </div>
  );
}
