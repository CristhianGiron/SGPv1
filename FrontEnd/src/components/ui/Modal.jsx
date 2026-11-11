/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          Modal.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente Modal de la interfaz del SGP.
 */

import { useDialogFocus } from '../../hooks/useDialogFocus';
import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { getPortalRoot } from '../../utils/portal';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function Modal({
  children,
  className = '',
  description,
  footer,
  labelledBy,
  maxWidth = 'max-w-4xl',
  onClose,
  open,
  title,
}) {
  const portalRoot = getPortalRoot();
  const dialogRef = useRef(null);

  const generatedId = useId();
  const titleId = labelledBy || `sgp-dialog-${generatedId}`;
  useDialogFocus(open, dialogRef, onClose);

  if (!open || !portalRoot) {
    return null;
  }

  return createPortal(
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/45 dark:bg-black/65"
        style={{ zIndex: 100000 }}
      />
      <div
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? "Diálogo" : undefined}
        aria-modal="true"
        className="sgp-modal-dialog fixed inset-0 flex items-center justify-center px-3 py-4 sm:px-4 sm:py-6"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose?.();
          }
        }}
        role="dialog"
        tabIndex={-1}
        ref={dialogRef}
        style={{ zIndex: 100001 }}
      >
        <div
          className={cx(
            'flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-lg border border-line bg-panel text-ink shadow-soft dark:border-line dark:bg-surface dark:text-ink dark:shadow-soft sm:max-h-[calc(100vh-3rem)]',
            maxWidth,
            className,
          )}
        >
          {(title || description || onClose) && (
            <div className="flex items-start gap-3 border-b border-border p-3 sm:p-4 dark:border-line">
              <div className="min-w-0 flex-1">
                {title && (
                  <h2
                    className="text-base font-medium leading-tight text-unl-graphite dark:text-heading"
                    id={titleId}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm leading-6 text-body">
                    {description}
                  </p>
                )}
              </div>
              {onClose && (
                <button
                  aria-label="Cerrar"
                  className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-transparent text-body transition-colors hover:border-accent hover:bg-accent-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong"
                  onClick={onClose}
                  type="button"
                >
                  <X aria-hidden="true" size={18} />
                </button>
              )}
            </div>
          )}
          <div className="min-h-0 overflow-y-auto p-3 sm:p-4">
            {children}
          </div>
          {footer && (
            <div className="border-t border-border p-3 sm:p-4 dark:border-line">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>,
    portalRoot,
  );
}
