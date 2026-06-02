import { useEffect } from 'react';
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
  labelledBy = 'app-modal-title',
  maxWidth = 'max-w-4xl',
  onClose,
  open,
  title,
}) {
  const portalRoot = getPortalRoot();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

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
        aria-labelledby={labelledBy}
        aria-modal="true"
        className="fixed inset-0 flex items-center justify-center px-4 py-6"
        role="dialog"
        style={{ zIndex: 100001 }}
      >
        <div
          className={cx(
            'flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden rounded-lg border border-[#bdcbd0] bg-[#fbfaf7] text-ink shadow-[0_24px_60px_rgba(4,52,76,0.22)] dark:border-slate-700 dark:bg-surface dark:text-ink dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)]',
            maxWidth,
            className,
          )}
        >
          {(title || description || onClose) && (
            <div className="flex items-start gap-3 border-b border-border p-4 dark:border-slate-700">
              <div className="min-w-0 flex-1">
                {title && (
                  <h2
                    className="text-base font-[850] leading-tight text-unl-graphite dark:text-slate-50"
                    id={labelledBy}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {description}
                  </p>
                )}
              </div>
              {onClose && (
                <button
                  aria-label="Cerrar"
                  className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-transparent text-muted transition-colors hover:border-[#529914] hover:bg-[#eef5e8] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:hover:border-[#75c66a] dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0]"
                  onClick={onClose}
                  type="button"
                >
                  <X aria-hidden="true" size={18} />
                </button>
              )}
            </div>
          )}
          <div className="min-h-0 overflow-y-auto p-4">
            {children}
          </div>
          {footer && (
            <div className="border-t border-border p-4 dark:border-slate-700">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>,
    portalRoot,
  );
}
