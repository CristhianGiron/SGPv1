import { Loader2 } from 'lucide-react';

const baseButton =
  'inline-flex min-h-[2.55rem] items-center justify-center rounded-lg border px-4 py-2 text-sm font-extrabold leading-tight transition-[background-color,border-color,color,transform] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 max-sm:w-full';

const primaryButton =
  'border-[#529914] bg-transparent text-primary hover:border-primary hover:bg-primary hover:text-white dark:border-[#75c66a] dark:text-[#bbf7d0] dark:hover:border-[#a7e79f] dark:hover:bg-[#203026] dark:hover:text-white';

const secondaryButton =
  'border-[#529914] bg-transparent text-primary hover:border-primary hover:bg-primary hover:text-white dark:border-slate-600 dark:bg-surface dark:text-ink dark:hover:border-[#75c66a] dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0]';

const dangerButton =
  'border-rose-300 bg-rose-50 text-rose-700 hover:border-rose-500 hover:bg-rose-100 dark:border-rose-400/40 dark:bg-rose-950/35 dark:text-rose-200 dark:hover:bg-rose-900/45';

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
