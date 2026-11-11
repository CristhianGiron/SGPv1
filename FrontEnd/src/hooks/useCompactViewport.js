/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          useCompactViewport.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona el estado y la integración de useCompactViewport en la interfaz React.
 */

import { useEffect, useState } from 'react';

const query = '(max-width: 639px)';
const readViewport = () => window.matchMedia ? window.matchMedia(query).matches : window.innerWidth < 640;

export function useCompactViewport() {
  const [compact, setCompact] = useState(readViewport);
  useEffect(() => {
    const media = window.matchMedia?.(query);
    const update = () => setCompact(readViewport());
    if (media?.addEventListener) { media.addEventListener('change', update); return () => media.removeEventListener('change', update); }
    window.addEventListener('resize', update); return () => window.removeEventListener('resize', update);
  }, []);
  return compact;
}
