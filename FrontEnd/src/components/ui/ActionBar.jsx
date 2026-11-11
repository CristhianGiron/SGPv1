/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ActionBar.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente ActionBar de la interfaz del SGP.
 */

import { resolveActionIntent } from '../../utils/actionIntent';
import { Loader2 } from 'lucide-react';

const baseButton =
  'inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 max-sm:w-full';

const primaryButton =
  'sgp-button-primary border-primary bg-primary text-inverse hover:border-primary-strong hover:bg-primary-strong';

const secondaryButton =
  'border-line bg-panel text-heading hover:border-line-strong hover:bg-panel-soft';

const closeButton =
  'border-line bg-transparent text-body hover:border-line-strong hover:bg-panel-soft hover:text-heading';

const dangerButton =
  'border-danger bg-danger-soft text-danger-strong hover:border-danger hover:bg-danger-soft dark:border-danger/40 dark:bg-danger-soft dark:text-danger-strong dark:hover:bg-danger-soft';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getButtonLabel(children) {
  if (children === null || children === undefined || typeof children === 'boolean') {
    return '';
  }

  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(getButtonLabel).join(' ').replace(/\s+/g, ' ').trim();
  }

  return children?.props ? getButtonLabel(children.props.children) : '';
}

export function ActionBar({ children }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

function ButtonContent({ children, icon: Icon, loading }) {
  return (
    <span className="inline-flex min-w-0 items-center justify-center gap-2">
      {loading ? (
        <Loader2 aria-hidden="true" className="animate-spin" size={17} />
      ) : (
        Icon && <Icon aria-hidden="true" size={17} />
      )}
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  className = '',
  intent,
  disabled,
  disabledReason,
  icon,
  loading = false,
  title,
  type = 'button',
  ...props
}) {
  const resolvedTitle = title || (disabled ? disabledReason : undefined) || getButtonLabel(children) || undefined;

  return (
    <button
      {...props}
      data-intent={resolveActionIntent(getButtonLabel(children) || props['aria-label'], intent, 'info')}
      aria-busy={loading || undefined}
      className={cx('sgp-action sgp-action-solid', baseButton, primaryButton, className)}
      disabled={disabled || loading}
      title={resolvedTitle}
      type={type}
    >
      <ButtonContent icon={icon} loading={loading}>
        {children}
      </ButtonContent>
    </button>
  );
}

export function SecondaryButton({
  children,
  className = '',
  intent,
  disabled,
  disabledReason,
  icon,
  loading = false,
  title,
  type = 'button',
  ...props
}) {
  const resolvedTitle = title || (disabled ? disabledReason : undefined) || getButtonLabel(children) || undefined;

  return (
    <button
      {...props}
      data-intent={resolveActionIntent(getButtonLabel(children) || props['aria-label'], intent, 'neutral')}
      aria-busy={loading || undefined}
      className={cx('sgp-action sgp-action-soft', baseButton, secondaryButton, className)}
      disabled={disabled || loading}
      title={resolvedTitle}
      type={type}
    >
      <ButtonContent icon={icon} loading={loading}>
        {children}
      </ButtonContent>
    </button>
  );
}

export function CloseButton({
  children,
  className = '',
  disabled,
  disabledReason,
  icon,
  loading = false,
  title,
  type = 'button',
  ...props
}) {
  const resolvedTitle = title || (disabled ? disabledReason : undefined) || getButtonLabel(children) || undefined;

  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={cx(baseButton, closeButton, className)}
      disabled={disabled || loading}
      title={resolvedTitle}
      type={type}
    >
      <ButtonContent icon={icon} loading={loading}>
        {children}
      </ButtonContent>
    </button>
  );
}

export function DangerButton({
  children,
  className = '',
  intent,
  disabled,
  disabledReason,
  icon,
  loading = false,
  title,
  type = 'button',
  ...props
}) {
  const resolvedTitle = title || (disabled ? disabledReason : undefined) || getButtonLabel(children) || undefined;

  return (
    <button
      {...props}
      data-intent={resolveActionIntent(getButtonLabel(children) || props['aria-label'], intent || 'danger', 'danger')}
      aria-busy={loading || undefined}
      className={cx('sgp-action sgp-action-soft', baseButton, dangerButton, className)}
      disabled={disabled || loading}
      title={resolvedTitle}
      type={type}
    >
      <ButtonContent icon={icon} loading={loading}>
        {children}
      </ButtonContent>
    </button>
  );
}
