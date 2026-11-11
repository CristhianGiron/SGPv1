/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          NotificationItem.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente NotificationItem de la interfaz del SGP.
 */

import { useState } from 'react';
import { ArrowRight, CheckCircle2, CircleDot } from "lucide-react";
import { hasNotificationLink } from "../../utils/notificationLinks";

const itemBaseClass =
  "sgp-color-card min-w-0 w-full overflow-hidden rounded-lg border border-line bg-panel p-3 text-left text-heading transition-colors hover:border-accent focus-visible:border-accent focus-visible:outline-none dark:border-line dark:bg-surface dark:text-ink dark:hover:border-accent dark:focus-visible:border-accent";

const itemUnreadClass =
  "border-info/40 bg-info-soft dark:border-info/40 dark:bg-info-soft";

const readIndicatorClass = "text-success-strong dark:text-success-strong";
const unreadIndicatorClass = "text-info-strong dark:text-info-strong";

const readBadgeClass =
  "border-success/35 bg-success-soft text-success-strong dark:border-success/35 dark:bg-success-soft dark:text-success-strong";
const unreadBadgeClass =
  "border-info/35 bg-info-soft text-info-strong";
const linkBadgeClass =
  "border-info/35 bg-info-soft text-info-strong dark:border-info/35 dark:bg-info-soft dark:text-info-strong";

export function NotificationItem({ notification, onClick }) {
  const [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  const validDate = notification.createdAt && Number.isFinite(Date.parse(notification.createdAt));
  const timestamp = validDate
    ? new Date(notification.createdAt).toLocaleString("es-EC", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";
  const isRead = notification.read;
  const hasLink = hasNotificationLink(notification.link);
  const actionLabel = hasLink
    ? "Abrir"
    : isRead
      ? "Leída"
      : "Marcar leída";
  const indicatorClass = isRead ? readIndicatorClass : unreadIndicatorClass;
  const badgeClass = hasLink
    ? linkBadgeClass
    : isRead
      ? readBadgeClass
      : unreadBadgeClass;

  return (
    <button
      type="button"
      disabled={busy}
      aria-busy={busy || undefined}
      onClick={async () => {
        setBusy(true);setFailed(false);
        try { if (await onClick(notification) === false) setFailed(true); }
        catch { setFailed(true); }
        finally { setBusy(false); }
      }}
      className={`${itemBaseClass} ${isRead ? "" : itemUnreadClass}`}
    >
      <span className="flex min-w-0 items-start gap-3">
        <span className={`mt-0.5 flex-none ${indicatorClass}`}>
          {isRead ? (
            <CheckCircle2 size={18} />
          ) : (
            <CircleDot size={18} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 break-words text-sm font-semibold leading-snug text-heading dark:text-heading">
              {notification.title}
            </span>
            <span className={`inline-flex max-w-[7.5rem] flex-none items-center gap-1 rounded-md border px-2 py-1 text-[0.68rem] font-semibold uppercase leading-none ${badgeClass}`}>
              {busy ? "Abriendo…" : actionLabel}
              {hasLink && (
                <ArrowRight
                  aria-hidden="true"
                  size={13}
                />
              )}
            </span>
          </span>
          <span className="mt-1.5 block whitespace-normal break-words text-sm leading-6 text-body dark:text-ink">
            {notification.message}
          </span>
          {failed && <span role="alert" className="mt-2 block text-sm text-danger-strong">No se pudo completar la acción. Inténtalo de nuevo.</span>}
          <span className="mt-2.5 block truncate text-[0.72rem] font-medium uppercase leading-tight tracking-normal text-body dark:text-ink">
            {timestamp}
          </span>
        </span>
      </span>
    </button>
  );
}
