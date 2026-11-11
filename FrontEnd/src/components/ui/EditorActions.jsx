/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EditorActions.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente EditorActions de la interfaz del SGP.
 */

import { useLayoutEffect, useRef } from 'react';

export function EditorActions({ children }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.style.getPropertyValue('--sgp-editor-actions-height');
    const measure = () => root.style.setProperty('--sgp-editor-actions-height', `${ref.current?.getBoundingClientRect().height || 0}px`);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ref.current) observer?.observe(ref.current);
    window.addEventListener('resize', measure); measure();
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); if (previous) root.style.setProperty('--sgp-editor-actions-height', previous); else root.style.removeProperty('--sgp-editor-actions-height'); };
  }, []);
  return <aside ref={ref} aria-label="Acciones del documento" className="sgp-editor-actions print:hidden">{children}</aside>;
}
