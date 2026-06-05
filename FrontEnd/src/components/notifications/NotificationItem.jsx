import { ArrowRight, CheckCircle2, CircleDot } from "lucide-react";
import { hasNotificationLink } from "../../utils/notificationLinks";

const itemBaseClass =
  "sgp-color-card min-w-0 w-full overflow-hidden rounded-lg border border-line bg-panel p-3 text-left text-heading transition-colors hover:border-accent focus-visible:border-accent focus-visible:outline-none dark:border-line dark:bg-surface dark:text-ink dark:hover:border-accent dark:focus-visible:border-accent";

const itemUnreadClass =
  "border-warning/50 bg-warning-soft dark:border-warning/40 dark:bg-warning-soft";

const readIndicatorClass = "text-success-strong dark:text-success-strong";
const unreadIndicatorClass = "text-warning-strong dark:text-warning-strong";

const readBadgeClass =
  "border-success/35 bg-success-soft text-success-strong dark:border-success/35 dark:bg-success-soft dark:text-success-strong";
const unreadBadgeClass =
  "border-warning/35 bg-warning-soft text-warning-strong dark:border-warning/35 dark:bg-warning-soft dark:text-warning-strong";
const linkBadgeClass =
  "border-info/35 bg-info-soft text-info-strong dark:border-info/35 dark:bg-info-soft dark:text-info-strong";

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
  const indicatorClass = isRead ? readIndicatorClass : unreadIndicatorClass;
  const badgeClass = hasLink
    ? linkBadgeClass
    : isRead
      ? readBadgeClass
      : unreadBadgeClass;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
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
          <span className="flex min-w-0 items-center justify-between gap-3">
            <span className="min-w-0 truncate text-sm font-medium leading-tight text-heading dark:text-heading">
              {notification.title}
            </span>
            <span className={`inline-flex max-w-[7.5rem] flex-none items-center gap-1 rounded-md border px-2 py-1 text-[0.68rem] font-semibold uppercase leading-none ${badgeClass}`}>
              {actionLabel}
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
          <span className="mt-2.5 block truncate text-[0.72rem] font-medium uppercase leading-tight tracking-normal text-body dark:text-ink">
            {timestamp}
          </span>
        </span>
      </span>
    </button>
  );
}
