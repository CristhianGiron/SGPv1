function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function ModuleTabs({ children, className = '', ...props }) {
  return (
    <div
      className={cx('flex gap-2 overflow-x-auto pb-0.5', className)}
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
      ? 'border-accent bg-transparent text-primary hover:border-primary hover:bg-primary hover:text-inverse dark:border-line dark:bg-surface dark:text-ink dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong'
      : 'border-accent bg-accent text-inverse hover:border-accent-strong hover:bg-accent-strong dark:border-accent dark:bg-hover-soft dark:text-accent-strong dark:hover:border-accent-strong dark:hover:bg-hover-soft';

  return (
    <button
      aria-selected={active}
      className={cx(
        'inline-flex min-h-[2.45rem] flex-none items-center rounded-lg border border-accent bg-transparent px-3 py-2 text-sm font-extrabold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:text-ink dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong',
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
