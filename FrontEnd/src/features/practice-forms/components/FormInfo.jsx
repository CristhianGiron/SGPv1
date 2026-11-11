/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FormInfo.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente FormInfo de la interfaz del SGP.
 */



export function InfoLine({ fallback = '-', label, value }) {
  return (
    <div className="practice-form-print-info-line">
      <p className="text-xs font-semibold uppercase text-body">{label}</p>
      <p className="mt-1 font-semibold text-heading dark:text-heading">{value === 0 ? 0 : value || fallback}</p>
    </div>
  );
}

