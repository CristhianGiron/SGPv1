import { formatEnum } from '../../utils/format';

const PALETTE = {
  APPROVED: 'border-success bg-success-soft text-success-strong dark:border-success/40 dark:bg-success-soft dark:text-success-strong',
  ACTIVE: 'border-success bg-success-soft text-success-strong dark:border-success/40 dark:bg-success-soft dark:text-success-strong',
  INACTIVE: 'border-line bg-panel-soft text-muted dark:border-line dark:bg-surface-soft dark:text-muted',
  LOCKED: 'border-danger bg-danger-soft text-danger-strong dark:border-danger/40 dark:bg-danger-soft dark:text-danger-strong',
  PRESENT: 'border-success bg-success-soft text-success-strong dark:border-success/40 dark:bg-success-soft dark:text-success-strong',
  SUBMITTED: 'border-info bg-info-soft text-info-strong dark:border-info/40 dark:bg-info-soft dark:text-info-strong',
  SENT: 'border-info bg-info-soft text-info-strong dark:border-info/40 dark:bg-info-soft dark:text-info-strong',
  ANSWERED: 'border-success bg-success-soft text-success-strong dark:border-success/40 dark:bg-success-soft dark:text-success-strong',
  ARCHIVED: 'border-line bg-panel-soft text-muted dark:border-line dark:bg-surface-soft dark:text-muted',
  PENDING: 'border-warning bg-warning-soft text-warning-strong dark:border-warning/40 dark:bg-warning-soft dark:text-warning-strong',
  NEEDS_CORRECTION: 'border-warning bg-warning-soft text-warning-strong dark:border-warning/40 dark:bg-warning-soft dark:text-warning-strong',
  REJECTED: 'border-danger bg-danger-soft text-danger-strong dark:border-danger/40 dark:bg-danger-soft dark:text-danger-strong',
  ABSENT: 'border-danger bg-danger-soft text-danger-strong dark:border-danger/40 dark:bg-danger-soft dark:text-danger-strong',
  DRAFT: 'border-line bg-panel-soft text-muted dark:border-line dark:bg-surface-soft dark:text-muted',
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
