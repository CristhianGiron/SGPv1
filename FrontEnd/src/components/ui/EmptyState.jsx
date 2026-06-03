import { Inbox } from 'lucide-react';

export function EmptyState({ text = 'Aun no hay informacion para mostrar.' }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-line bg-panel-soft p-4 text-sm text-muted dark:border-line dark:bg-surface dark:text-muted">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-primary-soft text-primary dark:bg-panel/10 dark:text-info-strong">
        <Inbox aria-hidden="true" size={18} />
      </span>
      <span>{text}</span>
    </div>
  );
}
