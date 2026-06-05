import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { getPortalRoot } from '../../utils/portal';

const ConfirmContext = createContext(null);

const toneStyles = {
  danger: {
    icon: 'border-danger bg-danger-soft text-danger-strong dark:border-danger/40 dark:bg-danger-soft dark:text-danger-strong',
    confirm: 'border-danger bg-danger text-inverse hover:bg-danger-strong dark:border-danger dark:bg-danger-strong dark:hover:bg-danger',
  },
  warning: {
    icon: 'border-warning bg-warning-soft text-warning-strong dark:border-warning/40 dark:bg-warning-soft dark:text-warning-strong',
    confirm: 'border-accent bg-primary text-inverse hover:bg-secondary dark:border-accent dark:bg-hover-soft dark:text-accent-strong dark:hover:bg-hover-soft',
  },
  success: {
    icon: 'border-line bg-success-soft text-success-strong dark:border-accent/40 dark:bg-success-soft dark:text-success-strong',
    confirm: 'border-accent bg-primary text-inverse hover:bg-secondary dark:border-accent dark:bg-hover-soft dark:text-accent-strong dark:hover:bg-hover-soft',
  },
};

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolverRef = useRef(null);
  const portalRoot = getPortalRoot();

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current?.(false);
      resolverRef.current = resolve;
      setRequest({
        cancelLabel: 'Cancelar',
        confirmLabel: 'Confirmar',
        description: 'Esta accion modificara informacion de la plataforma.',
        tone: 'warning',
        title: 'Confirmar accion',
        ...options,
      });
    });
  }, []);

  const close = useCallback((accepted) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setRequest(null);
    resolver?.(accepted);
  }, []);

  useEffect(() => {
    if (!request) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        close(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [request, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && portalRoot
        ? createPortal(
            <ConfirmModal request={request} onClose={close} />,
            portalRoot
          )
        : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);

  if (!confirm) {
    throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  }

  return confirm;
}

function ConfirmModal({ request, onClose }) {
  const tone = toneStyles[request.tone] || toneStyles.warning;
  const Icon = request.tone === 'success' ? CheckCircle2 : AlertTriangle;

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/45 dark:bg-black/65"
        data-confirm-overlay="true"
        style={{ zIndex: 100002 }}
      />
      <div
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="fixed inset-0 flex items-center justify-center px-4 py-6"
        data-confirm-dialog="true"
        role="dialog"
        style={{ zIndex: 100003 }}
      >
        <div className="relative w-full max-w-[32rem] overflow-hidden rounded-lg border border-line bg-panel text-ink shadow-soft dark:border-line dark:bg-surface dark:text-ink dark:shadow-soft">
          <div className="flex items-start gap-3 border-b border-border p-4 dark:border-line">
            <div className={cx('grid h-10 w-10 flex-none place-items-center rounded-lg border', tone.icon)}>
              <Icon aria-hidden="true" size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className="text-base font-semibold leading-tight text-unl-graphite dark:text-heading"
                id="confirm-dialog-title"
              >
                {request.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-body">
                {request.description}
              </p>
            </div>
            <button
              aria-label="Cerrar confirmacion"
              className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-transparent text-body transition-colors hover:border-accent hover:bg-accent-soft hover:text-primary dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong"
              onClick={() => onClose(false)}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          {request.details && (
            <div className="border-b border-border bg-panel-soft px-4 py-3 text-sm font-medium leading-6 text-body dark:border-line dark:bg-surface-soft dark:text-body">
              {request.details}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end">
            <button
              className="inline-flex min-h-[2.55rem] items-center justify-center rounded-lg border border-accent bg-transparent px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:bg-surface dark:text-ink dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong"
              onClick={() => onClose(false)}
              type="button"
            >
              {request.cancelLabel}
            </button>
            <button
              className={cx(
                'inline-flex min-h-[2.55rem] items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35',
                tone.confirm
              )}
              onClick={() => onClose(true)}
              type="button"
            >
              {request.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
