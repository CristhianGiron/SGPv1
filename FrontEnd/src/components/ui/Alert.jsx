/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          Alert.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente Alert de la interfaz del SGP.
 */

import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

// Only transient success confirmations disappear automatically.
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
    if (!visible || tone !== 'success' || !dismissible) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, ALERT_AUTO_HIDE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [children, tone, visible, dismissible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`sgp-alert flex w-full min-w-0 items-start gap-3 rounded-lg border p-3 text-sm leading-6 ${styles[tone] || styles.info}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon aria-hidden="true" className="mt-1 flex-none" size={18} />
      <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">{children}</div>
      {dismissible && (
        <button
          aria-label="Cerrar alerta"
          className="ml-auto grid min-h-8 min-w-8 flex-none place-items-center rounded-lg border border-current/20 bg-panel/40 transition-colors hover:bg-panel/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/25 dark:bg-page/20 dark:hover:bg-surface/50"
          onClick={() => setVisible(false)}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
      )}
    </div>
  );
}
