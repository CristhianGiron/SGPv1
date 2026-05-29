import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { isAccessDeniedMessage } from '../../api/client';

// Ajusta este valor manualmente si quieres que las alertas duren mas o menos tiempo.
// 1000 = 1 segundo.
const ALERT_AUTO_HIDE_MS = 3000;

export function Alert({ tone = 'info', children, dismissible = true }) {
  const [visible, setVisible] = useState(true);
  const styles = {
    error: 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-400/40 dark:bg-rose-950/35 dark:text-rose-200',
    success: 'border-green-300 bg-green-50 text-green-800 dark:border-green-400/40 dark:bg-green-950/35 dark:text-green-200',
    info: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-400/40 dark:bg-sky-950/35 dark:text-sky-200',
    warning: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/40 dark:bg-amber-950/35 dark:text-amber-200',
  };
  const icons = {
    error: AlertCircle,
    success: CheckCircle2,
    info: Info,
    warning: AlertTriangle,
  };
  const Icon = icons[tone] || Info;

  useEffect(() => {
    setVisible(true);
  }, [children, tone]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, ALERT_AUTO_HIDE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [children, tone, visible]);

  if (!visible) {
    return null;
  }

  if (tone === 'error' && isAccessDeniedMessage(getText(children))) {
    return null;
  }

  return (
    <div
      className={`fixed left-1/2 top-4 z-[100000] flex w-[min(34rem,calc(100vw-1.5rem))] -translate-x-1/2 items-start gap-3 rounded-lg border p-3 text-sm leading-6 shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${styles[tone] || styles.info}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon aria-hidden="true" size={18} />
      <div className="min-w-0 flex-1">{children}</div>
      {dismissible && (
        <button
          aria-label="Cerrar alerta"
          className="ml-auto grid min-h-8 min-w-8 place-items-center rounded-lg border border-current/20 bg-white/40 transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/25 dark:bg-slate-950/20 dark:hover:bg-slate-900/50"
          onClick={() => setVisible(false)}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
      )}
    </div>
  );
}

function getText(value) {
  if (Array.isArray(value)) {
    return value.map(getText).join(' ');
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (value?.props?.children) {
    return getText(value.props.children);
  }

  return '';
}
