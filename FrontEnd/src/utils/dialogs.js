/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          dialogs.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de dialogs utilizadas por la interfaz del SGP.
 */

export function activeDialogs() {
  return [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')]
    .filter(dialog => {
      if (dialog.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
      for (let node=dialog; node; node=node.parentElement) {
        const style=getComputedStyle(node);
        if (style.display==='none' || style.visibility==='hidden') return false;
      }
      return true;
    })
    .sort((a,b)=>(Number(getComputedStyle(a).zIndex)||0)-(Number(getComputedStyle(b).zIndex)||0));
}
