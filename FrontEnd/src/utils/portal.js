/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          portal.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de portal utilizadas por la interfaz del SGP.
 */

export function getPortalRoot() {
  if (typeof document === 'undefined') {
    return null;
  }

  return document.getElementById('portal-root') || document.body;
}
