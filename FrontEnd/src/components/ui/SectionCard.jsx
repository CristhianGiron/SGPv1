/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          SectionCard.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente SectionCard de la interfaz del SGP.
 */

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
  collapsible = false,
  defaultCollapsed = false,
}) {
  const canCollapse = collapsible || defaultCollapsed;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (collapsed) {
    return (
      <section
        className={cx(
          'sgp-section-card relative min-w-0 overflow-hidden rounded-lg border border-line bg-panel px-3 py-2 text-ink dark:border-line-soft dark:bg-surface',
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
              <h2 className="truncate text-base font-semibold leading-none text-heading dark:text-heading">
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
                aria-label={`Expandir ${title || 'sección'}`}
                title="Expandir sección"
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
        'relative min-w-0 overflow-hidden rounded-lg border border-line bg-panel text-ink dark:border-line-soft dark:bg-surface',
        'sgp-section-card',
        'p-4 sm:p-6',
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
            'mb-3 flex flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between dark:border-line-soft',
          )}
        >
          {(title || description) && (
            <div className="min-w-0">
              {title && (
                <h2 className="text-base font-semibold leading-tight text-heading dark:text-heading">
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
                aria-label={`${collapsed ? 'Expandir' : 'Contraer'} ${title || 'sección'}`}
                title={collapsed ? 'Expandir sección' : 'Contraer sección'}
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
      <div className="min-w-0">
        {children}
      </div>
    </section>
  );
}
