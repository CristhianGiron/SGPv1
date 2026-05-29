import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { getPortalRoot } from '../../utils/portal';

const ConfirmContext = createContext(null);

const toneStyles = {
  danger: {
    icon: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-950/35 dark:text-rose-200',
    confirm: 'border-rose-600 bg-rose-700 text-white hover:bg-rose-800 dark:border-rose-400 dark:bg-rose-800 dark:hover:bg-rose-700',
  },
  warning: {
    icon: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-950/35 dark:text-amber-200',
    confirm: 'border-[#529914] bg-primary text-white hover:bg-secondary dark:border-[#75c66a] dark:bg-[#203026] dark:text-[#bbf7d0] dark:hover:bg-[#2b3f31]',
  },
  success: {
    icon: 'border-[#b9ddcf] bg-[#eef9f1] text-[#14532d] dark:border-[#75c66a]/40 dark:bg-green-950/30 dark:text-green-200',
    confirm: 'border-[#529914] bg-primary text-white hover:bg-secondary dark:border-[#75c66a] dark:bg-[#203026] dark:text-[#bbf7d0] dark:hover:bg-[#2b3f31]',
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
        <div className="relative w-full max-w-[32rem] overflow-hidden rounded-lg border border-[#bdcbd0] bg-[#fbfaf7] text-ink shadow-[0_24px_60px_rgba(4,52,76,0.22)] dark:border-slate-700 dark:bg-surface dark:text-ink dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <div className="flex items-start gap-3 border-b border-border p-4 dark:border-slate-700">
            <div className={cx('grid h-10 w-10 flex-none place-items-center rounded-lg border', tone.icon)}>
              <Icon aria-hidden="true" size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className="text-base font-[850] leading-tight text-unl-graphite dark:text-slate-50"
                id="confirm-dialog-title"
              >
                {request.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {request.description}
              </p>
            </div>
            <button
              aria-label="Cerrar confirmacion"
              className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-transparent text-muted transition-colors hover:border-[#529914] hover:bg-[#eef5e8] hover:text-primary dark:hover:border-[#75c66a] dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0]"
              onClick={() => onClose(false)}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          {request.details && (
            <div className="border-b border-border bg-[#eef3f2] px-4 py-3 text-sm font-bold leading-6 text-[#34443b] dark:border-slate-700 dark:bg-[#172033] dark:text-slate-200">
              {request.details}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end">
            <button
              className="inline-flex min-h-[2.55rem] items-center justify-center rounded-lg border border-[#529914] bg-transparent px-4 py-2 text-sm font-extrabold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-600 dark:bg-surface dark:text-ink dark:hover:border-[#75c66a] dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0]"
              onClick={() => onClose(false)}
              type="button"
            >
              {request.cancelLabel}
            </button>
            <button
              className={cx(
                'inline-flex min-h-[2.55rem] items-center justify-center rounded-lg border px-4 py-2 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35',
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
