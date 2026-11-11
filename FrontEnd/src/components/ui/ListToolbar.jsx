/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ListToolbar.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente ListToolbar de la interfaz del SGP.
 */

export function ListToolbar({ search, actions, leading, summary }) {
  return <div className="sgp-list-tools space-y-3">
    {leading && <div className="min-w-0">{leading}</div>}
    <div role="group" aria-label="Búsqueda y acciones del listado" className={`sgp-list-toolbar ${search ? '' : 'sgp-list-toolbar-actions-only'}`}>
      {search && <div className="sgp-toolbar-search">{search}</div>}
      {actions && <div className="sgp-toolbar-actions">{actions}</div>}
    </div>
    {summary && <p className="text-xs font-medium text-body">{summary}</p>}
  </div>;
}
