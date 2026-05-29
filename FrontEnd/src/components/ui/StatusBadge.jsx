import { formatEnum } from '../../utils/format';

const PALETTE = {
  APPROVED: 'border-green-300 bg-green-50 text-green-800 dark:border-green-400/40 dark:bg-green-950/35 dark:text-green-200',
  ACTIVE: 'border-green-300 bg-green-50 text-green-800 dark:border-green-400/40 dark:bg-green-950/35 dark:text-green-200',
  INACTIVE: 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
  LOCKED: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-950/35 dark:text-rose-200',
  PRESENT: 'border-green-300 bg-green-50 text-green-800 dark:border-green-400/40 dark:bg-green-950/35 dark:text-green-200',
  SUBMITTED: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-400/40 dark:bg-sky-950/35 dark:text-sky-200',
  SENT: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-400/40 dark:bg-sky-950/35 dark:text-sky-200',
  ANSWERED: 'border-green-300 bg-green-50 text-green-800 dark:border-green-400/40 dark:bg-green-950/35 dark:text-green-200',
  PENDING: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/40 dark:bg-amber-950/35 dark:text-amber-200',
  NEEDS_CORRECTION: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/40 dark:bg-amber-950/35 dark:text-amber-200',
  REJECTED: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-950/35 dark:text-rose-200',
  ABSENT: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-950/35 dark:text-rose-200',
  DRAFT: 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
  COMPLETED: 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-400/40 dark:bg-indigo-950/35 dark:text-indigo-200',
};

const baseClass =
  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-extrabold leading-none';

export function StatusBadge({ status }) {
  const value = typeof status === 'boolean' ? (status ? 'ACTIVE' : 'INACTIVE') : status;

  return (
    <span
      className={`${baseClass} ${PALETTE[value] || PALETTE.DRAFT}`}
    >
      {formatEnum(value)}
    </span>
  );
}
