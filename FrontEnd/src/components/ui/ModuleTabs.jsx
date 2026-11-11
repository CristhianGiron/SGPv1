/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ModuleTabs.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente ModuleTabs de la interfaz del SGP.
 */

import { useRef } from 'react';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getTabLabel(children) {
  if (children === null || children === undefined || typeof children === 'boolean') return '';
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(getTabLabel).join(' ').replace(/\s+/g, ' ').trim();
  }

  return getTabLabel(children?.props?.children);
}

export function ModuleTabs({ children, className = '', onKeyDown, ...props }) {
  const listRef = useRef(null);

  function handleKeyDown(event) {
    onKeyDown?.(event);
    if (event.defaultPrevented || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = Array.from(listRef.current.querySelectorAll('[role="tab"]:not(:disabled)'));
    const index = tabs.indexOf(event.target);
    if (index < 0 || !tabs.length) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    tabs[next].click();
  }

  return (
    <div className={cx('sgp-tab-strip flex overflow-x-auto', className)} ref={listRef} role="tablist" onKeyDown={handleKeyDown} {...props}>
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
      aria-selected={Boolean(active)}
      tabIndex={active ? 0 : -1}
      className={cx(
        'inline-flex min-h-[2.45rem] flex-none items-center rounded-lg border border-accent bg-transparent px-3 py-2 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary hover:text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:text-ink dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong',
        'border-[color:var(--sgp-tab-color)] bg-[var(--sgp-tab-soft)] text-[color:var(--sgp-tab-strong)] hover:bg-[var(--sgp-tab-color)] hover:text-inverse dark:border-[color:var(--sgp-tab-color)] dark:bg-[var(--sgp-tab-soft)] dark:text-[color:var(--sgp-tab-strong)]',
        active && activeClasses,
        className,
      )}
      role="tab"
      title={getTabLabel(children) || undefined}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
