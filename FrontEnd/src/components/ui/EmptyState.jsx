/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EmptyState.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente EmptyState de la interfaz del SGP.
 */

import { Inbox } from 'lucide-react';

export function EmptyState({ text = 'Aún no hay información para mostrar.', title, action, icon: Icon = Inbox }) {
  return <div className="flex flex-col items-start gap-4 rounded-xl bg-panel-soft p-5 text-sm leading-6 text-body sm:flex-row sm:items-center sm:p-6">
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-panel text-muted"><Icon aria-hidden="true" size={23} /></span>
    <div className="min-w-0 flex-1">{title && <p className="font-semibold text-heading">{title}</p>}<p className={title ? 'mt-1' : ''}>{text}</p>{action && <div className="mt-3">{action}</div>}</div>
  </div>;
}
