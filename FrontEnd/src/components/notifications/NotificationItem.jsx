import { ArrowRight, CheckCircle2, CircleDot } from "lucide-react";

const itemBaseClass =
  "w-full rounded-lg border border-[#bdcbd0] bg-white p-3 text-left text-[#10232c] transition-colors hover:border-[#529914] focus-visible:border-[#529914] focus-visible:outline-none dark:border-slate-700 dark:bg-surface dark:text-ink dark:hover:border-[#75c66a] dark:focus-visible:border-[#75c66a]";

const itemUnreadClass =
  "border-[#529914]/40 bg-[#eef5e8] dark:border-[#75c66a]/40 dark:bg-[#75c66a]/10";

export function NotificationItem({ notification, onClick }) {
  const timestamp = notification.createdAt
    ? new Date(notification.createdAt).toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";
  const isRead = notification.read;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={`${itemBaseClass} ${isRead ? "" : itemUnreadClass}`}
    >
      <span className="flex items-start gap-3">
        <span className="mt-0.5 flex-none text-[#529914] dark:text-[#a7e79f]">
          {isRead ? (
            <CheckCircle2 size={18} />
          ) : (
            <CircleDot size={18} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-[850] leading-tight text-[#10232c] dark:text-slate-50">
              {notification.title}
            </span>
            <ArrowRight
              aria-hidden="true"
              size={16}
              className="flex-none text-muted"
            />
          </span>
          <span className="mt-1.5 block text-sm leading-6 text-[#4b5a60] dark:text-muted">
            {notification.message}
          </span>
          <span className="mt-2.5 block text-[0.72rem] font-extrabold uppercase leading-tight tracking-normal text-[#6b7c83] dark:text-muted">
            {timestamp}
          </span>
        </span>
      </span>
    </button>
  );
}
