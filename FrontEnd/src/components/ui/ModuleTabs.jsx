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
      ? 'border-[#529914] bg-transparent text-primary hover:border-primary hover:bg-primary hover:text-white dark:border-slate-600 dark:bg-surface dark:text-ink dark:hover:border-[#75c66a] dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0]'
      : 'border-[#529914] bg-[#529914] text-white hover:border-[#3f760f] hover:bg-[#3f760f] dark:border-[#75c66a] dark:bg-[#203026] dark:text-[#bbf7d0] dark:hover:border-[#a7e79f] dark:hover:bg-[#2b3f31]';

  return (
    <button
      aria-selected={active}
      className={cx(
        'inline-flex min-h-[2.45rem] flex-none items-center rounded-lg border border-[#529914] bg-transparent px-3 py-2 text-sm font-extrabold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-600 dark:text-ink dark:hover:border-[#75c66a] dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0]',
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
