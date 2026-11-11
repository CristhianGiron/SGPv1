/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          visibility.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de visibility utilizadas por la interfaz del SGP.
 */

export function filterInactiveForNonAdmin(rows, roles) {
  if (roles?.includes('ROLE_ADMIN')) {
    return rows || [];
  }

  return (rows || []).filter(isVisibleActiveRecord);
}

function isVisibleActiveRecord(row) {
  if (!row || typeof row !== 'object') {
    return true;
  }

  if (row.status === 'COMPLETED') {
    return true;
  }

  if (row.active === false || row.enabled === false || row.courseActive === false) {
    return false;
  }

  return true;
}
