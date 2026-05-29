import { Inbox } from 'lucide-react';

export function EmptyState({ text = 'Aun no hay informacion para mostrar.' }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-[#bdcbd0] bg-[#dfe9e3] p-4 text-sm text-[#53646a] dark:border-slate-700 dark:bg-surface dark:text-slate-300">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-primary-soft text-primary dark:bg-white/10 dark:text-sky-200">
        <Inbox aria-hidden="true" size={18} />
      </span>
      <span>{text}</span>
    </div>
  );
}
