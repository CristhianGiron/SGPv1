/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DraftRecovery.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente DraftRecovery de la interfaz del SGP.
 */

import { SecondaryButton } from './ActionBar';
export function DraftRecovery({ draft, disabled = false, showStatus = true }) {
 return <div aria-live="polite" className="space-y-2 text-sm text-body">
  {draft.recovery && <div className="rounded-lg border border-info/30 bg-info-soft p-4"><p className="font-semibold text-heading">{draft.recovery.source === 'server' ? 'Hay un borrador guardado en el servidor' : 'Hay una copia local sin guardar en el sistema'}</p><p className="mt-1">{new Date(draft.recovery.savedAt).toLocaleString('es-EC')}. Recuperarla reemplazará los campos actuales de este formulario. Los archivos adjuntos deben seleccionarse nuevamente.</p><div className="mt-3 flex flex-wrap gap-2"><SecondaryButton disabled={disabled} onClick={draft.recover}>Recuperar borrador</SecondaryButton>{draft.recovery.source !== 'server' && <SecondaryButton disabled={disabled} onClick={draft.discard}>Descartar copia local</SecondaryButton>}{draft.useCurrent && <SecondaryButton disabled={disabled} onClick={draft.useCurrent}>Conservar mi copia local</SecondaryButton>}</div></div>}
  {showStatus && draft.status && <p role="status">{draft.status}</p>}
  {draft.useCurrent && !draft.recovery && <SecondaryButton disabled={disabled} onClick={draft.useCurrent}>Conservar mi copia local</SecondaryButton>}
  {showStatus && draft.retry && /No se pudo/.test(draft.status) && <SecondaryButton disabled={disabled} onClick={draft.retry}>Reintentar autoguardado</SecondaryButton>}
 </div>;
}
