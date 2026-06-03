import { Loader2 } from 'lucide-react';

const baseButton =
  'inline-flex min-h-[2.55rem] items-center justify-center rounded-lg border px-4 py-2 text-sm font-extrabold leading-tight transition-[background-color,border-color,color,transform] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 max-sm:w-full';

const primaryButton =
  'border-accent bg-transparent text-primary hover:border-primary hover:bg-primary hover:text-inverse dark:border-accent dark:text-accent-strong dark:hover:border-accent-strong dark:hover:bg-hover-soft dark:hover:text-inverse';

const secondaryButton =
  'border-accent bg-transparent text-primary hover:border-primary hover:bg-primary hover:text-inverse dark:border-line dark:bg-surface dark:text-ink dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong';

const dangerButton =
  'border-danger bg-danger-soft text-danger-strong hover:border-danger hover:bg-danger-soft dark:border-danger/40 dark:bg-danger-soft dark:text-danger-strong dark:hover:bg-danger-soft';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
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
  disabled,
  icon,
  loading = false,
  type = 'button',
  ...props
}) {
  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={cx(baseButton, primaryButton, className)}
      disabled={disabled || loading}
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
  disabled,
  icon,
  loading = false,
  type = 'button',
  ...props
}) {
  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={cx(baseButton, secondaryButton, className)}
      disabled={disabled || loading}
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
  disabled,
  icon,
  loading = false,
  type = 'button',
  ...props
}) {
  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={cx(baseButton, dangerButton, className)}
      disabled={disabled || loading}
      type={type}
    >
      <ButtonContent icon={icon} loading={loading}>
        {children}
      </ButtonContent>
    </button>
  );
}
