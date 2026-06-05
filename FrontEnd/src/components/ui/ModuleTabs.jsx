function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function ModuleTabs({ children, className = '', ...props }) {
  return (
    <div
      className={cx('sgp-tab-strip flex gap-2 overflow-x-auto pb-0.5', className)}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
}

export function ModuleTab({
  active,
  activeVariant = 'outline',
  children,
  className = '',
  type = 'button',
  ...props
}) {
  const activeClasses =
    activeVariant === 'outline'
      ? 'border-[color:var(--sgp-tab-color)] bg-[var(--sgp-tab-color)] text-inverse shadow-card hover:border-[color:var(--sgp-tab-strong)] hover:bg-[var(--sgp-tab-strong)] dark:text-inverse'
      : 'border-[color:var(--sgp-tab-color)] bg-[var(--sgp-tab-color)] text-inverse shadow-card hover:border-[color:var(--sgp-tab-strong)] hover:bg-[var(--sgp-tab-strong)] dark:text-inverse';

  return (
    <button
      aria-selected={active}
      className={cx(
        'inline-flex min-h-[2.45rem] flex-none items-center rounded-lg border border-accent bg-transparent px-3 py-2 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary hover:text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:text-ink dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong',
        'border-[color:var(--sgp-tab-color)] bg-[var(--sgp-tab-soft)] text-[color:var(--sgp-tab-strong)] hover:bg-[var(--sgp-tab-color)] hover:text-inverse dark:border-[color:var(--sgp-tab-color)] dark:bg-[var(--sgp-tab-soft)] dark:text-[color:var(--sgp-tab-strong)]',
        active && activeClasses,
        className,
      )}
      role="tab"
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
