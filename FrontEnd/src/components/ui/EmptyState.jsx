import { Inbox } from 'lucide-react';

export function EmptyState({ text = 'Aun no hay informacion para mostrar.' }) {
  return (
    <div className="relative flex items-center gap-3 overflow-hidden rounded-lg border border-dashed border-[color:var(--module-accent)] bg-[var(--module-accent-soft)] p-4 text-sm text-[color:var(--module-accent-strong)] shadow-card dark:border-[color:var(--module-accent)] dark:bg-[var(--module-accent-soft)] dark:text-[color:var(--module-accent-strong)]">
      <span aria-hidden="true" className="absolute -right-7 -top-8 h-20 w-20 rounded-full bg-inverse/20" />
      <span className="relative grid h-10 w-10 flex-none place-items-center rounded-lg border-4 border-panel bg-[var(--module-accent)] text-inverse shadow-card">
        <Inbox aria-hidden="true" size={18} />
      </span>
      <span className="relative">{text}</span>
    </div>
  );
}
