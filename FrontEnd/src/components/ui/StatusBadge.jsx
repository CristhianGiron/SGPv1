/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          StatusBadge.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente StatusBadge de la interfaz del SGP.
 */

import { formatEnum } from '../../utils/format';

const PALETTE = {
  APPROVED: 'border-success bg-success-soft text-success-strong dark:border-success/40 dark:bg-success-soft dark:text-success-strong',
  ACTIVE: 'border-success bg-success-soft text-success-strong dark:border-success/40 dark:bg-success-soft dark:text-success-strong',
  INACTIVE: 'border-line bg-panel-soft text-body dark:border-line dark:bg-surface-soft dark:text-ink',
  LOCKED: 'border-danger bg-danger-soft text-danger-strong dark:border-danger/40 dark:bg-danger-soft dark:text-danger-strong',
  PRESENT: 'border-success bg-success-soft text-success-strong dark:border-success/40 dark:bg-success-soft dark:text-success-strong',
  SUBMITTED: 'border-info bg-info-soft text-info-strong dark:border-info/40 dark:bg-info-soft dark:text-info-strong',
  SENT: 'border-info bg-info-soft text-info-strong dark:border-info/40 dark:bg-info-soft dark:text-info-strong',
  ANSWERED: 'border-success bg-success-soft text-success-strong dark:border-success/40 dark:bg-success-soft dark:text-success-strong',
  ARCHIVED: 'border-line bg-panel-soft text-body dark:border-line dark:bg-surface-soft dark:text-ink',
  PENDING: 'border-warning bg-warning-soft text-warning-strong dark:border-warning/40 dark:bg-warning-soft dark:text-warning-strong',
  NEEDS_CORRECTION: 'border-warning bg-warning-soft text-warning-strong dark:border-warning/40 dark:bg-warning-soft dark:text-warning-strong',
  REJECTED: 'border-danger bg-danger-soft text-danger-strong dark:border-danger/40 dark:bg-danger-soft dark:text-danger-strong',
  ABSENT: 'border-danger bg-danger-soft text-danger-strong dark:border-danger/40 dark:bg-danger-soft dark:text-danger-strong',
  DRAFT: 'border-line bg-panel-soft text-body dark:border-line dark:bg-surface-soft dark:text-ink',
  LATE: 'border-warning bg-warning-soft text-warning-strong',
  JUSTIFIED: 'border-info bg-info-soft text-info-strong',
  COMPLETED: 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-400/40 dark:bg-indigo-950/35 dark:text-indigo-200',
};

const baseClass =
  'sgp-status-badge inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none';

export function StatusBadge({ status }) {
  const value = typeof status === 'boolean' ? (status ? 'ACTIVE' : 'INACTIVE') : status;

  return (
    <span
      data-status={value}
      className={`${baseClass} ${PALETTE[value] || PALETTE.DRAFT}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {formatEnum(value)}
    </span>
  );
}
