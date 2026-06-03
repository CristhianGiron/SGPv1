import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { isAccessDeniedMessage } from '../../api/client';

// Ajusta este valor manualmente si quieres que las alertas duren mas o menos tiempo.
// 1000 = 1 segundo.
const ALERT_AUTO_HIDE_MS = 3000;

export function Alert({ tone = 'info', children, dismissible = true }) {
  const [visible, setVisible] = useState(true);
  const styles = {
    error: 'border-danger bg-danger-soft text-danger-strong dark:border-danger/40 dark:bg-danger-soft dark:text-danger-strong',
    success: 'border-success bg-success-soft text-success-strong dark:border-success/40 dark:bg-success-soft dark:text-success-strong',
    info: 'border-info bg-info-soft text-info-strong dark:border-info/40 dark:bg-info-soft dark:text-info-strong',
    warning: 'border-warning bg-warning-soft text-warning-strong dark:border-warning/40 dark:bg-warning-soft dark:text-warning-strong',
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
      className={`fixed left-1/2 top-4 z-[100000] flex w-[min(34rem,calc(100vw-1.5rem))] -translate-x-1/2 items-start gap-3 rounded-lg border p-3 text-sm leading-6 shadow-soft ${styles[tone] || styles.info}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon aria-hidden="true" size={18} />
      <div className="min-w-0 flex-1">{children}</div>
      {dismissible && (
        <button
          aria-label="Cerrar alerta"
          className="ml-auto grid min-h-8 min-w-8 place-items-center rounded-lg border border-current/20 bg-panel/40 transition-colors hover:bg-panel/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/25 dark:bg-page/20 dark:hover:bg-surface/50"
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
