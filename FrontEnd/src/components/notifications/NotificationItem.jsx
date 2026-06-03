import { ArrowRight, CheckCircle2, CircleDot } from "lucide-react";
import { hasNotificationLink } from "../../utils/notificationLinks";

const itemBaseClass =
  "w-full rounded-lg border border-line bg-panel p-3 text-left text-heading transition-colors hover:border-accent focus-visible:border-accent focus-visible:outline-none dark:border-line dark:bg-surface dark:text-ink dark:hover:border-accent dark:focus-visible:border-accent";

const itemUnreadClass =
  "border-accent/40 bg-accent-soft dark:border-accent/40 dark:bg-accent-soft";

export function NotificationItem({ notification, onClick }) {
  const timestamp = notification.createdAt
    ? new Date(notification.createdAt).toLocaleString("es-ES", {
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

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={`${itemBaseClass} ${isRead ? "" : itemUnreadClass}`}
    >
      <span className="flex items-start gap-3">
        <span className="mt-0.5 flex-none text-accent dark:text-accent-strong">
          {isRead ? (
            <CheckCircle2 size={18} />
          ) : (
            <CircleDot size={18} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-[850] leading-tight text-heading dark:text-heading">
              {notification.title}
            </span>
            <span className="inline-flex flex-none items-center gap-1 rounded-md border border-line bg-field-hover px-2 py-1 text-[0.68rem] font-extrabold uppercase leading-none text-muted dark:border-line dark:bg-surface-soft dark:text-muted">
              {actionLabel}
              {hasLink && (
                <ArrowRight
                  aria-hidden="true"
                  size={13}
                  className="text-muted"
                />
              )}
            </span>
          </span>
          <span className="mt-1.5 block text-sm leading-6 text-muted dark:text-muted">
            {notification.message}
          </span>
          <span className="mt-2.5 block text-[0.72rem] font-extrabold uppercase leading-tight tracking-normal text-muted dark:text-muted">
            {timestamp}
          </span>
        </span>
      </span>
    </button>
  );
}
