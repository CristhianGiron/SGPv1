/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          Skeleton.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente Skeleton de la interfaz del SGP.
 */

export function Skeleton({ lines = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          className="block h-3.5 rounded-full bg-panel-soft dark:bg-table-header"
          key={index}
          style={{ width: `${Math.max(42, 96 - index * 9)}%` }}
        />
      ))}
    </div>
  );
}
