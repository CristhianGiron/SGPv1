import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className = '',
  collapsible,
  defaultCollapsed = false,
}) {
  const canCollapse = collapsible ?? Boolean(title || description);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section
      className={cx(
        'relative min-w-0 overflow-hidden rounded-lg border border-primary/15 bg-panel p-4 text-ink shadow-card dark:border-line-soft dark:bg-surface',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 bg-primary opacity-80"
      />
      {(title || description || action) && (
        <div
          className={cx(
            'mb-4 flex flex-col gap-3 border-b border-line-soft pb-4 sm:flex-row sm:items-start sm:justify-between dark:border-line-soft',
            collapsed && 'mb-0 border-b-transparent pb-0',
          )}
        >
          {(title || description) && (
            <div className="min-w-0">
              {title && (
                <h2 className="text-base font-[850] leading-tight text-heading dark:text-heading">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm leading-6 text-muted dark:text-muted">
                  {description}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {action}
            {canCollapse && (
              <button
                aria-expanded={!collapsed}
                className="grid min-h-9 min-w-9 place-items-center rounded-lg border border-accent bg-transparent text-primary transition-colors hover:border-primary hover:bg-primary hover:text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:bg-surface-soft dark:text-ink dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong"
                onClick={() => setCollapsed((current) => !current)}
                title={collapsed ? 'Expandir seccion' : 'Contraer seccion'}
                type="button"
              >
                <ChevronDown
                  aria-hidden="true"
                  className={cx('transition-transform', collapsed && '-rotate-90')}
                  size={18}
                />
              </button>
            )}
          </div>
        </div>
      )}
      <div
        className={cx(
          'min-w-0 overflow-hidden transition-[max-height,opacity] duration-200',
          collapsed ? 'max-h-0 opacity-0' : 'max-h-[5600px] opacity-100',
        )}
      >
        {children}
      </div>
    </section>
  );
}
