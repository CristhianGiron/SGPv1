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

  if (collapsed) {
    return (
      <section
        className={cx(
          'sgp-section-card relative min-w-0 overflow-hidden rounded-lg border border-line bg-panel px-3 py-2 text-ink shadow-card dark:border-line-soft dark:bg-surface',
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-0.5 bg-primary opacity-70"
        />
        <div className="flex min-h-9 items-center justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-base font-medium leading-none text-heading dark:text-heading">
                {title}
              </h2>
            )}
          </div>
          <div className="flex flex-none items-center gap-2">
            {action}
            {canCollapse && (
              <button
                aria-expanded="false"
                className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-accent bg-transparent text-primary transition-colors hover:border-primary hover:bg-primary hover:text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:bg-surface-soft dark:text-ink dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong"
                onClick={() => setCollapsed(false)}
                title="Expandir seccion"
                type="button"
              >
                <ChevronDown
                  aria-hidden="true"
                  className="-rotate-90 transition-transform"
                  size={18}
                />
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cx(
        'relative min-w-0 overflow-hidden rounded-lg border border-line bg-panel text-ink shadow-card dark:border-line-soft dark:bg-surface',
        'sgp-section-card',
        'p-3 sm:p-4',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-0.5 bg-primary opacity-70"
      />
      {(title || description || action) && (
        <div
          className={cx(
            'mb-3 flex flex-col gap-3 border-b border-line-soft pb-3 sm:flex-row sm:items-start sm:justify-between dark:border-line-soft',
          )}
        >
          {(title || description) && (
            <div className="min-w-0">
              {title && (
                <h2 className="text-base font-medium leading-tight text-heading dark:text-heading">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm leading-6 text-body dark:text-ink">
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
                className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-accent bg-transparent text-primary transition-colors hover:border-primary hover:bg-primary hover:text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:bg-surface-soft dark:text-ink dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong"
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
      <div className="min-w-0 overflow-hidden transition-[max-height,opacity] duration-200">
        {children}
      </div>
    </section>
  );
}
